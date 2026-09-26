import "server-only";
import { prisma } from "@/lib/db/client";
import { publishedAssets, pipelineSummary } from "@/lib/data/metrics";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * The four-week review (REP-02): ACTION, RESULTS, PROBLEMS, FUTURE, one per
 * service period. The figures are computed from records for the period's
 * calendar dates and frozen when the draft is created or refreshed; the
 * operator writes the four sections. Finalising is staff-only; a final review
 * is corrected by a new version, exactly like weekly reports.
 */
export type PeriodFigures = {
  published: number;
  views: number;
  inquiries: number;
  qualified: number;
  callsBooked: number;
  won: number;
  approvalsGiven: number;
  changesRequested: number;
  diagnosesApproved: number;
  correctionsMade: number;
  correctionsWorked: number;
  weeklyReportsFinal: number;
  computedAt: string;
};

export async function computePeriodFigures(orgId: string, start: Date, endExclusive: Date): Promise<PeriodFigures> {
  const range = { start, end: new Date(endExclusive.getTime() - 1) };
  const [assets, pipeline, approvals, changes, diagnoses, corrections, reports] = await Promise.all([
    publishedAssets(orgId, range),
    pipelineSummary(orgId, range),
    prisma.approval.count({ where: { orgId, decision: "approved", decidedAt: { gte: range.start, lte: range.end } } }),
    prisma.approval.count({ where: { orgId, decision: "changes_requested", decidedAt: { gte: range.start, lte: range.end } } }),
    prisma.contentDiagnosis.count({ where: { orgId, approvalState: "approved", approvedAt: { gte: range.start, lte: range.end } } }),
    prisma.correctionEntry.findMany({ where: { orgId, createdAt: { gte: range.start, lte: range.end } }, select: { worked: true } }),
    prisma.weeklyReport.count({ where: { orgId, status: "final", periodStart: { gte: range.start, lte: range.end } } }),
  ]);
  return {
    published: assets.length,
    views: assets.reduce((a, x) => a + x.views, 0),
    inquiries: pipeline.inquiries,
    qualified: pipeline.qualified,
    callsBooked: pipeline.callsBooked,
    won: pipeline.won,
    approvalsGiven: approvals,
    changesRequested: changes,
    diagnosesApproved: diagnoses,
    correctionsMade: corrections.length,
    correctionsWorked: corrections.filter((c) => c.worked === true).length,
    weeklyReportsFinal: reports,
    computedAt: new Date().toISOString(),
  };
}

/** Open (or return) the draft review for a period of the engagement. */
export async function openPeriodReview(orgId: string, engagementId: string, periodNumber: number, userId: string) {
  const period = await prisma.servicePeriod.findFirst({ where: { engagementId, orgId, number: periodNumber } });
  if (!period) throw new WorkflowError("That service period does not exist.");
  if (period.status === "upcoming" || period.status === "paused") throw new WorkflowError("A review is written once the period has started.");
  const existing = await prisma.periodReview.findFirst({ where: { engagementId, periodNumber }, orderBy: { version: "desc" } });
  if (existing?.status === "draft") return existing;
  if (existing?.status === "final") return existing;
  const figures = await computePeriodFigures(orgId, period.startDate, period.endDate);
  return prisma.periodReview.create({
    data: { orgId, engagementId, periodNumber, periodStart: period.startDate, periodEnd: period.endDate, figures: JSON.stringify(figures), createdById: userId },
  });
}

export async function refreshFigures(reviewId: string, orgId: string) {
  const r = await prisma.periodReview.findFirst({ where: { id: reviewId, orgId } });
  if (!r) throw new WorkflowError("That review no longer exists.");
  if (r.status !== "draft") throw new WorkflowError("A final review's figures are frozen.");
  const figures = await computePeriodFigures(orgId, r.periodStart, r.periodEnd);
  return prisma.periodReview.update({ where: { id: r.id }, data: { figures: JSON.stringify(figures) } });
}

export async function saveReviewSections(reviewId: string, orgId: string, sections: { action: string; results: string; problems: string; future: string }) {
  const updated = await prisma.periodReview.updateMany({ where: { id: reviewId, orgId, status: "draft" }, data: sections });
  if (updated.count !== 1) throw new WorkflowError("Only a draft review can be edited.");
}

