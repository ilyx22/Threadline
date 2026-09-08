import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PHASES,
  phaseForPeriod,
  periodWindow,
  periodWindows,
  readLearning,
  type PeriodRecord,
} from "./learning-velocity";

/**
 * The rules these tests protect:
 *
 *   1. a declining trajectory is reported as declining, in the headline;
 *   2. one period is a baseline, never a trend;
 *   3. corrections without a retest are counted as pending, never as failures;
 *   4. periods are four weeks, never calendar months;
 *   5. period 3 closes the initial engagement, not the relationship.
 */

const period = (n: number, over: Partial<PeriodRecord> = {}): PeriodRecord => ({
  period: n,
  start: new Date(2026, 0, 1 + (n - 1) * 28),
  end: new Date(2026, 0, 28 + (n - 1) * 28),
  meanScore: 4.0,
  published: 14,
  diagnosed: 4,
  corrections: 2,
  correctionsWorked: 1,
  correctionsFailed: 1,
  qualifiedActions: 1,
  ...over,
});

describe("phases", () => {
  it("runs establish, refine, concentrate, then compounds", () => {
    assert.equal(phaseForPeriod(1).key, "establish");
    assert.equal(phaseForPeriod(2).key, "refine");
    assert.equal(phaseForPeriod(3).key, "concentrate");
  });

  it("does not end at period three", () => {
    // Period 3 closes the initial engagement. It is not the end of usefulness,
    // and hard-coding that it were would build a churn assumption into the product.
    assert.equal(phaseForPeriod(4).key, "compound");
    assert.equal(phaseForPeriod(11).key, "compound");
  });

  it("describes what success looks like for every phase", () => {
    for (const phase of PHASES) {
      assert.ok(phase.intent.length > 40, `${phase.key} has no stated intent`);
      assert.ok(phase.successLooksLike.length > 30, `${phase.key} cannot be judged`);
    }
  });

  it("never claims an algorithm needs a fixed learning time", () => {
    const prose = PHASES.map((p) => `${p.intent} ${p.successLooksLike}`).join(" ");
    assert.doesNotMatch(prose, /algorithm/i);
    assert.doesNotMatch(prose, /three months/i);
  });
});

describe("reading the trajectory", () => {
  it("calls one period a baseline, not a trend", () => {
    const reading = readLearning([period(1)]);
    assert.equal(reading.direction, "unknown");
    assert.match(reading.headline, /baseline/i);
  });

  it("reports a decline as a decline, in the headline", () => {
    // 4.8 -> 4.6 -> 4.2 reads as 4.8 -> 4.6 -> 4.2.
    const reading = readLearning([
      period(1, { meanScore: 4.8 }),
      period(2, { meanScore: 4.6 }),
      period(3, { meanScore: 4.2 }),
    ]);
    assert.equal(reading.direction, "declining");
    assert.match(reading.headline, /going down/);
    assert.match(reading.headline, /4\.8 → 4\.6 → 4\.2/);
    assert.equal(reading.scoreDelta, -0.6);
  });

  it("does not soften a decline just because corrections worked", () => {
    const reading = readLearning([
      period(1, { meanScore: 4.8, corrections: 2, correctionsWorked: 2, correctionsFailed: 0 }),
      period(2, { meanScore: 4.0, corrections: 2, correctionsWorked: 2, correctionsFailed: 0 }),
    ]);
    assert.equal(reading.direction, "declining");
    assert.match(reading.reading, /aimed at the wrong thing/);
  });

  it("reports improvement with the correction hit rate attached", () => {
    const reading = readLearning([
      period(1, { meanScore: 3.4 }),
      period(2, { meanScore: 4.1 }),
    ]);
    assert.equal(reading.direction, "improving");
    assert.equal(reading.correctionHitRate, 0.5);
    assert.match(reading.reading, /decisions are getting better/);
  });

  it("treats rounding as flat rather than as progress", () => {
    const reading = readLearning([period(1, { meanScore: 4.0 }), period(2, { meanScore: 4.1 })]);
    assert.equal(reading.direction, "flat");
  });

  it("counts untested corrections as pending, never as failures", () => {
    const reading = readLearning([
      period(1, { meanScore: 4.0, corrections: 5, correctionsWorked: 1, correctionsFailed: 0 }),
      period(2, { meanScore: 4.2, corrections: 3, correctionsWorked: 0, correctionsFailed: 0 }),
    ]);
    assert.equal(reading.correctionsPending, 7);
    assert.equal(reading.correctionHitRate, 1, "only the one with a verdict counts");
    assert.ok(reading.limitations.some((l) => /not been retested/.test(l)));
  });

  it("says plainly when nothing commercial has been traced", () => {
    const reading = readLearning([
      period(1, { meanScore: 4.0, qualifiedActions: 0 }),
      period(2, { meanScore: 4.4, qualifiedActions: 0 }),
    ]);
    assert.ok(reading.limitations.some((l) => /No commercial action/.test(l)));
  });

  it("refuses a direction when too few periods carry scored work", () => {
    const reading = readLearning([period(1, { meanScore: null }), period(2, { meanScore: 4.0 })]);
    assert.equal(reading.direction, "unknown");
    assert.match(reading.headline, /Not enough scored work/);
  });
});

describe("period arithmetic", () => {
  const start = new Date("2026-01-05T00:00:00.000Z");

  it("uses four weeks, never a calendar month", () => {
    assert.equal(periodWindow(start, new Date("2026-02-01T00:00:00.000Z"))!.period, 1);
    // 2 February is a new month and still period two only because 28 days passed.
    assert.equal(periodWindow(start, new Date("2026-02-02T00:00:00.000Z"))!.period, 2);
  });

  it("returns nothing before the engagement began", () => {
    assert.equal(periodWindow(start, new Date("2026-01-04T00:00:00.000Z")), null);
  });

  it("carries the phase with the window", () => {
    assert.equal(periodWindow(start, start)!.phase.key, "establish");
    assert.equal(periodWindow(start, new Date("2026-03-05T00:00:00.000Z"))!.phase.key, "concentrate");
  });

  it("enumerates every period up to a date without gaps", () => {
    const windows = periodWindows(start, new Date("2026-04-01T00:00:00.000Z"));
    assert.equal(windows.length, 4);
    assert.deepEqual(windows.map((w) => w.period), [1, 2, 3, 4]);
    for (let i = 1; i < windows.length; i += 1) {
      assert.equal(
        windows[i].start.getTime() - windows[i - 1].start.getTime(),
        28 * 86_400_000,
        "periods must be exactly four weeks apart",
      );
    }
  });
});
