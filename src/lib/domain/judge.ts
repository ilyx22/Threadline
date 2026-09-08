import type { OutlierBand } from "./corpus";

/**
 * The Judge — V0, uncalibrated.
 *
 * An adversarial evaluation pass that runs before a human sees a candidate, so
 * the human is reviewing something that has already had its obvious weaknesses
 * argued with. It exists because a generator that is never marked will keep
 * producing whatever it produced last time, confidently.
 *
 * **THE MOST IMPORTANT THING IN THIS FILE IS THAT IT IS NOT CALIBRATED.**
 *
 * The rubric below is a hypothesis about what makes expert-led B2B content earn
 * commercially valuable attention. It has not been checked against a single
 * real outcome. Until it has, a Judge score is one more opinion — better
 * structured than an unaided one, and not yet evidence. Every verdict carries
 * `calibrated: false`, every surface says so, and no verdict may block a human
 * decision while that is true.
 *
 * Calibration is the whole reason this shipped alongside the corpus rather than
 * before it. Corpus examples have known real-world outcomes; running the Judge
 * over them and comparing its opinion against what actually happened is the
 * only way to find out whether the rubric is worth anything. See
 * `calibrationReading` at the bottom.
 */

/* -------------------------------- The rubric -------------------------------- */

/**
 * Bumped whenever a criterion is added, removed or reworded.
 *
 * Verdicts store the version they were produced under, because a score from an
 * older rubric is not comparable to a newer one and silently mixing them would
 * make the calibration record meaningless.
 */
export const RUBRIC_VERSION = "v0.1";

export type Criterion = {
  key: string;
  label: string;
  /** What the Judge is being asked. Written as a question, not a virtue. */
  question: string;
  /** Why it earns a place. A criterion nobody can justify gets dropped. */
  why: string;
  /** Weight in the overall score. Sums to 100 across all criteria. */
  weight: number;
  /** True where a bad score is disqualifying regardless of the total. */
  gating?: boolean;
};

export const RUBRIC: Criterion[] = [
  {
    key: "icp_relevance",
    label: "ICP relevance",
    question: "Would the client's actual buyer stop for this, or only their peers?",
    why: "Content that impresses the industry and bores the buyer is the most common expensive failure in expert-led B2B.",
    weight: 18,
    gating: true,
  },
  {
    key: "buyer_problem",
    label: "Buyer problem",
    question: "Does this address a problem the buyer would recognise in their own words?",
    why: "A piece about a problem nobody has is well-made content with no audience.",
    weight: 12,
  },
  {
    key: "authority",
    label: "Authority",
    question: "Could only someone who has actually done this work have written it?",
    why: "The entire premise is that the founder knows something. Content anyone could have written wastes the one asset the client has.",
    weight: 14,
    gating: true,
  },
  {
    key: "originality",
    label: "Originality",
    question: "Is the thesis distinct from what the rest of the market is already saying?",
    why: "Buyers are choosing between firms that describe themselves identically. Sounding like them is the problem, not the solution.",
    weight: 12,
  },
  {
    key: "curiosity",
    label: "Curiosity",
    question: "Does the opening create a reason to keep watching that the payoff honours?",
    why: "A hook that overpromises buys attention it then loses, and trains the audience to skip the next one.",
    weight: 10,
  },
  {
    key: "evidence",
    label: "Evidence",
    question: "Is every claim supported, and is the strongest claim the best-supported one?",
    why: "One unsupported claim in a piece about expertise costs more credibility than the whole piece earns.",
    weight: 12,
    gating: true,
  },
  {
    key: "voice",
    label: "Voice fit",
    question: "Does this sound like the founder, including the things they refuse to say?",
    why: "A founder who cannot recognise their own words will not record it, and if they do it will not sound like them.",
    weight: 8,
  },
  {
    key: "commercial_path",
    label: "Commercial path",
    question: "Is there a plausible route from watching this to a buying conversation?",
    why: "Threadline optimises for commercially valuable attention. Attention with no path is a vanity metric with production costs.",
    weight: 10,
  },
  {
    key: "wrong_audience",
    label: "Wrong-audience risk",
    question: "Would this attract people the client does not want — job seekers, peers, bad-fit buyers?",
    why: "Content that reliably attracts the wrong people makes the pipeline worse while the metrics improve.",
    weight: 4,
  },
];