export async function finaliseReview(reviewId: string, orgId: string, userId: string) {
  const r = await prisma.periodReview.findFirst({ where: { id: reviewId, orgId } });
  if (!r) throw new WorkflowError("That review no longer exists.");
  if (r.status === "final") return r;
  const missing = (["action", "results", "problems", "future"] as const).filter((k) => !r[k].trim());
  if (missing.length) throw new WorkflowError(`Write every section before finalising (missing: ${missing.join(", ")}).`);
  return prisma.$transaction(async (tx) => {
    await tx.periodReview.updateMany({ where: { engagementId: r.engagementId, periodNumber: r.periodNumber, status: "final", version: { lt: r.version }, supersededAt: null }, data: { supersededAt: new Date() } });
    return tx.periodReview.update({ where: { id: r.id }, data: { status: "final", finalisedAt: new Date(), finalisedById: userId } });
  });
}

export async function reviseReview(reviewId: string, orgId: string, userId: string, reason: string) {
  const r = await prisma.periodReview.findFirst({ where: { id: reviewId, orgId } });
  if (!r || r.status !== "final" || r.supersededAt) throw new WorkflowError("Only the current final review can be corrected.");
  return prisma.periodReview.create({
    data: { orgId, engagementId: r.engagementId, periodNumber: r.periodNumber, periodStart: r.periodStart, periodEnd: r.periodEnd, version: r.version + 1, figures: r.figures, action: r.action, results: r.results, problems: r.problems, future: r.future, createdById: userId, revisionReason: reason.slice(0, 1000) },
  });
}

/**
 * AI-07: a draft of the four sections from the frozen figures and the
 * period's recorded corrections and approved diagnoses, for the operator to
 * edit. It fills only sections that are still empty, never overwrites what a
 * person wrote, and never finalises.
 */
export async function draftReviewSections(reviewId: string, orgId: string, userId: string) {
  const r = await prisma.periodReview.findFirst({ where: { id: reviewId, orgId } });
  if (!r) throw new WorkflowError("That review no longer exists.");
  if (r.status !== "draft") throw new WorkflowError("Only a draft review can be drafted.");
  const empty = (["action", "results", "problems", "future"] as const).filter((k) => !r[k].trim());
  if (!empty.length) throw new WorkflowError("Every section already has text; nothing was changed.");
  const f = JSON.parse(r.figures) as PeriodFigures;
  const range = { gte: r.periodStart, lt: r.periodEnd };
  const [corrections, diagnoses] = await Promise.all([
    prisma.correctionEntry.findMany({ where: { orgId, createdAt: range }, select: { failedAssumption: true, correction: true, worked: true }, take: 10 }),
    prisma.contentDiagnosis.findMany({ where: { orgId, approvalState: "approved", approvedAt: range }, select: { failureClass: true, explanation: true }, take: 10 }),
  ]);
  const facts = [
    `Published ${f.published} pieces, ${f.views} views. Inquiries ${f.inquiries}, qualified ${f.qualified}, calls booked ${f.callsBooked}, won ${f.won}.`,
    `Approvals given ${f.approvalsGiven}; changes requested ${f.changesRequested}; weekly reports finalised ${f.weeklyReportsFinal}.`,
    `Corrections made ${f.correctionsMade}, of which ${f.correctionsWorked} confirmed as working.`,
    ...corrections.map((c) => `Correction: believed "${c.failedAssumption}"; changed "${c.correction}"; ${c.worked === true ? "worked" : c.worked === false ? "did not work" : "not yet retested"}.`),
    ...diagnoses.map((d) => `Approved diagnosis (${d.failureClass}): ${d.explanation}`),
  ].join("\n");
  const { runGeneration } = await import("@/lib/ai");
  const { extractJson } = await import("@/lib/ai/provider");
  const { result, meta } = await runGeneration(
    {
      key: "review.draft",
      system: 'You draft a four-week review for a founder, from the records given and nothing else. Never add a number, a result or a cause that is not in the records. Where the records are thin, say so plainly. Return JSON { "action": string, "results": string, "problems": string, "future": string }, each two to five sentences.',
      user: `RECORDS FOR THE PERIOD\n${facts}\n\nDraft ACTION (what was done), RESULTS (what happened, with the figures), PROBLEMS (what did not work and why, only where recorded) and FUTURE (what changes next period).`,
      maxTokens: 1500,
      temperature: 0.3,
    },
    { orgId, userId, kind: "review_draft", entityType: "period_review", entityId: r.id, demoContext: { reviewFacts: facts, reviewFigures: f } },
  );
  const parsed = (extractJson(result.text) ?? {}) as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const k of empty) {
    const v = parsed[k];
    if (typeof v === "string" && v.trim()) data[k] = `${v.trim().slice(0, 4000)}${meta.isDemo ? " [demo draft]" : ""}`;
  }
  if (Object.keys(data).length) await prisma.periodReview.updateMany({ where: { id: r.id, status: "draft" }, data });
  return { filled: Object.keys(data), isDemo: meta.isDemo };
}
