import { WorkflowError } from "@/lib/domain/workflow";
import {
  ATTRIBUTION_STRENGTH,
  type AttributionClass,
  type AttributionModel,
  type CommercialEventKind,
} from "./enums";

/**
 * Attribution.
 *
 * The question is "which content is creating commercially valuable attention",
 * and this module answers it with three models a client can check: first touch,
 * last touch, and an even split. Nothing weighted, nothing learned, nothing
 * proprietary — a model somebody has to take on trust is the opposite of what
 * attribution is for.
 *
 * FOUR RULES, EACH OF WHICH HAS A TEST:
 *
 *   1. **A model redistributes credit; it never creates evidence.** Splitting a
 *      deal three ways does not improve how well any of those three assets is
 *      connected to it. `evidenceStrength` is carried by the event and is never
 *      touched by the arithmetic here.
 *   2. **Only touches before the event qualify.** A touch after a deal closed
 *      did not contribute to it, however tempting the timestamp ordering.
 *   3. **A repeated visit does not buy an asset more credit.** Linear credit is
 *      split across *distinct assets*, not across touchpoint rows — otherwise
 *      one enthusiastic reader clicking the same post four times would make it
 *      look like the strongest thing published.
 *   4. **Missing data reads as missing.** Zero touches produces no credit and
 *      says so, rather than crediting the nearest thing available.
 */

/* --------------------------------- Inputs ---------------------------------- */

export type Touch = {
  id: string;
  /** The asset touched. Null when a touch is known but its asset is not. */
  contentItemId: string | null;
  occurredAt: Date;
};

export type CommercialOutcome = {
  id: string;
  kind: CommercialEventKind;
  occurredAt: Date;
  valueMinor: number;
  /** How well this connects to content. Set by a person, never by a model. */
  evidence: AttributionClass;
};

/**
 * How far back a touch can sit and still be considered part of the journey.
 *
 * Ninety days is a judgement, and it is written here as one rather than hidden
 * in a query. Expert-led B2B buying cycles routinely run longer than a quarter,
 * so this will under-credit early awareness; it is set short deliberately,
 * because over-crediting a touch from eight months ago is the more damaging
 * error and the harder one to notice.
 */
export const ATTRIBUTION_WINDOW_DAYS = 90;

/** Touches that legitimately precede an outcome, oldest first. */
export function qualifyingTouches(
  touches: Touch[],
  outcome: Pick<CommercialOutcome, "occurredAt">,
  windowDays = ATTRIBUTION_WINDOW_DAYS,
): Touch[] {
  const cutoff = new Date(outcome.occurredAt.getTime() - windowDays * 86_400_000);
  return touches
    .filter((t) => t.occurredAt <= outcome.occurredAt && t.occurredAt >= cutoff)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}

/* -------------------------------- The models -------------------------------- */

export type Credit = {
  contentItemId: string;
  /** 0–1. Sums to 1 across the result when any credit was assigned. */
  share: number;
  valueMinor: number;
};

export type AttributionResult = {
  model: AttributionModel;
  credits: Credit[];
  /** Touches considered, after the window and ordering rules. */
  considered: number;
  /** Distinct assets among them. */
  assets: number;
  /**
   * Why there is no credit, when there is none. An empty result with no reason
   * would be indistinguishable from a bug.
   */
  reason: string | null;
};

export function attribute(
  model: AttributionModel,
  touches: Touch[],
  outcome: CommercialOutcome,
  windowDays = ATTRIBUTION_WINDOW_DAYS,
): AttributionResult {
  const qualifying = qualifyingTouches(touches, outcome, windowDays).filter(
    (t) => t.contentItemId,
  );

  const distinct = [...new Set(qualifying.map((t) => t.contentItemId as string))];

  const empty = (reason: string): AttributionResult => ({
    model,
    credits: [],
    considered: qualifying.length,
    assets: distinct.length,
    reason,
  });

  if (touches.length === 0) return empty("No touchpoints were recorded for this journey.");
  if (qualifying.length === 0) {
    return empty(
      `No touchpoint falls in the ${windowDays} days before this, so nothing here can be credited.`,
    );
  }

  if (model === "first_touch") {
    const first = qualifying[0].contentItemId as string;
    return {
      model,
      credits: [{ contentItemId: first, share: 1, valueMinor: outcome.valueMinor }],
      considered: qualifying.length,
      assets: distinct.length,
      reason: null,
    };
  }

  if (model === "last_touch") {
    const last = qualifying[qualifying.length - 1].contentItemId as string;
    return {
      model,
      credits: [{ contentItemId: last, share: 1, valueMinor: outcome.valueMinor }],
      considered: qualifying.length,
      assets: distinct.length,
      reason: null,
    };
  }

  // Linear: an even split across distinct assets. Splitting across touchpoint
  // rows instead would let one repeat visitor inflate a single asset.
  const share = 1 / distinct.length;
  const per = Math.round(outcome.valueMinor / distinct.length);

  const credits = distinct.map((contentItemId, index) => ({
    contentItemId,
    share,
    // Rounding remainder goes to the first asset so the parts still sum to the
    // whole. A total that does not reconcile is the fastest way to lose a
    // client's trust in every other number on the page.
    valueMinor: index === 0 ? outcome.valueMinor - per * (distinct.length - 1) : per,
  }));

  return { model, credits, considered: qualifying.length, assets: distinct.length, reason: null };
}

/**
 * Evidence strength, carried straight through.
 *
 * Deliberately a separate function that ignores the attribution result: it
 * exists so that reading the code makes the rule obvious, and so a test can
 * assert that no model changes it.
 */
