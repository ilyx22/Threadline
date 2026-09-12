import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ACQUISITION_DEFAULTS, acquisitionModel, formatCount, leverage, normaliseInputs, type AcquisitionInputs } from "./acquisition-model";

/**
 * The rule these tests protect: the public model reads the funnel backwards
 * with correct percentage handling, rounds every stage up to a whole number,
 * refuses when a rate is zero, and names the lowest rate as the lever.
 */

const base: AcquisitionInputs = { targetWins: 2, bookingRatePct: 5, showRatePct: 80, qualifiedRatePct: 50, closeRatePct: 25 };

describe("acquisition model", () => {
  it("reads the funnel backwards from wins to first touches", () => {
    const r = acquisitionModel(base);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    const counts = Object.fromEntries(r.stages.map((s) => [s.key, s.count]));
    assert.deepEqual(counts, { wins: 2, qualified: 8, attended: 16, booked: 20, touches: 400 });
    assert.equal(r.requiredTouches, 400);
    assert.ok(Math.abs(r.conversion - 0.005) < 1e-12);
  });

  it("rounds every stage up rather than showing fractional people", () => {
    const r = acquisitionModel({ targetWins: 3, bookingRatePct: 7, showRatePct: 75, qualifiedRatePct: 60, closeRatePct: 35 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    for (const s of r.stages) assert.equal(Number.isInteger(s.count), true, `${s.key} is a whole number`);
    // 3 / 0.35 = 8.57 → 9; 8.57 / 0.6 = 14.29 → 15; 14.29 / 0.75 = 19.05 → 20; touches = ceil(3 / (0.07*0.75*0.6*0.35)) = ceil(272.1) = 273
    const counts = Object.fromEntries(r.stages.map((s) => [s.key, s.count]));
    assert.deepEqual(counts, { wins: 3, qualified: 9, attended: 15, booked: 20, touches: 273 });
  });

  it("does not produce floating-point noise at exact boundaries", () => {
    // 4 / 0.25 = 16 exactly in decimal, 16.000000000000004 in binary if done naively
    const r = acquisitionModel({ targetWins: 4, bookingRatePct: 10, showRatePct: 100, qualifiedRatePct: 100, closeRatePct: 25 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    const counts = Object.fromEntries(r.stages.map((s) => [s.key, s.count]));
    assert.deepEqual(counts, { wins: 4, qualified: 16, attended: 16, booked: 16, touches: 160 });
  });

  it("refuses when a rate is zero instead of dividing by it", () => {
    const r = acquisitionModel({ ...base, closeRatePct: 0 });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.reason, /close rate/i);
  });

  it("refuses a target of zero", () => {
    const r = acquisitionModel({ ...base, targetWins: 0 });
    assert.equal(r.ok, false);
  });

  it("names the lowest rate as the lever, because ten points there is the largest relative move", () => {
    const l = leverage(base);
    assert.ok(l);
    assert.equal(l?.key, "bookingRatePct");
    assert.ok((l?.saved ?? 0) > 0);
    const lowClose = leverage({ ...base, bookingRatePct: 40, closeRatePct: 8 });
    assert.equal(lowClose?.key, "closeRatePct");
  });

  it("clamps inputs to their bounds and falls back to defaults for junk", () => {
    const n = normaliseInputs({ targetWins: 999, bookingRatePct: -3, showRatePct: Number.NaN, closeRatePct: 30 });
    assert.equal(n.targetWins, 50);
    assert.equal(n.bookingRatePct, 0.5);
    assert.equal(n.showRatePct, ACQUISITION_DEFAULTS.showRatePct);
    assert.equal(n.closeRatePct, 30);
  });

  it("more wins never needs fewer touches", () => {
    const a = acquisitionModel({ ...base, targetWins: 2 });
    const b = acquisitionModel({ ...base, targetWins: 5 });
    assert.ok(a.ok && b.ok && b.requiredTouches >= a.requiredTouches);
  });

  it("formats whole numbers only", () => {
    assert.equal(formatCount(1234.4), "1,234");
    assert.equal(formatCount(16), "16");
  });
});
