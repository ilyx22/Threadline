/**
 * The public acquisition model — the Playbook's "model the commercial maths".
 *
 *   required first touches = target wins / (booking × show × qualified × close)
 *
 * Built on the same arithmetic as the internal funnel (`funnel.ts`), with the
 * same two rules: it refuses to produce a number it cannot support, and every
 * rate here is an assumption typed in by the visitor — never a measurement,
 * never a forecast. The output is the funnel read backwards: wins → qualified
 * opportunities → attended calls → bookings → first touches.
 *
 * Channel-agnostic on purpose. A "first touch" is a relevant buyer meeting the
 * firm's thinking for the first time, whatever the surface.
 */
import { assumedRates, projectFromRates } from "./funnel";

export type AcquisitionInputs = {
  /** Engagements the firm wants to win in the period. */
  targetWins: number;
  /** Percentage of first touches that become a booked conversation, 0–100. */
  bookingRatePct: number;
  /** Percentage of booked conversations that are attended, 0–100. */
  showRatePct: number;
  /** Percentage of attended conversations that are genuinely a fit, 0–100. */
  qualifiedRatePct: number;
  /** Percentage of qualified conversations that close, 0–100. */
  closeRatePct: number;
};

export type RateKey = "bookingRatePct" | "showRatePct" | "qualifiedRatePct" | "closeRatePct";

export const RATE_KEYS: readonly RateKey[] = ["bookingRatePct", "showRatePct", "qualifiedRatePct", "closeRatePct"];

/** Sensible bounds for the controls; the maths clamps to them too. */
export const ACQUISITION_BOUNDS = {
  targetWins: { min: 1, max: 50, step: 1 },
  bookingRatePct: { min: 0.5, max: 50, step: 0.5 },
  showRatePct: { min: 10, max: 100, step: 1 },
  qualifiedRatePct: { min: 10, max: 100, step: 1 },
  closeRatePct: { min: 5, max: 100, step: 1 },
} as const;

export const ACQUISITION_DEFAULTS: AcquisitionInputs = {
  targetWins: 4,
  bookingRatePct: 5,
  showRatePct: 80,
  qualifiedRatePct: 50,
  closeRatePct: 30,
};

export type Stage = {
  key: "wins" | "qualified" | "attended" | "booked" | "touches";
  label: string;
  /** Rounded up — you cannot book half a call. */
  count: number;
  /** The rate that produced this stage from the one below it, as a fraction, or null for the target itself. */
  fromRate: number | null;
};

export type Leverage = {
  key: RateKey;
  label: string;
  /** Required touches if this rate improved by ten points (capped at 100). */
  touchesIfImproved: number;
  /** Touches saved by that ten-point move. */
  saved: number;
};

export type AcquisitionResult =
  | {
      ok: true;
      stages: Stage[];
      requiredTouches: number;
      /** Compound conversion from first touch to win, 0–1. */
      conversion: number;
      /** Which rate a ten-point improvement would move the answer most — the lowest one, by construction. */
      leverage: Leverage | null;
    }
  | { ok: false; reason: string };

const RATE_LABELS: Record<RateKey, string> = {
  bookingRatePct: "Booking rate",
  showRatePct: "Show rate",
  qualifiedRatePct: "Qualification rate",
  closeRatePct: "Close rate",
};

/** Clamp every input to its bounds; non-finite values fall back to the default. */
export function normaliseInputs(raw: Partial<AcquisitionInputs>): AcquisitionInputs {
  const out = { ...ACQUISITION_DEFAULTS };
  for (const key of Object.keys(ACQUISITION_DEFAULTS) as (keyof AcquisitionInputs)[]) {
    const v = raw[key];
    const b = ACQUISITION_BOUNDS[key];
    out[key] = Number.isFinite(v) ? Math.min(b.max, Math.max(b.min, v as number)) : ACQUISITION_DEFAULTS[key];
  }
  return out;
}

export function acquisitionModel(inputs: AcquisitionInputs): AcquisitionResult {
  const projection = projectFromRates(
    inputs.targetWins,
    assumedRates({ booking: inputs.bookingRatePct, show: inputs.showRatePct, qualified: inputs.qualifiedRatePct, close: inputs.closeRatePct }),
  );
  if (!projection.ok) return { ok: false, reason: projection.reason };

  const close = inputs.closeRatePct / 100;
  const qualified = inputs.qualifiedRatePct / 100;
  const show = inputs.showRatePct / 100;
  const booking = inputs.bookingRatePct / 100;

  // Read the funnel backwards on exact values, then round each stage up.
  const wins = inputs.targetWins;
  const qualifiedNeeded = wins / close;
  const attendedNeeded = qualifiedNeeded / qualified;
  const bookedNeeded = attendedNeeded / show;

  const stages: Stage[] = [
    { key: "wins", label: "Engagements won", count: wins, fromRate: null },
    { key: "qualified", label: "Qualified opportunities", count: ceil(qualifiedNeeded), fromRate: close },
    { key: "attended", label: "Conversations attended", count: ceil(attendedNeeded), fromRate: qualified },
    { key: "booked", label: "Conversations booked", count: ceil(bookedNeeded), fromRate: show },
    { key: "touches", label: "First touches with the right buyers", count: projection.requiredFirstTouches, fromRate: booking },
  ];

  return { ok: true, stages, requiredTouches: projection.requiredFirstTouches, conversion: projection.conversion, leverage: leverage(inputs) };
}

/**
 * In a product of rates every factor has the same elasticity, so "which rate
 * matters most" only has an answer for a fixed absolute move: ten points on
 * the lowest rate is the largest relative change, so it saves the most touches.
 */
export function leverage(inputs: AcquisitionInputs): Leverage | null {
  const base = acquisitionTouches(inputs);
  if (base === null) return null;
  let best: Leverage | null = null;
  for (const key of RATE_KEYS) {
    const improved = { ...inputs, [key]: Math.min(100, inputs[key] + 10) };
    const touches = acquisitionTouches(improved);
    if (touches === null) continue;
    const saved = base - touches;
    if (!best || saved > best.saved) best = { key, label: RATE_LABELS[key], touchesIfImproved: touches, saved };
  }
  return best && best.saved > 0 ? best : null;
}

function acquisitionTouches(inputs: AcquisitionInputs): number | null {
  const p = projectFromRates(
    inputs.targetWins,
    assumedRates({ booking: inputs.bookingRatePct, show: inputs.showRatePct, qualified: inputs.qualifiedRatePct, close: inputs.closeRatePct }),
  );
  return p.ok ? p.requiredFirstTouches : null;
}

/** Ceil with a guard against floating-point noise (e.g. 16.000000000000004). */
function ceil(value: number): number {
  return Math.ceil(Math.round(value * 1e9) / 1e9);
}

/** Whole numbers with thin-space grouping for display; never decimals. */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(n);
}
