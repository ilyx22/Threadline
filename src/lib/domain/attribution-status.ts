/**
 * Rev-share-ready attribution state (v1.5 data, no billing).
 *
 * A commercial event may be *eligible* for a future performance-pricing
 * arrangement only when the client and Threadline have explicitly agreed the
 * pool. Eligibility never rises on its own, status moves only along the
 * transitions below, every move is recorded, and the pool is always
 * "explicitly agreed attributed revenue / cash collected" — never all client
 * revenue during the engagement.
 */

export const ATTRIBUTION_ELIGIBILITY = ["ineligible", "eligible", "agreed"] as const;
export type AttributionEligibility = (typeof ATTRIBUTION_ELIGIBILITY)[number];

export const ATTRIBUTION_STATUSES = ["pending", "confirmed", "disputed", "excluded"] as const;
export type AttributionStatus = (typeof ATTRIBUTION_STATUSES)[number];

export const STATUS_TRANSITIONS: Record<AttributionStatus, AttributionStatus[]> = {
  pending: ["confirmed", "disputed", "excluded"],
  confirmed: ["disputed", "excluded"],
  disputed: ["confirmed", "excluded"],
  excluded: [], // an exclusion is final; record a new event if the facts change
};

export class AttributionStatusError extends Error {}

export function assertStatusTransition(from: AttributionStatus, to: AttributionStatus, reason?: string | null) {
  if (!STATUS_TRANSITIONS[from].includes(to)) throw new AttributionStatusError(`An attribution cannot move from "${from}" to "${to}".`);
  if ((to === "disputed" || to === "excluded") && !reason?.trim()) throw new AttributionStatusError(`Say why it is ${to}. A ${to} claim with no reason cannot be revisited.`);
}

/** Evidence classes strong enough to be *eligible* at all. Weak evidence never becomes eligible by arithmetic. */
export const ELIGIBLE_EVIDENCE = new Set(["directly_tracked", "buyer_named"]);

export function eligibilityFor(input: { evidence: string; agreed: boolean }): AttributionEligibility {
  if (!ELIGIBLE_EVIDENCE.has(input.evidence)) return "ineligible";
  return input.agreed ? "agreed" : "eligible";
}

export type PoolEvent = {
  status: AttributionStatus;
  eligibility: AttributionEligibility;
  cashCollectedMinor: number | null;
  attributableRevenueMinor: number | null;
  attributablePercentage: number | null;
};

/**
 * The pool a future performance fee would be computed on. Only confirmed,
 * agreed events with cash actually collected count; the attributable share
 * is applied per event and defaults to 100% of the agreed amount, never more.
 */
export function revSharePool(events: PoolEvent[]) {
  let poolMinor = 0;
  let counted = 0;
  const excludedReasons: string[] = [];
  for (const e of events) {
    if (e.status !== "confirmed") { excludedReasons.push(`status ${e.status}`); continue; }
    if (e.eligibility !== "agreed") { excludedReasons.push(`eligibility ${e.eligibility}`); continue; }
    const base = e.attributableRevenueMinor ?? e.cashCollectedMinor;
    if (base === null || base <= 0) { excludedReasons.push("no cash collected"); continue; }
    const share = Math.min(100, Math.max(0, e.attributablePercentage ?? 100)) / 100;
    poolMinor += Math.round(Math.min(base, e.cashCollectedMinor ?? base) * share);
    counted++;
  }
  return { poolMinor, counted, excluded: events.length - counted, excludedReasons };
}
