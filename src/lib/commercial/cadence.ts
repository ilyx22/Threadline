import { addDays, type IsoDate } from "./calendar";

/**
 * The relationship cadence (client communication and CRM playbook, 27 Sept
 * 2026; Charlie Morgan / Imperium Client Success Manager Masterclass: weekly
 * calls in month one, fortnightly after, reviews in place of the call).
 *
 * Pure: given the engagement clock it returns every planned touch with its due
 * instant. Week k covers days 7(k-1)+1 .. 7k after the active service start,
 * so the week-4 review falls on the period-1 boundary (day 28 by default).
 * Calls land on the agreed weekday inside their week at the agreed local time
 * in the client's timezone; without an agreed slot they fall on the start
 * date's weekday at 10:00 (days 7, 14, 21, 28 ...). Pauses push the whole
 * cadence by `offsetDays`.
 */
export type TouchKey = "kickoff" | "day3" | "w1" | "w2" | "w3" | "review1" | "w6" | "review2" | "w10" | "review3";
export type PlannedTouch = { key: TouchKey; title: string; localDate: IsoDate; localTime: string; dueAt: Date };
export type CadenceInput = {
  startDate: IsoDate;
  timezone: string;
  kickoffAt?: Date | null;
  checkInWeekday?: number | null; // 0 Sunday .. 6 Saturday
  checkInTime?: string | null; // "HH:MM"
  offsetDays?: number;
};

const WEEKS: { key: TouchKey; week: number; title: string }[] = [
  { key: "w1", week: 1, title: "Week-1 check-in call (15–20 min)" },
  { key: "w2", week: 2, title: "Week-2 check-in call (15–20 min)" },
  { key: "w3", week: 3, title: "Week-3 check-in call (15–20 min)" },
  { key: "review1", week: 4, title: "Week-4 review: period 1 (Action → Results → Problems → Future)" },
  { key: "w6", week: 6, title: "Week-6 check-in call" },
  { key: "review2", week: 8, title: "Week-8 review: period 2" },
  { key: "w10", week: 10, title: "Week-10 check-in call" },
  { key: "review3", week: 12, title: "Week-12 review and renewal decision" },
];

export const TOUCH_KEYS: TouchKey[] = ["kickoff", "day3", ...WEEKS.map((w) => w.key)];

export const weekdayOf = (d: IsoDate) => new Date(`${d}T12:00:00Z`).getUTCDay();

/** Minutes the zone is ahead of UTC at `instant`. */
function offsetMinutes(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(instant);
  const n = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour") % 24, n("minute"));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** The instant a wall-clock time in `timeZone` happens (DST-safe; a skipped hour resolves forward). */
export function zonedTime(date: IsoDate, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - offsetMinutes(new Date(guess), timeZone) * 60_000;
  utc = guess - offsetMinutes(new Date(utc), timeZone) * 60_000;
  return new Date(utc);
}

/** The first date on/after `from` with the given weekday. */
function onOrAfter(from: IsoDate, weekday: number) {
  return addDays(from, (weekday - weekdayOf(from) + 7) % 7);
}

export function validSlot(weekday: number | null | undefined, time: string | null | undefined) {
  const w = weekday === null || weekday === undefined || (Number.isInteger(weekday) && weekday >= 0 && weekday <= 6);
  const t = !time || /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  return w && t;
}

export function planCadence(input: CadenceInput): PlannedTouch[] {
  if (!validSlot(input.checkInWeekday, input.checkInTime)) throw new Error("Invalid check-in slot.");
  const start = addDays(input.startDate, input.offsetDays ?? 0);
  const time = input.checkInTime || "10:00";
  const weekday = input.checkInWeekday ?? weekdayOf(start);
  const at = (localDate: IsoDate, key: TouchKey, title: string): PlannedTouch => ({ key, title, localDate, localTime: time, dueAt: zonedTime(localDate, time, input.timezone) });

  const touches: PlannedTouch[] = [];
  if (input.kickoffAt) {
    const local = new Intl.DateTimeFormat("en-CA", { timeZone: input.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(input.kickoffAt);
    const [date, clock] = local.split(", ");
    touches.push({ key: "kickoff", title: "Kickoff / Brand Brain session (60–90 min)", localDate: date, localTime: clock, dueAt: input.kickoffAt });
  } else {
    touches.push(at(start, "kickoff", "Kickoff / Brand Brain session (60–90 min): confirm the booked time"));
  }
  touches.push(at(addDays(start, 2), "day3", "Day-2/3 personal check-in: progress, obstacle, next delivery, one specific question"));
  for (const w of WEEKS) touches.push(at(onOrAfter(addDays(start, 7 * (w.week - 1) + 1), weekday), w.key, w.title));
  return touches;
}