/** Sanity: the weights must actually sum to 100 or the score means nothing. */
export const RUBRIC_TOTAL_WEIGHT = RUBRIC.reduce((sum, c) => sum + c.weight, 0);

export const GATING_CRITERIA = RUBRIC.filter((c) => c.gating).map((c) => c.key);

/* -------------------------------- Verdicts ---------------------------------- */

export const VERDICTS = ["pass", "revise", "reject"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type CriterionScore = {
  key: string;
  /** 0–5. Whole numbers: finer resolution than the Judge can justify is noise. */
  score: number;
  reason: string;
};

export type JudgeResult = {
  rubricVersion: string;
  /** 0–100, weighted. */
  overall: number;
  verdict: Verdict;
  scores: CriterionScore[];
  /** Specific things a person should look at, worst first. */
  concerns: string[];
  /** Always false in V0. */
  calibrated: boolean;
  /** What this verdict is and is not entitled to claim. */
  disclaimer: string;
};

/** A gating criterion at or below this is disqualifying on its own. */
export const GATING_FLOOR = 2;

/** Below this overall score, the piece needs work regardless of gates. */
export const REVISE_BELOW = 65;
export const PASS_AT = 78;

export const UNCALIBRATED_DISCLAIMER =
  "Uncalibrated. This rubric has not yet been checked against real outcomes, so this is a structured opinion rather than evidence. It is here to make weaknesses easier to see, never to decide anything on its own.";

/**
 * Turn per-criterion scores into a verdict.
 *
 * Kept as a pure function rather than asked of the model. Letting the model
 * pick its own overall verdict makes the threshold un-auditable and lets it
 * drift between runs; the model's job is to score each criterion and say why,
 * and the arithmetic is ours.
 */
export function judgeVerdict(scores: CriterionScore[]): JudgeResult {
  const byKey = new Map(scores.map((s) => [s.key, s]));

  let weighted = 0;
  let weightSeen = 0;
  for (const criterion of RUBRIC) {
    const score = byKey.get(criterion.key);
    if (!score) continue;
    weighted += (clamp(score.score, 0, 5) / 5) * criterion.weight;
    weightSeen += criterion.weight;
  }

  // Scoring against the weight actually returned, so a model that skipped a
  // criterion produces a low-confidence result rather than a quietly deflated
  // score that looks like a judgement.
  const overall = weightSeen === 0 ? 0 : Math.round((weighted / weightSeen) * 100);

  const failedGates = GATING_CRITERIA.filter((key) => {
    const score = byKey.get(key);
    return score !== undefined && score.score <= GATING_FLOOR;
  });

  const missing = RUBRIC.filter((c) => !byKey.has(c.key));

  const verdict: Verdict =
    failedGates.length > 0 ? "reject" : overall >= PASS_AT ? "pass" : overall >= REVISE_BELOW ? "revise" : "reject";

  const concerns = [
    ...failedGates.map((key) => {
      const criterion = RUBRIC.find((c) => c.key === key);
      const score = byKey.get(key);
      return `${criterion?.label ?? key}: ${score?.reason ?? "scored at or below the floor"}`;
    }),
    ...scores
      .filter((s) => s.score <= GATING_FLOOR && !failedGates.includes(s.key))
      .sort((a, b) => a.score - b.score)
      .map((s) => `${RUBRIC.find((c) => c.key === s.key)?.label ?? s.key}: ${s.reason}`),
    ...(missing.length > 0
      ? [`${missing.length} criteria were not scored, so this total is less reliable than it looks.`]
      : []),
  ];

  return {
    rubricVersion: RUBRIC_VERSION,
    overall,
    verdict,
    scores,
    concerns,
    calibrated: false,
    disclaimer: UNCALIBRATED_DISCLAIMER,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/* ------------------------------- Calibration -------------------------------- */

/**
 * Whether the Judge's opinion tracks reality.
 *
 * Corpus examples have a known outcome — how far they outperformed their own
 * creator's baseline. Running the Judge over them and comparing gives the first
 * honest answer to "is this rubric worth anything".
 *
 * The comparison is deliberately crude: rank agreement on a two-way split
 * (did the Judge rate the pieces that actually outperformed above the ones that
 * did not). Anything more sophisticated would imply a precision the sample size
 * cannot support.
 */
export const CALIBRATION_MINIMUM = 30;

export type CalibrationPair = {
  exampleId: string;
  /** What actually happened. */
  band: OutlierBand;
  /** What the Judge thought, 0–100. */
  overall: number;
};

export type CalibrationReading = {
  pairs: number;
  /** Examples that actually outperformed their creator. */
  outperformers: number;
  /** Judge's mean score on those. */
  meanOnOutperformers: number | null;
  /** Judge's mean score on the rest. */
  meanOnRest: number | null;
  /** The gap. Positive means the Judge is pointing the right way. */
  separation: number | null;
  /** Enough pairs to say anything at all. */
  sufficient: boolean;
  /** Whether the Judge may yet be described as calibrated. Always false in V0. */
  calibrated: boolean;
  reading: string;
  /** Examples where the Judge was most wrong, worst first. Where the work is. */
  worstMisses: CalibrationPair[];
};

const OUTPERFORMED: OutlierBand[] = ["strong", "exceptional"];

export function calibrationReading(pairs: CalibrationPair[]): CalibrationReading {
  // Unbanded examples carry no known outcome, so they cannot calibrate anything.
  const usable = pairs.filter((p) => p.band !== "unknown");

  const winners = usable.filter((p) => OUTPERFORMED.includes(p.band));
  const rest = usable.filter((p) => !OUTPERFORMED.includes(p.band));

  const meanOnOutperformers = mean(winners.map((p) => p.overall));
  const meanOnRest = mean(rest.map((p) => p.overall));
  const separation =
    meanOnOutperformers !== null && meanOnRest !== null
      ? Math.round((meanOnOutperformers - meanOnRest) * 10) / 10
      : null;

  const sufficient = usable.length >= CALIBRATION_MINIMUM && winners.length > 0 && rest.length > 0;

  let reading: string;
  if (usable.length === 0) {
    reading =
      "Nothing to calibrate against. Corpus examples need a known outcome — a creator baseline of at least three pieces — before the Judge can be checked against them.";
  } else if (!sufficient) {
    reading = `${usable.length} of ${CALIBRATION_MINIMUM} scored examples with a known outcome${
      winners.length === 0
        ? ", and none of them outperformed their creator — there is nothing to separate."
        : rest.length === 0
          ? ", and all of them outperformed — a set with no ordinary content cannot show whether the Judge can tell the difference."
          : "."
    } Too few to say whether the rubric is worth anything.`;
  } else if (separation === null || separation <= 0) {
    reading = `The Judge scored the pieces that actually outperformed no higher than the ones that did not (${separation} points). On this evidence the rubric is not measuring what it claims to. Look at the misses below before trusting any verdict.`;
  } else if (separation < 8) {
    reading = `The Judge scored outperformers ${separation} points higher on average. That is the right direction and a weak signal — not enough to call it calibrated, and worth another ${CALIBRATION_MINIMUM} examples before changing the rubric on it.`;
  } else {
    reading = `The Judge scored outperformers ${separation} points higher on average across ${usable.length} examples. The rubric appears to be pointing at something real. It is still not calibrated — that word is reserved for a rubric checked against client outcomes, not corpus outcomes.`;
  }

  const worstMisses = [...winners]
    .sort((a, b) => a.overall - b.overall)
    .slice(0, 5);

  return {
    pairs: usable.length,
    outperformers: winners.length,
    meanOnOutperformers,
    meanOnRest,
    separation,
    sufficient,
    // Never true in V0, and deliberately not a computed value: calibration is a
    // claim about client outcomes, and the corpus cannot make it.
    calibrated: false,
    reading,
    worstMisses,
  };
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
