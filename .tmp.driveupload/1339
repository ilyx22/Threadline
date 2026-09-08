import "server-only";
import { prisma } from "@/lib/db/client";
import { parseRecord, parseStringArray } from "@/lib/db/json";
import {
  assumedRates,
  EMPTY_COUNTS,
  funnelSteps,
  inputFromCounts,
  projectFromRates,
  quota,
  requiredFirstTouches,
  weakestConversion,
  workdaysBetween,
  type FunnelCounts,
  type FunnelProjection,
  type Quota,
} from "@/lib/domain/funnel";
import { isActiveProspectState } from "@/lib/domain/enums";
import {
  callProgress,
  checklistStatus,
  prospectState,
  readValidation,
  requiresNextAction,
  wedgeState,
  type ChecklistStatus,
} from "@/lib/domain/sop";
import { addDays, startOfDay, startOfWeek } from "@/lib/utils/dates";

/**
 * Threadline's own acquisition and sales records.
 *
 * Separate from `src/lib/data/admin.ts`, which reads across client workspaces.
 * Nothing here touches an organisation, and every caller must already hold
 * `acquisition.view`.
 *
 * The important property of this module is that **no funnel number is stored**.
 * Every rate in the product is counted from prospect and call records at read
 * time. A stored counter drifts from what happened the first time somebody
 * corrects a record; a derived one cannot.
 */

export type Range = { start: Date; end: Date };

export function periodToDate(days = 90): Range {
  const end = new Date();
  return { start: startOfDay(addDays(end, -days + 1)), end };
}

/* --------------------------------- Counting -------------------------------- */

/**
 * The funnel, counted from records.
 *
 * A first touch is a prospect whose first message actually went out, dated.
 * A booking is a call that exists. A show is a call somebody attended. None of
 * these is an operator's recollection of the week.
 */
export async function funnelCounts(range: Range, channel?: string | null): Promise<FunnelCounts> {
  const within = { gte: range.start, lte: range.end };
  const channelWhere = channel ? { channel } : {};

  const [firstTouches, replies, positive, booked, calls] = await Promise.all([
    prisma.prospect.count({ where: { ...channelWhere, firstTouchAt: within } }),
    prisma.prospect.count({ where: { ...channelWhere, repliedAt: within } }),
    prisma.prospect.count({ where: { ...channelWhere, positiveReplyAt: within } }),
    prisma.salesCall.count({
      where: { createdAt: within, ...(channel ? { prospect: { channel } } : {}) },
    }),
    prisma.salesCall.findMany({
      where: { completedAt: within, ...(channel ? { prospect: { channel } } : {}) },
      select: { attended: true, qualified: true, offerMade: true, outcome: true },
    }),
  ]);

  return {
    firstTouches,
    replies,
    positiveReplies: positive,
    booked,
    showed: calls.filter((c) => c.attended).length,
    qualified: calls.filter((c) => c.attended && c.qualified).length,
    offers: calls.filter((c) => c.offerMade).length,
    won: calls.filter((c) => c.outcome === "won").length,
  };
}

/**
 * The same counts per channel.
 *
 * Kept separate rather than blended because warm referrals, cold outreach and
 * inbound convert differently, and averaging them produces a number that
 * describes none of them.
 */
export async function channelBreakdown(range: Range) {
  const channels = await prisma.prospect.findMany({
    where: { channel: { not: null } },
    distinct: ["channel"],
    select: { channel: true },
  });

  const names = channels.map((c) => c.channel).filter((c): c is string => Boolean(c));
  const rows = await Promise.all(
    names.map(async (name) => ({
      channel: name,
      counts: await funnelCounts(range, name),
    })),
  );

  return rows
    .filter((r) => r.counts.firstTouches > 0 || r.counts.booked > 0)
    .map((r) => ({ ...r, steps: funnelSteps(r.counts) }))
    .sort((a, b) => b.counts.firstTouches - a.counts.firstTouches);
}

/* ------------------------------- The plan ---------------------------------- */

