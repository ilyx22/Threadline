/**
 * The research corpus.
 *
 * A collection of real content from the wedge's market, used for two jobs at
 * once:
 *
 *   1. **Signal.** What is earning disproportionate attention in this market,
 *      and which variables appear to be doing the work.
 *   2. **A test set for the Judge.** Every example has a known real-world
 *      outcome. That makes it the only material available for finding out
 *      whether the Judge's opinion is worth anything — before it is allowed to
 *      influence a client's content.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not rank by raw views. The most-viewed thing in a niche is usually
 * the thing published by the largest account, which tells you about the account
 * and not about the content.
 *
 * It also does not treat "went viral" and "worth copying" as the same claim.
 * Threadline sells buying conversations, not reach, so a piece that outperformed
 * its creator while speaking to nobody who could ever buy is a **negative**
 * result worth recording, not a template. `commercialStanding` below is where
 * that distinction lives, and it is the reason the outlier band alone is never
 * the answer to "should we make something like this".
 */

/* ------------------------------ Baseline sources ---------------------------- */

/**
 * Where the comparison came from, strongest first.
 *
 * Outlier detection is a comparison, and the comparison is only as good as what
 * it is against. Rather than refusing to say anything when a creator is new to
 * the corpus, we fall back down this ladder — and report which rung we landed
 * on, because a multiple against a platform-wide baseline is a far weaker claim
 * than one against the same creator's own recent work in the same format.
 *
 *   - `creator_format` — the same creator, same format, comparable period.
 *     Holds account size, audience, topic *and* format constant. Strongest.
 *   - `creator` — the same creator, any format. Still holds the audience
 *     constant, which is the thing that matters most.
 *   - `cohort` — different creators of comparable size on the same platform in
 *     the same niche. Holds the market roughly constant and nothing else.
 *   - `platform` — everything on that platform in the corpus. Weakest usable
 *     comparison; mostly says "unusual for this market at all".
 *   - `none` — nothing sufficient. Produces `unknown`, which is a real answer.
 */
export const BASELINE_SOURCES = ["creator_format", "creator", "cohort", "platform", "none"] as const;
export type BaselineSource = (typeof BASELINE_SOURCES)[number];

export type BaselineConfidence = "high" | "moderate" | "low" | "none";

/**
 * How many comparable pieces each rung needs before it may be used.
 *
 * The weaker the comparison, the more of it is required. Three same-creator
 * pieces say something; three pieces by three different creators say almost
 * nothing, because the variance between creators dwarfs the variance between
 * their posts.
 */
export const BASELINE_MINIMUMS: Record<Exclude<BaselineSource, "none">, number> = {
  creator_format: 3,
  creator: 3,
  cohort: 5,
  platform: 8,
};

/** Kept for the many call sites that only care about the same-creator floor. */
export const BASELINE_MINIMUM = BASELINE_MINIMUMS.creator;

/**
 * Band thresholds, as a multiple of the baseline median, per rung.
 *
 * These widen as the comparison weakens, and that is the whole point. Being 5x
 * your own median is remarkable. Being 5x the median of a loose cohort of other
 * people is close to noise, because you are mostly measuring the difference
 * between accounts. A weaker baseline has to clear a higher bar to earn the
 * same word.
 */
const THRESHOLDS: Record<Exclude<BaselineSource, "none">, {
  exceptional: number;
  strong: number;
  typical: number;
}> = {
  creator_format: { exceptional: 5, strong: 2, typical: 0.7 },
  creator: { exceptional: 5, strong: 2, typical: 0.7 },
  cohort: { exceptional: 8, strong: 3, typical: 0.6 },
  platform: { exceptional: 12, strong: 4, typical: 0.5 },
};

const SOURCE_LABELS: Record<BaselineSource, string> = {
  creator_format: "this creator's other work in the same format",
  creator: "this creator's other work",
  cohort: "creators of a similar size in this market",
  platform: "everything in the corpus on this platform",
  none: "nothing comparable",
};

