import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RUN_TRANSITIONS,
  adjustedConfidence,
  assertCandidateHasEvidence,
  assertRunTransition,
  canMoveRun,
  evidenceFingerprint,
  isClientVisible,
  isInternalSource,
  nextRunStatuses,
  testRankScore,
  type RunGateContext,
} from "./intelligence";
import { WorkflowError } from "./workflow";
import { RUN_STATUSES } from "./enums";

/**
 * The rule these tests exist to protect: nothing the system proposes can reach
 * the client or influence strategy until a person has decided on it.
 */

const READY: RunGateContext = {
  totalSources: 3,
  resolvedSources: 3,
  evidenceCount: 12,
  candidateCount: 5,
  pendingCandidates: 0,
  approvedCandidates: 3,
  hasSummary: true,
};

describe("run lifecycle", () => {
  it("moves forward through the defined path", () => {
    assert.equal(canMoveRun("scoping", "collecting"), true);
    assert.equal(canMoveRun("collecting", "synthesis"), true);
    assert.equal(canMoveRun("synthesis", "review"), true);
    assert.equal(canMoveRun("review", "published"), true);
  });

  it("refuses to skip straight to published", () => {
    assert.equal(canMoveRun("scoping", "published"), false);
    assert.equal(canMoveRun("collecting", "published"), false);
    assert.equal(canMoveRun("synthesis", "published"), false);
  });

  it("freezes a published brief", () => {
    assert.deepEqual(nextRunStatuses("published"), ["archived"]);
    assert.equal(canMoveRun("published", "review"), false);
    assert.equal(canMoveRun("published", "collecting"), false);
  });

  it("closes an archived run permanently", () => {
    assert.deepEqual(nextRunStatuses("archived"), []);
  });

  it("declares a transition map for every status", () => {
    for (const status of RUN_STATUSES) {
      assert.ok(RUN_TRANSITIONS[status], `no transitions declared for ${status}`);
    }
  });

  it("only treats a published run as client-visible", () => {
    assert.equal(isClientVisible("published"), true);
    for (const status of RUN_STATUSES.filter((s) => s !== "published")) {
      assert.equal(isClientVisible(status), false, `${status} should not be client visible`);
    }
  });
});

describe("run gates", () => {
  it("will not collect with no declared sources", () => {
    assert.throws(
      () => assertRunTransition("scoping", "collecting", { ...READY, totalSources: 0 }),
      WorkflowError,
    );
  });

  it("will not synthesise with no evidence", () => {
    assert.throws(
      () => assertRunTransition("collecting", "synthesis", { ...READY, evidenceCount: 0 }),
      WorkflowError,
    );
  });

  it("will not synthesise while a source is unresolved", () => {
    assert.throws(
      () =>
        assertRunTransition("collecting", "synthesis", {
          ...READY,
          totalSources: 3,
          resolvedSources: 2,
        }),
      WorkflowError,
    );
  });

  it("will not open review with nothing proposed", () => {
    assert.throws(
      () => assertRunTransition("synthesis", "review", { ...READY, candidateCount: 0 }),
      WorkflowError,
    );
  });

  it("REFUSES TO PUBLISH while any candidate is undecided", () => {
    assert.throws(
      () => assertRunTransition("review", "published", { ...READY, pendingCandidates: 1 }),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /not been decided/i);
        return true;
      },
    );
  });

  it("will not publish without a written summary", () => {
    assert.throws(
      () => assertRunTransition("review", "published", { ...READY, hasSummary: false }),
      WorkflowError,
    );
  });

  it("publishes once every gate is satisfied", () => {
    assert.doesNotThrow(() => assertRunTransition("review", "published", READY));
  });

  it("allows a run with zero approved signals to publish", () => {
    // An empty cycle is a truthful result and must not be blocked.
    assert.doesNotThrow(() =>
      assertRunTransition("review", "published", { ...READY, approvedCandidates: 0 }),
    );
  });

  it("is a no-op when the status does not change", () => {
    assert.doesNotThrow(() =>
      assertRunTransition("scoping", "scoping", { ...READY, totalSources: 0 }),
    );
  });
});

describe("candidate evidence rule", () => {
  it("refuses a candidate with no evidence", () => {
    assert.throws(() => assertCandidateHasEvidence("pain", 0), WorkflowError);
  });

  it("accepts a candidate that cites at least one item", () => {
    assert.doesNotThrow(() => assertCandidateHasEvidence("pain", 1));
  });
});

