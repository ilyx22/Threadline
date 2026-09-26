import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { addDays, dbDateFromIso, isoFromDbDate, periodStatus, todayIn, type IsoDate } from "./calendar";

/**
 * Engagements and their service periods (ENG-01, ENG-02, ENG-05).
 *
 * An engagement copies an offer's terms when it is created, so later edits to
 * the offer never change what a client signed. Activation fixes the start
 * date; periods are generated as calendar dates (see calendar.ts) and kept one
 * period ahead while the engagement is active. Pausing freezes the calendar:
 * on resume, the remaining periods are re-planned from the resume date, and
 * periods already delivered are never altered.
 */
export class EngagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngagementError";
  }
}

type Tx = Prisma.TransactionClient;

export type OfferTerms = { key: string; name: string; currency: string; setupFeeMinor: number; periodFeeMinor: number; periodDays: number; initialPeriods: number; entitlements: string; version: number };

export async function offerTerms(key = "standard", tx: Tx = prisma): Promise<OfferTerms & { id: string }> {
  const offer = await tx.offerTemplate.findUnique({ where: { key } });
  if (!offer || !offer.active) throw new EngagementError(`No active offer "${key}".`);
  return offer;
}

/** Create a draft engagement with the offer's terms frozen into it. */
export async function createDraftEngagement(tx: Tx, input: { orgId: string; timezone: string; offerKey?: string; overrides?: Partial<Pick<OfferTerms, "setupFeeMinor" | "periodFeeMinor">>; createdById?: string | null; sourceApplicationId?: string | null; sourceProspectId?: string | null }) {
  const offer = await offerTerms(input.offerKey, tx);
  const terms = { ...offer, ...input.overrides };
  return tx.engagement.create({
    data: {
      orgId: input.orgId,
      offerTemplateId: offer.id,
      offerSnapshot: JSON.stringify({ key: offer.key, name: offer.name, version: offer.version, currency: terms.currency, setupFeeMinor: terms.setupFeeMinor, periodFeeMinor: terms.periodFeeMinor, periodDays: terms.periodDays, initialPeriods: terms.initialPeriods, entitlements: JSON.parse(offer.entitlements) }),
      currency: terms.currency,
      setupFeeMinor: terms.setupFeeMinor,
      periodFeeMinor: terms.periodFeeMinor,
      periodDays: terms.periodDays,
      initialPeriods: terms.initialPeriods,
      entitlements: offer.entitlements,
      timezone: input.timezone,
      status: "draft",
      createdById: input.createdById ?? null,
      sourceApplicationId: input.sourceApplicationId ?? null,
      sourceProspectId: input.sourceProspectId ?? null,
    },
  });
}

/**
 * Keep the period chain generated at least `initialPeriods` long and one
 * period beyond the current one, extending from the LAST REAL period (so a
 * re-planned chain after a pause is respected), and refresh statuses.
 * Idempotent: safe to call on every read and from the daily job.
 */
export async function ensurePeriods(engagementId: string, now = new Date()) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId }, include: { periods: { orderBy: { number: "asc" } } } });
  if (!e.startDate || e.status === "draft") return [];
  const today = todayIn(e.timezone, now);
  if (e.status === "active") {
    const rows: { number: number; startDate: IsoDate; endDate: IsoDate }[] = [];
    let last = e.periods.length ? { number: e.periods[e.periods.length - 1].number, endDate: isoFromDbDate(e.periods[e.periods.length - 1].endDate) } : { number: 0, endDate: isoFromDbDate(e.startDate) };
    const horizon = addDays(today, e.periodDays);
    while (last.number < e.initialPeriods || last.endDate <= horizon) {
      const start = last.endDate;
      const next = { number: last.number + 1, startDate: start, endDate: addDays(start, e.periodDays) };
      rows.push(next);
      last = next;
    }
    if (rows.length) {
      await prisma.servicePeriod.createMany({
        data: rows.map((p) => ({ engagementId: e.id, orgId: e.orgId, number: p.number, startDate: dbDateFromIso(p.startDate), endDate: dbDateFromIso(p.endDate), feeMinor: e.periodFeeMinor })),
        skipDuplicates: true,
      });
    }
  }
  const periods = await prisma.servicePeriod.findMany({ where: { engagementId: e.id }, orderBy: { number: "asc" } });
  for (const p of periods) {
    if (p.status === "paused") continue;
    const st = periodStatus({ startDate: isoFromDbDate(p.startDate), endDate: isoFromDbDate(p.endDate) }, today);
    if (st !== p.status) await prisma.servicePeriod.update({ where: { id: p.id }, data: { status: st } });
  }
  return prisma.servicePeriod.findMany({ where: { engagementId: e.id }, orderBy: { number: "asc" } });
}

/** Activate a draft on a start date (defaults to today in the workspace's timezone). */
export async function activateEngagement(engagementId: string, startDate?: IsoDate, now = new Date()) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId } });
  if (e.status !== "draft") throw new EngagementError("Only a draft engagement can be activated.");
  const start = startDate ?? todayIn(e.timezone, now);
  const claimed = await prisma.engagement.updateMany({
    where: { id: e.id, status: "draft" },
    data: { status: "active", startDate: dbDateFromIso(start), activatedAt: now, earlyWinDueDate: dbDateFromIso(addDays(start, 14)) },
  });
  if (claimed.count !== 1) throw new EngagementError("That engagement was activated by someone else just now.");
  await prisma.organization.update({ where: { id: e.orgId }, data: { startedAt: dbDateFromIso(start), setupFee: e.setupFeeMinor, periodFee: e.periodFeeMinor, status: "active" } });
  return ensurePeriods(e.id, now);
}

