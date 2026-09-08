import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalise, unavailableKeys } from "./normalise";

describe("analytics normaliser", () => {
  test("0, unknown, unavailable, unsupported and stale are five different states", () => {
    const n = normalise({ provider: "youtube", raw: { views: 0, likes: null, comments: 12 }, measuredAt: new Date(), providerRecordId: "abc" });
    assert.equal(n.states.views, "value");
    assert.equal(n.values.views, 0);
    assert.equal(n.states.likes, "unavailable");
    assert.equal(n.states.shares, "unknown");
    assert.equal(n.states.saves, "unsupported"); // YouTube does not expose saves
    assert.equal(n.values.comments, 12);
  });

  test("a reading older than the freshness window is kept but flagged stale", () => {
    const old = new Date(Date.now() - 4 * 86_400_000);
    const n = normalise({ provider: "x", raw: { impressions: 500 }, measuredAt: old });
    assert.equal(n.states.impressions, "stale");
    assert.equal(n.values.impressions, 500);
    assert.ok(unavailableKeys(n).includes("views")); // unsupported on X
    assert.ok(!unavailableKeys(n).includes("impressions"));
  });

  test("an unknown provider supports nothing rather than everything", () => {
    const n = normalise({ provider: "carrier-pigeon", raw: { views: 9 } });
    assert.equal(n.states.views, "unsupported");
    assert.equal(n.values.views, undefined);
  });
});
