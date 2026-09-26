import "server-only";
import { prisma } from "@/lib/db/client";
import { COMPARABLE_WINDOW_DAYS } from "@/lib/data/corpus";
import { parseJson } from "@/lib/db/json";
import {
  EMPTY_METRICS,
  prescribe,
  readGap,
  type ActualContext,
  type DimensionScore,
  type Expectation,
  type Gap,
  type ObservedMetrics,
} from "@/lib/domain/content-diagnosis";
import {
  periodWindows,
  readLearning,
  type LearningReading,
  type PeriodRecord,
} from "@/lib/domain/learning-velocity";
import { readOutlier, type OutlierBand } from "@/lib/domain/corpus";
import type { AttributionClass } from "@/lib/domain/enums";

/**
 * Reading what actually happened to a piece of content.
 *
 * Two rules govern this file.
 *
 * **Unmeasured is not zero.** `PerformanceSnapshot` stores integers with a
 * default of 0, which cannot distinguish "the platform does not expose saves"
 * from "nobody saved it". Where the distinction is recoverable — no snapshot at
 * all, or a metric that is zero across every snapshot on a platform known not
 * to report it — this layer returns `null`. Everything downstream then has to
 * handle "we do not know", which is the point.
 *
 * **Evidence strength is never raised here.** A commercial event only counts as
 * a qualified action for a specific piece when its attribution already says it
 * can be traced to one (ADR-015). Bio-link traffic does not become proof that a
 * particular Reel caused a visit, however convenient that would be.
 */

/**
 * Attribution classes strong enough to count a commercial event against a
 * specific piece of content.
 *
 * These are the two the domain calls "defensible" (`defensible()` in
 * domain/attribution.ts): a click Threadline itself tracked, or a buyer who
 * named the piece. `multi_touch`, `associated` and `qualitative_only` are real
 * evidence of *something* but cannot be pinned to one asset.
 *
 * QA-003 (2026-09-09): this set previously held three class names that did not
 * exist, so `qualifiedActions` was always null and a 500-view piece that booked
 * a call read as a hook failure — the exact misclassification the engine is
 * built to refuse.
 */
export const TRACEABLE_ATTRIBUTION: ReadonlySet<AttributionClass> = new Set<AttributionClass>([
  "directly_tracked",
  "buyer_named",
]);

/* --------------------------- Metrics from snapshots -------------------------- */

type SnapshotRow = {
  capturedAt: Date;
  views: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTimeSec: number;
  avgViewSec: number;
  retentionPct: number;
  source: string;
};

/**
 * Collapse a snapshot history into one reading.
 *
 * The newest non-zero value wins for each metric, and a metric that is zero in
 * every snapshot stays `null` rather than becoming 0 — because on most
 * platforms that is what "not reported" looks like coming through this schema.
 * The exception is `views`: a published piece always has a view figure, so zero
 * views across a real snapshot genuinely means zero.
 */
export function collapseSnapshots(rows: SnapshotRow[]): ObservedMetrics {
  if (rows.length === 0) return { ...EMPTY_METRICS };

  const newestFirst = [...rows].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

  const pick = (key: keyof SnapshotRow): number | null => {
    for (const row of newestFirst) {
      const value = row[key];
      if (typeof value === "number" && value > 0) return value;
    }
    return null;
  };

  return {
    views: newestFirst[0].views,
    impressions: pick("impressions"),
    likes: pick("likes"),
    comments: pick("comments"),
    shares: pick("shares"),
    saves: pick("saves"),
    watchTimeSec: pick("watchTimeSec"),
    avgViewSec: pick("avgViewSec"),
    retentionPct: pick("retentionPct"),
    trackedClicks: null,
    qualifiedActions: null,
    bookedCalls: null,
  };
}

/* ------------------------------ The actual read ------------------------------ */

/**
 * Band a piece against the client's own comparable history.
 *
 * Reuses the corpus ladder deliberately: the question "did this outperform its
 * own baseline" is identical whether the creator is a market example or the
 * client, and two implementations of it would drift apart.
 */