export async function pauseEngagement(engagementId: string, now = new Date()) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId } });
  if (e.status !== "active") throw new EngagementError("Only an active engagement can be paused.");
  const today = todayIn(e.timezone, now);
  await prisma.$transaction([
    prisma.engagement.update({ where: { id: e.id }, data: { status: "paused", pausedAt: now } }),
    // Periods that have not started yet are held; the current one runs to its end.
    prisma.servicePeriod.updateMany({ where: { engagementId: e.id, startDate: { gt: dbDateFromIso(today) } }, data: { status: "paused" } }),
    prisma.organization.update({ where: { id: e.orgId }, data: { status: "paused" } }),
  ]);
}

/** Resume: held periods are re-planned from the resume date (or the end of the period that kept running). */
export async function resumeEngagement(engagementId: string, now = new Date()) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId }, include: { periods: { orderBy: { number: "asc" } } } });
  if (e.status !== "paused") throw new EngagementError("Only a paused engagement can be resumed.");
  const today = todayIn(e.timezone, now);
  const held = e.periods.filter((p) => p.status === "paused");
  const lastRun = [...e.periods].reverse().find((p) => p.status !== "paused");
  const lastRunEnd = lastRun ? isoFromDbDate(lastRun.endDate) : today;
  let cursor: IsoDate = lastRunEnd > today ? lastRunEnd : today;
  await prisma.$transaction(async (tx) => {
    for (const p of held) {
      await tx.servicePeriod.update({ where: { id: p.id }, data: { startDate: dbDateFromIso(cursor), endDate: dbDateFromIso(addDays(cursor, e.periodDays)), status: "upcoming" } });
      cursor = addDays(cursor, e.periodDays);
    }
    await tx.engagement.update({ where: { id: e.id }, data: { status: "active", pausedAt: null } });
    await tx.organization.update({ where: { id: e.orgId }, data: { status: "active" } });
  });
  return ensurePeriods(e.id, now);
}

export async function endEngagement(engagementId: string, kind: "ended" | "terminated", reason: string, now = new Date()) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId } });
  if (e.status === "ended" || e.status === "terminated") throw new EngagementError("That engagement has already ended.");
  const today = todayIn(e.timezone, now);
  await prisma.$transaction([
    prisma.engagement.update({ where: { id: e.id }, data: { status: kind, endedAt: now, endReason: reason.slice(0, 1000) } }),
    // Periods that have not started are removed from the plan; delivered ones stay.
    prisma.servicePeriod.deleteMany({ where: { engagementId: e.id, startDate: { gt: dbDateFromIso(today) } } }),
    prisma.organization.update({ where: { id: e.orgId }, data: { status: "churned" } }),
  ]);
}

/** Scope changes (ENG-05): proposed, then approved or rejected; approval applies a fee change from a named period. */
export async function proposeScopeChange(engagementId: string, input: { summary: string; detail?: string | null; requestedById: string; effectiveFromPeriod?: number | null; feeChangeMinor?: number | null }) {
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId } });
  return prisma.scopeChange.create({ data: { engagementId, orgId: e.orgId, summary: input.summary.slice(0, 300), detail: input.detail?.slice(0, 4000) ?? null, requestedById: input.requestedById, effectiveFromPeriod: input.effectiveFromPeriod ?? null, feeChangeMinor: input.feeChangeMinor ?? null } });
}

export async function decideScopeChange(changeId: string, decision: "approved" | "rejected", decidedById: string) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.scopeChange.findUniqueOrThrow({ where: { id: changeId } });
    const claimed = await tx.scopeChange.updateMany({ where: { id: c.id, state: "proposed" }, data: { state: decision, decidedById, decidedAt: new Date() } });
    if (claimed.count !== 1) throw new EngagementError("That change has already been decided.");
    if (decision === "approved" && c.feeChangeMinor) {
      const e = await tx.engagement.findUniqueOrThrow({ where: { id: c.engagementId } });
      const newFee = e.periodFeeMinor + c.feeChangeMinor;
      await tx.engagement.update({ where: { id: e.id }, data: { periodFeeMinor: newFee } });
      if (c.effectiveFromPeriod) await tx.servicePeriod.updateMany({ where: { engagementId: e.id, number: { gte: c.effectiveFromPeriod } }, data: { feeMinor: newFee } });
      await tx.organization.update({ where: { id: e.orgId }, data: { periodFee: newFee } });
    }
    return tx.scopeChange.findUniqueOrThrow({ where: { id: c.id } });
  });
}

/** The active or most recent engagement of a workspace. */
export async function currentEngagement(orgId: string) {
  const include = { periods: { orderBy: { number: "asc" as const } } };
  return (
    (await prisma.engagement.findFirst({ where: { orgId, status: { in: ["active", "paused"] } }, orderBy: { createdAt: "desc" }, include })) ??
    (await prisma.engagement.findFirst({ where: { orgId }, orderBy: { createdAt: "desc" }, include }))
  );
}
