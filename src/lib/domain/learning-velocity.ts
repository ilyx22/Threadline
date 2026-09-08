/**
 * Visible learning velocity.
 *
 * Threadline's honest answer to "is this working yet?" cannot be "content takes
 * time". That is the answer every agency gives and it is unfalsifiable, which
 * is exactly why clients stop believing it. The defensible answer is a record:
 * here is what we believed, here is what the market did, here is what we
 * changed, and here is whether the change worked.
 *
 * A client who can see the decisions getting better will tolerate a period
 * where the numbers have not. A client who is shown only rising vanity metrics
 * learns nothing and leaves the moment the metrics stop rising.
 *
 * WHAT THIS MODULE REFUSES TO DO
 *
 * It does not smooth a declining trajectory. If the scorecard reads
 * 4.8 -> 4.6 -> 4.2 it reports 4.8 -> 4.6 -> 4.2 and says the decisions are not
 * yet landing. A reporting layer that cannot deliver bad news is not a
 * reporting layer.
 *
 * It also does not claim that any platform "needs three months to learn". That
 * is folklore about algorithms. The phases below describe *Threadline's* work —
 * how much the system knows about this founder and this market — which is a
 * claim we can actually support.
 */

import { PERIODS_PER_YEAR, SERVICE_PERIOD_WEEKS } from "./service-period";

/* ---------------------------------- Phases ---------------------------------- */

export const PERIOD_PHASES = ["establish", "refine", "concentrate", "compound"] as const;
export type PeriodPhase = (typeof PERIOD_PHASES)[number];

export type PhaseDefinition = {
  key: PeriodPhase;
  label: string;
  /** What Threadline is actually doing, in the client's language. */
  intent: string;
  /** What a good outcome looks like, so the period can be judged honestly. */
  successLooksLike: string;
};

/**
 * The service-learning framework.
 *
 * Note what period 3 is *not*: the end. It closes the initial engagement, which
 * is a commercial boundary, not the point at which the system stops improving.
 * Everything from period 4 on is the same work with more evidence behind it.
 */
export const PHASES: PhaseDefinition[] = [
  {
    key: "establish",
    label: "Establish and calibrate",
    intent:
      "Get the first real work in front of a real audience and find out what this market actually responds to, rather than what we assumed it would.",
    successLooksLike:
      "A published baseline, honest readings on it, and at least one belief we can now show was wrong.",
  },
  {
    key: "refine",
    label: "Refine and correct",
    intent:
      "Act on what the first period taught us — change the specific things the evidence pointed at, and check whether those changes moved anything.",
    successLooksLike:
      "Corrections made against named failures, and a verdict on whether each one worked.",
  },
  {
    key: "concentrate",
    label: "Concentrate and compound",
    intent:
      "Put the effort behind what has been shown to earn commercially valuable attention, and stop paying for what has not.",
    successLooksLike:
      "Fewer, better theses; repeat performance on the ones that worked; commercial signal rather than reach alone.",
  },
  {
    key: "compound",
    label: "Compound harder",
    intent:
      "Keep pressing the patterns that hold, keep retiring the ones that stop paying, and keep the founder's specific voice and evidence accumulating.",
    successLooksLike:
      "A widening gap between what this system knows about this founder and what any newcomer could know.",
  },
];

export function phaseForPeriod(period: number): PhaseDefinition {
  if (period <= 1) return PHASES[0];
  if (period === 2) return PHASES[1];
  if (period === 3) return PHASES[2];
  return PHASES[3];
}

/* -------------------------------- Trajectory --------------------------------- */

export type PeriodRecord = {
  period: number;
  start: Date;
  end: Date;
  /** Mean rubric score across pieces published in the period, 0–5. Null if none. */
  meanScore: number | null;
  published: number;
  /** Diagnoses that named a cause rather than deferring. */
  diagnosed: number;
  /** Corrections made in response to those diagnoses. */
  corrections: number;
  /** Corrections whose retest has since been read as working. */
  correctionsWorked: number;
  /** Corrections whose retest has been read as not working. */
  correctionsFailed: number;
  /** Commercial events with evidence strong enough to name a piece. */
  qualifiedActions: number;
};

export const TRAJECTORY_DIRECTIONS = ["improving", "flat", "declining", "unknown"] as const;
export type TrajectoryDirection = (typeof TRAJECTORY_DIRECTIONS)[number];

export type LearningReading = {
  direction: TrajectoryDirection;
  /** Change in mean score between the first and last period with a score. */
  scoreDelta: number | null;
  /** Of corrections with a verdict, the share that worked. Null when none have one. */
  correctionHitRate: number | null;
  /** Corrections still awaiting a retest. Honest, and usually the biggest number. */
  correctionsPending: number;
  /** The headline a person reads first. Never softened. */
  headline: string;
  /** The longer, checkable statement. */
  reading: string;
  /** Things the data genuinely cannot support yet. */
  limitations: string[];
};

/** Below this many periods, a direction is noise. */
const MINIMUM_PERIODS_FOR_TREND = 2;
/** Score movement smaller than this is not a trend, it is rounding. */
const MATERIAL_SCORE_DELTA = 0.2;

