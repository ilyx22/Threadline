/**
 * Proof capture — baseline versus engagement months.
 *
 * The honesty rule for this whole module: Threadline can show that things
 * changed while it was engaged. It cannot show that Threadline caused them.
 * Every comparison here is therefore written as a change *associated with* the
 * engagement, attribution is only ever claimed *where it is trackable*, and
 * commercial numbers are called *signals* rather than results.
 *
 * The baseline is unavoidably client-reported: nothing before the engagement is
 * observable from inside the product. Engagement months mix client-reported
 * figures (founder hours, audience size) with figures the platform can observe
 * from its own records (pieces published, cycle time, inquiries, calls booked).
 * Which is which is carried on every metric and shown in the UI, so a reader
 * always knows whether a number was measured or reported.
 */

export type MetricDirection = "lower_is_better" | "higher_is_better";
export type MetricOrigin = "client_reported" | "platform_observed";
export type MetricFormat = "hours" | "count" | "days" | "percent" | "money";

export type ProofMetricKey =
  | "founderHours"
  | "contentOutput"
  | "cycleTimeDays"
  | "approvalDays"
  | "audienceSize"
  | "engagementRate"
  | "qualifiedInquiries"
  | "callsBooked"
  | "attributableValue";

export type ProofMetricDefinition = {
  key: ProofMetricKey;
  label: string;
  /** What the number actually counts, said precisely enough to argue with. */
  definition: string;
  direction: MetricDirection;
  format: MetricFormat;
  /** Where the engagement-month figure comes from. Baselines are always reported. */
  origin: MetricOrigin;
  /** Shown next to any commercial metric so the claim stays inside what is provable. */
  caveat?: string;
};

export const PROOF_METRICS: ProofMetricDefinition[] = [
  {
    key: "founderHours",
    label: "Founder hours on content",
    definition:
      "Hours per week the founder spends on content, including thinking, writing, recording, reviewing and chasing.",
    direction: "lower_is_better",
    format: "hours",
    origin: "client_reported",
    caveat: "Self-reported by the founder. Treat as an estimate, not a timesheet.",
  },
  {
    key: "contentOutput",
    label: "Pieces published",
    definition: "Distinct pieces published in the period, counted per platform record.",
    direction: "higher_is_better",
    format: "count",
    origin: "platform_observed",
  },
  {
    key: "cycleTimeDays",
    label: "Production cycle time",
    definition: "Days from recorded footage arriving to the piece being approved.",
    direction: "lower_is_better",
    format: "days",
    origin: "platform_observed",
  },
  {
    key: "approvalDays",
    label: "Approval time",
    definition: "Days a finished piece waits for a decision once it reaches review.",
    direction: "lower_is_better",
    format: "days",
    origin: "platform_observed",
  },
  {
    key: "audienceSize",
    label: "Audience",
    definition: "Total followers across the platforms in scope, at the end of the period.",
    direction: "higher_is_better",
    format: "count",
    origin: "client_reported",
  },
  {
    key: "engagementRate",
    label: "Engagement quality",
    definition:
      "Engagements as a percentage of views. A quality read, not a reach read — it moves when the right people respond, not when more people scroll past.",
    direction: "higher_is_better",
    format: "percent",
    origin: "platform_observed",
  },
  {
    key: "qualifiedInquiries",
    label: "Qualified inquiries",
    definition:
      "Inbound conversations recorded in the pipeline that met the qualification bar for this business.",
    direction: "higher_is_better",
    format: "count",
    origin: "platform_observed",
    caveat: "Counted where an inquiry was logged. Conversations that never reached the pipeline are not here.",
  },
  {
    key: "callsBooked",
    label: "Calls booked",
    definition: "Pipeline records that reached a booked conversation in the period.",
    direction: "higher_is_better",
    format: "count",
    origin: "platform_observed",
  },
  {
    key: "attributableValue",
    label: "Attributable commercial signal",
    definition:
      "Closed value on pipeline records that name a specific piece of content as their source.",
    direction: "higher_is_better",
    format: "money",
    origin: "platform_observed",
    caveat:
      "Single-touch and self-declared: it reflects what the buyer said brought them in. It is a commercial signal, not proof of cause.",
  },
];

export const PROOF_METRIC_BY_KEY: Record<ProofMetricKey, ProofMetricDefinition> = Object.fromEntries(
  PROOF_METRICS.map((m) => [m.key, m]),
) as Record<ProofMetricKey, ProofMetricDefinition>;

export type MetricValue = {
  value: number | null;
  /** True when the figure was observed by the platform rather than reported. */
  observed: boolean;
};

