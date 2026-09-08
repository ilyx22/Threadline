import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CALIBRATION_MINIMUM,
  calibrationReading,
  GATING_CRITERIA,
  GATING_FLOOR,
  judgeVerdict,
  PASS_AT,
  REVISE_BELOW,
  RUBRIC,
  RUBRIC_TOTAL_WEIGHT,
  RUBRIC_VERSION,
  UNCALIBRATED_DISCLAIMER,
  type CriterionScore,
} from "./judge";

/**
 * The rules these tests protect:
 *
 *   1. the Judge's overall verdict is arithmetic we own, not a number the model
 *      picked;
 *   2. a gating failure rejects regardless of the total;
 *   3. every verdict says it is uncalibrated, and nothing can promote it;
 *   4. calibration refuses to conclude anything from a sample that cannot
 *      support a conclusion — including a set with no ordinary content in it.
 *
 * The corpus and outlier rules live in `corpus.test.ts`.
 */

describe("the rubric", () => {
  it("has weights that sum to 100", () => {
    assert.equal(RUBRIC_TOTAL_WEIGHT, 100);
  });

  it("justifies every criterion", () => {
    for (const c of RUBRIC) {
      assert.ok(c.question.endsWith("?"), `${c.key} should be asked as a question`);
      assert.ok(c.why.length > 30, `${c.key} has no stated reason to exist`);
    }
  });

  it("gates on the things that cannot be traded away", () => {
    assert.deepEqual(GATING_CRITERIA.sort(), ["authority", "evidence", "icp_relevance"]);
  });
});

/** Every criterion at the same score. */
const flat = (score: number): CriterionScore[] =>
  RUBRIC.map((c) => ({ key: c.key, score, reason: "test" }));

describe("verdicts", () => {
  it("computes the overall itself rather than trusting the model", () => {
    assert.equal(judgeVerdict(flat(5)).overall, 100);
    assert.equal(judgeVerdict(flat(0)).overall, 0);
    assert.equal(judgeVerdict(flat(4)).overall, 80);
  });

  it("passes a strong piece", () => {
    const result = judgeVerdict(flat(5));
    assert.equal(result.verdict, "pass");
    assert.ok(result.overall >= PASS_AT);
  });

  it("rejects on a gating failure however good the rest is", () => {
    // A piece that scores brilliantly everywhere and cannot be evidenced is not
    // a good piece with one flaw; it is a liability with good pacing.
    const scores = flat(5).map((s) =>
      s.key === "evidence" ? { ...s, score: GATING_FLOOR, reason: "Two unsupported claims" } : s,
    );
    const result = judgeVerdict(scores);
    assert.equal(result.verdict, "reject");
    assert.ok(result.overall > PASS_AT, "the total was still high, which is the point");
    assert.match(result.concerns[0], /Evidence/);
  });

  it("asks for a revision in the middle band", () => {
    // Solid but not strong: mostly fours with the heavier criteria at three.
    // No gate is breached, so the verdict has to come from the total alone.
    const mixed = flat(4).map((s) =>
      ["icp_relevance", "authority", "originality", "buyer_problem"].includes(s.key)
        ? { ...s, score: 3 }
        : s,
    );
    const result = judgeVerdict(mixed);
    assert.ok(
      result.overall >= REVISE_BELOW && result.overall < PASS_AT,
      `overall was ${result.overall}`,
    );
    assert.equal(result.verdict, "revise");
  });

  it("rejects a piece that is simply weak everywhere", () => {
    // Threes across the board is 60, below the revise floor. A piece with
    // nothing wrong and nothing right is not a revision, it is a restart.
    assert.equal(judgeVerdict(flat(3)).verdict, "reject");
  });

  it("says so when criteria were not scored", () => {
    const partial = flat(5).slice(0, 4);
    const result = judgeVerdict(partial);
    assert.ok(result.concerns.some((c) => /not scored/i.test(c)));
  });

  it("marks every verdict uncalibrated, with the reason attached", () => {
    for (const score of [0, 3, 5]) {
      const result = judgeVerdict(flat(score));
      assert.equal(result.calibrated, false);
      assert.equal(result.disclaimer, UNCALIBRATED_DISCLAIMER);
      assert.match(result.disclaimer, /structured opinion rather than evidence/i);
    }
  });

  it("records the rubric version, so old scores are not compared to new ones", () => {
    assert.equal(judgeVerdict(flat(4)).rubricVersion, RUBRIC_VERSION);
  });
});

describe("calibration", () => {
  const pair = (id: string, band: "strong" | "typical" | "unknown" | "under", overall: number) => ({
    exampleId: id,
    band,
    overall,
  });

  it("refuses to conclude anything from too few pairs", () => {
    const reading = calibrationReading([pair("a", "strong", 90), pair("b", "typical", 40)]);
    assert.equal(reading.sufficient, false);
    assert.match(reading.reading, new RegExp(`of ${CALIBRATION_MINIMUM}`));
  });

  it("ignores examples with no known outcome", () => {
    const reading = calibrationReading([pair("a", "unknown", 90), pair("b", "unknown", 20)]);
    assert.equal(reading.pairs, 0);
    assert.match(reading.reading, /nothing to calibrate/i);
  });

  it("refuses a set with no ordinary content in it", () => {
    // A corpus of nothing but hits cannot show whether the Judge can tell the
    // difference — it can only show that it likes things.
    const allWinners = Array.from({ length: 40 }, (_, i) => pair(`w${i}`, "strong", 85));
    const reading = calibrationReading(allWinners);
    assert.equal(reading.sufficient, false);
    assert.match(reading.reading, /no ordinary content/i);
  });

  it("says plainly when the Judge is not tracking reality", () => {
    const pairs = [
      ...Array.from({ length: 20 }, (_, i) => pair(`w${i}`, "strong", 40)),
      ...Array.from({ length: 20 }, (_, i) => pair(`t${i}`, "typical", 80)),
    ];
    const reading = calibrationReading(pairs);
    assert.ok((reading.separation ?? 0) < 0);
    assert.match(reading.reading, /not measuring what it claims/i);
  });

  it("reports a real separation without calling it calibrated", () => {
    const pairs = [
      ...Array.from({ length: 20 }, (_, i) => pair(`w${i}`, "strong", 85)),
      ...Array.from({ length: 20 }, (_, i) => pair(`t${i}`, "typical", 55)),
    ];
    const reading = calibrationReading(pairs);
    assert.equal(reading.separation, 30);
    assert.equal(reading.sufficient, true);
    // "Calibrated" is a claim about client outcomes and the corpus cannot make
    // it, however good the separation looks.
    assert.equal(reading.calibrated, false);
    assert.match(reading.reading, /still not calibrated/i);
  });

  it("surfaces the outperformers the Judge scored lowest", () => {
    const pairs = [
      pair("miss", "exceptional" as "strong", 20),
      ...Array.from({ length: 20 }, (_, i) => pair(`w${i}`, "strong", 85)),
      ...Array.from({ length: 20 }, (_, i) => pair(`t${i}`, "typical", 55)),
    ];
    const reading = calibrationReading(pairs);
    assert.equal(reading.worstMisses[0].exampleId, "miss");
  });
});
