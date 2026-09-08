import type { CommercialIntent } from "./enums";

/**
 * Deterministic scoring. Every score in Threadline is computed from stored
 * inputs, never hand-typed and never produced by a model — so two people
 * looking at the same workspace always see the same priority order, and the
 * ordering can be explained to a client on a call.
 */

const INTENT_BONUS: Record<CommercialIntent, number> = { high: 8, medium: 3, low: 0 };

export const IDEA_WEIGHTS = {
  relevance: 0.3,
  novelty: 0.25,
  proofStrength: 0.25,
  formatFit: 0.2,
} as const;

export type IdeaScoreInput = {
  relevanceScore: number;
  noveltyScore: number;
  proofStrength: number;
  formatFit: number;
  commercialIntent: string;
};

/**
 * Weighted blend of the four component scores plus a commercial-intent bonus.
 * Returns 0–100.
 */
export function ideaPriority(input: IdeaScoreInput): number {
  const base =
    clamp(input.relevanceScore) * IDEA_WEIGHTS.relevance +
    clamp(input.noveltyScore) * IDEA_WEIGHTS.novelty +
    clamp(input.proofStrength) * IDEA_WEIGHTS.proofStrength +
    clamp(input.formatFit) * IDEA_WEIGHTS.formatFit;

  const bonus = INTENT_BONUS[input.commercialIntent as CommercialIntent] ?? 0;
  return round1(Math.min(100, base + bonus));
}

/** Human-readable explanation of how a priority score was reached. */
export function explainIdeaPriority(input: IdeaScoreInput) {
  return [
    { label: "Relevance", value: clamp(input.relevanceScore), weight: IDEA_WEIGHTS.relevance },
    { label: "Novelty", value: clamp(input.noveltyScore), weight: IDEA_WEIGHTS.novelty },
    { label: "Proof strength", value: clamp(input.proofStrength), weight: IDEA_WEIGHTS.proofStrength },
    { label: "Format fit", value: clamp(input.formatFit), weight: IDEA_WEIGHTS.formatFit },
  ];
}

export function priorityBand(score: number): { label: string; tone: "accent" | "info" | "outline" } {
  if (score >= 78) return { label: "High", tone: "accent" };
  if (score >= 58) return { label: "Medium", tone: "info" };
  return { label: "Low", tone: "outline" };
}

/**
 * Pattern score. Confidence scales impact; effort discounts it.
 * Range 0–25, where 25 = certain, maximum impact, minimum effort.
 */
export function patternScore(input: {
  confidence: number;
  impact: number;
  effort: number;
}): number {
  const confidence = clamp(input.confidence) / 100;
  const impact = clampRange(input.impact, 1, 5);
  const effort = clampRange(input.effort, 1, 5);
  return round1(confidence * impact * (6 - effort));
}

export function patternBand(score: number): { label: string; tone: "accent" | "info" | "outline" } {
  if (score >= 15) return { label: "Act now", tone: "accent" };
  if (score >= 8) return { label: "Worth testing", tone: "info" };
  return { label: "Watch", tone: "outline" };
}

/**
 * Engagement rate against reach, guarding the zero-reach case rather than
 * producing NaN or Infinity in the UI.
 */
export function engagementRate(metrics: {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
}) {
  if (metrics.views <= 0) return 0;
  const interactions = metrics.likes + metrics.comments + metrics.shares + metrics.saves;
  return round1((interactions / metrics.views) * 100);
}

/** Percentage change between two periods. Returns null when there is no baseline. */
export function periodDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round1(((current - previous) / previous) * 100);
}

/**
 * Classify a published asset against the workspace median. Deliberately uses
 * the median, not the mean, so a single viral outlier does not relabel every
 * other piece as an underperformer.
 */
export function classifyPerformance(value: number, median: number) {
  if (median <= 0) return "unknown" as const;
  const ratio = value / median;
  if (ratio >= 1.6) return "winner" as const;
  if (ratio <= 0.55) return "loser" as const;
  return "typical" as const;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : sorted[mid] ?? 0;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/**
 * Client health, used by the admin portal to surface accounts needing attention.
 * Every input is an operational fact, so the number is defensible in a review.
 */
export function healthScore(input: {
  overdueApprovals: number;
  missingRecordings: number;
  daysSinceActivity: number;
  publishedLast30: number;
  targetLast30: number;
}) {
  let score = 100;
  score -= Math.min(30, input.overdueApprovals * 6);
  score -= Math.min(25, input.missingRecordings * 5);
  score -= Math.min(25, Math.max(0, input.daysSinceActivity - 3) * 3);
  const outputRatio = input.targetLast30 > 0 ? input.publishedLast30 / input.targetLast30 : 1;
  if (outputRatio < 1) score -= Math.min(25, (1 - outputRatio) * 40);
  return Math.max(0, Math.round(score));
}

export function healthBand(score: number) {
  if (score >= 80) return { label: "Healthy", tone: "positive" as const };
  if (score >= 60) return { label: "Watch", tone: "warning" as const };
  return { label: "At risk", tone: "negative" as const };
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function clampRange(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
