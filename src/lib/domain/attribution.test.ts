import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ATTRIBUTION_WINDOW_DAYS,
  attribute,
  attributionCoverage,
  EFFICIENCY_COVERAGE_FLOOR,
  evidenceStrength,
  outcomeLanguage,
  per10k,
  qualifyingTouches,
  rollUp,
  type CommercialOutcome,
  type Touch,
  assertEvidenceSupportable,
} from "./attribution";
import { ATTRIBUTION_CLASSES, ATTRIBUTION_MODELS, type AttributionClass } from "./enums";

/**
 * The rules these tests exist to protect:
 *
 *   1. an attribution model redistributes credit and never creates evidence;
 *   2. only touches before the event, and inside the window, can be credited;
 *   3. a repeated visit does not buy an asset more credit;
 *   4. credit sums to the whole, so the parts reconcile;
 *   5. money per asset is withheld when coverage cannot support it;
 *   6. nothing is credited when nothing was recorded, and it says why.
 */

const day = (n: number) => new Date(2026, 5, n, 12, 0, 0);

function touch(id: string, contentItemId: string | null, dayOfMonth: number): Touch {
  return { id, contentItemId, occurredAt: day(dayOfMonth) };
}

const outcome: CommercialOutcome = {
  id: "won-1",
  kind: "won",
  occurredAt: day(20),
  valueMinor: 1_000_000,
  evidence: "directly_tracked",
};

describe("qualifying touches", () => {
  it("excludes anything after the event", () => {
    // A click the week after a deal closed did not contribute to it, however
    // convenient the ordering would be.
    const touches = [touch("a", "asset-1", 10), touch("b", "asset-2", 25)];
    assert.deepEqual(
      qualifyingTouches(touches, outcome).map((t) => t.id),
      ["a"],
    );
  });

  it("excludes anything older than the window", () => {
    const old = { id: "old", contentItemId: "asset-9", occurredAt: new Date(2025, 0, 1) };
    assert.deepEqual(
      qualifyingTouches([old, touch("a", "asset-1", 10)], outcome).map((t) => t.id),
      ["a"],
    );
  });

  it("orders oldest first, whatever order they arrive in", () => {
    const touches = [touch("c", "asset-3", 18), touch("a", "asset-1", 2), touch("b", "asset-2", 9)];
    assert.deepEqual(
      qualifyingTouches(touches, outcome).map((t) => t.id),
      ["a", "b", "c"],
    );
  });
});

describe("first and last touch", () => {
  const touches = [touch("a", "asset-1", 2), touch("b", "asset-2", 9), touch("c", "asset-3", 18)];

  it("credits the earliest for first touch", () => {
    const result = attribute("first_touch", touches, outcome);
    assert.equal(result.credits.length, 1);
    assert.equal(result.credits[0].contentItemId, "asset-1");
    assert.equal(result.credits[0].valueMinor, outcome.valueMinor);
  });

  it("credits the latest for last touch", () => {
    const result = attribute("last_touch", touches, outcome);
    assert.equal(result.credits[0].contentItemId, "asset-3");
    assert.equal(result.credits[0].valueMinor, outcome.valueMinor);
  });

  it("gives the whole value to a single touch under every model", () => {
    const single = [touch("only", "asset-1", 4)];
    for (const model of ATTRIBUTION_MODELS) {
      const result = attribute(model, single, outcome);
      assert.equal(result.credits.length, 1, model);
      assert.equal(result.credits[0].valueMinor, outcome.valueMinor, model);
      assert.equal(result.credits[0].share, 1, model);
    }
  });
});

