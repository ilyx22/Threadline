import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/db/json";
import {
  BASELINE_MINIMUM,
  readCorpus,
  readOutlier,
  type BaselineCandidate,
  type BuyerRelevance,
  type CommercialIntent,
  type OutlierReading,
} from "@/lib/domain/corpus";
import {
  calibrationReading,
  type CalibrationPair,
  type CriterionScore,
} from "@/lib/domain/judge";

/**
 * The research corpus, read.
 *
 * Outlier bands are computed here rather than stored, for the same reason the
 * acquisition funnel is counted rather than stored (ADR-012): a band depends on
 * every other example it is compared against, so adding one example changes the
 * band of others. A stored band would be wrong the moment the corpus grew,
 * which is continuously.
 *
 * This module's only real job is assembling the **baseline ladder** — the set of
 * comparisons `readOutlier` chooses between. The domain module decides which
 * rung is strong enough to use; this one decides what is on each rung.
 */

export type CorpusExample = Awaited<ReturnType<typeof listExamples>>[number];

/**
 * How far apart two pieces can be published and still be compared directly.
 *
 * Eighteen months. Long enough that a hand-seeded corpus is not cut to nothing,
 * short enough that a creator's 2023 audience is not used as the yardstick for
 * their 2026 work. Falling outside it does not discard the piece — it drops the
 * comparison to the next rung down, which is the whole point of the ladder.
 */
export const COMPARABLE_WINDOW_DAYS = 540;

/**
 * How different two accounts' follower counts may be and still count as a cohort.
 *
 * Fivefold in either direction. Beyond that the comparison is measuring account
 * size, which is the exact failure the whole module exists to avoid.
 */
const COHORT_FOLLOWER_SPREAD = 5;

/** The fields any example needs to serve as a comparison for another. */
type Comparable = {
  id: string;
  creatorHandle: string;
  platform: string;
  format: string;
  wedgeId: string | null;
  views: number;
  followers: number;
  publishedAt: Date | null;
};

function withinWindow(a: Date | null, b: Date | null): boolean {
  // Unknown dates are not treated as disqualifying. A missing publish date is
  // common in hand capture, and refusing to compare would push almost everything
  // down to the weakest rung for a reason that has nothing to do with the content.
  if (!a || !b) return true;
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000 <= COMPARABLE_WINDOW_DAYS;
}

/**
 * Build the ladder for one example.
 *
 * Every rung excludes the example itself. That is not a detail: a creator with
 * three examples where one is a huge outlier would otherwise have that outlier
 * drag its own baseline up and disguise itself as typical.
 */
function baselinesFor(example: Comparable, all: Comparable[]): BaselineCandidate[] {
  const others = all.filter((o) => o.id !== example.id);

  const sameCreator = others.filter((o) => o.creatorHandle === example.creatorHandle);

  const sameCreatorFormat =
    example.format === "unknown"
      ? []
      : sameCreator.filter(
          (o) => o.format === example.format && withinWindow(o.publishedAt, example.publishedAt),
        );

  // A cohort needs a size to compare against. Without follower data on this
  // example there is no way to tell a peer from a giant, so the rung is skipped
  // rather than filled with whoever happens to be on the platform.
  const cohort =
    example.followers > 0
      ? others.filter(
          (o) =>
            o.creatorHandle !== example.creatorHandle &&
            o.platform === example.platform &&
            o.wedgeId === example.wedgeId &&
            o.followers > 0 &&
            o.followers <= example.followers * COHORT_FOLLOWER_SPREAD &&
            o.followers >= example.followers / COHORT_FOLLOWER_SPREAD,
        )
      : [];

  const platform = others.filter((o) => o.platform === example.platform);

  return [
    { source: "creator_format", views: sameCreatorFormat.map((o) => o.views) },
    { source: "creator", views: sameCreator.map((o) => o.views) },
    { source: "cohort", views: cohort.map((o) => o.views) },
    { source: "platform", views: platform.map((o) => o.views) },
  ];
}

type Bandable = Comparable & {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  capturedAt: Date;
  buyerRelevance: string;
  commercialIntent: string;
};

function bandFor(example: Bandable, all: Comparable[]): OutlierReading {
  return readOutlier({
    metrics: {
      views: example.views,
      likes: example.likes,
      comments: example.comments,
      shares: example.shares,
      saves: example.saves,
      followers: example.followers,
      publishedAt: example.publishedAt,
      capturedAt: example.capturedAt,
    },
    baselines: baselinesFor(example, all),
    relevance: {
      buyerRelevance: example.buyerRelevance as BuyerRelevance,
      commercialIntent: example.commercialIntent as CommercialIntent,
    },
  });
}

const COMPARABLE_SELECT = {
  id: true,
  creatorHandle: true,
  platform: true,
  format: true,
  wedgeId: true,
  views: true,
  followers: true,
  publishedAt: true,
} as const;

