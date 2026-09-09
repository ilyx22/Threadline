import "server-only";
import { z } from "zod";
import { computeLearningSections, learningSectionsSchema, EMPTY_LEARNING } from "./learning-sections";
import { prisma } from "@/lib/db/client";
import { mean } from "@/lib/domain/scoring";
import {
  breakdowns,
  operatingSnapshot,
  pipelineSummary,
  previousPeriod,
  publishedAssets,
  summarise,
  topPerformers,
  underPerformers,
  type PeriodRange,
} from "@/lib/data/metrics";
import { clientAttributionSummary } from "@/lib/data/attribution";
import { endOfWeek, formatWeekRange, startOfWeek } from "@/lib/utils/dates";

/**
 * Weekly executive report.
 *
 * Every number is computed from stored records, then FROZEN into
 * `WeeklyReport.payload`. A report is a snapshot of what was true that week —
 * re-opening a report from three months ago must not silently re-query and
 * show different numbers than the client was sent.
 *
 * The optional AI narrative sits alongside the numbers and never produces them.
 */

export const weeklyReportPayloadSchema = z.object({
  periodLabel: z.string(),
  shipped: z.object({
    count: z.number(),
    target: z.number(),
    byPlatform: z.array(z.object({ platform: z.string(), count: z.number() })),
    titles: z.array(z.object({ id: z.string(), title: z.string(), platform: z.string() })),
  }),
  performance: z.object({
    views: z.number(),
    impressions: z.number(),
    engagements: z.number(),
    avgRetention: z.number(),
    avgEngagementRate: z.number(),
    viewsDelta: z.number().nullable(),
    publishedDelta: z.number().nullable(),
  }),
  wins: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      metric: z.string().optional(),
      contentItemId: z.string().optional(),
    }),
  ),
  misses: z.array(z.object({ title: z.string(), detail: z.string() })),
  learnings: z.array(
    z.object({ title: z.string(), detail: z.string(), kind: z.string(), confidence: z.number() }),
  ),
  nextWeek: z.object({
    tests: z.array(z.string()),
    priorities: z.array(z.string()),
    recordingPlan: z.array(z.object({ title: z.string(), estimateMin: z.number() })),
    recordingMinutes: z.number(),
  }),
  clientActions: z.array(
    z.object({ kind: z.string(), title: z.string(), count: z.number(), estimateMin: z.number() }),
  ),
  operating: z.object({
    founderHours: z.number(),
    hoursSaved: z.number(),
    cycleTimeHours: z.number(),
    approvalHours: z.number(),
    piecesShipped: z.number(),
    bottleneck: z.string().nullable(),
  }),
  commercial: z.object({
    inquiries: z.number(),
    qualified: z.number(),
    callsBooked: z.number(),
    won: z.number(),
    valueMinor: z.number(),
    attributedToContent: z.number(),
  }),
  /**
   * What the period's commercial figures are actually entitled to claim.
   *
   * Frozen into the payload with everything else, so a report says the same
   * thing in six months as it did on the day — including about how well
   * evidenced it was. Re-deriving this at read time would let a later
   * improvement in tracking quietly upgrade the language of an old report.
   */
  attribution: z
    .object({
      trackedClicks: z.number(),
      /** One line per evidence class, strongest first. */
      claims: z.array(
        z.object({
          evidence: z.string(),
          events: z.number(),
          valueMinor: z.number(),
          sentence: z.string(),
        }),
      ),
      /** Whether money-per-asset was defensible in this period. */
      monetaryAllowed: z.boolean(),
      dataQualityNote: z.string(),
    })
    .default({ trackedClicks: 0, claims: [], monetaryAllowed: false, dataQualityNote: "" }),
  /** Brief §33 / §62: expected vs actual, what we learned, weakest link, what changed, limitations, next tests. */
  learning: learningSectionsSchema.default(EMPTY_LEARNING),
  generatedAt: z.string(),
  isDemoNarrative: z.boolean().default(false),
});

export type WeeklyReportPayload = z.infer<typeof weeklyReportPayloadSchema>;

export function weekRangeFor(date: Date): PeriodRange {
  return { start: startOfWeek(date), end: endOfWeek(date) };
}

/**
 * Compute the report payload. Pure read + arithmetic; no writes, no AI.
 */
