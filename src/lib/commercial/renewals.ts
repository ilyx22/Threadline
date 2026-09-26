import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import { kickCrm, queueCrm } from "@/lib/crm/outbox";
import { addDays, isoFromDbDate, todayIn, dbDateFromIso } from "./calendar";
import { endEngagement, pauseEngagement } from "./engagements";

/**
 * Renewals (RNW-01).
 *
 * Twenty-one days before the initial term's last period ends, a renewal review
 * opens: a task for Threadline, a notification-worthy item on the operator
 * queue, and a renewal opportunity in the CRM. A person decides: renew (the
 * engagement simply continues period to period), pause, expand (via a scope
 * change), end, or hand over. Nothing renews or ends by itself.
 */
export const RENEWAL_LEAD_DAYS = 21;

export async function openDueRenewals(now = new Date()) {
  const engagements = await prisma.engagement.findMany({ where: { status: "active" }, include: { periods: { orderBy: { number: "asc" } }, org: { select: { name: true } } } });
  const opened = [];
  for (const e of engagements) {
    const term = e.periods.find((p) => p.number === e.initialPeriods);
    if (!term) continue;
    const endIso = isoFromDbDate(term.endDate);
    const opensOn = addDays(endIso, -RENEWAL_LEAD_DAYS);
    if (todayIn(e.timezone, now) < opensOn) continue;
    try {
      const review = await prisma.renewalReview.create({ data: { orgId: e.orgId, engagementId: e.id, periodNumber: term.number, dueDate: dbDateFromIso(endIso) } });
      await prisma.task.create({
        data: { orgId: e.orgId, title: `Renewal review for ${e.org.name}, due ${endIso}`, description: "Decide with the client: renew, pause, expand, end or hand over. Bring the four-week reviews.", kind: "general", audience: "internal", priority: "high", estimateMin: 30 } as never,
      });
      const row = await queueCrm(prisma, { op: "upsert_deal", entityType: "engagement", entityId: `${e.id}:renewal:${term.number}`, name: `${e.org.name}: renewal`, stage: "in_progress", valueMinor: e.periodFeeMinor * e.initialPeriods, currency: e.currency, companyEntity: { type: "organization", id: e.orgId }, personEntity: null }, `deal:${e.id}:renewal:${term.number}`);
      await kickCrm([row.id]);
      opened.push(review);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue; // already open
      throw err;
    }
  }
  return opened;
}

export async function decideRenewal(reviewId: string, decision: "renewed" | "paused" | "expanded" | "ended" | "handed_over", note: string, userId: string) {
  const r = await prisma.renewalReview.findUniqueOrThrow({ where: { id: reviewId } });
  if (r.state !== "open") throw new WorkflowError("This renewal has already been decided.");
  const claimed = await prisma.renewalReview.updateMany({ where: { id: r.id, state: "open" }, data: { state: decision, note: note.slice(0, 1000), decidedById: userId, decidedAt: new Date() } });
  if (claimed.count !== 1) throw new WorkflowError("This renewal has already been decided.");
  if (decision === "paused") await pauseEngagement(r.engagementId);
  if (decision === "ended" || decision === "handed_over") await endEngagement(r.engagementId, "ended", `Renewal decision: ${decision.replace("_", " ")}. ${note}`);
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: r.engagementId }, include: { org: { select: { name: true } } } });
  const stage = decision === "renewed" || decision === "expanded" ? "won" : "lost";
  const row = await queueCrm(prisma, { op: "upsert_deal", entityType: "engagement", entityId: `${e.id}:renewal:${r.periodNumber}`, name: `${e.org.name}: renewal`, stage, valueMinor: e.periodFeeMinor * e.initialPeriods, currency: e.currency, companyEntity: { type: "organization", id: e.orgId }, personEntity: null }, `deal:${e.id}:renewal:${r.periodNumber}:${decision}`);
  await kickCrm([row.id]);
  return prisma.renewalReview.findUniqueOrThrow({ where: { id: r.id } });
}
