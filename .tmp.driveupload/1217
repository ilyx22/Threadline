import {
  CONSTRAINT_DIMENSIONS,
  CONSTRAINT_DIMENSION_META,
  type ConstraintDimension,
  type Severity,
} from "./enums";

/**
 * Constraint diagnosis.
 *
 * Threadline sells content, so the standing temptation is to answer every
 * demand problem with "publish more". This module exists to make that answer
 * something the operator has to argue for rather than assume: nine dimensions
 * are rated, the weakest becomes the primary constraint, and only two of the
 * nine are actually solved by volume.
 *
 * Ratings run 1 (severely constrained) to 5 (strong). They are entered by a
 * person from evidence; nothing here invents a rating.
 */

export const RATING_LABELS: Record<number, string> = {
  1: "Severely constrained",
  2: "Weak",
  3: "Adequate",
  4: "Good",
  5: "Strong",
};

/** What each dimension is asking, phrased as the question an operator answers. */
export const DIMENSION_QUESTION: Record<ConstraintDimension, string> = {
  positioning:
    "Can a stranger tell within one sentence what this business does, who for, and why it is the obvious choice?",
  audience:
    "Are the people being reached the people who can actually authorise a purchase at this price?",
  offer_alignment:
    "Does the offer solve the problem this audience says it has, at a price and shape they can say yes to?",
  content_market_fit:
    "Do the topics being published match what this market is already trying to solve?",
  differentiation:
    "If a competitor published the same piece, would anyone be able to tell the difference?",
  creative_quality:
    "Do the hooks, structure and delivery hold attention long enough for the point to land?",
  distribution:
    "Does enough of the right audience see the work, or is good work dying in a small room?",
  conversion:
    "Does an interested viewer have an obvious, low-friction next step towards a conversation?",
  operations:
    "Can this business sustain output without the founder personally carrying every step?",
};

/**
 * Whether publishing more content plausibly moves this constraint.
 *
 * This drives the honest sentence on the diagnosis screen. When the primary
 * constraint is positioning, offer alignment, differentiation or conversion,
 * more content amplifies the existing problem instead of fixing it.
 */
export const VOLUME_HELPS: Record<ConstraintDimension, boolean> = {
  positioning: false,
  audience: false,
  offer_alignment: false,
  content_market_fit: true,
  differentiation: false,
  creative_quality: true,
  distribution: true,
  conversion: false,
  operations: true,
};

export function volumeVerdict(dimension: ConstraintDimension): string {
  return VOLUME_HELPS[dimension]
    ? "More output plausibly helps here, provided the other dimensions hold."
    : "More output will not fix this. Publishing more against an unresolved constraint makes the same problem more expensive.";
}

export type DimensionRating = { dimension: ConstraintDimension; rating: number };

/**
 * The weakest dimension, with ties broken by the fixed order in
 * CONSTRAINT_DIMENSIONS so the same inputs always produce the same answer.
 * A recommendation, not a decision — the operator sets the stored constraint.
 */
export function weakestDimension(ratings: DimensionRating[]): ConstraintDimension | null {
  if (ratings.length === 0) return null;
  const byDimension = new Map(ratings.map((r) => [r.dimension, clampRating(r.rating)]));

  let best: ConstraintDimension | null = null;
  let bestRating = Number.POSITIVE_INFINITY;
  for (const dimension of CONSTRAINT_DIMENSIONS) {
    const rating = byDimension.get(dimension);
    if (rating === undefined) continue;
    if (rating < bestRating) {
      bestRating = rating;
      best = dimension;
    }
  }
  return best;
}

/**
 * Suggested severity from the primary constraint's rating.
 * The operator can override it; this is the starting point, not the verdict.
 */
export function suggestedSeverity(rating: number): Severity {
  const r = clampRating(rating);
  if (r <= 1) return "critical";
  if (r === 2) return "high";
  if (r === 3) return "medium";
  return "low";
}