/**
 * Days before a piece's numbers are treated as settled.
 *
 * A three-day-old post compared against medians drawn from months-old posts is
 * being asked to have finished growing when it plainly has not. The band is
 * still produced — refusing would make recent content invisible, and recent
 * content is the most useful kind — but `stillMoving` is set so nobody builds a
 * conclusion on a number that has not stopped changing.
 */
export const MATURITY_DAYS = 14;

/* --------------------------------- Inputs ---------------------------------- */

export type ExampleMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  /** Followers at capture. Zero when unknown. */
  followers: number;
  publishedAt: Date | null;
  /** When these numbers were read off the platform. */
  capturedAt: Date;
};

/** One rung of the ladder, already filtered to comparable pieces. */
export type BaselineCandidate = {
  source: Exclude<BaselineSource, "none">;
  /** Views of the comparable pieces. Never includes the piece being judged. */
  views: number[];
};

/**
 * Content shape. Part of what makes two pieces comparable.
 *
 * A creator's 40-second vertical video and their 3,000-word newsletter do not
 * belong in the same baseline, and averaging them produces a median that
 * describes neither.
 */
export const EXAMPLE_FORMATS = [
  "unknown",
  "short_video",
  "long_video",
  "carousel",
  "text_post",
  "newsletter",
  "podcast",
] as const;
export type ExampleFormat = (typeof EXAMPLE_FORMATS)[number];

/**
 * Operator judgement about who the content is for.
 *
 * Deliberately not inferred. An LLM asked "is this relevant to our buyer?" will
 * find a way to say yes, because the question invites it to. These are ratings a
 * person assigns, and `unrated` is an honest and common state rather than a
 * missing value to be filled in with a guess.
 */
export const BUYER_RELEVANCE = ["unrated", "direct", "adjacent", "off_icp"] as const;
export type BuyerRelevance = (typeof BUYER_RELEVANCE)[number];

export const COMMERCIAL_INTENT = ["unrated", "commercial", "mixed", "entertainment"] as const;
export type CommercialIntent = (typeof COMMERCIAL_INTENT)[number];

export type RelevanceInput = {
  buyerRelevance: BuyerRelevance;
  commercialIntent: CommercialIntent;
};

/* --------------------------------- Outputs ---------------------------------- */

export const OUTLIER_BANDS = ["unknown", "under", "typical", "strong", "exceptional"] as const;
export type OutlierBand = (typeof OUTLIER_BANDS)[number];

/**
 * What the piece is, once reach and relevance are read together.
 *
 * This is the field that answers the question the corpus exists to answer.
 * `commercial_outlier` is the only value that means "study this".
 */
export const COMMERCIAL_STANDINGS = [
  "unknown",
  "unrated",
  "commercial_outlier",
  "popular_off_icp",
  "relevant_but_ordinary",
  "ordinary",
] as const;
export type CommercialStanding = (typeof COMMERCIAL_STANDINGS)[number];

export type OutlierReading = {
  band: OutlierBand;
  /** Views as a multiple of the chosen baseline's median. Null when unknowable. */
  multiple: number | null;
  engagementRate: number | null;
  /** Views as a multiple of follower count. Null when followers are unknown. */
  reachRatio: number | null;
  /** Views per day since publication. Null without a publish date. */
  viewsPerDay: number | null;
  ageDays: number | null;
  /** True while the piece is young enough that its numbers are still climbing. */
  stillMoving: boolean;
  baselineSize: number;
  baselineSource: BaselineSource;
  baselineLabel: string;
  confidence: BaselineConfidence;
  commercialStanding: CommercialStanding;
  /** Why the band is what it is, in a sentence a person can check. */
  reason: string;
  /** Why the commercial standing is what it is. */
  commercialReason: string;
};

