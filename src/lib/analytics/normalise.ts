/**
 * Provider payload → normalised metrics with an explicit state per field.
 *
 * The five states are the whole point. A platform that does not expose saves
 * is `unsupported`; one that exposes them but returned nothing for this post
 * is `unavailable`; a reading older than the freshness window is `stale`; a
 * field we have not asked for yet is `unknown`; and `0` is a real zero. Only a
 * real number ever becomes a number in a snapshot — every other state is
 * recorded beside it, never as 0.
 */

export const METRIC_KEYS = ["views", "impressions", "reach", "likes", "comments", "shares", "saves", "watchTimeSec", "avgViewSec", "retentionPct", "ctrPct"] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export type FieldState = "value" | "unknown" | "unavailable" | "unsupported" | "stale";

export type NormalisedMetrics = {
  values: Partial<Record<MetricKey, number>>;
  states: Record<MetricKey, FieldState>;
  /** Provider's own timestamp for the reading, when given. */
  measuredAt: Date | null;
  /** The provider's record id for the post/video, used to de-duplicate ingestion. */
  providerRecordId: string | null;
};

/** What each provider can supply at all, per its documented public API surface. */
export const PROVIDER_SUPPORT: Record<string, MetricKey[]> = {
  youtube: ["views", "likes", "comments", "shares", "watchTimeSec", "avgViewSec", "retentionPct", "ctrPct", "impressions"],
  linkedin: ["impressions", "likes", "comments", "shares", "ctrPct"],
  instagram: ["views", "reach", "likes", "comments", "shares", "saves", "impressions"],
  tiktok: ["views", "likes", "comments", "shares", "watchTimeSec", "avgViewSec", "retentionPct"],
  x: ["impressions", "likes", "comments", "shares"],
  threads: ["views", "likes", "comments", "shares"],
};

export const FRESHNESS_MS = 36 * 60 * 60_000;

export function normalise(input: { provider: string; raw: Partial<Record<MetricKey, number | null | undefined>>; measuredAt?: Date | null; providerRecordId?: string | null; now?: Date }): NormalisedMetrics {
  const supported = new Set(PROVIDER_SUPPORT[input.provider] ?? []);
  const now = input.now ?? new Date();
  const stale = !!input.measuredAt && now.getTime() - input.measuredAt.getTime() > FRESHNESS_MS;
  const values: Partial<Record<MetricKey, number>> = {};
  const states = {} as Record<MetricKey, FieldState>;
  for (const key of METRIC_KEYS) {
    if (!supported.has(key)) {
      states[key] = "unsupported";
      continue;
    }
    const v = input.raw[key];
    if (v === undefined) states[key] = "unknown";
    else if (v === null || Number.isNaN(v)) states[key] = "unavailable";
    else if (stale) {
      states[key] = "stale";
      values[key] = v; // kept, but flagged; a stale value is still evidence of a lower bound
    } else {
      states[key] = "value";
      values[key] = v;
    }
  }
  return { values, states, measuredAt: input.measuredAt ?? null, providerRecordId: input.providerRecordId ?? null };
}

/** Keys that could not be supplied, for the snapshot's `unavailable` column. */
export function unavailableKeys(n: NormalisedMetrics): MetricKey[] {
  return METRIC_KEYS.filter((k) => n.states[k] !== "value" && n.states[k] !== "stale");
}