describe("evidence fingerprinting", () => {
  it("treats the same URL as the same item", () => {
    const a = evidenceFingerprint({ url: "https://example.com/post/1", title: "One" });
    const b = evidenceFingerprint({ url: "https://www.example.com/post/1/", title: "Different" });
    assert.equal(a, b);
  });

  it("ignores tracking parameters", () => {
    const a = evidenceFingerprint({ url: "https://example.com/p?utm_source=x&id=7" });
    const b = evidenceFingerprint({ url: "https://example.com/p?id=7" });
    assert.equal(a, b);
  });

  it("distinguishes genuinely different pages", () => {
    const a = evidenceFingerprint({ url: "https://example.com/post/1" });
    const b = evidenceFingerprint({ url: "https://example.com/post/2" });
    assert.notEqual(a, b);
  });

  it("falls back to normalised text when there is no URL", () => {
    const a = evidenceFingerprint({ title: "Leads are not", body: "the problem!" });
    const b = evidenceFingerprint({ title: "LEADS ARE NOT", body: "  the   problem  " });
    assert.equal(a, b);
  });

  it("produces a stable, bounded key", () => {
    const key = evidenceFingerprint({ title: "x".repeat(5000) });
    assert.equal(key.length, 32);
    assert.match(key, /^[0-9a-f]+$/);
  });
});

describe("source collection modes", () => {
  it("treats only workspace-owned data as internal", () => {
    assert.equal(isInternalSource("performance"), true);
    assert.equal(isInternalSource("pipeline"), true);
    assert.equal(isInternalSource("historic_content"), true);
  });

  it("never claims an automatic path for a third-party platform", () => {
    assert.equal(isInternalSource("competitor"), false);
    assert.equal(isInternalSource("creator"), false);
    assert.equal(isInternalSource("sales_call"), false);
    assert.equal(isInternalSource("customer_language"), false);
  });
});

describe("test ranking", () => {
  it("ranks a confident, high-impact, low-effort test above the reverse", () => {
    const strong = testRankScore({ confidence: 80, impact: 5, effort: 1, evidenceCount: 5 });
    const weak = testRankScore({ confidence: 20, impact: 2, effort: 5, evidenceCount: 1 });
    assert.ok(strong > weak, `${strong} should exceed ${weak}`);
  });

  it("rewards independent evidence, but only up to a bound", () => {
    const base = { confidence: 50, impact: 3, effort: 3 };
    const one = testRankScore({ ...base, evidenceCount: 1 });
    const three = testRankScore({ ...base, evidenceCount: 3 });
    const six = testRankScore({ ...base, evidenceCount: 6 });
    const twenty = testRankScore({ ...base, evidenceCount: 20 });

    assert.ok(three > one);
    assert.equal(six, twenty, "evidence weight must be bounded so volume cannot dominate");
  });

  it("stays finite for degenerate input", () => {
    const score = testRankScore({
      confidence: Number.NaN,
      impact: 0,
      effort: 0,
      evidenceCount: -5,
    });
    assert.ok(Number.isFinite(score));
    assert.ok(score >= 0);
  });
});

describe("confidence feedback", () => {
  it("moves up on a supporting result, and only by a small step", () => {
    const next = adjustedConfidence(50, "supported");
    assert.ok(next > 50);
    assert.ok(next - 50 <= 10, "one result must not settle a signal on its own");
  });

  it("moves down harder on a contradicting result", () => {
    const supported = adjustedConfidence(50, "supported") - 50;
    const contradicted = 50 - adjustedConfidence(50, "contradicted");
    assert.ok(contradicted > supported, "disconfirming evidence should count for more");
  });

  it("never reaches certainty in either direction", () => {
    let high = 50;
    let low = 50;
    for (let i = 0; i < 40; i += 1) {
      high = adjustedConfidence(high, "supported");
      low = adjustedConfidence(low, "contradicted");
    }
    assert.ok(high <= 95, "confidence must never present as certainty");
    assert.ok(low >= 5, "confidence must never present as impossibility");
  });

  it("drifts slightly down on a mixed read", () => {
    assert.ok(adjustedConfidence(60, "mixed") < 60);
  });
});
