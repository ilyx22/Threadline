/**
 * Presentation formatting. All money is stored in minor units (see docs/DATA_MODEL.md).
 */

const CURRENCY_SYMBOL: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export function currencySymbol(currency = "GBP") {
  return CURRENCY_SYMBOL[currency] ?? currency + " ";
}

/** Format minor units (pence) as a currency string. */
export function money(minor: number, currency = "GBP", opts: { compact?: boolean } = {}) {
  const major = minor / 100;
  if (opts.compact && Math.abs(major) >= 1000) {
    return currencySymbol(currency) + compactNumber(major);
  }
  return (
    currencySymbol(currency) +
    major.toLocaleString("en-GB", {
      minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

/** 1234 -> "1.2K", 1250000 -> "1.25M" */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return trimZero(value / 1_000_000_000) + "B";
  if (abs >= 1_000_000) return trimZero(value / 1_000_000) + "M";
  if (abs >= 1_000) return trimZero(value / 1_000) + "K";
  return String(Math.round(value));
}

function trimZero(n: number) {
  const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(rounded);
}

export function number(value: number) {
  return value.toLocaleString("en-GB");
}

export function percent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

/** Signed delta for period-over-period comparisons. */
export function delta(value: number, digits = 0) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** Seconds -> "1:24" or "12s" */
export function duration(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Minutes -> "1h 20m" */
export function minutes(mins: number) {
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function hours(value: number) {
  return `${value.toFixed(1)}h`;
}

export function bytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Convert snake_case / kebab-case identifiers into a readable label. */
export function humanise(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bCta\b/g, "CTA")
    .replace(/\bIcp\b/g, "ICP")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bQa\b/g, "QA")
    .replace(/\bRoi\b/g, "ROI")
    .replace(/\bUrl\b/g, "URL")
    .replace(/\bVsl\b/g, "VSL")
    .replace(/\bYoutube\b/g, "YouTube")
    .replace(/\bLinkedin\b/g, "LinkedIn")
    .replace(/\bTiktok\b/g, "TikTok");
}

export function pluralise(count: number, singular: string, plural = singular + "s") {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Words -> approximate spoken seconds at ~145 wpm (conversational to-camera pace). */
export function estimateSpokenSeconds(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(5, Math.round((words / 145) * 60));
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
