import "server-only";
import { prisma } from "@/lib/db/client";
import {
  ATTRIBUTION_DISCLOSURE,
  PROOF_METRICS,
  compareMetric,
  periodVerdict,
  type MetricValue,
  type ProofComparison,
  type ProofMetricKey,
} from "@/lib/domain/proof";

/**
 * Proof repository.
 *
 * Each period carries two kinds of number. Client-reported figures are read
 * straight from the stored `ProofPeriod`. Platform-observed figures are
 * recomputed from workspace records every time, so a comparison can never drift
 * away from the content, publishing and pipeline data behind it.
 *
 * A baseline is client-reported for everything: the engagement had not started,
 * so the platform observed nothing to recompute.
 */

export async function listProofPeriods(orgId: string) {
  return prisma.proofPeriod.findMany({
    where: { orgId },
    orderBy: [{ kind: "asc" }, { periodStart: "asc" }],
    include: { recordedBy: { select: { id: true, name: true } } },
  });
}

export type ProofPeriodRecord = Awaited<ReturnType<typeof listProofPeriods>>[number];

export async function getProofPeriod(orgId: string, id: string) {
  return prisma.proofPeriod.findFirst({ where: { id, orgId } });
}

export async function baselinePeriod(orgId: string) {
  return prisma.proofPeriod.findFirst({
    where: { orgId, kind: "baseline" },
    orderBy: { periodStart: "desc" },
  });
}

/* ------------------------- Platform-observed figures ------------------------ */

export type ObservedFigures = {
  contentOutput: number;
  cycleTimeDays: number | null;
  approvalDays: number | null;
  engagementRate: number | null;
  qualifiedInquiries: number;
  callsBooked: number;
  attributableValue: number;
};

/**
 * Recompute what the platform can actually see for a period.
 *
 * Cycle time runs from a piece being created (footage arriving) to approval.
 * Approval time pairs each `in_review` event with the next `approved` event for
 * the same item. Both use real timestamps from the content event log.
 */
