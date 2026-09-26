import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, periodNumberOn, periodStatus, planPeriods, todayIn } from "./calendar";

describe("engagement calendar (ENG-06)", () => {
  it("plans three 28-day periods as calendar dates", () => {
    assert.deepEqual(planPeriods("2026-03-16", 3), [
      { number: 1, startDate: "2026-03-16", endDate: "2026-04-13" },
      { number: 2, startDate: "2026-04-13", endDate: "2026-05-11" },
      { number: 3, startDate: "2026-05-11", endDate: "2026-06-08" },
    ]);
  });
  it("is unmoved by daylight saving (UK clocks change 29 March and 25 October 2026)", () => {
    assert.equal(addDays("2026-03-28", 1), "2026-03-29");
    assert.equal(addDays("2026-03-28", 2), "2026-03-30");
    assert.equal(addDays("2026-10-24", 28), "2026-11-21");
    // the same wall-clock instant maps to the right local date either side of the change
    assert.equal(todayIn("Europe/London", new Date("2026-03-29T00:30:00Z")), "2026-03-29");
    assert.equal(todayIn("Europe/London", new Date("2026-06-30T23:30:00Z")), "2026-07-01");
    assert.equal(todayIn("America/New_York", new Date("2026-06-30T23:30:00Z")), "2026-06-30");
  });
  it("counts periods and statuses from local dates, including leap years and year ends", () => {
    assert.equal(periodNumberOn("2026-12-20", "2026-12-19"), null);
    assert.equal(periodNumberOn("2026-12-20", "2027-01-16"), 1);
    assert.equal(periodNumberOn("2026-12-20", "2027-01-17"), 2);
    assert.equal(addDays("2028-02-28", 1), "2028-02-29");
    const p = { startDate: "2026-04-13", endDate: "2026-05-11" };
    assert.equal(periodStatus(p, "2026-04-12"), "upcoming");
    assert.equal(periodStatus(p, "2026-04-13"), "current");
    assert.equal(periodStatus(p, "2026-05-10"), "current");
    assert.equal(periodStatus(p, "2026-05-11"), "complete");
  });
});
