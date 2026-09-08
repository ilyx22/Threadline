import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_METRICS,
  MATURITY_DAYS,
  MINIMUM_VIEWS_FOR_READING,
  prescribe,
  readGap,
  readSufficiency,
  type ActualContext,
  type Expectation,
  type ObservedMetrics,
} from "./content-diagnosis";

/**
 * The rules these tests protect:
 *
 *   1. sufficiency is checked before any cause is named — a four-day-old post
 *      is not a result;
 *   2. `null` and `0` stay different: unmeasured is never reported as failed;
 *   3. reach in front of the wrong audience is a FAILURE, not a success;
 *   4. weak reach plus strong engagement preserves the thesis — the single most
 *      valuable diagnosis the system can produce;
 *   5. ambiguity produces `mixed`, never the nearest confident-sounding label;
 *   6. a retest is a question, so batch sizes stay small.
 */

const metrics = (over: Partial<ObservedMetrics> = {}): ObservedMetrics => ({
  ...EMPTY_METRICS,
  views: 1_000,
  likes: 10,
  comments: 2,
  shares: 1,
  saves: 2,
  trackedClicks: 0,
  qualifiedActions: 0,
  ...over,
});

const actual = (over: Partial<ActualContext> = {}): ActualContext => ({
  metrics: metrics(),
  band: "typical",
  maturityDays: 30,
  snapshotCount: 3,
  buyerRelevanceObserved: "unknown",
  ...over,
});

const expectation = (over: Partial<Expectation> = {}): Expectation => ({
  rubricVersion: "v0.1",
  overall: 80,
  dimensions: [
    { key: "icp_relevance", score: 4, source: "rubric" },
    { key: "hook_strength", score: 5, source: "rubric" },
    { key: "authority_signal", score: 4, source: "rubric" },
  ],
  predictedStrengths: ["Hook"],
  predictedWeaknesses: [],
  expectedClass: "strong",
  confidence: "moderate",
  ...over,
});

/* ------------------------------- Sufficiency -------------------------------- */

describe("sufficiency", () => {
  it("refuses to diagnose a piece that is still moving", () => {
    const reading = readSufficiency(actual({ maturityDays: 4 }));
    assert.equal(reading.sufficient, false);
    assert.equal(reading.tooEarly, true);
    assert.match(reading.reasons.join(" "), new RegExp(`${MATURITY_DAYS} days`));
  });

  it("refuses to diagnose a piece nobody has seen", () => {
    const reading = readSufficiency(actual({ metrics: metrics({ views: 10 }) }));
    assert.equal(reading.sufficient, false);
    assert.match(reading.reasons.join(" "), /too few/);
  });

  it("distinguishes an unrecorded view count from a low one", () => {
    // null means "we cannot see this"; 0 would mean "measured, and none".
    const unmeasured = readSufficiency(actual({ metrics: metrics({ views: null }) }));
    assert.match(unmeasured.reasons.join(" "), /No view figure has been recorded/);
    assert.equal(unmeasured.tooEarly, false);
  });

  it("refuses when nothing has been captured at all", () => {
    const reading = readSufficiency(actual({ snapshotCount: 0 }));
    assert.equal(reading.sufficient, false);
  });

  it("is satisfied by a mature, measured piece", () => {
    assert.equal(readSufficiency(actual()).sufficient, true);
    assert.ok(MINIMUM_VIEWS_FOR_READING < 1_000);
  });
});

/* ------------------------------ Expected vs actual --------------------------- */

