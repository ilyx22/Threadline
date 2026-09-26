import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assumedRates,
  dailyTouches,
  EMPTY_COUNTS,
  funnelRates,
  funnelSteps,
  inputFromCounts,
  projectFromRates,
  quota,
  requiredFirstTouches,
  weakestConversion,
  workdaysBetween,
  workdaysRemainingInMonth,
  type FunnelCounts,
  type FunnelInput,
} from "./funnel";

/**
 * The rule these tests protect: this module produces an activity target only
 * when the recorded data can support one, and it never presents an assumption
 * as a measurement.
 */

const measured: FunnelInput = {
  firstTouches: 400,
  callsBooked: 20,
  showRatePct: 80,
  closeRatePct: 25,
  qualifiedRatePct: 50,
};

describe("rates", () => {
  it("derives booking from touches and calls", () => {
    const booking = funnelRates(measured).find((r) => r.key === "booking");
    assert.equal(booking?.value, 0.05);
    assert.equal(booking?.measured, true);
  });

  it("labels the qualified rate an assumption when nothing recorded it", () => {
    const qualified = funnelRates(measured).find((r) => r.key === "qualified");
    assert.equal(qualified?.measured, false);
    assert.match(qualified?.basis ?? "", /not recorded/i);
    assert.match(qualified?.basis ?? "", /assumption/i);
  });

  it("promotes the qualified rate to a measurement once calls are recorded", () => {
    const qualified = funnelRates({
      ...measured,
      qualifiedFromRecords: { showed: 12, qualified: 9 },
    }).find((r) => r.key === "qualified");
    assert.equal(qualified?.measured, true);
    assert.equal(qualified?.value, 0.75);
    assert.match(qualified?.basis ?? "", /9 of 12/);
  });

  it("does not promote it on zero attended calls", () => {
    // The arithmetic would be a division by zero; the honest answer is that
    // there is nothing to measure yet, not that the rate is nought.
    const qualified = funnelRates({
      ...measured,
      qualifiedFromRecords: { showed: 0, qualified: 0 },
    }).find((r) => r.key === "qualified");
    assert.equal(qualified?.measured, false);
  });

  it("marks the recorded rates as measured", () => {
    for (const key of ["booking", "show", "close"] as const) {
      const rate = funnelRates(measured).find((r) => r.key === key);
      assert.equal(rate?.measured, true, `${key} should be measured`);
    }
  });

  it("returns null rather than zero when nothing was touched", () => {
    const booking = funnelRates({ ...measured, firstTouches: 0 }).find((r) => r.key === "booking");
    assert.equal(booking?.value, null);
  });

  it("gives every rate a stated basis a reader can check", () => {
    for (const rate of funnelRates(measured)) {
      assert.ok(rate.basis.length > 10, `${rate.key} needs a basis`);
    }
  });
});

describe("projection", () => {
  it("computes the touches a target implies", () => {
    const result = requiredFirstTouches(2, measured);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    // 0.05 * 0.8 * 0.5 * 0.25 = 0.005 -> 2 / 0.005 = 400.
    // Compared with a tolerance: the conversion is a product of four floats and
    // is rendered as a percentage, so exact binary equality is not the contract.
    assert.ok(Math.abs(result.conversion - 0.005) < 1e-9, `conversion was ${result.conversion}`);
    assert.equal(result.requiredFirstTouches, 400);
  });

  it("rounds up, because a partial first touch is not a thing", () => {
    const result = requiredFirstTouches(3, measured);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.requiredFirstTouches, 600);
  });

  it("REFUSES TO PROJECT when a rate is not yet recorded", () => {
    const result = requiredFirstTouches(2, { ...measured, closeRatePct: 0 });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.match(result.reason, /cannot be projected honestly/i);
    assert.ok(result.missing.some((m) => /close/i.test(m)));
  });

  it("refuses when nothing has been touched at all", () => {
    const result = requiredFirstTouches(2, { ...measured, firstTouches: 0, callsBooked: 0 });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.missing.some((m) => /booking/i.test(m)));
  });

  it("refuses a target of zero or nonsense", () => {
    for (const target of [0, -3, Number.NaN]) {
      const result = requiredFirstTouches(target, measured);
      assert.equal(result.ok, false, `target ${target} should be refused`);
    }
  });

  it("flags that the answer contains an assumption", () => {
    const result = requiredFirstTouches(2, measured);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(
      result.containsAssumption,
      true,
      "qualification is never measured, so every projection is partly assumed",
    );
  });

  it("still returns the rates alongside a refusal, so the gap is visible", () => {
    const result = requiredFirstTouches(2, { ...measured, showRatePct: 0 });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.rates.length, 4);
  });
});