async function bandAgainstOwnWork(
  orgId: string,
  contentItemId: string,
  views: number | null,
  publishedAt: Date | null,
  capturedAt: Date,
  format: string,
  platform: string,
): Promise<{ band: OutlierBand; baselineSource: string; baselineSize: number; baselineLabel: string }> {
  if (views === null) return { band: "unknown", baselineSource: "none", baselineSize: 0, baselineLabel: "no view count" };

  const siblings = await prisma.contentItem.findMany({
    where: { orgId, id: { not: contentItemId }, platform },
    select: { id: true, format: true, publishRecords: { select: { snapshots: { select: { views: true }, orderBy: { capturedAt: "desc" }, take: 1 } } } },
    take: 200,
  });

  const sameFormat = siblings.filter((s) => s.format === format).map((s) => s.publishRecords[0]?.snapshots[0]?.views ?? 0).filter((v) => v > 0);
  const anyFormat = siblings.map((s) => s.publishRecords[0]?.snapshots[0]?.views ?? 0).filter((v) => v > 0);

  // Cold start: a client's first pieces have no own history to stand against.
  // The corpus supplies the wider rungs — same platform and comparable format
  // first, then the platform as a whole — under the ladder's stricter minimums
  // (ADR-019). The reading says which rung it used, so "under" against a
  // cohort of strangers is never mistaken for "under" against yourself.
  const corpusFormat = CORPUS_FORMAT_FOR[format] ?? null;
  const cohort = await prisma.researchExample.findMany({
    where: { platform, views: { gt: 0 }, ...(corpusFormat ? { format: corpusFormat } : {}), capturedAt: { gte: new Date(capturedAt.getTime() - COMPARABLE_WINDOW_DAYS * 86_400_000) } },
    select: { views: true },
    take: 400,
  });
  const platformWide = await prisma.researchExample.findMany({
    where: { platform, views: { gt: 0 }, capturedAt: { gte: new Date(capturedAt.getTime() - COMPARABLE_WINDOW_DAYS * 86_400_000) } },
    select: { views: true },
    take: 800,
  });

  const reading = readOutlier({
    metrics: {
      views,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      followers: 0,
      publishedAt,
      capturedAt,
    },
    baselines: [
      { source: "creator_format", views: sameFormat },
      { source: "creator", views: anyFormat },
      { source: "cohort", views: cohort.map((c) => c.views) },
      { source: "platform", views: platformWide.map((c) => c.views) },
    ],
    relevance: { buyerRelevance: "unrated", commercialIntent: "unrated" },
  });
  return { band: reading.band, baselineSource: reading.baselineSource, baselineSize: reading.baselineSize, baselineLabel: reading.baselineLabel };
}

/** Client content formats → corpus example formats (the corpus narrows on format first). */
const CORPUS_FORMAT_FOR: Record<string, string> = {
  short_form: "short_video",
  talking_head: "short_video",
  long_form: "long_video",
  interview: "long_video",
  screen_share: "long_video",
  documentary: "long_video",
  carousel: "carousel",
  text_post: "text_post",
};