export type AcquisitionPlan = {
  target: {
    id: string;
    label: string;
    targetWins: number;
    periodStart: Date;
    periodEnd: Date;
    assumed: { booking: number; show: number; qualified: number; close: number };
    notes: string | null;
  } | null;
  counts: FunnelCounts;
  /** Projection from Threadline's own recorded rates. */
  measured: FunnelProjection;
  /**
   * Projection from the target's planning assumptions.
   *
   * Kept beside the measured one rather than replaced by it: while the sample
   * is small, one win or one no-show moves the measured figure enough to
   * rewrite the plan, and seeing both is what stops that happening.
   */
  assumed: FunnelProjection | null;
  quota: Quota | null;
  /** Lowest recorded conversion — a suggestion for the review, not a verdict. */
  weakest: ReturnType<typeof weakestConversion>;
  steps: ReturnType<typeof funnelSteps>;
};

export async function acquisitionPlan(): Promise<AcquisitionPlan> {
  const target = await prisma.acquisitionTarget.findFirst({
    where: { status: "active" },
    orderBy: { periodStart: "desc" },
  });

  const range: Range = target
    ? { start: target.periodStart, end: target.periodEnd }
    : periodToDate(90);

  const counts = await funnelCounts(range);
  const measured = requiredFirstTouches(target?.targetWins ?? 0, inputFromCounts(counts));

  const assumed = target
    ? projectFromRates(
        target.targetWins,
        assumedRates({
          booking: target.assumedBookingRatePct,
          show: target.assumedShowRatePct,
          qualified: target.assumedQualifiedRatePct,
          close: target.assumedCloseRatePct,
        }),
      )
    : null;

  const plan = measured.ok ? measured : assumed?.ok ? assumed : null;

  const now = new Date();
  const completedToday = await prisma.prospect.count({
    where: { firstTouchAt: { gte: startOfDay(now) } },
  });

  return {
    target: target
      ? {
          id: target.id,
          label: target.label,
          targetWins: target.targetWins,
          periodStart: target.periodStart,
          periodEnd: target.periodEnd,
          assumed: {
            booking: target.assumedBookingRatePct,
            show: target.assumedShowRatePct,
            qualified: target.assumedQualifiedRatePct,
            close: target.assumedCloseRatePct,
          },
          notes: target.notes,
        }
      : null,
    counts,
    measured,
    assumed,
    quota:
      plan && target
        ? quota({
            required: plan.requiredFirstTouches,
            completed: counts.firstTouches,
            completedToday,
            workdaysRemaining: workdaysBetween(now, target.periodEnd),
          })
        : null,
    weakest: weakestConversion(counts),
    steps: funnelSteps(counts),
  };
}

/* -------------------------------- Prospects -------------------------------- */

export type ProspectFilter = {
  state?: string;
  tier?: string;
  q?: string;
};

export async function listProspects(filter: ProspectFilter = {}) {
  const rows = await prisma.prospect.findMany({
    where: {
      ...(filter.state ? { state: filter.state } : {}),
      ...(filter.tier ? { tier: filter.tier } : {}),
      ...(filter.q
        ? { OR: [{ company: { contains: filter.q } }, { contactName: { contains: filter.q } }] }
        : {}),
    },
    include: {
      owner: { select: { name: true } },
      wedge: { select: { label: true } },
      calls: { orderBy: { scheduledAt: "desc" }, take: 1 },
    },
    orderBy: [{ nextActionDueAt: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const now = new Date();

  return rows
    .map((p) => ({
      ...p,
      active: isActiveProspectState(p.state),
      overdue: Boolean(p.nextActionDueAt && p.nextActionDueAt < now),
    }))
    // SQLite sorts nulls first, which would put closed records — the ones with
    // no date because they correctly have no next action — at the top of a list
    // whose whole purpose is what is due. Active work leads; closed records sit
    // at the bottom where they belong.
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const at = a.nextActionDueAt?.getTime() ?? Infinity;
      const bt = b.nextActionDueAt?.getTime() ?? Infinity;
      return at - bt;
    });
}

export type ProspectDetail = NonNullable<Awaited<ReturnType<typeof getProspect>>>;

export async function getProspect(id: string) {
  const prospect = await prisma.prospect.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      wedge: { select: { id: true, label: true, problem: true, state: true } },
      checks: true,
      calls: { orderBy: { scheduledAt: "desc" } },
    },
  });
  if (!prospect) return null;

  const definition = prospectState(prospect.state);
  const checks = prospect.checks
    .filter((c) => c.state === prospect.state)
    .map((c) => ({ key: c.key, done: c.done, note: c.note }));

  const status: ChecklistStatus = checklistStatus(definition, checks);

  return {
    ...prospect,
    definition,
    status,
    calls: prospect.calls.map((call) => ({
      ...call,
      stages: callProgress(
        parseStringArray(call.stagesCovered),
        Object.fromEntries(
          Object.entries(parseRecord(call.stageNotes)).map(([k, v]) => [k, String(v ?? "")]),
        ),
      ),
    })),
  };
}