/* --------------------------------- Helpers ---------------------------------- */

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function engagementRate(m: ExampleMetrics): number | null {
  if (m.views <= 0) return null;
  return (m.likes + m.comments + m.shares + m.saves) / m.views;
}

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 86_400_000;
}

function confidenceFor(source: Exclude<BaselineSource, "none">, size: number): BaselineConfidence {
  switch (source) {
    case "creator_format":
      return size >= 4 ? "high" : "moderate";
    case "creator":
      return size >= 6 ? "high" : "moderate";
    case "cohort":
      return size >= 10 ? "moderate" : "low";
    case "platform":
      return "low";
  }
}

/**
 * Pick the strongest usable rung.
 *
 * Candidates are consulted in ladder order and the first one meeting its own
 * minimum wins. Nothing is blended: a weighted mixture of a good comparison and
 * a bad one is a bad comparison wearing a number that looks considered.
 */
export function chooseBaseline(candidates: BaselineCandidate[]): {
  source: BaselineSource;
  values: number[];
  confidence: BaselineConfidence;
} {
  for (const source of ["creator_format", "creator", "cohort", "platform"] as const) {
    const candidate = candidates.find((c) => c.source === source);
    if (!candidate) continue;
    if (candidate.views.length < BASELINE_MINIMUMS[source]) continue;
    const base = median(candidate.views);
    if (base === null || base <= 0) continue;
    return {
      source,
      values: candidate.views,
      confidence: confidenceFor(source, candidate.views.length),
    };
  }
  return { source: "none", values: [], confidence: "none" };
}

/* ------------------------------ Commercial read ----------------------------- */

function readCommercial(
  band: OutlierBand,
  relevance: RelevanceInput,
): { standing: CommercialStanding; reason: string } {
  if (band === "unknown") {
    return {
      standing: "unknown",
      reason: "No usable comparison, so there is nothing to call relevant or otherwise yet.",
    };
  }

  if (relevance.buyerRelevance === "unrated" || relevance.commercialIntent === "unrated") {
    return {
      standing: "unrated",
      reason:
        "Nobody has said who this is for. Rate the buyer relevance and commercial intent — the corpus cannot tell a useful outlier from a popular irrelevance without it.",
    };
  }

  const outperformed = band === "strong" || band === "exceptional";
  const reachesBuyer = relevance.buyerRelevance === "direct" || relevance.buyerRelevance === "adjacent";
  const commercial =
    relevance.commercialIntent === "commercial" || relevance.commercialIntent === "mixed";

  if (outperformed && reachesBuyer && commercial) {
    return {
      standing: "commercial_outlier",
      reason:
        "Outperformed its baseline in front of an audience that could plausibly buy. This is the kind of example the corpus exists to collect.",
    };
  }

  if (outperformed) {
    return {
      standing: "popular_off_icp",
      reason:
        "It travelled, but not to anyone who could buy. Useful as a warning about what earns attention here — copying it would buy reach we cannot sell against.",
    };
  }

  if (relevance.buyerRelevance === "direct" && relevance.commercialIntent === "commercial") {
    return {
      standing: "relevant_but_ordinary",
      reason:
        "Aimed squarely at the buyer and performed normally. Worth keeping as baseline material: it is what ordinary looks like when the targeting is right.",
    };
  }

  // Everything left is ordinary performance. The reason still has to describe
  // *this* row rather than assert the worst case: a piece rated adjacent is not
  // "not aimed at our buyer", and saying so would quietly misreport the
  // operator's own rating back to them.
  const audience =
    relevance.buyerRelevance === "direct"
      ? "aimed at our buyer"
      : relevance.buyerRelevance === "adjacent"
        ? "aimed near our buyer"
        : "not aimed at our buyer";

  return {
    standing: "ordinary",
    reason: `Ordinary performance, ${audience}${
      relevance.commercialIntent === "entertainment" ? ", and the attention it earns is not commercial" : ""
    }.`,
  };
}

/* -------------------------------- The reading -------------------------------- */