describe("reading the gap", () => {
  it("says insufficient_data rather than guessing, when it is too early", () => {
    const gap = readGap({ expectation: expectation(), actual: actual({ maturityDays: 3 }) });
    assert.equal(gap.failureClass, "insufficient_data");
    assert.equal(gap.preserveThesis, true, "a thesis is never retired on thin evidence");
    assert.equal(gap.confidence, "low");
    assert.match(gap.explanation, /still moving/);
  });

  it("treats reach in front of the wrong audience as a failure", () => {
    // The dashboard-friendly result that Threadline must never celebrate.
    const gap = readGap({
      expectation: expectation(),
      actual: actual({ band: "exceptional", buyerRelevanceObserved: "off_icp" }),
    });
    assert.equal(gap.failureClass, "commercial_relevance");
    assert.equal(gap.preserveThesis, false);
    assert.match(gap.explanation, /wrong room/);
  });

  it("calls a qualified action a success even on modest reach", () => {
    // 400 views and one real enquiry beats 100,000 irrelevant views.
    const gap = readGap({
      expectation: expectation(),
      actual: actual({
        band: "under",
        metrics: metrics({ views: 400, qualifiedActions: 1 }),
        buyerRelevanceObserved: "direct",
      }),
    });
    assert.equal(gap.failureClass, "none");
    assert.equal(gap.preserveThesis, true);
    assert.ok(gap.positives.some((p) => /qualified action/.test(p)));
  });

  it("preserves the thesis when reach was weak but engagement was strong", () => {
    // The most valuable diagnosis available: the idea is fine, the opening lost.
    const gap = readGap({
      expectation: expectation(),
      actual: actual({
        band: "under",
        metrics: metrics({ views: 800, likes: 40, comments: 8, shares: 4, saves: 12 }),
      }),
    });
    assert.equal(gap.failureClass, "hook_packaging");
    assert.equal(gap.preserveThesis, true);
    assert.equal(gap.weakestDimension, "hook_strength");
    assert.match(gap.failedAssumption ?? "", /opening/);
  });

  it("names retention when the platform lets us see it", () => {
    const gap = readGap({
      expectation: expectation(),
      actual: actual({ band: "typical", metrics: metrics({ retentionPct: 12 }) }),
    });
    assert.equal(gap.failureClass, "retention_structure");
    assert.equal(gap.preserveThesis, true);
  });

  it("retires a thesis only when we predicted strongly and nothing landed", () => {
    const gap = readGap({
      expectation: expectation({ expectedClass: "strong" }),
      actual: actual({ band: "under", metrics: metrics({ views: 900, likes: 2, comments: 0, shares: 0, saves: 0 }) }),
    });
    assert.equal(gap.failureClass, "idea_thesis", "genuine underperformance, strongly predicted");
    assert.equal(gap.preserveThesis, false);
  });

  it("never retires a thesis on an ordinary result", () => {
    // Caught by running the engine against real seeded data: a piece landing on
    // its creator's own median was being read as "the thesis did not interest
    // this audience" and prescribed retirement. `typical` is an ordinary
    // result, not a failure, however strongly we predicted otherwise.
    const gap = readGap({
      expectation: expectation({ expectedClass: "strong" }),
      actual: actual({
        band: "typical",
        metrics: metrics({ views: 27_300, likes: 437, comments: 35, shares: 25, saves: 57 }),
      }),
    });
    assert.equal(gap.failureClass, "mixed");
    assert.equal(gap.preserveThesis, true);
    assert.equal(gap.confidence, "low");
    assert.match(gap.explanation, /ordinary result is a weak signal/);
    assert.equal(prescribe(gap), null, "an ordinary result prescribes nothing");
  });

  it("still points at the hook when ordinary reach hides strong engagement", () => {
    const gap = readGap({
      expectation: expectation(),
      actual: actual({
        band: "typical",
        metrics: metrics({ views: 10_000, likes: 500, comments: 60, shares: 40, saves: 120 }),
      }),
    });
    assert.equal(gap.failureClass, "hook_packaging");
    assert.equal(gap.preserveThesis, true);
    assert.match(gap.explanation, /working harder than its distribution/);
  });

  it("will not retire a thesis we never expected much from", () => {
    // Same flat result, but no strong prediction to falsify. "Mixed" is honest.
    const gap = readGap({
      expectation: expectation({ expectedClass: "typical" }),
      actual: actual({ band: "under", metrics: metrics({ views: 900, likes: 2, comments: 0, shares: 0, saves: 0 }) }),
    });
    assert.equal(gap.failureClass, "mixed");
    assert.equal(gap.preserveThesis, true);
    assert.equal(gap.confidence, "low");
  });

  it("works without any expectation at all", () => {
    const gap = readGap({ expectation: null, actual: actual() });
    assert.ok(gap.failureClass);
    assert.equal(gap.strongestDimension, null);
  });

  it("keeps the good news visible even when the headline is bad", () => {
    const gap = readGap({
      expectation: expectation(),
      actual: actual({
        band: "exceptional",
        buyerRelevanceObserved: "off_icp",
        metrics: metrics({ views: 50_000, saves: 900 }),
      }),
    });
    assert.equal(gap.failureClass, "commercial_relevance");
    assert.ok(gap.positives.length > 0, "a bad verdict must not bury real signals");
  });
});

/* ------------------------------- Prescriptions ------------------------------- */

describe("prescriptions", () => {
  it("keeps the thesis and retests two hooks on a packaging failure", () => {
    const gap = readGap({
      expectation: expectation(),
      actual: actual({
        band: "under",
        metrics: metrics({ views: 800, likes: 40, comments: 8, shares: 4, saves: 12 }),
      }),
    });
    const p = prescribe(gap)!;
    assert.equal(p.lever, "hook");
    assert.equal(p.preserveThesis, true);
    assert.equal(p.retestBatchSize, 2);
  });

  it("prescribes nothing when there is nothing to correct", () => {
    const gap = readGap({
      expectation: expectation(),
      actual: actual({ metrics: metrics({ qualifiedActions: 2 }), buyerRelevanceObserved: "direct" }),
    });
    assert.equal(prescribe(gap), null);
  });

  it("prescribes nothing on insufficient evidence", () => {
    const gap = readGap({ expectation: expectation(), actual: actual({ snapshotCount: 0 }) });
    assert.equal(prescribe(gap), null);
  });

  it("keeps every retest small enough to attribute", () => {
    // Six variations at once means the answer belongs to none of them.
    for (const cls of ["hook_packaging", "retention_structure", "cta_conversion", "icp_targeting"] as const) {
      const p = prescribe({
        sufficiency: { sufficient: true, reasons: [], tooEarly: false },
        strongestDimension: null,
        weakestDimension: null,
        failureClass: cls,
        preserveThesis: true,
        confidence: "moderate",
        explanation: "",
        failedAssumption: null,
        positives: [],
      })!;
      assert.ok(p.retestBatchSize <= 2, `${cls} prescribed a batch of ${p.retestBatchSize}`);
    }
  });

  it("stops making content when the thesis is retired", () => {
    const p = prescribe({
      sufficiency: { sufficient: true, reasons: [], tooEarly: false },
      strongestDimension: null,
      weakestDimension: null,
      failureClass: "idea_thesis",
      preserveThesis: false,
      confidence: "moderate",
      explanation: "",
      failedAssumption: null,
      positives: [],
    })!;
    assert.equal(p.retestBatchSize, 0);
    assert.equal(p.preserveThesis, false);
  });
});
