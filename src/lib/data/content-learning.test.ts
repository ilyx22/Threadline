import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRACEABLE_ATTRIBUTION, collapseSnapshots } from "./content-learning";
import { ATTRIBUTION_STRENGTH } from "@/lib/domain/enums";

/**
 * Regression for QA-003: the traceable set named classes that did not exist,
 * so no commercial event ever counted against a piece of content.
 */
describe("traceable attribution", () => {
  it("only names classes that actually exist", () => {
    for (const cls of TRACEABLE_ATTRIBUTION) {
      assert.ok(cls in ATTRIBUTION_STRENGTH, `${cls} is not an attribution class`);
    }
  });

  it("counts a buyer naming the piece as traceable", () => {
    assert.ok(TRACEABLE_ATTRIBUTION.has("buyer_named"));
    assert.ok(TRACEABLE_ATTRIBUTION.has("directly_tracked"));
  });

  it("does not count evidence that cannot be pinned to one asset", () => {
    assert.ok(!TRACEABLE_ATTRIBUTION.has("associated"));
    assert.ok(!TRACEABLE_ATTRIBUTION.has("qualitative_only"));
    assert.ok(!TRACEABLE_ATTRIBUTION.has("multi_touch"));
  });
});

describe("collapsing snapshots", () => {
  it("keeps unmeasured metrics null rather than zero", () => {
    const m = collapseSnapshots([
      { capturedAt: new Date(2), views: 100, impressions: 0, likes: 5, comments: 0, shares: 0, saves: 0, watchTimeSec: 0, avgViewSec: 0, retentionPct: 0, source: "manual" },
    ]);
    assert.equal(m.views, 100);
    assert.equal(m.likes, 5);
    assert.equal(m.saves, null, "a zero across every snapshot is unreported, not measured-zero");
    assert.equal(m.retentionPct, null);
  });

  it("returns all-null for no snapshots", () => {
    assert.equal(collapseSnapshots([]).views, null);
  });
});
