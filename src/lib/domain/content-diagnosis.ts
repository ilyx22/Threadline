/**
 * The content learning loop.
 *
 *   SCORE -> EXPLAIN -> DIAGNOSE -> PRESCRIBE -> RETEST
 *
 * This module is deliberately separate from `diagnosis.ts`, which answers a
 * different question. `ConstraintDiagnosis` asks *what is constraining this
 * client's whole demand system*. This asks *what did we believe about this one
 * thesis, what actually happened, and what should change*. Both are needed and
 * neither replaces the other.
 *
 * THE RULE THAT SHAPES EVERYTHING HERE
 *
 * An honest UNKNOWN beats an invented answer. Threadline's entire pitch is that
 * it reports what actually happened, so a learning system that manufactures a
 * cause for ambiguous evidence is not merely inaccurate — it is the specific
 * failure the product exists to avoid. `insufficient_data` and `mixed` are
 * first-class conclusions, and the sufficiency test runs *before* any
 * classification is attempted.
 *
 * A SECOND RULE, EASILY LOST
 *
 * Reach is not the objective. 400 views among ideal buyers with one qualified
 * enquiry beats 100,000 irrelevant views, and the arithmetic here has to say so
 * out loud or Threadline will quietly optimise itself into a virality shop.
 */

import type { OutlierBand } from "./corpus";

/* --------------------------------- Scoring ---------------------------------- */

/**
 * The client-facing decomposition.
 *
 * These are the dimensions a founder can act on. They are not a claim to
 * measure content objectively — the useful part is the decomposition, not the
 * total, and every surface that shows one has to say which kind of assessment
 * it is (see `AssessmentSource`).
 */