describe("daily pacing", () => {
  it("spreads the requirement across remaining workdays", () => {
    assert.equal(dailyTouches(400, 20), 20);
    assert.equal(dailyTouches(401, 20), 21, "rounds up");
  });

  it("returns null rather than dividing by no time", () => {
    assert.equal(dailyTouches(400, 0), null);
    assert.equal(dailyTouches(0, 20), null);
  });

  it("counts only weekdays", () => {
    // Monday 2026-06-01 through Tuesday 2026-06-30: 22 weekdays.
    assert.equal(workdaysRemainingInMonth(new Date(2026, 5, 1)), 22);
    // From Monday 2026-06-29: Mon and Tue remain.
    assert.equal(workdaysRemainingInMonth(new Date(2026, 5, 29)), 2);
  });
});

describe("channel neutrality", () => {
  it("encodes no channel anywhere in the model", () => {
    const serialised = JSON.stringify(funnelRates(measured)).toLowerCase();
    for (const channel of ["linkedin", "email", "twitter", "instagram", "cold call"]) {
      assert.equal(
        serialised.includes(channel),
        false,
        `the funnel model must not hard-code ${channel} — a channel is an operating choice`,
      );
    }
  });
});

/* ------------------------- The measured funnel ------------------------------ */

const counts: FunnelCounts = {
  firstTouches: 400,
  replies: 60,
  positiveReplies: 24,
  booked: 20,
  showed: 16,
  qualified: 12,
  offers: 10,
  won: 3,
};

describe("counted funnel", () => {
  it("derives every step from the counts", () => {
    const steps = funnelSteps(counts);
    assert.equal(steps.find((s) => s.key === "reply")?.rate, 60 / 400);
    assert.equal(steps.find((s) => s.key === "show")?.rate, 16 / 20);
  });

  it("returns null rather than zero when a denominator is empty", () => {
    const steps = funnelSteps({ ...EMPTY_COUNTS });
    for (const step of steps) {
      assert.equal(step.rate, null, `${step.key} has no denominator, so it has no rate`);
    }
  });

  it("marks thin samples so a rate over three observations is not read as evidence", () => {
    const steps = funnelSteps({ ...counts, offers: 3, won: 1 });
    assert.equal(steps.find((s) => s.key === "close")?.thin, true);
    assert.equal(steps.find((s) => s.key === "reply")?.thin, false);
  });

  it("makes the qualified rate measurable, closing the last assumption", () => {
    const rates = funnelRates(inputFromCounts(counts));
    const qualified = rates.find((r) => r.key === "qualified");
    assert.equal(qualified?.measured, true);
    assert.equal(qualified?.value, 12 / 16);
  });
});

describe("weakest conversion", () => {
  it("says nothing when no step has enough data to read", () => {
    assert.equal(weakestConversion({ ...EMPTY_COUNTS, firstTouches: 4, replies: 1 }), null);
  });

  it("reports the lowest conversion that has a real denominator", () => {
    const weakest = weakestConversion({
      firstTouches: 1000,
      replies: 20,
      positiveReplies: 18,
      booked: 16,
      showed: 15,
      qualified: 14,
      offers: 13,
      won: 6,
    });
    assert.equal(weakest?.key, "reply");
  });

  it("never reports a step it cannot read, even when it is the lowest", () => {
    // Close is 1 in 3 here — numerically the lowest, and meaningless. Pointing
    // an operator at it would send them to change a variable on the strength of
    // three observations.
    const weakest = weakestConversion({
      firstTouches: 200,
      replies: 80,
      positiveReplies: 60,
      booked: 40,
      showed: 30,
      qualified: 20,
      offers: 3,
      won: 1,
    });
    assert.notEqual(weakest?.key, "close");
    assert.equal(weakest?.thin, false);
  });
});