export async function observedFigures(
  orgId: string,
  start: Date,
  end: Date,
): Promise<ObservedFigures> {
  const [published, approvedItems, events, snapshots, inquiries] = await Promise.all([
    prisma.publishRecord.count({
      where: { orgId, status: "published", publishedAt: { gte: start, lte: end } },
    }),
    prisma.contentItem.findMany({
      where: { orgId, approvedAt: { gte: start, lte: end } },
      select: { id: true, createdAt: true, approvedAt: true },
    }),
    prisma.contentEvent.findMany({
      where: {
        orgId,
        type: "stage_change",
        toStage: { in: ["in_review", "approved"] },
        // Reach back a little so a review that started just before the period
        // still pairs with its approval inside it.
        createdAt: { gte: addDays(start, -45), lte: end },
      },
      select: { contentItemId: true, toStage: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.performanceSnapshot.findMany({
      where: { orgId, capturedAt: { gte: start, lte: end } },
      orderBy: { capturedAt: "desc" },
      select: { publishRecordId: true, views: true, likes: true, comments: true, shares: true },
    }),
    prisma.inquiry.findMany({
      where: { orgId, occurredAt: { gte: start, lte: end } },
      select: { stage: true, valueMinor: true, contentItemId: true, closedAt: true },
    }),
  ]);

  const cycleTimes = approvedItems
    .filter((i) => i.approvedAt)
    .map((i) => daysBetween(i.createdAt, i.approvedAt as Date))
    .filter((d) => d >= 0);

  const approvalTimes: number[] = [];
  const pendingReview = new Map<string, Date>();
  for (const event of events) {
    if (event.toStage === "in_review") {
      pendingReview.set(event.contentItemId, event.createdAt);
    } else if (event.toStage === "approved") {
      const started = pendingReview.get(event.contentItemId);
      if (started && event.createdAt >= start) {
        approvalTimes.push(daysBetween(started, event.createdAt));
        pendingReview.delete(event.contentItemId);
      }
    }
  }

  // One reading per publish record — the most recent inside the period — so a
  // piece measured weekly does not count its views several times over.
  const latestByRecord = new Map<string, (typeof snapshots)[number]>();
  for (const snapshot of snapshots) {
    if (!latestByRecord.has(snapshot.publishRecordId)) {
      latestByRecord.set(snapshot.publishRecordId, snapshot);
    }
  }
  let views = 0;
  let engagements = 0;
  for (const snapshot of latestByRecord.values()) {
    views += snapshot.views;
    engagements += snapshot.likes + snapshot.comments + snapshot.shares;
  }

  const qualifiedInquiries = inquiries.filter((i) =>
    ["qualified", "call_booked", "won"].includes(i.stage),
  ).length;
  const callsBooked = inquiries.filter((i) => ["call_booked", "won"].includes(i.stage)).length;

  // Attributable only where the buyer named a specific piece of content.
  const attributableValue = inquiries
    .filter((i) => i.stage === "won" && i.contentItemId)
    .reduce((sum, i) => sum + (i.valueMinor ?? 0), 0);

  return {
    contentOutput: published,
    cycleTimeDays: cycleTimes.length ? round1(mean(cycleTimes)) : null,
    approvalDays: approvalTimes.length ? round1(mean(approvalTimes)) : null,
    engagementRate: views > 0 ? round1((engagements / views) * 100) : null,
    qualifiedInquiries,
    callsBooked,
    attributableValue,
  };
}

/* ------------------------------- Comparison -------------------------------- */

export type PeriodFigures = Record<ProofMetricKey, MetricValue>;

/**
 * Resolve every metric for a period.
 *
 * A baseline never recomputes: there is nothing in the workspace from before
 * the engagement to recompute from, so every baseline figure stays exactly what
 * the client reported and is labelled as reported in the UI.
 */
export async function figuresFor(
  orgId: string,
  period: {
    kind: string;
    periodStart: Date;
    periodEnd: Date;
    reportedFounderHours: number | null;
    reportedContentOutput: number | null;
    reportedCycleTimeDays: number | null;
    reportedApprovalDays: number | null;
    reportedAudienceSize: number | null;
    reportedEngagementRate: number | null;
    reportedQualifiedInquiries: number | null;
    reportedCallsBooked: number | null;
    reportedAttributableValueMinor: number | null;
  },
): Promise<PeriodFigures> {
  const reported = {
    founderHours: period.reportedFounderHours,
    contentOutput: period.reportedContentOutput,
    cycleTimeDays: period.reportedCycleTimeDays,
    approvalDays: period.reportedApprovalDays,
    audienceSize: period.reportedAudienceSize,
    engagementRate: period.reportedEngagementRate,
    qualifiedInquiries: period.reportedQualifiedInquiries,
    callsBooked: period.reportedCallsBooked,
    attributableValue: period.reportedAttributableValueMinor,
  };

  if (period.kind === "baseline") {
    return Object.fromEntries(
      PROOF_METRICS.map((m) => [m.key, { value: reported[m.key] ?? null, observed: false }]),
    ) as PeriodFigures;
  }

  const observed = await observedFigures(orgId, period.periodStart, period.periodEnd);

  const resolve = (key: ProofMetricKey): MetricValue => {
    switch (key) {
      // These four are only knowable from the founder and the platform cannot
      // check them, so a reported value is the whole truth for them.
      case "founderHours":
      case "audienceSize":
        return { value: reported[key] ?? null, observed: false };
      // For the rest the platform's own records are authoritative; a reported
      // figure is used only when there is nothing recorded to observe.
      case "contentOutput":
        return observed.contentOutput > 0
          ? { value: observed.contentOutput, observed: true }
          : { value: reported.contentOutput ?? null, observed: false };
      case "cycleTimeDays":
        return observed.cycleTimeDays !== null
          ? { value: observed.cycleTimeDays, observed: true }
          : { value: reported.cycleTimeDays ?? null, observed: false };
      case "approvalDays":
        return observed.approvalDays !== null
          ? { value: observed.approvalDays, observed: true }
          : { value: reported.approvalDays ?? null, observed: false };
      case "engagementRate":
        return observed.engagementRate !== null
          ? { value: observed.engagementRate, observed: true }
          : { value: reported.engagementRate ?? null, observed: false };
      case "qualifiedInquiries":
        return observed.qualifiedInquiries > 0
          ? { value: observed.qualifiedInquiries, observed: true }
          : { value: reported.qualifiedInquiries ?? null, observed: false };
      case "callsBooked":
        return observed.callsBooked > 0
          ? { value: observed.callsBooked, observed: true }
          : { value: reported.callsBooked ?? null, observed: false };
      case "attributableValue":
        return observed.attributableValue > 0
          ? { value: observed.attributableValue, observed: true }
          : { value: reported.attributableValue ?? null, observed: false };
    }
  };

  return Object.fromEntries(PROOF_METRICS.map((m) => [m.key, resolve(m.key)])) as PeriodFigures;
}

export type ProofPeriodView = {
  record: ProofPeriodRecord;
  figures: PeriodFigures;
  comparisons: ProofComparison[];
  verdict: ReturnType<typeof periodVerdict> | null;
};

export type ProofView = {
  baseline: ProofPeriodView | null;
  months: ProofPeriodView[];
  disclosure: string;
};

/** The full comparison view: baseline plus every recorded month, in order. */
export async function proofView(orgId: string): Promise<ProofView> {
  const periods = await listProofPeriods(orgId);
  const baselineRecord = periods.find((p) => p.kind === "baseline") ?? null;
  const monthRecords = periods
    .filter((p) => p.kind === "period")
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

  const baselineFigures = baselineRecord ? await figuresFor(orgId, baselineRecord) : null;

  const months: ProofPeriodView[] = [];
  for (const record of monthRecords) {
    const figures = await figuresFor(orgId, record);
    const comparisons = baselineFigures
      ? PROOF_METRICS.map((metric) =>
          compareMetric(metric, baselineFigures[metric.key], figures[metric.key]),
        )
      : [];
    months.push({
      record,
      figures,
      comparisons,
      verdict: comparisons.length ? periodVerdict(comparisons) : null,
    });
  }

  return {
    baseline:
      baselineRecord && baselineFigures
        ? { record: baselineRecord, figures: baselineFigures, comparisons: [], verdict: null }
        : null,
    months,
    disclosure: ATTRIBUTION_DISCLOSURE,
  };
}

/**
 * Suggested figures for a new month, so an operator starts from the workspace's
 * own records rather than a blank form.
 */
export async function suggestedMonth(orgId: string, start: Date, end: Date) {
  return observedFigures(orgId, start, end);
}

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / 86_400_000;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