/**
 * How far this piece outperformed a comparison, and whether that matters.
 *
 * Signals, in order of how much they can be trusted:
 *
 *   - **Multiple of the chosen baseline's median** is the strongest, and how
 *     much it can be trusted is reported alongside it rather than assumed.
 *   - **Reach ratio against follower count** catches distribution the creator
 *     did not already own — the thing that actually indicates the platform
 *     chose to spread it.
 *   - **Views per day** separates "big because it is good" from "big because it
 *     is old", which a raw view count cannot do.
 *   - **Engagement rate** is the weakest and is reported rather than banded,
 *     because a small enthusiastic audience produces a high rate on content
 *     nobody outside it ever saw.
 */
export function readOutlier(input: {
  metrics: ExampleMetrics;
  baselines: BaselineCandidate[];
  relevance: RelevanceInput;
}): OutlierReading {
  const { metrics, baselines, relevance } = input;

  const rate = engagementRate(metrics);
  const reachRatio = metrics.followers > 0 ? metrics.views / metrics.followers : null;

  const ageDays = metrics.publishedAt ? Math.max(0, daysBetween(metrics.publishedAt, metrics.capturedAt)) : null;
  const viewsPerDay = ageDays === null ? null : Math.round(metrics.views / Math.max(1, ageDays));
  const stillMoving = ageDays !== null && ageDays < MATURITY_DAYS;

  const chosen = chooseBaseline(baselines);
  const base = median(chosen.values);

  // No view count is not a view count of zero. A row captured from a URL and
  // not yet given its numbers would otherwise band as `under` — "underperformed
  // its creator" — and, worse, feed calibration as a known loser. QA-004.
  if (metrics.views <= 0) {
    const c = readCommercial("unknown", relevance);
    return {
      band: "unknown",
      multiple: null,
      engagementRate: null,
      reachRatio: null,
      viewsPerDay,
      ageDays,
      stillMoving,
      baselineSize: chosen.values.length,
      baselineSource: chosen.source,
      baselineLabel: SOURCE_LABELS[chosen.source],
      confidence: "none",
      commercialStanding: c.standing,
      commercialReason: c.reason,
      reason: "No view count has been recorded for this piece yet, so it cannot be compared with anything. Add the numbers.",
    };
  }

  if (chosen.source === "none" || base === null || base <= 0) {
    const creatorSize = baselines.find((c) => c.source === "creator")?.views.length ?? 0;
    return {
      band: "unknown",
      multiple: null,
      engagementRate: rate,
      reachRatio,
      viewsPerDay,
      ageDays,
      stillMoving,
      baselineSize: 0,
      baselineSource: "none",
      baselineLabel: SOURCE_LABELS.none,
      confidence: "none",
      ...(() => {
        const c = readCommercial("unknown", relevance);
        return { commercialStanding: c.standing, commercialReason: c.reason };
      })(),
      reason: `${
        creatorSize === 0
          ? "Nothing else from this creator yet"
          : `Only ${creatorSize} other ${creatorSize === 1 ? "example" : "examples"} from this creator`
      }, and no wider comparison is strong enough to stand in — a cohort needs ${BASELINE_MINIMUMS.cohort} and a platform baseline ${BASELINE_MINIMUMS.platform}. Add more of their ordinary content, not just their hits.`,
    };
  }

  const multiple = metrics.views / base;
  const t = THRESHOLDS[chosen.source];
  const band: OutlierBand =
    multiple >= t.exceptional
      ? "exceptional"
      : multiple >= t.strong
        ? "strong"
        : multiple >= t.typical
          ? "typical"
          : "under";

  const rounded = Math.round(multiple * 10) / 10;
  const against = SOURCE_LABELS[chosen.source];
  const size = chosen.values.length;

  const core =
    band === "exceptional"
      ? `${rounded}x the median of ${against}, across ${size} pieces. Worth understanding.`
      : band === "strong"
        ? `${rounded}x the median of ${against}, across ${size} pieces.`
        : band === "typical"
          ? `${rounded}x the median of ${against} — ordinary here, which is its own useful signal.`
          : `${rounded}x the median of ${against}. Underperformed the comparison.`;

  const caveats: string[] = [];
  if (chosen.source === "cohort" || chosen.source === "platform") {
    caveats.push(
      "This is a cross-creator comparison, so it is measuring account differences as much as content — the bar was raised to compensate, and it is still the weakest kind of claim here.",
    );
  }
  if (stillMoving) {
    caveats.push(
      `Published ${Math.round(ageDays!)} day${Math.round(ageDays!) === 1 ? "" : "s"} ago, so these numbers have not settled. Re-capture after ${MATURITY_DAYS} days before concluding anything.`,
    );
  }

  const commercial = readCommercial(band, relevance);

  return {
    band,
    multiple,
    engagementRate: rate,
    reachRatio,
    viewsPerDay,
    ageDays,
    stillMoving,
    baselineSize: size,
    baselineSource: chosen.source,
    baselineLabel: against,
    confidence: chosen.confidence,
    commercialStanding: commercial.standing,
    commercialReason: commercial.reason,
    reason: [core, ...caveats].join(" "),
  };
}

