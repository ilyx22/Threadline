/**
 * Engagement calendar arithmetic (ENG-01, ENG-06).
 *
 * Service periods are CALENDAR DATES in the workspace's timezone, not instants:
 * a period that starts on 30 March in London starts on 30 March whatever the
 * clocks do that weekend. So every calculation here works on plain
 * "YYYY-MM-DD" dates with UTC-noon-free integer day arithmetic, which daylight
 * saving cannot move, and converts "now" into the workspace's local date once,
 * with the platform's timezone database.
 */
export type IsoDate = string; // YYYY-MM-DD

const DAY_MS = 86_400_000;
const toDays = (d: IsoDate) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`not a calendar date: ${d}`);
  const [y, m, day] = d.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, day) / DAY_MS);
};
const fromDays = (n: number): IsoDate => new Date(n * DAY_MS).toISOString().slice(0, 10);

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromDays(toDays(date) + days);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return toDays(to) - toDays(from);
}

/** The calendar date it is now in `timeZone`. */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** A Postgres DATE column comes back as a Date at UTC midnight. */
export const isoFromDbDate = (d: Date): IsoDate => d.toISOString().slice(0, 10);
export const dbDateFromIso = (d: IsoDate): Date => new Date(`${d}T00:00:00.000Z`);

export type PeriodPlan = { number: number; startDate: IsoDate; endDate: IsoDate };

/** Periods 1..count from `start`, each `periodDays` long; `endDate` is exclusive. */
export function planPeriods(start: IsoDate, count: number, periodDays = 28, firstNumber = 1): PeriodPlan[] {
  return Array.from({ length: count }, (_, i) => {
    const n = firstNumber + i;
    const s = addDays(start, (n - 1) * periodDays);
    return { number: n, startDate: s, endDate: addDays(s, periodDays) };
  });
}

/** Which period number contains `date` (1-based), or null before the start. */
export function periodNumberOn(start: IsoDate, date: IsoDate, periodDays = 28): number | null {
  const d = daysBetween(start, date);
  return d < 0 ? null : Math.floor(d / periodDays) + 1;
}

export function periodStatus(p: { startDate: IsoDate; endDate: IsoDate }, today: IsoDate): "upcoming" | "current" | "complete" {
  if (daysBetween(today, p.startDate) > 0) return "upcoming";
  if (daysBetween(today, p.endDate) <= 0) return "complete";
  return "current";
}