export async function actualForContent(
  orgId: string,
  contentItemId: string,
): Promise<ActualContext | null> {
  const item = await prisma.contentItem.findFirst({
    where: { id: contentItemId, orgId },
    select: {
      id: true,
      format: true,
      platform: true,
      liveAt: true,
      publishRecords: {
        select: {
          publishedAt: true,
          snapshots: {
            select: {
              capturedAt: true,
              views: true,
              impressions: true,
              likes: true,
              comments: true,
              shares: true,
              saves: true,
              watchTimeSec: true,
              avgViewSec: true,
              retentionPct: true,
              source: true,
            },
            orderBy: { capturedAt: "desc" },
          },
        },
      },
      touchpoints: { select: { kind: true } },
    },
  });
  if (!item) return null;

  const snapshots = item.publishRecords.flatMap((r) => r.snapshots);
  const metrics = collapseSnapshots(snapshots);

  metrics.trackedClicks = item.touchpoints.filter((t) => t.kind === "click").length || null;

  // Only events whose attribution already reaches the piece may count. This is
  // the line the whole attribution design exists to hold.
  const events = await prisma.commercialEvent.findMany({
    where: { orgId },
    select: { kind: true, attribution: true, inquiry: { select: { contentItemId: true } } },
  });
  const traceable = events.filter(
    (e) => e.inquiry?.contentItemId === contentItemId && TRACEABLE_ATTRIBUTION.has(e.attribution as AttributionClass),
  );
  metrics.qualifiedActions = traceable.length || null;
  metrics.bookedCalls = traceable.filter((e) => e.kind === "booked_call").length || null;

  const publishedAt =
    item.publishRecords.map((r) => r.publishedAt).find((d): d is Date => Boolean(d)) ?? item.liveAt;
  const newest = snapshots[0]?.capturedAt ?? new Date();
  const maturityDays = publishedAt
    ? Math.max(0, (newest.getTime() - publishedAt.getTime()) / 86_400_000)
    : null;

  const banded = await bandAgainstOwnWork(
    orgId,
    contentItemId,
    metrics.views,
    publishedAt,
    newest,
    item.format,
    item.platform,
  );

  return {
    metrics,
    band: banded.band,
    baselineSource: banded.baselineSource,
    baselineSize: banded.baselineSize,
    baselineLabel: banded.baselineLabel,
    maturityDays,
    snapshotCount: snapshots.length,
    // Observed buyer relevance needs audience data no platform gives us without
    // approved analytics scopes. Until then this is honestly unknown rather
    // than inferred from engagement, which would be a guess dressed as a metric.
    buyerRelevanceObserved: "unknown",
  };
}

/* ------------------------------- Expectations -------------------------------- */

export type StoredExpectation = Expectation & {
  id: string;
  createdAt: Date;
  provider: string;
  model: string;
  calibrated: boolean;
};

