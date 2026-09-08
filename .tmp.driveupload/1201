/**
 * Operating-cost calculator.
 *
 * Deliberately frames everything as a scenario built from the user's own inputs.
 * It computes what their current operation costs and what capacity a different
 * workflow would release — never a saving, never a guarantee, and never a
 * revenue projection. Anyone promising the latter from five form fields is
 * making it up.
 */

export type CalculatorInputs = {
  /** What an hour of the founder's time is worth to the business. */
  founderHourlyValue: number;
  /** Hours per week the founder spends on content. */
  founderHoursPerWeek: number;
  /** Monthly spend on writers, editors, contractors and tools. */
  monthlyContractorCost: number;
  /** Pieces published per four-week period. */
  piecesPerMonth: number;
  /** Days from idea to published. */
  cycleTimeDays: number;
  /** Optional: average value of a closed deal. */
  averageDealValue?: number;
  /** Optional: deals per year currently attributed to content. */
  dealsFromContentPerYear?: number;
};

export type CalculatorResult = {
  founderAnnualCost: number;
  contractorAnnualCost: number;
  totalAnnualCost: number;
  annualPieces: number;
  costPerPiece: number;
  founderHoursPerYear: number;
  /** Hours per year released under the target workflow. */
  hoursReleasedPerYear: number;
  releasedValue: number;
  /** Founder hours per week under the target workflow. */
  targetHoursPerWeek: number;
  cycleTimeDays: number;
  attributedRevenue: number | null;
  revenuePerPiece: number | null;
};

/**
 * The target workflow assumption, stated openly in the UI.
 *
 * In a Threadline-style operation the founder's remaining direct time is
 * recording and approval. We model that as a floor of roughly 20 minutes per
 * published piece plus a fixed weekly approval pass — not zero, because the
 * founder never disappears from the loop, and claiming otherwise would be false.
 */
export const TARGET_MINUTES_PER_PIECE = 20;
export const TARGET_WEEKLY_OVERHEAD_MINUTES = 30;

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const founderHourlyValue = clampNumber(inputs.founderHourlyValue, 0, 100_000);
  const founderHoursPerWeek = clampNumber(inputs.founderHoursPerWeek, 0, 80);
  const monthlyContractorCost = clampNumber(inputs.monthlyContractorCost, 0, 1_000_000);
  const piecesPerMonth = clampNumber(inputs.piecesPerMonth, 0, 500);
  const cycleTimeDays = clampNumber(inputs.cycleTimeDays, 0, 365);

  const founderHoursPerYear = founderHoursPerWeek * 52;
  const founderAnnualCost = founderHoursPerYear * founderHourlyValue;
  const contractorAnnualCost = monthlyContractorCost * 12;
  const totalAnnualCost = founderAnnualCost + contractorAnnualCost;

  const annualPieces = piecesPerMonth * 12;
  const costPerPiece = annualPieces > 0 ? totalAnnualCost / annualPieces : 0;

  // Target-state founder time: recording and approving, nothing else.
  const targetWeeklyMinutes =
    (piecesPerMonth / 4.345) * TARGET_MINUTES_PER_PIECE + TARGET_WEEKLY_OVERHEAD_MINUTES;
  const targetHoursPerWeek = Math.min(founderHoursPerWeek, targetWeeklyMinutes / 60);

  const hoursReleasedPerYear = Math.max(0, (founderHoursPerWeek - targetHoursPerWeek) * 52);
  const releasedValue = hoursReleasedPerYear * founderHourlyValue;

  const dealValue = inputs.averageDealValue ?? 0;
  const deals = inputs.dealsFromContentPerYear ?? 0;
  const attributedRevenue = dealValue > 0 && deals > 0 ? dealValue * deals : null;
  const revenuePerPiece =
    attributedRevenue != null && annualPieces > 0 ? attributedRevenue / annualPieces : null;

  return {
    founderAnnualCost: round(founderAnnualCost),
    contractorAnnualCost: round(contractorAnnualCost),
    totalAnnualCost: round(totalAnnualCost),
    annualPieces,
    costPerPiece: round(costPerPiece),
    founderHoursPerYear: round(founderHoursPerYear),
    hoursReleasedPerYear: round(hoursReleasedPerYear),
    releasedValue: round(releasedValue),
    targetHoursPerWeek: Math.round(targetHoursPerWeek * 10) / 10,
    cycleTimeDays,
    attributedRevenue: attributedRevenue != null ? round(attributedRevenue) : null,
    revenuePerPiece: revenuePerPiece != null ? round(revenuePerPiece) : null,
  };
}

export const CALCULATOR_DEFAULTS: CalculatorInputs = {
  founderHourlyValue: 250,
  founderHoursPerWeek: 8,
  monthlyContractorCost: 2000,
  piecesPerMonth: 12,
  cycleTimeDays: 14,
  averageDealValue: 0,
  dealsFromContentPerYear: 0,
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value);
}