export const CONTENT_DIMENSIONS = [
  "icp_relevance",
  "hook_strength",
  "authority_signal",
  "delivery",
  "retention_structure",
  "proof_credibility",
  "commercial_intent",
  "voice_cta_fit",
] as const;
export type ContentDimension = (typeof CONTENT_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ContentDimension, string> = {
  icp_relevance: "ICP relevance",
  hook_strength: "Hook strength",
  authority_signal: "Authority signal",
  delivery: "Delivery",
  retention_structure: "Retention structure",
  proof_credibility: "Proof and credibility",
  commercial_intent: "Commercial intent",
  voice_cta_fit: "Voice and CTA fit",
};

/**
 * Where an assessment came from. Never collapsed into one number.
 *
 * A rubric's opinion, a person's opinion, and a measurement are three different
 * kinds of claim. Averaging them would produce a figure that looks more certain
 * than any of its inputs.
 */
export const ASSESSMENT_SOURCES = ["rubric", "human", "observed", "derived", "unknown"] as const;
export type AssessmentSource = (typeof ASSESSMENT_SOURCES)[number];

export type DimensionScore = {
  key: ContentDimension;
  /** 0–5, or null when nothing supports a score. */
  score: number | null;
  source: AssessmentSource;
  reason?: string;
};

/* ------------------------------- Expectation -------------------------------- */

export const EXPECTED_CLASSES = ["unknown", "under", "typical", "strong", "exceptional"] as const;
export type ExpectedClass = (typeof EXPECTED_CLASSES)[number];

export const CONFIDENCE_LEVELS = ["low", "moderate", "high"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export type Expectation = {
  rubricVersion: string;
  overall: number;
  dimensions: DimensionScore[];
  predictedStrengths: string[];
  predictedWeaknesses: string[];
  expectedClass: ExpectedClass;
  confidence: Confidence;
};

/* --------------------------------- Reality ---------------------------------- */

/**
 * What the platform actually reported, plus what we could and could not see.
 *
 * `null` and `0` are different facts and are kept different. A platform that
 * does not expose saves gives `saves: null`; a post nobody saved gives
 * `saves: 0`. Collapsing them would turn "we cannot see this" into "this
 * failed", which is how a reporting system starts lying by omission.
 */
export type ObservedMetrics = {
  views: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  watchTimeSec: number | null;
  avgViewSec: number | null;
  retentionPct: number | null;
  /** Clicks on tracked links attributed to this piece. */
  trackedClicks: number | null;
  /** Commercial events with evidence strong enough to name this piece. */
  qualifiedActions: number | null;
  bookedCalls: number | null;
};

export const EMPTY_METRICS: ObservedMetrics = {
  views: null,
  impressions: null,
  likes: null,
  comments: null,
  shares: null,
  saves: null,
  watchTimeSec: null,
  avgViewSec: null,
  retentionPct: null,
  trackedClicks: null,
  qualifiedActions: null,
  bookedCalls: null,
};

export type ActualContext = {
  metrics: ObservedMetrics;
  /** How this performed against the chosen baseline (own history first, then corpus cohort, then platform). */
  band: OutlierBand;
  /** Which rung of the ladder the band rests on, and how many pieces it had. */
  baselineSource?: string;
  baselineSize?: number;
  baselineLabel?: string;
  /** Days between publication and the newest snapshot used. */
  maturityDays: number | null;
  /** How many snapshots the reading rests on. */
  snapshotCount: number;
  /** Whether the audience reached looks like the buyer, when observable. */
  buyerRelevanceObserved: "unknown" | "off_icp" | "adjacent" | "direct";
};

/* ------------------------------- Sufficiency -------------------------------- */

/**
 * The youngest a piece may be before its numbers are treated as a result.
 *
 * Short-form distribution routinely keeps moving for a fortnight. Diagnosing a
 * four-day-old post produces a confident conclusion about a number that has not
 * finished happening.
 */
export const MATURITY_DAYS = 14;

/** Below this, "it got no views" is as likely to mean "nobody has looked yet". */
export const MINIMUM_VIEWS_FOR_READING = 50;

export type Sufficiency = {
  sufficient: boolean;
  /** What is missing, in words a person can act on. */
  reasons: string[];
  /** True when the piece is simply too young rather than genuinely unmeasured. */
  tooEarly: boolean;
};

export function readSufficiency(actual: ActualContext): Sufficiency {
  const reasons: string[] = [];
  let tooEarly = false;

  if (actual.snapshotCount === 0) {
    reasons.push("No performance has been captured for this piece yet.");
  }

  if (actual.maturityDays !== null && actual.maturityDays < MATURITY_DAYS) {
    tooEarly = true;
    reasons.push(
      `Published ${Math.round(actual.maturityDays)} day${Math.round(actual.maturityDays) === 1 ? "" : "s"} ago. Distribution is usually still moving before ${MATURITY_DAYS} days.`,
    );
  }

  if (actual.metrics.views === null) {
    reasons.push("No view figure has been recorded, so there is nothing to read against.");
  } else if (actual.metrics.views < MINIMUM_VIEWS_FOR_READING) {
    reasons.push(
      `${actual.metrics.views} views is too few to separate a weak piece from one nobody has been shown yet.`,
    );
  }

  return { sufficient: reasons.length === 0, reasons, tooEarly };
}

/* ------------------------------ Failure classes ------------------------------ */

export const FAILURE_CLASSES = [
  "none",
  "idea_thesis",
  "icp_targeting",
  "hook_packaging",
  "delivery",
  "retention_structure",
  "proof_credibility",
  "distribution",
  "cta_conversion",
  "commercial_relevance",
  "mixed",
  "insufficient_data",
] as const;
export type FailureClass = (typeof FAILURE_CLASSES)[number];

export const FAILURE_LABELS: Record<FailureClass, string> = {
  none: "Nothing to correct",
  idea_thesis: "The thesis itself",
  icp_targeting: "Aimed at the wrong people",
  hook_packaging: "Hook and packaging",
  delivery: "Delivery",
  retention_structure: "How it was structured",
  proof_credibility: "Proof and credibility",
  distribution: "Distribution",
  cta_conversion: "The ask",
  commercial_relevance: "Commercially irrelevant attention",
  mixed: "More than one cause",
  insufficient_data: "Not enough evidence to say",
};

/** Which lever a correction pulls. Used to find repeated corrections later. */
export const CORRECTION_LEVERS = [
  "hook",
  "thesis",
  "icp",
  "proof",
  "structure",
  "delivery",
  "distribution",
  "cta",
  "format",
  "platform",
  "other",
] as const;
export type CorrectionLever = (typeof CORRECTION_LEVERS)[number];

/** The lever a failure class most obviously implies. Advisory, not automatic. */
export const SUGGESTED_LEVER: Record<FailureClass, CorrectionLever> = {
  none: "other",
  idea_thesis: "thesis",
  icp_targeting: "icp",
  hook_packaging: "hook",
  delivery: "delivery",
  retention_structure: "structure",
  proof_credibility: "proof",
  distribution: "distribution",
  cta_conversion: "cta",
  commercial_relevance: "icp",
  mixed: "other",
  insufficient_data: "other",
};

/* ---------------------------- Expected vs actual ----------------------------- */

export type Gap = {
  sufficiency: Sufficiency;
  /** The dimension the expectation leaned on hardest. */
  strongestDimension: ContentDimension | null;
  /** Where reality most contradicted the expectation. */
  weakestDimension: ContentDimension | null;
  failureClass: FailureClass;
  /** Whether the underlying claim survives this result. */
  preserveThesis: boolean;
  confidence: Confidence;
  /** One paragraph a person can check against the numbers. */
  explanation: string;
  /** The specific belief that turned out to be wrong, when one can be named. */
  failedAssumption: string | null;
  /** Signals that were genuinely good, so a bad headline does not bury them. */
  positives: string[];
};

const ENGAGED_ACTION_RATE_FLOOR = 0.01;

function rate(part: number | null, whole: number | null): number | null {
  if (part === null || whole === null || whole <= 0) return null;
  return part / whole;
}

function topDimension(dims: DimensionScore[]): ContentDimension | null {
  const scored = dims.filter((d) => d.score !== null);
  if (scored.length === 0) return null;
  return scored.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a)).key;
}