describe("linear", () => {
  it("splits evenly across distinct assets", () => {
    const touches = [touch("a", "asset-1", 2), touch("b", "asset-2", 9)];
    const result = attribute("linear", touches, outcome);
    assert.equal(result.credits.length, 2);
    assert.equal(result.credits[0].valueMinor + result.credits[1].valueMinor, outcome.valueMinor);
    assert.equal(result.credits[0].share, 0.5);
  });

  it("does not let a repeat visit buy an asset more credit", () => {
    // One enthusiastic reader clicking the same post four times must not make
    // it look like the strongest thing published.
    const touches = [
      touch("a", "asset-1", 2),
      touch("b", "asset-2", 4),
      touch("c", "asset-2", 5),
      touch("d", "asset-2", 6),
    ];
    const result = attribute("linear", touches, outcome);
    assert.equal(result.credits.length, 2);
    assert.equal(result.assets, 2);
    assert.equal(result.considered, 4);
    const asset2 = result.credits.find((c) => c.contentItemId === "asset-2");
    assert.equal(asset2?.share, 0.5);
  });

  it("reconciles to the whole with an awkward split", () => {
    // Three ways into a figure that does not divide. The parts must still sum
    // to the total, or every other number on the page loses its credibility.
    const odd = { ...outcome, valueMinor: 100 };
    const touches = [touch("a", "a1", 2), touch("b", "a2", 3), touch("c", "a3", 4)];
    const result = attribute("linear", touches, odd);
    assert.equal(
      result.credits.reduce((sum, c) => sum + c.valueMinor, 0),
      100,
    );
  });
});

describe("no credit", () => {
  it("says nothing was recorded when there are no touches", () => {
    const result = attribute("linear", [], outcome);
    assert.deepEqual(result.credits, []);
    assert.match(result.reason ?? "", /no touchpoints/i);
  });

  it("says so when every touch falls outside the window", () => {
    const stale = [{ id: "x", contentItemId: "a1", occurredAt: new Date(2024, 0, 1) }];
    const result = attribute("first_touch", stale, outcome);
    assert.deepEqual(result.credits, []);
    assert.match(result.reason ?? "", new RegExp(`${ATTRIBUTION_WINDOW_DAYS} days`));
  });

  it("ignores touches whose asset is unknown", () => {
    // A click we know happened but cannot tie to content is real, and it is
    // still not evidence about any particular asset.
    const result = attribute("linear", [touch("a", null, 5)], outcome);
    assert.deepEqual(result.credits, []);
  });
});

describe("evidence is never created by a model", () => {
  it("carries the class through unchanged, whatever the model says", () => {
    for (const evidence of ATTRIBUTION_CLASSES) {
      const weak: CommercialOutcome = { ...outcome, evidence };
      for (const model of ATTRIBUTION_MODELS) {
        attribute(model, [touch("a", "a1", 2), touch("b", "a2", 3)], weak);
        assert.equal(
          evidenceStrength(weak),
          evidence,
          `${model} changed the evidence class to something else`,
        );
      }
    }
  });

  it("keeps a correlation a correlation even when three assets share the credit", () => {
    const correlated: CommercialOutcome = { ...outcome, evidence: "associated" };
    const credits = rollUp("linear", [
      {
        touches: [touch("a", "a1", 2), touch("b", "a2", 3), touch("c", "a3", 4)],
        outcome: correlated,
      },
    ]);
    assert.equal(credits.length, 3);
    for (const credit of credits) {
      assert.equal(credit.bestEvidence, "associated");
    }
  });
});

describe("roll-up", () => {
  it("aggregates across journeys and keeps the strongest evidence per asset", () => {
    const strong: CommercialOutcome = { ...outcome, id: "e1", evidence: "directly_tracked" };
    const weak: CommercialOutcome = {
      ...outcome,
      id: "e2",
      valueMinor: 500_000,
      evidence: "associated",
    };

    const credits = rollUp("last_touch", [
      { touches: [touch("a", "asset-1", 2)], outcome: weak },
      { touches: [touch("b", "asset-1", 3)], outcome: strong },
    ]);

    assert.equal(credits.length, 1);
    assert.equal(credits[0].events, 2);
    assert.equal(credits[0].valueMinor, 1_500_000);
    assert.equal(credits[0].bestEvidence, "directly_tracked");
  });

  it("returns nothing rather than a zero row when no journey has touches", () => {
    assert.deepEqual(rollUp("linear", [{ touches: [], outcome }]), []);
  });
});

