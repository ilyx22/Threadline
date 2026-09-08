import "server-only";
import { prisma } from "@/lib/db/client";
import { addDays, hoursBetween, startOfDay } from "@/lib/utils/dates";
import { classifyPerformance, engagementRate, mean, median, periodDelta, sum } from "@/lib/domain/scoring";

/**
 * Derived metrics.
 *
 * Everything here is computed from stored records. No metric is stored
 * pre-aggregated except `OperatingMetric` (a weekly snapshot) and the frozen
 * `WeeklyReport.payload`, both of which exist so a historical report does not
 * silently change after the fact.
 *
 * Every function takes an `orgId` that must originate from an AuthContext.
 */

export type PeriodRange = { start: Date; end: Date };

export function lastNDays(days: number): PeriodRange {
  const end = new Date();
  return { start: startOfDay(addDays(end, -days + 1)), end };
}

export function previousPeriod(range: PeriodRange): PeriodRange {
  const span = range.end.getTime() - range.start.getTime();
  return { start: new Date(range.start.getTime() - span), end: new Date(range.start.getTime() - 1) };
}

/* --------------------------- Latest snapshot view -------------------------- */

export type PublishedAsset = {
  publishRecordId: string;
  contentItemId: string;
  title: string;
  platform: string;
  format: string;
  publishedAt: Date;
  url: string | null;
  hook: string | null;
  pillar: string | null;
  cta: string | null;
  views: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTimeSec: number;
  avgViewSec: number;
  retentionPct: number;
  ctrPct: number;
  leads: number;
  bookedCalls: number;
  revenueMinor: number;
  engagementRate: number;
};

/**
 * Published assets with their most recent metric snapshot.
 *
 * Uses the latest snapshot per publish record rather than summing snapshots,
 * because snapshots are cumulative readings of the same asset, not increments.
 */