/**
 * Read expectation against reality.
 *
 * The order of the checks is the argument. Sufficiency first, because a
 * conclusion drawn from four days of data is worse than no conclusion.
 * Commercial relevance next, because a piece that travelled to the wrong room
 * is a *targeting* result however good the retention was. Only then the
 * craft-level causes.
 */
export const INTENDED_JOBS = ["discovery", "authority", "conversion"] as const;
export type IntendedJob = (typeof INTENDED_JOBS)[number];
export const INTENDED_JOB_LABELS: Record<IntendedJob, string> = {
  discovery: "Discovery — earn relevant reach",
  authority: "Authority — earn depth and trust",
  conversion: "Conversion — earn the next step",
};

export function readGap(input: {
  expectation: Expectation | null;
  actual: ActualContext;
  /** What the piece was for. A discovery piece is not judged on conversions. */
  intendedJob?: IntendedJob;
}): Gap {
  const { expectation, actual } = input;
  const intendedJob: IntendedJob = input.intendedJob ?? "authority";
  const sufficiency = readSufficiency(actual);
  const positives: string[] = [];

  const strongest = expectation ? topDimension(expectation.dimensions) : null;

  if (!sufficiency.sufficient) {
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: null,
      failureClass: "insufficient_data",
      preserveThesis: true,
      confidence: "low",
      explanation: sufficiency.tooEarly
        ? "Too early to diagnose. The numbers are still moving, and a conclusion drawn now would be about distribution timing rather than the content."
        : "There is not enough evidence to say anything useful about this piece yet.",
      failedAssumption: null,
      positives,
    };
  }

  const m = actual.metrics;
  const engagementRate = rate(
    (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0),
    m.views,
  );
  const saveRate = rate(m.saves, m.views);
  const clickRate = rate(m.trackedClicks, m.views);
  const qualified = m.qualifiedActions ?? 0;

  // Three states, not two. `typical` means the piece performed the way this
  // client's work normally performs — an ordinary result, not a failure. An
  // earlier version collapsed "not strong" into "did not travel" and duly
  // recommended retiring a thesis that had landed exactly on its own median,
  // which is the confident-wrong-conclusion this module exists to refuse.
  const travelled = actual.band === "strong" || actual.band === "exceptional";
  const underperformed = actual.band === "under";
  const ordinaryReach = actual.band === "typical";

  if (qualified > 0) positives.push(`${qualified} qualified action${qualified === 1 ? "" : "s"} traced to this piece.`);
  if (saveRate !== null && saveRate >= 0.01) {
    positives.push("Saved at a rate that suggests it was worth keeping, whatever the reach did.");
  }
  if (travelled) positives.push("Reached materially more people than this client's comparable work.");

  /* 1. Commercially irrelevant reach. The most important failure to name,
        because it is the one that looks like success on every dashboard. */
  if (travelled && actual.buyerRelevanceObserved === "off_icp") {
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: "icp_relevance",
      failureClass: "commercial_relevance",
      preserveThesis: false,
      confidence: qualified === 0 ? "moderate" : "low",
      explanation:
        "This travelled well and reached the wrong room. Reach without buyer relevance is not a result Threadline should try to repeat — the useful conclusion is about who the framing attracted, not how far it went.",
      failedAssumption: "That the audience this framing attracts overlaps with the buyer.",
      positives,
    };
  }

  /* 2. It reached the right people and they acted. Nothing to correct. */
  if (qualified > 0 && actual.buyerRelevanceObserved !== "off_icp") {
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: null,
      failureClass: "none",
      preserveThesis: true,
      confidence: "moderate",
      explanation:
        "Reached a plausible buyer and produced a qualified action. This is the outcome the system is aiming at; the thesis is worth pressing rather than replacing.",
      failedAssumption: null,
      positives,
    };
  }

  /* 3. Weak distribution but strong engagement among those who saw it. The
        single most valuable diagnosis available, because it says the thesis is
        fine and only the packaging suppressed it. */
  const engagedWell =
    (engagementRate !== null && engagementRate >= 0.03) ||
    (saveRate !== null && saveRate >= 0.01);

  if ((underperformed || ordinaryReach) && engagedWell) {
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: "hook_strength",
      failureClass: "hook_packaging",
      preserveThesis: true,
      confidence: "moderate",
      explanation: underperformed
        ? "Few people saw it and the ones who did responded well. That pattern points at the opening rather than the idea: the thesis earned its audience once it was reached, so it is worth retesting with a different hook before it is abandoned."
        : "Reach was ordinary and the people who saw it responded well above the usual rate. The argument is working harder than its distribution — a different opening is the cheapest way to find out how far it can go.",
      failedAssumption: "That the opening would earn the attention the argument deserved.",
      positives,
    };
  }

  /* 4. Retention specifically, when the platform lets us see it. */
  if (
    actual.metrics.retentionPct !== null &&
    actual.metrics.retentionPct > 0 &&
    actual.metrics.retentionPct < 25
  ) {
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: "retention_structure",
      failureClass: "retention_structure",
      preserveThesis: true,
      confidence: "moderate",
      explanation:
        `Most of the audience left early — ${Math.round(actual.metrics.retentionPct)}% average retention. The argument may be sound but the shape of it is losing people before it lands.`,
      failedAssumption: "That the piece held attention long enough to make its point.",
      positives,
    };
  }

  /* 5. It reached people, they engaged, and nobody did anything. A discovery
        piece was never asked to convert, so for it this is the outcome it was
        built for and the thesis stands. */
  if (
    travelled &&
    engagedWell &&
    qualified === 0 &&
    clickRate !== null &&
    clickRate < ENGAGED_ACTION_RATE_FLOOR
  ) {
    if (intendedJob === "discovery") {
      return {
        sufficiency,
        strongestDimension: strongest,
        weakestDimension: null,
        failureClass: "none",
        preserveThesis: true,
        confidence: "moderate",
        explanation:
          "Built for discovery, and it did that job: it reached materially more people than usual and they engaged. It was not asked to convert, so the absence of a next step is not a failure here — the follow-on authority and conversion pieces on this thesis are where that is read.",
        failedAssumption: null,
        positives,
      };
    }
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: "voice_cta_fit",
      failureClass: "cta_conversion",
      preserveThesis: true,
      confidence: "moderate",
      explanation:
        "It reached people, it held them, and almost nobody moved. The gap is between the value delivered and the next step offered rather than in the content itself.",
      failedAssumption: "That an audience persuaded by the argument would act on the ask as written.",
      positives,
    };
  }

  /* 6. An ordinary result. Not a diagnosis, and emphatically not grounds for
        retiring a thesis — most content performs like most content. */
  if (ordinaryReach && !engagedWell) {
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: null,
      failureClass: "mixed",
      preserveThesis: true,
      confidence: "low",
      explanation:
        "This performed the way this client's work usually performs, and nothing in the evidence separates it from the rest. An ordinary result is a weak signal, not a diagnosis — one more attempt at the thesis will say more than any conclusion drawn from this one.",
      failedAssumption: null,
      positives,
    };
  }

  /* 7. It genuinely underperformed, and the expectation had said it would not. */
  if (underperformed && !engagedWell) {
    const predictedStrong =
      expectation !== null &&
      (expectation.expectedClass === "strong" || expectation.expectedClass === "exceptional");
    return {
      sufficiency,
      strongestDimension: strongest,
      weakestDimension: strongest,
      failureClass: predictedStrong ? "idea_thesis" : "mixed",
      preserveThesis: !predictedStrong,
      confidence: predictedStrong ? "moderate" : "low",
      explanation: predictedStrong
        ? "We expected this to perform and it did not travel or engage. With the packaging and the argument both failing to land, the honest reading is that the thesis did not interest this audience."
        : "Neither reach nor engagement landed, and no single cause stands out in the evidence available. Treat this as a weak result rather than a diagnosed one.",
      failedAssumption: predictedStrong
        ? "That this audience cared about the problem the way we assumed."
        : null,
      positives,
    };
  }

  /* 8. Genuinely ambiguous. Say so rather than picking the nearest label. */
  return {
    sufficiency,
    strongestDimension: strongest,
    weakestDimension: null,
    failureClass: "mixed",
    preserveThesis: true,
    confidence: "low",
    explanation:
      "The signals point in different directions and no single cause is supported by the evidence. Worth a human read before anything is changed on the strength of it.",
    failedAssumption: null,
    positives,
  };
}

