/**
 * The storage budget arithmetic, kept pure so it can be tested without a
 * database. Prices are Cloudflare R2 Standard as published in September 2026:
 * the first 10 GB-month is free, then $0.015 per GB-month; egress is free.
 * Operation charges (uploads and downloads) are not modelled: only signed-in
 * people upload, and the free allowance (1M writes, 10M reads a month) is
 * orders of magnitude beyond a founder-run service.
 */
export const GB = 1024 ** 3;
export const R2_FREE_GB = 10;
export const R2_USD_PER_GB_MONTH = 0.015;
/** Headroom so rounding, exchange-rate moves and in-flight uploads never tip past the budget. */
export const SAFETY = 0.9;

export type StorageBudget = { budgetGbp: number; usdPerGbp: number; capBytes: number };
export type Threshold = { key: string; atBytes: number; title: string; severity: "info" | "warning" | "critical" };

type Env = Record<string, string | undefined>;
const positive = (raw: string | undefined, fallback: number) => {
  const n = Number((raw ?? "").trim());
  return (raw ?? "").trim() && Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * STORAGE_BUDGET_GBP (default 50) is the most the owner will pay R2 in a month.
 * STORAGE_USD_PER_GBP (default 1.20, deliberately below the market rate) turns
 * it into dollars; a lower rate means a smaller, safer cap.
 */
export function budgetFromEnv(env: Env = process.env): StorageBudget {
  const budgetGbp = positive(env.STORAGE_BUDGET_GBP, 50);
  const usdPerGbp = positive(env.STORAGE_USD_PER_GBP, 1.2);
  const billableGb = (budgetGbp * usdPerGbp) / R2_USD_PER_GB_MONTH;
  return { budgetGbp, usdPerGbp, capBytes: Math.floor((R2_FREE_GB + billableGb) * GB * SAFETY) };
}

/** Estimated monthly R2 storage charge in pounds for this many stored bytes. */
export function estimateMonthlyGbp(bytes: number, budget: StorageBudget) {
  const billableGb = Math.max(0, bytes / GB - R2_FREE_GB);
  return (billableGb * R2_USD_PER_GB_MONTH) / budget.usdPerGbp;
}

export function thresholds(budget: StorageBudget): Threshold[] {
  return [
    { key: "free-80", atBytes: R2_FREE_GB * 0.8 * GB, title: "Storage is at 80% of R2's free 10 GB", severity: "info" },
    { key: "free-100", atBytes: R2_FREE_GB * GB, title: "Storage has passed R2's free 10 GB: charges have started", severity: "warning" },
    { key: "budget-50", atBytes: budget.capBytes * 0.5, title: `Storage has reached half of the £${budget.budgetGbp} monthly cap`, severity: "warning" },
    { key: "budget-90", atBytes: budget.capBytes * 0.9, title: `Storage is at 90% of the £${budget.budgetGbp} monthly cap: uploads stop soon`, severity: "critical" },
  ];
}

/** Every threshold the current usage is at or past. */
export function crossedThresholds(usedBytes: number, budget: StorageBudget) {
  return thresholds(budget).filter((t) => usedBytes >= t.atBytes);
}

export function formatGb(bytes: number) {
  return `${(bytes / GB).toFixed(bytes < 10 * GB ? 2 : 0)} GB`;
}