export type ProofComparison = {
  metric: ProofMetricDefinition;
  baseline: MetricValue;
  current: MetricValue;
  /** Absolute change, current minus baseline. Null when either side is missing. */
  delta: number | null;
  /** Percentage change against the baseline. Null when the baseline is zero or missing. */
  deltaPct: number | null;
  /** Whether the movement is in the desired direction. Null when there is no movement to judge. */
  favourable: boolean | null;
  /** A sentence safe to put in front of a client. */
  statement: string;
};

/**
 * Compare one metric between the baseline and a month.
 *
 * Deliberately returns `null` rather than a zero when data is missing. A blank
 * is honest; a zero would be a claim.
 */
export function compareMetric(
  metric: ProofMetricDefinition,
  baseline: MetricValue,
  current: MetricValue,
): ProofComparison {
  const hasBoth = isNumber(baseline.value) && isNumber(current.value);
  const delta = hasBoth ? round2(current.value! - baseline.value!) : null;
  const deltaPct =
    hasBoth && baseline.value !== 0
      ? round1(((current.value! - baseline.value!) / Math.abs(baseline.value!)) * 100)
      : null;

  let favourable: boolean | null = null;
  if (delta !== null && delta !== 0) {
    favourable = metric.direction === "higher_is_better" ? delta > 0 : delta < 0;
  }

  return {
    metric,
    baseline,
    current,
    delta,
    deltaPct,
    favourable,
    statement: statementFor(metric, baseline, current, delta, deltaPct),
  };
}

/**
 * Phrase a comparison without implying causation.
 *
 * Every branch says what moved and over what period. None of them say
 * Threadline made it move — that is a judgement for the reader, made on the
 * evidence, not a claim the product asserts on its own behalf.
 */
function statementFor(
  metric: ProofMetricDefinition,
  baseline: MetricValue,
  current: MetricValue,
  delta: number | null,
  deltaPct: number | null,
): string {
  if (!isNumber(baseline.value) && !isNumber(current.value)) {
    return "Not recorded for either period.";
  }
  if (!isNumber(baseline.value)) {
    return "No baseline was recorded, so this month cannot be compared.";
  }
  if (!isNumber(current.value)) {
    return "Not recorded for this month.";
  }
  if (delta === 0 || delta === null) {
    return "Unchanged against the baseline.";
  }

  const direction = delta > 0 ? "higher" : "lower";
  const size = deltaPct === null ? "" : ` (${Math.abs(deltaPct).toFixed(1)}% ${direction})`;
  const measured = metric.origin === "platform_observed" ? "measured" : "reported";

  return `${Math.abs(delta)} ${direction} than the ${measured} baseline${size}, over the period Threadline has been engaged.`;
}

/**
 * The summary line for a whole month.
 *
 * Counts favourable and unfavourable movements rather than picking the flattering
 * ones. A month where more went backwards than forwards says so.
 */
export function periodVerdict(comparisons: ProofComparison[]): {
  favourable: number;
  unfavourable: number;
  unchanged: number;
  missing: number;
  headline: string;
} {
  let favourable = 0;
  let unfavourable = 0;
  let unchanged = 0;
  let missing = 0;

  for (const c of comparisons) {
    if (c.delta === null) missing += 1;
    else if (c.favourable === null) unchanged += 1;
    else if (c.favourable) favourable += 1;
    else unfavourable += 1;
  }

  const compared = favourable + unfavourable + unchanged;
  let headline: string;
  if (compared === 0) {
    headline = "Not enough recorded data to compare this month against the baseline.";
  } else if (favourable > unfavourable) {
    headline = `${favourable} of ${compared} comparable measures moved in the intended direction over this period.`;
  } else if (unfavourable > favourable) {
    headline = `${unfavourable} of ${compared} comparable measures moved against the intended direction over this period. That is the honest read.`;
  } else {
    headline = `Movement was mixed: ${favourable} improved, ${unfavourable} went the other way.`;
  }

  return { favourable, unfavourable, unchanged, missing, headline };
}

/** Fixed disclosure shown wherever a comparison is presented. */
export const ATTRIBUTION_DISCLOSURE =
  "These are changes associated with the period Threadline has been engaged, not a claim of cause. Commercial figures are attributed only where a buyer named a specific piece of content, so treat them as a signal rather than a measured return.";

export function formatMetricValue(
  value: number | null,
  format: MetricFormat,
  currency = "GBP",
): string {
  if (!isNumber(value)) return "—";
  switch (format) {
    case "hours":
      return `${round1(value)} hrs`;
    case "days":
      return `${round1(value)} ${round1(value) === 1 ? "day" : "days"}`;
    case "percent":
      return `${round1(value)}%`;
    case "money":
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value / 100);
    case "count":
    default:
      return new Intl.NumberFormat("en-GB").format(Math.round(value));
  }
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