export async function computeWeeklyReport(
  orgId: string,
  range: PeriodRange,
): Promise<WeeklyReportPayload> {
  const prev = previousPeriod(range);

  const [
    assets,
    prevAssets,
    operating,
    pipeline,
    learnings,
    openTests,
    recordingQueue,
    tasks,
    target,
    reviewQueue,
    attribution,
  ] = await Promise.all([
      publishedAssets(orgId, range),
      publishedAssets(orgId, prev),
      operatingSnapshot(orgId, range),
      pipelineSummary(orgId, range),
      prisma.pattern.findMany({
        where: {
          orgId,
          kind: { in: ["learning", "pattern"] },
          updatedAt: { gte: range.start, lte: range.end },
        },
        orderBy: { score: "desc" },
        take: 6,
      }),
      prisma.pattern.findMany({
        where: { orgId, kind: { in: ["hypothesis", "test"] }, status: { in: ["open", "testing"] } },
        orderBy: { score: "desc" },
        take: 4,
      }),
      prisma.script.findMany({
        where: { orgId, qaState: "approved", contentItems: { none: {} } },
        select: { id: true, title: true, estimatedSeconds: true },
        orderBy: { updatedAt: "asc" },
        take: 12,
      }),
      prisma.task.findMany({
        where: { orgId, audience: "client", status: { in: ["open", "in_progress"] } },
        select: { kind: true, title: true, estimateMin: true },
      }),
      cadenceTargetFor(orgId),
      prisma.contentItem.count({ where: { orgId, stage: "in_review" } }),
      clientAttributionSummary(orgId, range),
    ]);

  const current = summarise(assets);
  const before = summarise(prevAssets);
  const b = breakdowns(assets);

  /* --------------------------------- Shipped -------------------------------- */

  const byPlatform = new Map<string, number>();
  for (const asset of assets) {
    byPlatform.set(asset.platform, (byPlatform.get(asset.platform) ?? 0) + 1);
  }

  /* ----------------------------------- Wins --------------------------------- */

  const wins: WeeklyReportPayload["wins"] = [];
  for (const asset of topPerformers(assets, 3)) {
    if (asset.views <= 0) continue;
    wins.push({
      title: asset.title,
      detail: `${asset.platform} · ${asset.ratio > 0 ? `${asset.ratio}x median reach` : "published"}`,
      metric: `${asset.views.toLocaleString("en-GB")} views`,
      contentItemId: asset.contentItemId,
    });
  }

  const strongestTopic = b.byTopic.filter((t) => t.count >= 2)[0];
  if (strongestTopic) {
    wins.push({
      title: `Strongest theme: ${strongestTopic.label}`,
      detail: `${strongestTopic.count} pieces averaging ${strongestTopic.avgViews.toLocaleString("en-GB")} views.`,
    });
  }

  if (pipeline.callsBooked > 0) {
    wins.push({
      title: `${pipeline.callsBooked} call${pipeline.callsBooked === 1 ? "" : "s"} booked`,
      detail: `${pipeline.attributedToContent} of ${pipeline.inquiries} inquiries were attributed to published content.`,
    });
  }

  /* ---------------------------------- Misses -------------------------------- */

  const misses: WeeklyReportPayload["misses"] = [];

  if (current.published < target) {
    misses.push({
      title: `Output below target`,
      detail: `${current.published} shipped against a target of ${target} for the week.`,
    });
  }

  for (const asset of underPerformers(assets, 2)) {
    if (asset.verdict !== "loser") continue;
    misses.push({
      title: asset.title,
      detail: `${asset.views.toLocaleString("en-GB")} views — ${asset.ratio}x median. Worth reviewing the hook.`,
    });
  }

  if (operating.bottleneck && operating.bottleneck.count >= 2) {
    misses.push({
      title: `Production held at ${operating.bottleneck.label}`,
      detail: `${operating.bottleneck.count} pieces are stuck at this stage.`,
    });
  }

  if (reviewQueue >= 3) {
    misses.push({
      title: "Review queue building",
      detail: `${reviewQueue} pieces are waiting on approval.`,
    });
  }

  /* --------------------------------- Learnings ------------------------------- */

  const learningEntries = learnings.map((l) => ({
    title: l.title,
    detail: l.description ?? "",
    kind: l.kind,
    confidence: l.confidence,
  }));

  const hookLeader = b.byHookShape.filter((h) => h.count >= 2)[0];
  if (hookLeader && learningEntries.length < 4) {
    learningEntries.push({
      title: `"${hookLeader.label}" openings led on reach`,
      detail: `${hookLeader.count} pieces averaging ${hookLeader.avgViews.toLocaleString("en-GB")} views.`,
      kind: "pattern",
      confidence: hookLeader.count >= 4 ? 60 : 35,
    });
  }

  /* --------------------------------- Next week ------------------------------- */

  const recordingPlan = recordingQueue.slice(0, 8).map((s) => ({
    title: s.title,
    estimateMin: Math.max(4, Math.round((s.estimatedSeconds / 60) * 6)),
  }));

  const priorities: string[] = [];
  if (current.published < target) priorities.push(`Recover output to ${target} pieces.`);
  if (operating.bottleneck && operating.bottleneck.count >= 2) {
    priorities.push(`Clear the ${operating.bottleneck.label} backlog.`);
  }
  if (strongestTopic) priorities.push(`Produce two more pieces on ${strongestTopic.label}.`);
  if (pipeline.inquiries === 0) priorities.push("Add a direct CTA to at least two pieces.");

  /* ------------------------------ Client actions ----------------------------- */

  const actionGroups = new Map<string, { count: number; estimateMin: number; title: string }>();
  for (const task of tasks) {
    const existing = actionGroups.get(task.kind) ?? {
      count: 0,
      estimateMin: 0,
      title: task.title,
    };
    existing.count += 1;
    existing.estimateMin += task.estimateMin ?? 5;
    actionGroups.set(task.kind, existing);
  }

  const clientActions = [...actionGroups.entries()].map(([kind, v]) => ({
    kind,
    title: v.count === 1 ? v.title : `${v.count} ${kind} items`,
    count: v.count,
    estimateMin: v.estimateMin,
  }));

  if (recordingPlan.length > 0) {
    clientActions.unshift({
      kind: "record",
      title: `Record ${recordingPlan.length} script${recordingPlan.length === 1 ? "" : "s"}`,
      count: recordingPlan.length,
      estimateMin: recordingPlan.reduce((a, r) => a + r.estimateMin, 0),
    });
  }

  return weeklyReportPayloadSchema.parse({
    periodLabel: formatWeekRange(range.start, range.end),
    shipped: {
      count: current.published,
      target,
      byPlatform: [...byPlatform.entries()].map(([platform, count]) => ({ platform, count })),
      titles: assets.slice(0, 12).map((a) => ({
        id: a.contentItemId,
        title: a.title,
        platform: a.platform,
      })),
    },
    performance: {
      views: current.views,
      impressions: current.impressions,
      engagements: current.engagements,
      avgRetention: current.avgRetention,
      avgEngagementRate: current.avgEngagementRate,
      viewsDelta: before.views > 0 ? round1(((current.views - before.views) / before.views) * 100) : null,
      publishedDelta:
        before.published > 0
          ? round1(((current.published - before.published) / before.published) * 100)
          : null,
    },
    wins: wins.slice(0, 5),
    misses: misses.slice(0, 5),
    learnings: learningEntries.slice(0, 5),
    nextWeek: {
      tests: openTests.map((t) => t.nextExperiment || t.title).filter(Boolean),
      priorities: priorities.slice(0, 4),
      recordingPlan,
      recordingMinutes: recordingPlan.reduce((a, r) => a + r.estimateMin, 0),
    },
    clientActions,
    operating: {
      founderHours: operating.founderHours,
      hoursSaved: operating.hoursSaved,
      cycleTimeHours: operating.cycleTimeHours,
      approvalHours: operating.approvalHours,
      piecesShipped: operating.piecesShipped,
      bottleneck: operating.bottleneck?.label ?? null,
    },
    commercial: pipeline,
    attribution: {
      trackedClicks: attribution.clicks,
      claims: attribution.claims.map((c) => ({
        evidence: c.evidence,
        events: c.events,
        valueMinor: c.valueMinor,
        sentence: c.sentence,
      })),
      monetaryAllowed: attribution.coverage.monetaryAllowed,
      dataQualityNote: attribution.measurement,
    },
    learning: await computeLearningSections(orgId, range),
    generatedAt: new Date().toISOString(),
    isDemoNarrative: false,
  });
}