/* -------------------------- Prescriptions and retests ------------------------ */

export type Prescription = {
  headline: string;
  lever: CorrectionLever;
  /** How many pieces to make to test it. Small, because a retest is a question. */
  retestBatchSize: number;
  preserveThesis: boolean;
};

/**
 * What to do next.
 *
 * Batch sizes are small on purpose. A retest is a question, and asking it six
 * different ways at once means the answer cannot be attributed to any of them.
 */
export function prescribe(gap: Gap): Prescription | null {
  switch (gap.failureClass) {
    case "hook_packaging":
      return {
        headline: "Keep the thesis. Rewrite the opening and retest two hooks against it.",
        lever: "hook",
        retestBatchSize: 2,
        preserveThesis: true,
      };
    case "retention_structure":
      return {
        headline: "Keep the thesis. Shorten the setup and move the proof earlier.",
        lever: "structure",
        retestBatchSize: 1,
        preserveThesis: true,
      };
    case "cta_conversion":
      return {
        headline: "Keep the content. Change the ask to match what the audience just agreed with.",
        lever: "cta",
        retestBatchSize: 1,
        preserveThesis: true,
      };
    case "commercial_relevance":
      return {
        headline: "Re-aim it. The framing is attracting an audience that cannot buy.",
        lever: "icp",
        retestBatchSize: 2,
        preserveThesis: false,
      };
    case "idea_thesis":
      return {
        headline: "Retire this thesis and put the effort behind one that earned attention.",
        lever: "thesis",
        retestBatchSize: 0,
        preserveThesis: false,
      };
    case "distribution":
      return {
        headline: "Keep the piece. Change where and when it goes out.",
        lever: "distribution",
        retestBatchSize: 1,
        preserveThesis: true,
      };
    case "proof_credibility":
      return {
        headline: "Keep the thesis. Put the evidence in front of the claim.",
        lever: "proof",
        retestBatchSize: 1,
        preserveThesis: true,
      };
    case "delivery":
      return {
        headline: "Keep the script. Re-record it with more energy in the first ten seconds.",
        lever: "delivery",
        retestBatchSize: 1,
        preserveThesis: true,
      };
    case "icp_targeting":
      return {
        headline: "Keep the craft. Aim the same argument at the people who buy.",
        lever: "icp",
        retestBatchSize: 2,
        preserveThesis: true,
      };
    // Nothing to prescribe: either it worked, or we do not yet know anything.
    case "none":
    case "mixed":
    case "insufficient_data":
      return null;
  }
}
