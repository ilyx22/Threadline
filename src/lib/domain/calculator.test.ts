import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CALCULATOR_DEFAULTS, calculate } from "./calculator";

describe("operating cost calculator", () => {
  it("adds founder time to contractor spend", () => {
    const result = calculate({
      founderHourlyValue: 200,
      founderHoursPerWeek: 10,
      monthlyContractorCost: 1000,
      piecesPerMonth: 10,
      cycleTimeDays: 14,
    });

    // 10 hrs * 52 weeks * £200 = £104,000, plus £12,000 contractors.
    assert.equal(result.founderAnnualCost, 104_000);
    assert.equal(result.contractorAnnualCost, 12_000);
    assert.equal(result.totalAnnualCost, 116_000);
  });

  it("computes cost per shipped piece", () => {
    const result = calculate({
      founderHourlyValue: 100,
      founderHoursPerWeek: 10,
      monthlyContractorCost: 0,
      piecesPerMonth: 10,
      cycleTimeDays: 10,
    });
    // £52,000 across 120 pieces.
    assert.equal(result.annualPieces, 120);
    assert.equal(result.costPerPiece, 433);
  });

  it("does not divide by zero when nothing is published", () => {
    const result = calculate({ ...CALCULATOR_DEFAULTS, piecesPerMonth: 0 });
    assert.equal(result.costPerPiece, 0);
    assert.ok(Number.isFinite(result.costPerPiece));
  });

  it("never claims more capacity released than the founder currently spends", () => {
    const result = calculate({
      founderHourlyValue: 200,
      founderHoursPerWeek: 1,
      monthlyContractorCost: 0,
      piecesPerMonth: 40,
      cycleTimeDays: 7,
    });
    assert.ok(
      result.hoursReleasedPerYear >= 0,
      "released hours went negative",
    );
    assert.ok(
      result.targetHoursPerWeek <= 1,
      "target time exceeded current time",
    );
  });

  it("never models the founder out of the loop entirely", () => {
    const result = calculate({
      founderHourlyValue: 250,
      founderHoursPerWeek: 20,
      monthlyContractorCost: 0,
      piecesPerMonth: 12,
      cycleTimeDays: 14,
    });
    assert.ok(
      result.targetHoursPerWeek > 0,
      "the scenario should never claim zero founder involvement",
    );
    assert.ok(result.hoursReleasedPerYear < result.founderHoursPerYear);
  });

  it("omits commercial context when the inputs are not supplied", () => {
    const result = calculate(CALCULATOR_DEFAULTS);
    assert.equal(result.attributedRevenue, null);
    assert.equal(result.revenuePerPiece, null);
  });

  it("reports commercial context from the user's own figures only", () => {
    const result = calculate({
      ...CALCULATOR_DEFAULTS,
      piecesPerMonth: 10,
      averageDealValue: 8000,
      dealsFromContentPerYear: 6,
    });
    assert.equal(result.attributedRevenue, 48_000);
    assert.equal(result.revenuePerPiece, 400);
  });

  it("clamps absurd or non-numeric inputs rather than producing nonsense", () => {
    const result = calculate({
      founderHourlyValue: Number.NaN,
      founderHoursPerWeek: 9999,
      monthlyContractorCost: -500,
      piecesPerMonth: 10,
      cycleTimeDays: 5,
    });
    assert.ok(Number.isFinite(result.totalAnnualCost));
    assert.equal(result.contractorAnnualCost, 0);
    // 80 hours a week is the modelled ceiling.
    assert.equal(result.founderHoursPerYear, 80 * 52);
  });
});