describe("coverage gating", () => {
  const classes = (...list: AttributionClass[]) => list.map((evidence) => ({ evidence }));

  it("withholds money when most events are correlation", () => {
    // The specific failure: one traceable large deal plus four correlations
    // produces "£X from this post", which is arithmetically true and
    // completely misleading.
    const coverage = attributionCoverage(
      classes("directly_tracked", "associated", "associated", "associated", "associated"),
    );
    assert.equal(coverage.monetaryAllowed, false);
    assert.match(coverage.reason ?? "", /1 of 5/);
  });

  it("allows money once enough is defensible", () => {
    const coverage = attributionCoverage(classes("directly_tracked", "buyer_named", "associated"));
    assert.equal(coverage.monetaryAllowed, true);
    assert.equal(coverage.reason, null);
    assert.ok((coverage.share ?? 0) >= EFFICIENCY_COVERAGE_FLOOR);
  });

  it("counts a buyer naming the content as defensible", () => {
    assert.equal(attributionCoverage(classes("buyer_named", "buyer_named")).monetaryAllowed, true);
  });

  it("does not count influence or correlation as defensible", () => {
    assert.equal(attributionCoverage(classes("multi_touch", "associated")).monetaryAllowed, false);
  });

  it("refuses with no events at all, and says why", () => {
    const coverage = attributionCoverage([]);
    assert.equal(coverage.monetaryAllowed, false);
    assert.equal(coverage.share, null);
    assert.match(coverage.reason ?? "", /no commercial events/i);
  });
});

describe("normalised metrics", () => {
  it("refuses to normalise on too little reach", () => {
    // Two calls from 40 views is not "500 per 10,000".
    assert.equal(per10k(2, 40), null);
  });

  it("normalises once there is enough reach to read", () => {
    assert.equal(per10k(5, 50_000), 1);
  });
});

describe("outcome language", () => {
  it("never says a correlation was caused by content", () => {
    const sentence = outcomeLanguage("associated", "£40,000");
    assert.doesNotMatch(sentence, /generated|caused|produced by/i);
    assert.match(sentence, /does not support a causal claim/i);
  });

  it("says directly tracked only for directly tracked", () => {
    assert.match(outcomeLanguage("directly_tracked", "£40,000"), /directly tracked/i);
    assert.doesNotMatch(outcomeLanguage("multi_touch", "£40,000"), /directly tracked/i);
  });

  it("has a sentence for every evidence class", () => {
    for (const evidence of ATTRIBUTION_CLASSES) {
      assert.ok(outcomeLanguage(evidence, "£1").length > 10, evidence);
    }
  });
});

describe("evidence must be supportable (QA-005)", () => {
  it("refuses directly_tracked with no tracked visitor", () => {
    assert.throws(() => assertEvidenceSupportable("directly_tracked", { visitorId: null, inquiryId: "i" }), /observed the click itself/);
  });
  it("refuses buyer_named and multi_touch with no inquiry", () => {
    assert.throws(() => assertEvidenceSupportable("buyer_named", { visitorId: "v", inquiryId: null }));
    assert.throws(() => assertEvidenceSupportable("multi_touch", { visitorId: "v", inquiryId: null }));
  });
  it("accepts each class with its evidence, and the weak classes with none", () => {
    assert.doesNotThrow(() => assertEvidenceSupportable("directly_tracked", { visitorId: "v", inquiryId: null }));
    assert.doesNotThrow(() => assertEvidenceSupportable("buyer_named", { visitorId: null, inquiryId: "i" }));
    assert.doesNotThrow(() => assertEvidenceSupportable("associated", { visitorId: null, inquiryId: null }));
    assert.doesNotThrow(() => assertEvidenceSupportable("qualitative_only", { visitorId: null, inquiryId: null }));
  });
});

describe("evidence classes are the brief's five, exactly (ATT-01)", () => {
  it("maps every stored class to one canonical name and back", async () => {
    const { EVIDENCE_CLASS_CANONICAL } = await import("./enums");
    const canonical = ATTRIBUTION_CLASSES.map((c) => EVIDENCE_CLASS_CANONICAL[c]);
    assert.deepEqual([...canonical].sort(), ["ASSOCIATED_CORRELATED", "BUYER_NAMED_CLIENT_ATTRIBUTED", "DIRECTLY_TRACKED", "MULTI_TOUCH_INFLUENCED", "QUALITATIVE_ONLY"]);
    assert.equal(new Set(canonical).size, ATTRIBUTION_CLASSES.length);
  });
});