export async function latestExpectation(
  orgId: string,
  subjectType: string,
  subjectId: string,
): Promise<StoredExpectation | null> {
  // The forecast a piece is judged against is the last one frozen BEFORE it went
  // live; anything recorded afterwards cannot count as a prediction.
  const liveAt = subjectType === "content" ? (await prisma.contentItem.findFirst({ where: { id: subjectId, orgId }, select: { liveAt: true } }))?.liveAt ?? null : null;
  const row = await prisma.contentExpectation.findFirst({
    where: { orgId, subjectType, subjectId, ...(liveAt ? { createdAt: { lte: liveAt } } : {}) },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  return {
    id: row.id,
    rubricVersion: row.rubricVersion,
    overall: row.overall,
    dimensions: parseJson<DimensionScore[]>(row.dimensions, []),
    predictedStrengths: parseJson<string[]>(row.predictedStrengths, []),
    predictedWeaknesses: parseJson<string[]>(row.predictedWeaknesses, []),
    expectedClass: row.expectedClass as Expectation["expectedClass"],
    confidence: row.confidence as Expectation["confidence"],
    createdAt: row.createdAt,
    provider: row.provider,
    model: row.model,
    calibrated: row.calibrated,
  };
}

/* --------------------------------- The gap ----------------------------------- */

export type ContentReading = {
  contentItemId: string;
  title: string;
  expectation: StoredExpectation | null;
  actual: ActualContext | null;
  gap: Gap | null;
  prescription: ReturnType<typeof prescribe>;
};

export async function readContent(orgId: string, contentItemId: string): Promise<ContentReading | null> {
  const item = await prisma.contentItem.findFirst({
    where: { id: contentItemId, orgId },
    select: { id: true, title: true },
  });
  if (!item) return null;

  const [expectation, actual] = await Promise.all([
    latestExpectation(orgId, "content", contentItemId),
    actualForContent(orgId, contentItemId),
  ]);

  const gap = actual ? readGap({ expectation, actual }) : null;

  return {
    contentItemId: item.id,
    title: item.title,
    expectation,
    actual,
    gap,
    prescription: gap ? prescribe(gap) : null,
  };
}

/* -------------------------------- Root lineage -------------------------------- */

export async function listRoots(orgId: string) {
  const roots = await prisma.contentRoot.findMany({
    where: { orgId },
    include: {
      contentItems: {
        select: { id: true, title: true, stage: true, lineageRole: true, liveAt: true, platform: true, format: true },
        orderBy: { createdAt: "asc" },
      },
      diagnoses: { orderBy: { createdAt: "desc" }, take: 1 },
      corrections: { orderBy: { createdAt: "desc" } },
      _count: { select: { contentItems: true, diagnoses: true, corrections: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return roots.map((root) => ({
    ...root,
    // Derivatives are measured individually but never inflate the period's
    // source-asset count — five cross-posts of one interview is one idea tested.
    sourceCount: root.contentItems.filter((c) => c.lineageRole === "source").length,
    derivativeCount: root.contentItems.filter((c) => c.lineageRole === "derivative").length,
    retestCount: root.contentItems.filter((c) => c.lineageRole === "retest").length,
  }));
}

/* ------------------------------ Learning velocity ----------------------------- */

/**
 * Build the period-by-period record the learning reading is computed from.
 *
 * Counted from records rather than stored in counters, for the same reason the
 * acquisition funnel is (ADR-012): a stored tally is wrong the moment anything
 * is edited, and this one would be quoted to a client.
 */
export async function learningTrajectory(
  orgId: string,
  engagementStart: Date,
  now = new Date(),
): Promise<{ periods: PeriodRecord[]; reading: LearningReading }> {
  const windows = periodWindows(engagementStart, now);

  const [items, diagnoses, corrections, expectations, events] = await Promise.all([
    prisma.contentItem.findMany({
      where: { orgId, liveAt: { not: null } },
      select: { id: true, liveAt: true, lineageRole: true },
    }),
    prisma.contentDiagnosis.findMany({
      where: { orgId },
      select: { createdAt: true, failureClass: true },
    }),
    prisma.correctionEntry.findMany({
      where: { orgId },
      select: { createdAt: true, worked: true },
    }),
    prisma.contentExpectation.findMany({
      where: { orgId, subjectType: "content" },
      select: { subjectId: true, overall: true, createdAt: true },
    }),
    prisma.commercialEvent.findMany({
      where: { orgId },
      select: { occurredAt: true, attribution: true },
    }),
  ]);

  const scoreBySubject = new Map<string, number>();
  for (const e of expectations) {
    if (!scoreBySubject.has(e.subjectId)) scoreBySubject.set(e.subjectId, e.overall);
  }

  const periods: PeriodRecord[] = windows.map((w) => {
    const inWindow = (d: Date) => d >= w.start && d <= w.end;

    const published = items.filter((i) => i.liveAt && inWindow(i.liveAt));
    // Only source assets count as output. Derivatives are measured separately.
    const sources = published.filter((i) => i.lineageRole !== "derivative");

    const scores = published
      .map((i) => scoreBySubject.get(i.id))
      .filter((s): s is number => typeof s === "number");

    const periodCorrections = corrections.filter((c) => inWindow(c.createdAt));

    return {
      period: w.period,
      start: w.start,
      end: w.end,
      // Rubric overall is 0-100; the client scorecard is 0-5.
      meanScore:
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length / 20) * 100) / 100
          : null,
      published: sources.length,
      diagnosed: diagnoses.filter(
        (d) => inWindow(d.createdAt) && d.failureClass !== "insufficient_data",
      ).length,
      corrections: periodCorrections.length,
      correctionsWorked: periodCorrections.filter((c) => c.worked === true).length,
      correctionsFailed: periodCorrections.filter((c) => c.worked === false).length,
      qualifiedActions: events.filter(
        (e) => inWindow(e.occurredAt) && TRACEABLE_ATTRIBUTION.has(e.attribution as AttributionClass),
      ).length,
    };
  });

  return { periods, reading: readLearning(periods) };
}

export async function listCorrections(orgId: string, limit = 50) {
  return prisma.correctionEntry.findMany({
    where: { orgId },
    include: { root: { select: { label: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