/**
 * An evidence class must be backed by the evidence it names.
 *
 * `directly_tracked` means Threadline itself observed the click, so there must
 * be a tracked visitor behind the event. `buyer_named` and `multi_touch` are
 * claims about a specific deal, so there must be an inquiry. Without this an
 * operator could type "directly_tracked" into a form and manufacture the
 * strongest evidence class from nothing — QA-005, 2026-09-09.
 */
export function assertEvidenceSupportable(
  evidence: AttributionClass,
  support: { visitorId: string | null; inquiryId: string | null },
): void {
  if (evidence === "directly_tracked" && !support.visitorId) {
    throw new WorkflowError(
      "\"Directly tracked\" means Threadline observed the click itself. This event has no tracked visitor behind it, so record it as buyer-named, associated or qualitative instead.",
    );
  }
  if ((evidence === "buyer_named" || evidence === "multi_touch") && !support.inquiryId) {
    throw new WorkflowError(
      `"${evidence === "buyer_named" ? "Buyer named" : "Multi-touch"}" is a claim about a specific deal. Link the event to the enquiry it belongs to first.`,
    );
  }
}

export function evidenceStrength(outcome: CommercialOutcome): AttributionClass {
  return outcome.evidence;
}

/* ------------------------------- Roll-up ------------------------------------ */

export type AssetCredit = {
  contentItemId: string;
  events: number;
  valueMinor: number;
  /** The strongest evidence class among the events crediting this asset. */
  bestEvidence: AttributionClass;
};

/** Credit across many outcomes, aggregated per asset. */
export function rollUp(
  model: AttributionModel,
  journeys: { touches: Touch[]; outcome: CommercialOutcome }[],
  windowDays = ATTRIBUTION_WINDOW_DAYS,
): AssetCredit[] {
  const byAsset = new Map<string, AssetCredit>();

  for (const journey of journeys) {
    const result = attribute(model, journey.touches, journey.outcome, windowDays);
    for (const credit of result.credits) {
      const existing = byAsset.get(credit.contentItemId);
      if (existing) {
        existing.events += 1;
        existing.valueMinor += credit.valueMinor;
        if (
          ATTRIBUTION_STRENGTH[journey.outcome.evidence] >
          ATTRIBUTION_STRENGTH[existing.bestEvidence]
        ) {
          existing.bestEvidence = journey.outcome.evidence;
        }
      } else {
        byAsset.set(credit.contentItemId, {
          contentItemId: credit.contentItemId,
          events: 1,
          valueMinor: credit.valueMinor,
          bestEvidence: journey.outcome.evidence,
        });
      }
    }
  }

  return [...byAsset.values()].sort((a, b) => b.valueMinor - a.valueMinor);
}

/* --------------------------- Data quality gating ---------------------------- */

/**
 * Below this share of defensibly-evidenced commercial events, money-per-asset
 * figures are withheld.
 *
 * Half is a judgement and is written here as one. The failure it prevents is
 * specific: a client is shown "£40,000 of revenue from this post" when four of
 * five deals in the period were correlation, and the one traceable deal happens
 * to be large. The number is arithmetically true and completely misleading.
 */
export const EFFICIENCY_COVERAGE_FLOOR = 0.5;

/** Events strong enough to carry a monetary claim. */
function defensible(evidence: AttributionClass): boolean {
  return ATTRIBUTION_STRENGTH[evidence] >= ATTRIBUTION_STRENGTH.buyer_named;
}

export type Coverage = {
  events: number;
  defensible: number;
  /** 0–1, or null when there are no events to measure. */
  share: number | null;
  /** Whether monetary efficiency metrics may be shown. */
  monetaryAllowed: boolean;
  /** What to say instead, when they may not. */
  reason: string | null;
};

export function attributionCoverage(outcomes: Pick<CommercialOutcome, "evidence">[]): Coverage {
  if (outcomes.length === 0) {
    return {
      events: 0,
      defensible: 0,
      share: null,
      monetaryAllowed: false,
      reason: "No commercial events recorded yet, so there is nothing to attribute.",
    };
  }

  const strong = outcomes.filter((o) => defensible(o.evidence)).length;
  const share = strong / outcomes.length;

  if (share < EFFICIENCY_COVERAGE_FLOOR) {
    return {
      events: outcomes.length,
      defensible: strong,
      share,
      monetaryAllowed: false,
      reason: `Only ${strong} of ${outcomes.length} commercial events are traceable to content. Revenue per asset would be arithmetically true and misleading, so it is withheld until coverage improves.`,
    };
  }

  return {
    events: outcomes.length,
    defensible: strong,
    share,
    monetaryAllowed: true,
    reason: null,
  };
}

/* ------------------------- Normalised efficiency ---------------------------- */

/** Per ten thousand views. Null when there is not enough reach to normalise. */
export function per10k(count: number, views: number): number | null {
  if (!Number.isFinite(views) || views < 1000) return null;
  return Math.round((count / views) * 10_000 * 10) / 10;
}

/**
 * How a period's outcome should be described out loud.
 *
 * The three sentences are deliberately different claims, and the strongest one
 * the evidence supports is the one that gets used. This is the function that
 * stops a monthly report saying "generated" when it means "happened during".
 */
export function outcomeLanguage(
  evidence: AttributionClass,
  amount: string,
): string {
  switch (evidence) {
    case "directly_tracked":
      return `${amount} is directly tracked to Threadline content.`;
    case "buyer_named":
      return `${amount} came from buyers who named Threadline content themselves.`;
    case "multi_touch":
      return `${amount} had Threadline content as one identifiable touchpoint in a longer journey.`;
    case "associated":
      return `${amount} moved during the period, but the evidence does not support a causal claim.`;
    case "qualitative_only":
      return `${amount} has no defensible monetary path to content. Recorded as qualitative evidence only.`;
  }
}
