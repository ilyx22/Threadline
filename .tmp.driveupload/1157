/**
 * Date helpers. Weeks start Monday (UK operating convention).
 * All functions are pure and timezone-naive on the server's local time, which is
 * sufficient because scheduling granularity in v1 is a calendar day.
 */

export const DAY_MS = 86_400_000;

export function startOfDay(d: Date | string) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(d: Date | string) {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

/** Monday 00:00 of the week containing `d`. */
export function startOfWeek(d: Date | string) {
  const date = startOfDay(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  return date;
}

export function endOfWeek(d: Date | string) {
  const start = startOfWeek(d);
  return endOfDay(addDays(start, 6));
}

export function startOfMonth(d: Date | string) {
  const date = startOfDay(d);
  date.setDate(1);
  return date;
}

export function addDays(d: Date | string, days: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function addWeeks(d: Date | string, weeks: number) {
  return addDays(d, weeks * 7);
}

export function daysBetween(a: Date | string, b: Date | string) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export function hoursBetween(a: Date | string, b: Date | string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
}

export function isSameDay(a: Date | string, b: Date | string) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isToday(d: Date | string) {
  return isSameDay(d, new Date());
}

export function isPast(d: Date | string) {
  return new Date(d).getTime() < Date.now();
}

export function isOverdue(d: Date | string | null | undefined) {
  if (!d) return false;
  return endOfDay(d).getTime() < Date.now();
}

export function isThisWeek(d: Date | string) {
  const now = new Date();
  const t = new Date(d).getTime();
  return t >= startOfWeek(now).getTime() && t <= endOfWeek(now).getTime();
}

// --- Formatting -----------------------------------------------------------

export function formatDate(d: Date | string, style: "short" | "medium" | "long" = "medium") {
  const date = new Date(d);
  if (style === "short") {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  if (style === "long") {
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(d: Date | string) {
  return `${formatDate(d, "short")}, ${formatTime(d)}`;
}

export function formatWeekRange(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth();
  const left = s.toLocaleDateString("en-GB", { day: "numeric", ...(sameMonth ? {} : { month: "short" }) });
  const right = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return `${left} – ${right}`;
}

/** "in 3 days" / "2 hours ago" / "just now" */
export function relativeTime(d: Date | string) {
  const diffMs = new Date(d).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

  if (abs < 45_000) return "just now";
  if (abs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  if (abs < 7 * DAY_MS) return rtf.format(Math.round(diffMs / DAY_MS), "day");
  if (abs < 30 * DAY_MS) return rtf.format(Math.round(diffMs / (7 * DAY_MS)), "week");
  return formatDate(d, "medium");
}

/** Compact due-date label used across queues and boards. */
export function dueLabel(d: Date | string | null | undefined) {
  if (!d) return "No date";
  const days = daysBetween(new Date(), d);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days <= 6) return new Date(d).toLocaleDateString("en-GB", { weekday: "long" });
  return formatDate(d, "short");
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** ISO date (yyyy-mm-dd) for date inputs, without timezone shifting. */
export function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/** Calendar grid (Monday-first) covering the month containing `d`. */
export function monthGrid(d: Date | string) {
  const first = startOfMonth(d);
  const gridStart = startOfWeek(first);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));
  return cells;
}