export async function publishedAssets(
  orgId: string,
  range?: PeriodRange,
): Promise<PublishedAsset[]> {
  const records = await prisma.publishRecord.findMany({
    where: {
      orgId,
      status: "published",
      ...(range ? { publishedAt: { gte: range.start, lte: range.end } } : {}),
    },
    include: {
      contentItem: {
        select: {
          id: true,
          title: true,
          format: true,
          selectedHook: true,
          idea: { select: { pillar: true, cta: true } },
        },
      },
      snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
    orderBy: { publishedAt: "desc" },
  });

  return records
    .filter((r) => r.publishedAt)
    .map((r) => {
      const s = r.snapshots[0];
      const views = s?.views ?? 0;
      return {
        publishRecordId: r.id,
        contentItemId: r.contentItem.id,
        title: r.contentItem.title,
        platform: r.platform,
        format: r.contentItem.format,
        publishedAt: r.publishedAt as Date,
        url: r.url,
        hook: r.contentItem.selectedHook,
        pillar: r.contentItem.idea?.pillar ?? null,
        cta: r.contentItem.idea?.cta ?? null,
        views,
        impressions: s?.impressions ?? 0,
        likes: s?.likes ?? 0,
        comments: s?.comments ?? 0,
        shares: s?.shares ?? 0,
        saves: s?.saves ?? 0,
        watchTimeSec: s?.watchTimeSec ?? 0,
        avgViewSec: s?.avgViewSec ?? 0,
        retentionPct: s?.retentionPct ?? 0,
        ctrPct: s?.ctrPct ?? 0,
        leads: s?.leads ?? 0,
        bookedCalls: s?.bookedCalls ?? 0,
        revenueMinor: s?.revenueMinor ?? 0,
        engagementRate: engagementRate({
          likes: s?.likes ?? 0,
          comments: s?.comments ?? 0,
          shares: s?.shares ?? 0,
          saves: s?.saves ?? 0,
          views,
        }),
      };
    });
}

/* ------------------------------ Period summary ----------------------------- */

export type PerformanceSummary = {
  published: number;
  views: number;
  impressions: number;
  engagements: number;
  avgRetention: number;
  avgEngagementRate: number;
  leads: number;
  bookedCalls: number;
  revenueMinor: number;
};

export function summarise(assets: PublishedAsset[]): PerformanceSummary {
  const retentions = assets.filter((a) => a.retentionPct > 0).map((a) => a.retentionPct);
  return {
    published: assets.length,
    views: sum(assets.map((a) => a.views)),
    impressions: sum(assets.map((a) => a.impressions)),
    engagements: sum(assets.map((a) => a.likes + a.comments + a.shares + a.saves)),
    avgRetention: Math.round(mean(retentions) * 10) / 10,
    avgEngagementRate: Math.round(mean(assets.map((a) => a.engagementRate)) * 10) / 10,
    leads: sum(assets.map((a) => a.leads)),
    bookedCalls: sum(assets.map((a) => a.bookedCalls)),
    revenueMinor: sum(assets.map((a) => a.revenueMinor)),
  };
}

export type ComparedSummary = PerformanceSummary & {
  deltas: {
    published: number | null;
    views: number | null;
    engagements: number | null;
    leads: number | null;
    bookedCalls: number | null;
  };
};

export async function comparedPerformance(
  orgId: string,
  range: PeriodRange,
): Promise<ComparedSummary> {
  const prev = previousPeriod(range);
  const [current, previous] = await Promise.all([
    publishedAssets(orgId, range),
    publishedAssets(orgId, prev),
  ]);

  const now = summarise(current);
  const before = summarise(previous);

  return {
    ...now,
    deltas: {
      published: periodDelta(now.published, before.published),
      views: periodDelta(now.views, before.views),
      engagements: periodDelta(now.engagements, before.engagements),
      leads: periodDelta(now.leads, before.leads),
      bookedCalls: periodDelta(now.bookedCalls, before.bookedCalls),
    },
  };
}

/* -------------------------------- Breakdowns ------------------------------- */

export type Breakdown = {
  key: string;
  label: string;
  count: number;
  views: number;
  avgViews: number;
  engagementRate: number;
  leads: number;
};

function breakdownBy(
  assets: PublishedAsset[],
  keyOf: (a: PublishedAsset) => string | null,
  labelOf?: (key: string) => string,
): Breakdown[] {
  const groups = new Map<string, PublishedAsset[]>();
  for (const asset of assets) {
    const key = keyOf(asset);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(asset);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([key, items]) => ({
      key,
      label: labelOf?.(key) ?? key,
      count: items.length,
      views: sum(items.map((i) => i.views)),
      avgViews: Math.round(mean(items.map((i) => i.views))),
      engagementRate: Math.round(mean(items.map((i) => i.engagementRate)) * 10) / 10,
      leads: sum(items.map((i) => i.leads)),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}

export function breakdowns(assets: PublishedAsset[]) {
  return {
    byPlatform: breakdownBy(assets, (a) => a.platform),
    byFormat: breakdownBy(assets, (a) => a.format),
    byTopic: breakdownBy(assets, (a) => a.pillar),
    byCta: breakdownBy(assets, (a) => a.cta),
    /** Hooks are grouped by their opening structure, not verbatim text. */
    byHookShape: breakdownBy(assets, (a) => (a.hook ? hookShape(a.hook) : null)),
  };
}

/**
 * Classify a hook into a structural shape so hook performance can be compared
 * across pieces. Verbatim hooks never repeat, so grouping by exact text would
 * produce a table of ones.
 */
export function hookShape(hook: string): string {
  const h = hook.trim().toLowerCase();
  if (/^"|^'/.test(hook.trim())) return "Quote open";
  if (/\?$/.test(hook.trim())) return "Question open";
  if (/^(i |we |my |last week|a few years|when i)/.test(h)) return "First-person story";
  if (/^(most|everyone|nobody|people)\b/.test(h)) return "Contrarian claim";
  if (/^\d|\b\d+\s*(x|%|years|months|weeks)\b/.test(h)) return "Number open";
  if (/^(if you|here'?s|there'?s)\b/.test(h)) return "Direct address";
  if (/\bstop\b|\bnever\b|\bdon'?t\b/.test(h)) return "Warning / negation";
  return "Statement";
}

/* ---------------------------- Winners and losers --------------------------- */

export type Classified = PublishedAsset & { verdict: "winner" | "loser" | "typical" | "unknown"; ratio: number };

export function classifyAssets(assets: PublishedAsset[]): Classified[] {
  const med = median(assets.map((a) => a.views));
  return assets.map((a) => ({
    ...a,
    verdict: classifyPerformance(a.views, med),
    ratio: med > 0 ? Math.round((a.views / med) * 10) / 10 : 0,
  }));
}

export function topPerformers(assets: PublishedAsset[], limit = 5) {
  return classifyAssets(assets)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function underPerformers(assets: PublishedAsset[], limit = 5) {
  return classifyAssets(assets)
    .filter((a) => a.views > 0)
    .sort((a, b) => a.views - b.views)
    .slice(0, limit);
}

/* ------------------------------ Trend over time ---------------------------- */

export type TrendPoint = { date: string; label: string; views: number; published: number; leads: number };

export function viewsTrend(assets: PublishedAsset[], range: PeriodRange, buckets = 12): TrendPoint[] {
  const span = range.end.getTime() - range.start.getTime();
  const bucketMs = Math.max(86_400_000, Math.floor(span / buckets));
  const points: TrendPoint[] = [];

  for (let t = range.start.getTime(); t <= range.end.getTime(); t += bucketMs) {
    const bucketStart = t;
    const bucketEnd = t + bucketMs;
    const inBucket = assets.filter(
      (a) => a.publishedAt.getTime() >= bucketStart && a.publishedAt.getTime() < bucketEnd,
    );
    const date = new Date(bucketStart);
    points.push({
      date: date.toISOString(),
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      views: sum(inBucket.map((a) => a.views)),
      published: inBucket.length,
      leads: sum(inBucket.map((a) => a.leads)),
    });
  }

  return points;
}

/* ---------------------------- Operating metrics ---------------------------- */

export type OperatingSnapshot = {
  founderHours: number;
  hoursSaved: number;
  cycleTimeHours: number;
  approvalHours: number;
  piecesShipped: number;
  bottleneck: { stage: string; count: number; label: string } | null;
};

/**
 * Operating metrics computed from the content event log.
 *
 * Cycle time is measured from a piece entering `raw` to going `live`.
 * Approval turnaround is measured from entering `in_review` to `approved`.
 * Both come from real timestamps, not estimates.
 */
export async function operatingSnapshot(
  orgId: string,
  range: PeriodRange,
): Promise<OperatingSnapshot> {
  const [items, events, stored, stageCounts] = await Promise.all([
    prisma.contentItem.findMany({
      where: { orgId, liveAt: { gte: range.start, lte: range.end } },
      select: { id: true, createdAt: true, liveAt: true },
    }),
    prisma.contentEvent.findMany({
      where: {
        orgId,
        type: "stage_change",
        createdAt: { gte: addDays(range.start, -30), lte: range.end },
      },
      select: { contentItemId: true, toStage: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.operatingMetric.findMany({
      where: { orgId, weekStart: { gte: range.start, lte: range.end } },
    }),
    prisma.contentItem.groupBy({
      by: ["stage"],
      where: { orgId, stage: { notIn: ["live"] } },
      _count: { _all: true },
    }),
  ]);

  const cycleTimes = items
    .filter((i) => i.liveAt)
    .map((i) => hoursBetween(i.createdAt, i.liveAt as Date))
    .filter((h) => h > 0);

  // Pair each in_review with the next approval for the same item.
  const approvalTimes: number[] = [];
  const pendingReview = new Map<string, Date>();
  for (const event of events) {
    if (event.toStage === "in_review") {
      pendingReview.set(event.contentItemId, event.createdAt);
    } else if (event.toStage === "approved") {
      const started = pendingReview.get(event.contentItemId);
      if (started) {
        approvalTimes.push(hoursBetween(started, event.createdAt));
        pendingReview.delete(event.contentItemId);
      }
    }
  }

  const founderHours = sum(stored.map((s) => s.founderHours));
  const hoursSaved = sum(stored.map((s) => s.hoursSaved));

  const bottleneckRow = [...stageCounts]
    .filter((s) => s.stage !== "approved")
    .sort((a, b) => b._count._all - a._count._all)[0];

  return {
    founderHours: Math.round(founderHours * 10) / 10,
    hoursSaved: Math.round(hoursSaved * 10) / 10,
    cycleTimeHours: Math.round(mean(cycleTimes) * 10) / 10,
    approvalHours: Math.round(mean(approvalTimes) * 10) / 10,
    piecesShipped: items.length,
    bottleneck: bottleneckRow
      ? {
          stage: bottleneckRow.stage,
          count: bottleneckRow._count._all,
          label: bottleneckRow.stage.replace(/_/g, " "),
        }
      : null,
  };
}

/* --------------------------------- Pipeline -------------------------------- */

export type PipelineSummary = {
  inquiries: number;
  qualified: number;
  callsBooked: number;
  won: number;
  valueMinor: number;
  attributedToContent: number;
};

export async function pipelineSummary(orgId: string, range: PeriodRange): Promise<PipelineSummary> {
  const inquiries = await prisma.inquiry.findMany({
    where: { orgId, occurredAt: { gte: range.start, lte: range.end } },
    select: { stage: true, valueMinor: true, contentItemId: true },
  });

  return {
    inquiries: inquiries.length,
    qualified: inquiries.filter((i) => ["qualified", "call_booked", "won"].includes(i.stage)).length,
    callsBooked: inquiries.filter((i) => ["call_booked", "won"].includes(i.stage)).length,
    won: inquiries.filter((i) => i.stage === "won").length,
    valueMinor: sum(inquiries.filter((i) => i.stage === "won").map((i) => i.valueMinor)),
    attributedToContent: inquiries.filter((i) => i.contentItemId).length,
  };
}

/* --------------------------- Derived plain-English -------------------------- */

export type Insight = {
  id: string;
  text: string;
  tone: "positive" | "negative" | "neutral";
  evidence?: string;
};

/**
 * Insight generation from real numbers only.
 *
 * These are computed comparisons, not model output. If the data does not support
 * a statement, no statement is produced — an empty insights list is an honest
 * result and the UI has an empty state for it.
 */
export function deriveInsights(input: {
  assets: PublishedAsset[];
  breakdowns: ReturnType<typeof breakdowns>;
  operating: OperatingSnapshot;
  pipeline: PipelineSummary;
  previousApprovalHours?: number;
}): Insight[] {
  const insights: Insight[] = [];
  const { assets, breakdowns: b, operating, pipeline } = input;

  if (assets.length < 3) return insights;

  const overallAvg = mean(assets.map((a) => a.views));

  // Strongest topic vs the rest.
  const topics = b.byTopic.filter((t) => t.count >= 2);
  if (topics.length >= 2 && overallAvg > 0) {
    const best = topics[0];
    if (best && best.avgViews > overallAvg * 1.3) {
      const multiple = (best.avgViews / overallAvg).toFixed(1);
      insights.push({
        id: "topic-lead",
        tone: "positive",
        text: `"${best.label}" content is averaging ${multiple}x your median reach.`,
        evidence: `${best.count} pieces, ${Math.round(best.avgViews).toLocaleString("en-GB")} average views.`,
      });
    }
  }

  // Hook structure.
  const hooks = b.byHookShape.filter((h) => h.count >= 2);
  if (hooks.length >= 2) {
    const best = hooks[0];
    const worst = hooks[hooks.length - 1];
    if (best && worst && best.avgViews > worst.avgViews * 1.5) {
      insights.push({
        id: "hook-shape",
        tone: "positive",
        text: `Your strongest opening structure this period has been "${best.label}", outperforming "${worst.label}" openings.`,
        evidence: `${best.count} pieces at ${Math.round(best.avgViews).toLocaleString("en-GB")} average views vs ${Math.round(worst.avgViews).toLocaleString("en-GB")}.`,
      });
    }
  }

  // Commercial contribution.
  const leadDrivers = assets.filter((a) => a.leads > 0);
  if (pipeline.inquiries > 0 && leadDrivers.length > 0) {
    const share = Math.round((leadDrivers.length / assets.length) * 100);
    insights.push({
      id: "commercial",
      tone: "positive",
      text: `${leadDrivers.length} of ${assets.length} published pieces produced a recorded inbound signal.`,
      evidence: `${share}% of output generated at least one inquiry.`,
    });
  }

  // Approval turnaround movement.
  if (input.previousApprovalHours && operating.approvalHours > 0) {
    const change = periodDelta(operating.approvalHours, input.previousApprovalHours);
    if (change != null && Math.abs(change) >= 15) {
      insights.push({
        id: "approval-turnaround",
        tone: change > 0 ? "negative" : "positive",
        text:
          change > 0
            ? `Approval turnaround increased ${Math.round(change)}% this period.`
            : `Approval turnaround improved ${Math.abs(Math.round(change))}% this period.`,
        evidence: `Now averaging ${operating.approvalHours.toFixed(1)} hours from review to approval.`,
      });
    }
  }

  // Bottleneck.
  if (operating.bottleneck && operating.bottleneck.count >= 3) {
    insights.push({
      id: "bottleneck",
      tone: "negative",
      text: `${operating.bottleneck.count} pieces are held at "${operating.bottleneck.label}".`,
      evidence: "This is the current constraint on throughput.",
    });
  }

  // Format signal.
  const formats = b.byFormat.filter((f) => f.count >= 2);
  if (formats.length >= 2 && overallAvg > 0) {
    const best = formats[0];
    if (best && best.avgViews > overallAvg * 1.25) {
      insights.push({
        id: "format",
        tone: "neutral",
        text: `${best.label.replace(/_/g, " ")} is your strongest format this period.`,
        evidence: `${best.count} pieces averaging ${Math.round(best.avgViews).toLocaleString("en-GB")} views.`,
      });
    }
  }

  return insights.slice(0, 5);
}