export async function listExamples(
  filter: { wedgeId?: string; platform?: string; standing?: string } = {},
) {
  const [examples, all] = await Promise.all([
    prisma.researchExample.findMany({
      where: {
        ...(filter.wedgeId ? { wedgeId: filter.wedgeId } : {}),
        ...(filter.platform ? { platform: filter.platform } : {}),
      },
      include: {
        analysis: true,
        wedge: { select: { label: true } },
        verdicts: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { capturedAt: "desc" },
      take: 400,
    }),
    // Every example in the corpus is a potential comparison, including ones the
    // caller filtered out of the list they are looking at.
    prisma.researchExample.findMany({ select: COMPARABLE_SELECT }),
  ]);

  const banded = examples.map((example) => ({
    ...example,
    outlier: bandFor(example, all),
    // A row with no views has not been finished. Derived rather than stored:
    // there is no state to keep in sync, and "has metrics" is exactly the
    // question `views > 0` already answers.
    needsMetrics: example.views === 0,
  }));

  return filter.standing
    ? banded.filter((e) => e.outlier.commercialStanding === filter.standing)
    : banded;
}

export async function corpusSummary() {
  const [rows, all] = await Promise.all([
    prisma.researchExample.findMany({
      select: {
        ...COMPARABLE_SELECT,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
        capturedAt: true,
        buyerRelevance: true,
        commercialIntent: true,
        illustrative: true,
        analysis: { select: { id: true } },
      },
    }),
    prisma.researchExample.findMany({ select: COMPARABLE_SELECT }),
  ]);

  const readings = rows.map((row) => bandFor(row, all));

  const byCreator = new Map<string, number>();
  for (const row of all) byCreator.set(row.creatorHandle, (byCreator.get(row.creatorHandle) ?? 0) + 1);

  // A creator needs BASELINE_MINIMUM *others*, so one more than the minimum in
  // total before any of their own pieces can be banded against them.
  const creatorsWithBaseline = [...byCreator.values()].filter((n) => n > BASELINE_MINIMUM).length;

  return {
    ...readCorpus({
      total: rows.length,
      analysed: rows.filter((r) => r.analysis).length,
      creators: byCreator.size,
      creatorsWithBaseline,
      bandable: readings.filter((r) => r.band !== "unknown").length,
      commercialOutliers: readings.filter((r) => r.commercialStanding === "commercial_outlier").length,
      unrated: rows.filter(
        (r) => r.buyerRelevance === "unrated" || r.commercialIntent === "unrated",
      ).length,
    }),
    /** Captured but not yet finished — no numbers on them. */
    needsMetrics: rows.filter((r) => r.views === 0).length,
    illustrative: rows.filter((r) => r.illustrative).length,
    /** How many bands are resting on a cross-creator comparison. */
    weakBaselines: readings.filter(
      (r) => r.baselineSource === "cohort" || r.baselineSource === "platform",
    ).length,
    stillMoving: readings.filter((r) => r.stillMoving).length,
  };
}

/* ------------------------------- Calibration -------------------------------- */

/**
 * Judge verdicts on corpus examples, paired with what actually happened.
 *
 * Illustrative placeholders are excluded. Their metrics were invented for the
 * demo, so calibrating a rubric against them would produce a confident number
 * about nothing — worse than having no number at all.
 */
export async function calibrationPairs(): Promise<{
  pairs: CalibrationPair[];
  excludedIllustrative: number;
}> {
  const examples = await listExamples();

  const real = examples.filter((e) => !e.illustrative);
  const pairs: CalibrationPair[] = [];

  for (const example of real) {
    const verdict = example.verdicts[0];
    if (!verdict) continue;
    pairs.push({
      exampleId: example.id,
      band: example.outlier.band,
      overall: verdict.overall,
    });
  }

  return { pairs, excludedIllustrative: examples.length - real.length };
}

export async function currentCalibration() {
  const { pairs, excludedIllustrative } = await calibrationPairs();
  return { ...calibrationReading(pairs), excludedIllustrative };
}

export async function calibrationHistory(limit = 10) {
  return prisma.judgeCalibration.findMany({ orderBy: { runAt: "desc" }, take: limit });
}

/* --------------------------------- Verdicts --------------------------------- */

export type StoredVerdict = {
  id: string;
  overall: number;
  verdict: string;
  rubricVersion: string;
  calibrated: boolean;
  scores: CriterionScore[];
  concerns: string[];
  provider: string;
  model: string;
  createdAt: Date;
};

export async function latestVerdict(exampleId: string): Promise<StoredVerdict | null> {
  const row = await prisma.judgeVerdict.findFirst({
    where: { exampleId },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  return {
    id: row.id,
    overall: row.overall,
    verdict: row.verdict,
    rubricVersion: row.rubricVersion,
    calibrated: row.calibrated,
    scores: parseJson<CriterionScore[]>(row.scores, []),
    concerns: parseJson<string[]>(row.concerns, []),
    provider: row.provider,
    model: row.model,
    createdAt: row.createdAt,
  };
}