/** Compact metrics summary handed to the narrative generator. */
export function metricsSummaryFor(payload: WeeklyReportPayload) {
  return [
    `Pieces shipped: ${payload.shipped.count} (target ${payload.shipped.target})`,
    `Views: ${payload.performance.views.toLocaleString("en-GB")}${
      payload.performance.viewsDelta != null
        ? ` (${payload.performance.viewsDelta > 0 ? "+" : ""}${payload.performance.viewsDelta}% vs previous week)`
        : ""
    }`,
    `Average retention: ${payload.performance.avgRetention}%`,
    `Inquiries: ${payload.commercial.inquiries}, qualified: ${payload.commercial.qualified}, calls booked: ${payload.commercial.callsBooked}`,
    `Cycle time: ${payload.operating.cycleTimeHours}h, approval turnaround: ${payload.operating.approvalHours}h`,
    payload.operating.bottleneck ? `Current bottleneck: ${payload.operating.bottleneck}` : "",
    payload.learnings.length > 0
      ? `Learnings this week: ${payload.learnings.map((l) => l.title).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function cadenceTargetFor(orgId: string) {
  const brain = await prisma.brandBrain.findUnique({
    where: { orgId },
    select: { contentRules: true },
  });
  if (!brain) return 3;
  try {
    const rules = JSON.parse(brain.contentRules) as { cadencePerWeek?: number };
    return typeof rules.cadencePerWeek === "number" ? rules.cadencePerWeek : 3;
  } catch {
    return 3;
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Average of a list, exported for report unit tests. */
export const average = mean;
