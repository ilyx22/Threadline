import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planCadence, TOUCH_KEYS, weekdayOf, zonedTime } from "./cadence";
import { daysBetween } from "./calendar";

const byKey = (t: ReturnType<typeof planCadence>) => Object.fromEntries(t.map((x) => [x.key, x]));

describe("relationship cadence plan (communication playbook, 27 Sept 2026)", () => {
  it("plans the ten touches once each, in order, on the Charlie Morgan rhythm by default", () => {
    const plan = planCadence({ startDate: "2026-10-05", timezone: "Europe/London" });
    assert.deepEqual(plan.map((t) => t.key), TOUCH_KEYS);
    const offsets = plan.map((t) => daysBetween("2026-10-05", t.localDate));
    // kickoff, day-2/3, weeks 1-3 weekly, week-4 review, then fortnightly with reviews at 8 and 12.
    assert.deepEqual(offsets, [0, 2, 7, 14, 21, 28, 42, 56, 70, 84]);
    assert.ok(plan.every((t) => t.localTime === "10:00"));
    assert.match(byKey(plan).review3.title, /renewal/i);
  });

  it("uses the agreed weekday and local time in the client's timezone, across a daylight-saving change", () => {
    // New York client, Tuesday 14:00; US clocks go back on 1 Nov 2026.
    const plan = byKey(planCadence({ startDate: "2026-10-22", timezone: "America/New_York", checkInWeekday: 2, checkInTime: "14:00" }));
    for (const k of ["w1", "w2", "w3", "review1", "w6", "review2", "w10", "review3"] as const) {
      assert.equal(weekdayOf(plan[k].localDate), 2, `${k} on a Tuesday`);
      const local = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(plan[k].dueAt);
      assert.equal(local, "14:00", `${k} at 14:00 New York time`);
    }
    assert.equal(plan.w1.dueAt.toISOString(), "2026-10-27T18:00:00.000Z", "EDT before the change");
    assert.equal(plan.w2.dueAt.toISOString(), "2026-11-03T19:00:00.000Z", "EST after the change");
    // Each call sits inside its own week of the clock.
    assert.ok(daysBetween("2026-10-22", plan.w1.localDate) >= 1 && daysBetween("2026-10-22", plan.w1.localDate) <= 7);
  });

  it("keeps an explicit kickoff instant, and pushes the rest by paused days", () => {
    const kickoffAt = new Date("2026-10-06T09:30:00Z");
    const base = byKey(planCadence({ startDate: "2026-10-05", timezone: "Europe/London", kickoffAt }));
    const paused = byKey(planCadence({ startDate: "2026-10-05", timezone: "Europe/London", kickoffAt, offsetDays: 10 }));
    assert.equal(base.kickoff.dueAt.toISOString(), kickoffAt.toISOString());
    assert.equal(paused.kickoff.dueAt.toISOString(), kickoffAt.toISOString(), "an agreed kickoff is not moved by a later pause");
    assert.equal(daysBetween(base.w6.localDate, paused.w6.localDate), 10);
  });

  it("refuses an invalid slot and converts wall-clock time correctly", () => {
    assert.throws(() => planCadence({ startDate: "2026-10-05", timezone: "Europe/London", checkInTime: "25:00" }));
    assert.throws(() => planCadence({ startDate: "2026-10-05", timezone: "Europe/London", checkInWeekday: 7 }));
    assert.equal(zonedTime("2026-07-01", "10:00", "Europe/London").toISOString(), "2026-07-01T09:00:00.000Z");
    assert.equal(zonedTime("2026-12-01", "10:00", "Europe/London").toISOString(), "2026-12-01T10:00:00.000Z");
  });
});
