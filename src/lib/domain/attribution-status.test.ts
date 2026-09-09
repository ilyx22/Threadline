import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { assertStatusTransition, AttributionStatusError, eligibilityFor, revSharePool } from "./attribution-status";

describe("attribution status", () => {
  test("transitions are bounded and exclusions are final", () => {
    assertStatusTransition("pending", "confirmed");
    assertStatusTransition("confirmed", "disputed", "client says the lead came from a referral");
    assert.throws(() => assertStatusTransition("excluded", "confirmed"), AttributionStatusError);
    assert.throws(() => assertStatusTransition("pending", "disputed", ""), AttributionStatusError);
  });

  test("weak evidence is never eligible, strong evidence is eligible only when agreed", () => {
    assert.equal(eligibilityFor({ evidence: "associated", agreed: true }), "ineligible");
    assert.equal(eligibilityFor({ evidence: "buyer_named", agreed: false }), "eligible");
    assert.equal(eligibilityFor({ evidence: "directly_tracked", agreed: true }), "agreed");
  });

  test("the pool counts only confirmed, agreed, cash-collected events and never exceeds cash collected", () => {
    const pool = revSharePool([
      { status: "confirmed", eligibility: "agreed", cashCollectedMinor: 1_000_000, attributableRevenueMinor: 1_000_000, attributablePercentage: 50 },
      { status: "confirmed", eligibility: "agreed", cashCollectedMinor: 200_000, attributableRevenueMinor: 900_000, attributablePercentage: null }, // capped at cash
      { status: "confirmed", eligibility: "eligible", cashCollectedMinor: 5_000_000, attributableRevenueMinor: null, attributablePercentage: null }, // not agreed
      { status: "disputed", eligibility: "agreed", cashCollectedMinor: 5_000_000, attributableRevenueMinor: null, attributablePercentage: null },
      { status: "confirmed", eligibility: "agreed", cashCollectedMinor: null, attributableRevenueMinor: null, attributablePercentage: null }, // no cash
    ]);
    assert.equal(pool.poolMinor, 500_000 + 200_000);
    assert.equal(pool.counted, 2);
    assert.equal(pool.excluded, 3);
  });
});