/** Mean rating across the dimensions that were actually assessed, 0 if none. */
export function diagnosisAverage(ratings: DimensionRating[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => sum + clampRating(r.rating), 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

/** Dimensions rated at or below `threshold`, weakest first. */
export function constrainedDimensions(ratings: DimensionRating[], threshold = 2) {
  return ratings
    .filter((r) => clampRating(r.rating) <= threshold)
    .sort((a, b) => a.rating - b.rating || order(a.dimension) - order(b.dimension));
}

export function dimensionLabel(dimension: string): string {
  return CONSTRAINT_DIMENSION_META[dimension as ConstraintDimension]?.label ?? dimension;
}

/** A diagnosis is complete once every dimension has been rated. */
export function isComplete(ratings: DimensionRating[]): boolean {
  const seen = new Set(ratings.map((r) => r.dimension));
  return CONSTRAINT_DIMENSIONS.every((d) => seen.has(d));
}

export function missingDimensions(ratings: DimensionRating[]): ConstraintDimension[] {
  const seen = new Set(ratings.map((r) => r.dimension));
  return CONSTRAINT_DIMENSIONS.filter((d) => !seen.has(d));
}

/** Review cadence: a constraint that is never revisited becomes an assumption. */
export function defaultReviewDate(from = new Date()): Date {
  const date = new Date(from);
  date.setMonth(date.getMonth() + 1);
  return date;
}

export function isReviewOverdue(reviewDate: Date | null | undefined, now = new Date()): boolean {
  if (!reviewDate) return false;
  return reviewDate.getTime() < now.getTime();
}

function order(dimension: ConstraintDimension) {
  return CONSTRAINT_DIMENSIONS.indexOf(dimension);
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 3;
  return Math.min(5, Math.max(1, Math.round(value)));
}

/* ------------------------- Provisional ratings from onboarding -------------- */

/**
 * What onboarding can honestly tell us about each dimension.
 *
 * Only four of the nine are derivable from the answers a client gives during
 * installation, and only from concrete facts: whether an offer has a stated
 * mechanism and outcome, whether the ICP is described in enough detail to
 * target, whether the operation depends on one person, and whether an
 * interested viewer has an obvious next step.
 *
 * The other five - positioning, content-market fit, differentiation, creative
 * quality and distribution - require a person to look at the actual work. They
 * are deliberately left unrated, which also means a diagnosis seeded from
 * onboarding can never be activated without an operator completing it.
 */
export type OnboardingDiagnosisInput = {
  offerMechanism?: string;
  offerOutcome?: string;
  differentiatorCount: number;
  icpDescription?: string;
  icpFirmographics?: string;
  painCount: number;
  founderHoursPerWeek?: number;
  peopleInvolved?: number;
  turnaroundDays?: number;
  hasBookingUrl: boolean;
  leadMagnetCount: number;
  attentionToInquiry?: string;
};

export function provisionalRatings(input: OnboardingDiagnosisInput): {
  ratings: DimensionRating[];
  notes: Record<string, string>;
} {
  const ratings: DimensionRating[] = [];
  const notes: Record<string, string> = {};

  // Offer alignment: does the offer state a mechanism and an outcome?
  const hasMechanism = Boolean(input.offerMechanism?.trim());
  const hasOutcome = Boolean(input.offerOutcome?.trim());
  const stated = (hasMechanism ? 1 : 0) + (hasOutcome ? 1 : 0);
  const offerRating = stated === 2 ? (input.differentiatorCount >= 2 ? 4 : 3) : stated === 1 ? 3 : 2;
  ratings.push({ dimension: "offer_alignment", rating: offerRating });
  notes.offer_alignment =
    stated === 2
      ? `Onboarding: the offer states both a mechanism and an outcome, with ${input.differentiatorCount} stated differentiator(s).`
      : "Onboarding: the offer is missing a stated mechanism or outcome, so buyers have to infer what changes.";

  // Audience: is the ICP described in enough detail to actually target?
  const described = Boolean(input.icpDescription?.trim()) && Boolean(input.icpFirmographics?.trim());
  const audienceRating = described && input.painCount >= 3 ? 4 : described || input.painCount >= 3 ? 3 : 2;
  ratings.push({ dimension: "audience", rating: audienceRating });
  notes.audience = `Onboarding: ICP ${described ? "described with firmographics" : "described loosely"}, ${input.painCount} pain(s) captured.`;

  // Operations: can output survive the founder being busy?
  const hours = input.founderHoursPerWeek ?? 0;
  const people = input.peopleInvolved ?? 1;
  const turnaround = input.turnaroundDays ?? 0;
  let operationsRating = 3;
  if (hours >= 10 && people <= 2) operationsRating = 1;
  else if (hours >= 6 || people <= 1) operationsRating = 2;
  else if (hours <= 3 && people >= 3) operationsRating = 4;
  ratings.push({ dimension: "operations", rating: operationsRating });
  notes.operations = `Onboarding: ${hours} founder hour(s) per week across ${people} person/people${turnaround ? `, ${turnaround} day turnaround` : ""}.`;

  // Conversion: does an interested viewer have somewhere obvious to go?
  const paths =
    (input.hasBookingUrl ? 1 : 0) +
    (input.leadMagnetCount > 0 ? 1 : 0) +
    (input.attentionToInquiry?.trim() ? 1 : 0);
  const conversionRating = paths >= 3 ? 4 : paths === 2 ? 3 : paths === 1 ? 2 : 1;
  ratings.push({ dimension: "conversion", rating: conversionRating });
  notes.conversion =
    paths === 0
      ? "Onboarding: no booking link, lead magnet or described path from attention to a conversation."
      : `Onboarding: ${paths} of 3 conversion elements in place (booking link, lead magnet, described path).`;

  return { ratings, notes };
}