export function readLearning(periods: PeriodRecord[]): LearningReading {
  const limitations: string[] = [];
  const scored = periods.filter((p) => p.meanScore !== null);

  const totalCorrections = periods.reduce((n, p) => n + p.corrections, 0);
  const worked = periods.reduce((n, p) => n + p.correctionsWorked, 0);
  const failed = periods.reduce((n, p) => n + p.correctionsFailed, 0);
  const withVerdict = worked + failed;
  const correctionsPending = Math.max(0, totalCorrections - withVerdict);
  const correctionHitRate = withVerdict > 0 ? worked / withVerdict : null;

  if (correctionsPending > 0) {
    limitations.push(
      `${correctionsPending} correction${correctionsPending === 1 ? " has" : "s have"} not been retested yet, so ${correctionsPending === 1 ? "it is" : "they are"} not counted either way.`,
    );
  }

  if (periods.length < MINIMUM_PERIODS_FOR_TREND) {
    limitations.push(
      "One service period is a baseline, not a trend. Direction becomes readable from the second period onwards.",
    );
    return {
      direction: "unknown",
      scoreDelta: null,
      correctionHitRate,
      correctionsPending,
      headline: "Establishing the baseline.",
      reading:
        "This is the first service period. What it produces is a starting point to measure against, not a verdict on whether the approach works.",
      limitations,
    };
  }

  if (scored.length < MINIMUM_PERIODS_FOR_TREND) {
    limitations.push("Not enough periods carry a scored body of work to compare.");
    return {
      direction: "unknown",
      scoreDelta: null,
      correctionHitRate,
      correctionsPending,
      headline: "Not enough scored work to show a direction yet.",
      reading:
        "Fewer than two service periods contain scored content, so any direction here would be an artefact of a small sample rather than a trend.",
      limitations,
    };
  }

  const first = scored[0].meanScore!;
  const last = scored[scored.length - 1].meanScore!;
  const scoreDelta = Math.round((last - first) * 100) / 100;

  const direction: TrajectoryDirection =
    Math.abs(scoreDelta) < MATERIAL_SCORE_DELTA
      ? "flat"
      : scoreDelta > 0
        ? "improving"
        : "declining";

  const series = scored.map((p) => p.meanScore!.toFixed(1)).join(" → ");

  let headline: string;
  let reading: string;

  if (direction === "declining") {
    // Reported plainly. A declining trajectory that the client discovers for
    // themselves is far more expensive than one Threadline names first.
    headline = `Content scores are going down: ${series}.`;
    reading =
      correctionHitRate !== null && correctionHitRate >= 0.5
        ? `Scores have fallen ${Math.abs(scoreDelta).toFixed(1)} across the engagement, even though most corrections we made did work. That combination usually means the corrections were aimed at the wrong thing — worth re-reading the diagnoses before making more.`
        : `Scores have fallen ${Math.abs(scoreDelta).toFixed(1)} across the engagement and the corrections made so far have not turned it around. This is the honest position, and the next period should change something larger than a hook.`;
  } else if (direction === "improving") {
    headline = `Content scores are improving: ${series}.`;
    reading =
      correctionHitRate !== null
        ? `Scores are up ${scoreDelta.toFixed(1)} across the engagement, with ${worked} of ${withVerdict} tested corrections working. The decisions are getting better, which is the part that compounds.`
        : `Scores are up ${scoreDelta.toFixed(1)} across the engagement. No correction has been retested yet, so improvement cannot be attributed to a specific change.`;
  } else {
    headline = `Content scores are holding steady: ${series}.`;
    reading =
      "Scores have not moved materially. That is not automatically bad — a stable score with rising commercial signal is a better result than a rising score nobody acted on — but it does mean the craft-level changes so far have not shifted the rubric.";
  }

  const qualified = periods.reduce((n, p) => n + p.qualifiedActions, 0);
  if (qualified === 0) {
    limitations.push(
      "No commercial action has yet been traced to a specific piece, so none of this can be read as commercial performance.",
    );
  }

  return { direction, scoreDelta, correctionHitRate, correctionsPending, headline, reading, limitations };
}

/* ------------------------------ Period arithmetic ---------------------------- */

export type PeriodWindow = {
  period: number;
  phase: PhaseDefinition;
  start: Date;
  end: Date;
};

/**
 * The service period a date falls in, and its window.
 *
 * Four weeks, never a calendar month — thirteen periods a year, not twelve.
 * Returns null before the engagement starts, because "period 0" is a number
 * that ends up in a report.
 */
export function periodWindow(engagementStart: Date, date: Date): PeriodWindow | null {
  const ms = date.getTime() - engagementStart.getTime();
  if (ms < 0) return null;

  const periodMs = SERVICE_PERIOD_WEEKS * 7 * 86_400_000;
  const index = Math.floor(ms / periodMs);
  const start = new Date(engagementStart.getTime() + index * periodMs);
  const end = new Date(start.getTime() + periodMs - 1);

  return { period: index + 1, phase: phaseForPeriod(index + 1), start, end };
}

/** Windows for every period from the engagement start up to and including `upTo`. */
export function periodWindows(engagementStart: Date, upTo: Date): PeriodWindow[] {
  const last = periodWindow(engagementStart, upTo);
  if (!last) return [];
  const out: PeriodWindow[] = [];
  for (let i = 1; i <= last.period; i += 1) {
    const periodMs = SERVICE_PERIOD_WEEKS * 7 * 86_400_000;
    const start = new Date(engagementStart.getTime() + (i - 1) * periodMs);
    out.push({
      period: i,
      phase: phaseForPeriod(i),
      start,
      end: new Date(start.getTime() + periodMs - 1),
    });
  }
  return out;
}

/** Periods in a year, re-exported so report code need not import two modules. */
export { PERIODS_PER_YEAR };