/* ---------------------------------- Wedges --------------------------------- */

export async function listWedges() {
  const rows = await prisma.marketWedge.findMany({
    include: { _count: { select: { conversations: true, prospects: true } } },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });
  return rows;
}

export type WedgeDetail = NonNullable<Awaited<ReturnType<typeof getWedge>>>;

export async function getWedge(id: string) {
  const wedge = await prisma.marketWedge.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      checks: true,
      conversations: { orderBy: { heldAt: "desc" } },
      _count: { select: { prospects: true } },
    },
  });
  if (!wedge) return null;

  const definition = wedgeState(wedge.state);
  const status = checklistStatus(
    definition,
    wedge.checks
      .filter((c) => c.state === wedge.state)
      .map((c) => ({ key: c.key, done: c.done, note: c.note })),
  );

  return {
    ...wedge,
    definition,
    status,
    reading: readValidation(
      wedge.conversations.map((c) => ({ volunteered: c.volunteered, problem: c.problem })),
    ),
  };
}

/** The single wedge currently being sold against, if one has been chosen. */
export async function activeWedge() {
  const wedge = await prisma.marketWedge.findFirst({
    where: { active: true },
    include: { _count: { select: { conversations: true } } },
  });
  return wedge;
}

/* --------------------------- The weekly control loop ------------------------ */

export async function latestReviews(limit = 8) {
  return prisma.funnelReview.findMany({
    orderBy: { weekStart: "desc" },
    take: limit,
    include: { createdBy: { select: { name: true } } },
  });
}

/** Counts for the week under review, frozen when the review is written. */
export async function weekCounts(weekStart: Date): Promise<FunnelCounts> {
  return funnelCounts({ start: startOfDay(weekStart), end: addDays(weekStart, 6) });
}

export function currentWeekStart(): Date {
  return startOfWeek(new Date());
}

/* -------------------------------- Invariant --------------------------------- */

/**
 * Records that break the operating invariant.
 *
 * Every write path refuses to create one of these, so in normal use this
 * returns nothing. It exists because "the code prevents it" and "it is not
 * happening" are different claims, and only one of them is checkable — a
 * record imported, seeded or edited outside the action layer would otherwise
 * sit in the pipeline invisibly.
 */
export async function invariantBreaches() {
  const [prospects, wedges] = await Promise.all([
    prisma.prospect.findMany({
      where: { OR: [{ nextAction: null }, { nextActionDueAt: null }] },
      select: { id: true, company: true, state: true, nextAction: true, nextActionDueAt: true },
    }),
    prisma.marketWedge.findMany({
      where: { OR: [{ nextAction: null }, { nextActionDueAt: null }] },
      select: { id: true, label: true, state: true, nextAction: true, nextActionDueAt: true },
    }),
  ]);

  return [
    ...prospects
      .filter((p) => requiresNextAction(p.state))
      .map((p) => ({ kind: "prospect" as const, id: p.id, label: p.company, state: p.state })),
    ...wedges
      .filter((w) => requiresNextAction(w.state))
      .map((w) => ({ kind: "wedge" as const, id: w.id, label: w.label, state: w.state })),
  ];
}

export const EMPTY_FUNNEL = EMPTY_COUNTS;