describe("quota", () => {
  it("paces the remaining work across the remaining days", () => {
    const q = quota({ required: 600, completed: 200, completedToday: 5, workdaysRemaining: 40 });
    assert.equal(q.remaining, 400);
    assert.equal(q.perDay, 10);
    assert.equal(q.remainingToday, 5);
  });

  it("never asks for negative work once the target is met", () => {
    const q = quota({ required: 100, completed: 140, completedToday: 12, workdaysRemaining: 10 });
    assert.equal(q.remaining, 0);
    assert.equal(q.remainingToday, 0);
  });

  it("warns instead of demanding an impossible day", () => {
    const q = quota({ required: 4000, completed: 0, completedToday: 0, workdaysRemaining: 20 });
    assert.equal(q.perDay, 200);
    assert.ok(q.warning, "an impossible quota must say so rather than being displayed flatly");
    assert.match(q.warning ?? "", /diagnosis/i);
  });

  it("does not warn at a workable volume", () => {
    const q = quota({ required: 300, completed: 0, completedToday: 0, workdaysRemaining: 30 });
    assert.equal(q.warning, null);
  });

  it("says so when the period has run out with work left", () => {
    const q = quota({ required: 300, completed: 10, completedToday: 0, workdaysRemaining: 0 });
    assert.match(q.warning ?? "", /period is over/i);
  });
});

describe("assumed rates", () => {
  it("labels every planning rate as unmeasured", () => {
    const rates = assumedRates({ booking: 2, show: 75, qualified: 75, close: 15 });
    assert.equal(rates.every((r) => !r.measured), true);
    for (const rate of rates) assert.match(rate.basis, /assumption/i);
  });

  it("projects from them, flagged as containing an assumption", () => {
    const projection = projectFromRates(
      2,
      assumedRates({ booking: 2, show: 75, qualified: 75, close: 15 }),
    );
    assert.equal(projection.ok, true);
    if (projection.ok) {
      // 2 / (0.02 x 0.75 x 0.75 x 0.15) = 1185.18..., rounded up.
      assert.equal(projection.requiredFirstTouches, 1186);
      assert.equal(projection.containsAssumption, true);
    }
  });
});

describe("workdaysBetween", () => {
  it("counts weekdays inclusively", () => {
    // Monday 2026-06-01 to Friday 2026-06-05.
    assert.equal(workdaysBetween(new Date(2026, 5, 1), new Date(2026, 5, 5)), 5);
    // Across a weekend: Fri to Mon is two working days.
    assert.equal(workdaysBetween(new Date(2026, 5, 5), new Date(2026, 5, 8)), 2);
  });

  it("returns zero for a period that has already ended", () => {
    assert.equal(workdaysBetween(new Date(2026, 5, 10), new Date(2026, 5, 1)), 0);
  });
});

describe("refusals read as sentences", () => {
  it("does not start a refusal mid-sentence with a lowercase rate name", () => {
    const projection = requiredFirstTouches(2, {
      firstTouches: 100,
      callsBooked: 4,
      showRatePct: 80,
      closeRatePct: 0,
      qualifiedRatePct: 60,
    });
    assert.equal(projection.ok, false);
    if (!projection.ok) {
      assert.match(projection.reason, /^[A-Z]/);
    }
  });
});

describe("small samples (ATT-04)", () => {
  it("marks a measured rate resting on few observations, and not an assumption", () => {
    const few = funnelRates({ firstTouches: 12, callsBooked: 3, showRatePct: 80, closeRatePct: 30, qualifiedFromRecords: { showed: 4, qualified: 3 } });
    const booking = few.find((r) => r.key === "booking")!;
    const qualified = few.find((r) => r.key === "qualified")!;
    assert.deepEqual([booking.sample, booking.lowSample], [12, true]);
    assert.deepEqual([qualified.sample, qualified.lowSample], [4, true]);
    const many = funnelRates({ firstTouches: 120, callsBooked: 9, showRatePct: 80, closeRatePct: 30, qualifiedFromRecords: { showed: 14, qualified: 9 } });
    assert.equal(many.find((r) => r.key === "booking")!.lowSample, false);
    assert.equal(many.find((r) => r.key === "qualified")!.lowSample, false);
    const assumed = funnelRates({ firstTouches: 120, callsBooked: 9, showRatePct: 80, closeRatePct: 30, qualifiedRatePct: 50 }).find((r) => r.key === "qualified")!;
    assert.equal(assumed.measured, false);
    assert.equal(assumed.lowSample, undefined, "an assumption is labelled as one, not as a sample");
  });
});
