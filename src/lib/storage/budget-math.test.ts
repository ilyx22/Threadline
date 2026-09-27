import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GB, budgetFromEnv, crossedThresholds, estimateMonthlyGbp, thresholds } from "./budget-math";

describe("storage spending cap (owner: £50 a month, no capped card)", () => {
  it("turns the £50 default into a stored-bytes ceiling with headroom", () => {
    const b = budgetFromEnv({});
    assert.equal(b.budgetGbp, 50);
    // £50 × 1.20 = $60 → 4,000 billable GB + 10 free, × 0.9 safety = 3,609 GB.
    assert.equal(Math.round(b.capBytes / GB), 3609);
    // At the ceiling the estimated bill stays under the budget.
    assert.ok(estimateMonthlyGbp(b.capBytes, b) < 50);
  });

  it("ignores blank or invalid settings and honours real ones", () => {
    assert.equal(budgetFromEnv({ STORAGE_BUDGET_GBP: "   " }).budgetGbp, 50);
    assert.equal(budgetFromEnv({ STORAGE_BUDGET_GBP: "-5" }).budgetGbp, 50);
    assert.equal(budgetFromEnv({ STORAGE_BUDGET_GBP: "abc" }).budgetGbp, 50);
    const five = budgetFromEnv({ STORAGE_BUDGET_GBP: "5" });
    assert.ok(five.capBytes < budgetFromEnv({}).capBytes);
    assert.ok(estimateMonthlyGbp(five.capBytes, five) < 5);
  });

  it("costs nothing inside R2's free 10 GB", () => {
    const b = budgetFromEnv({});
    assert.equal(estimateMonthlyGbp(9.9 * GB, b), 0);
    assert.ok(estimateMonthlyGbp(20 * GB, b) > 0);
  });

  it("alerts in order: 80% of free tier, free tier passed, half budget, 90% budget", () => {
    const b = budgetFromEnv({});
    assert.deepEqual(crossedThresholds(1 * GB, b), []);
    assert.deepEqual(crossedThresholds(8 * GB, b).map((t) => t.key), ["free-80"]);
    assert.deepEqual(crossedThresholds(11 * GB, b).map((t) => t.key), ["free-80", "free-100"]);
    assert.deepEqual(crossedThresholds(b.capBytes, b).map((t) => t.key), ["free-80", "free-100", "budget-50", "budget-90"]);
    const at = thresholds(b).map((t) => t.atBytes);
    assert.deepEqual([...at].sort((x, y) => x - y), at, "thresholds rise monotonically");
  });
});