/* -------------------------------- The corpus -------------------------------- */

/**
 * Whether a corpus is large enough to draw patterns from.
 *
 * A hundred is the working floor named in the operating doctrine. Below it the
 * corpus is a reading list rather than a signal source, and the product says so
 * rather than producing clusters from twelve examples.
 */
/**
 * How many URLs one paste may carry.
 *
 * Each costs a network round trip, and an action that sits for four minutes is
 * one the operator assumes has hung. Fifty is a comfortable sitting; a
 * 300-piece corpus is six pastes.
 *
 * Lives here rather than beside the action because a "use server" module may
 * only export async functions, and the capture dialog needs to show the number.
 */
export const BULK_CAPTURE_LIMIT = 50;

export const CORPUS_WORKING_MINIMUM = 100;
export const CORPUS_TARGET = 300;

export type CorpusReading = {
  total: number;
  analysed: number;
  creators: number;
  creatorsWithBaseline: number;
  bandable: number;
  /** Examples that outperformed *and* reach a buyer. The number that matters. */
  commercialOutliers: number;
  /** Examples nobody has rated for relevance yet. */
  unrated: number;
  usable: boolean;
  reading: string;
};

export function readCorpus(input: {
  total: number;
  analysed: number;
  creators: number;
  creatorsWithBaseline: number;
  bandable: number;
  commercialOutliers: number;
  unrated: number;
}): CorpusReading {
  const usable = input.total >= CORPUS_WORKING_MINIMUM;

  let reading: string;
  if (input.total === 0) {
    reading = `Empty. The corpus is seeded by hand first — ${CORPUS_WORKING_MINIMUM} to ${CORPUS_TARGET} real examples from the wedge, including ordinary content from the same creators so their baselines exist.`;
  } else if (!usable) {
    reading = `${input.total} of ${CORPUS_WORKING_MINIMUM} to a working corpus. Below that this is a reading list, not a signal source — patterns drawn from it would be anecdote with arithmetic on top.`;
  } else if (input.creatorsWithBaseline === 0) {
    reading = `${input.total} examples but no creator has ${BASELINE_MINIMUM} of them, so every band is falling back to a cross-creator comparison. Add ordinary content from creators already in the corpus.`;
  } else if (input.unrated > input.total / 2) {
    reading = `${input.total} examples, but ${input.unrated} are unrated for buyer relevance. Until that is done the corpus can tell you what travelled and not what is worth copying.`;
  } else {
    reading = `${input.total} examples, ${input.bandable} bandable, ${input.commercialOutliers} of which outperformed in front of a plausible buyer. ${input.analysed} analysed.`;
  }

  return { ...input, usable, reading };
}
