/**
 * Acquisition funnel maths.
 *
 * Turns a target number of wins into the number of first touches that target
 * actually implies, using rates measured from Threadline's own recorded
 * business metrics rather than from ambition.
 *
 *   required first touches = target wins / (booking x show x qualified x close)
 *
 * Two rules make this useful rather than decorative:
 *
 *   1. **It refuses to produce a number it cannot support.** If any rate is
 *      zero or unmeasured, the answer is `null` and the caller says which input
 *      is missing. A funnel model that always returns a figure is a random
 *      number generator with a formula attached.
 *   2. **Measured and assumed rates are labelled separately.** Booking, show
 *      and close come from recorded metrics. Qualification is measured once
 *      call outcomes exist and is an explicitly labelled operator assumption
 *      until then. The two are never rendered the same way.
 *
 * Channel-agnostic on purpose. A platform is one component of an acquisition
 * system, not the system — nothing here encodes a channel, and the same maths
 * applies whether a first touch is an email, a message or a conversation.
 */

export type FunnelInput = {
  /** Distinct prospects first contacted in the period. */
  firstTouches: number;
  /** Calls booked from those touches. */
  callsBooked: number;
  /** Percentage of booked calls that were attended, 0-100. */
  showRatePct: number;
  /** Percentage of attended calls that closed, 0-100. */
  closeRatePct: number;
  /**
   * Percentage of attended calls that were genuinely a fit, 0-100.
   *
   * Used when nothing recorded the answer, in which case this is an operator
   * assumption and callers must present it as one.
   */
  qualifiedRatePct?: number | null;
  /**
   * Attended and genuinely-a-fit call counts, when call outcomes were recorded.
   *
   * When present this replaces the assumption above with a measurement. The
   * distinction is the whole point of the model: a planning number derived from
   * what happened carries weight an estimate does not, and the two must never
   * be rendered identically.
   */
  qualifiedFromRecords?: { showed: number; qualified: number } | null;
};

export type Rate = {
  key: "booking" | "show" | "qualified" | "close";
  label: string;
  /** 0-1, or null when it cannot be derived from what is recorded. */
  value: number | null;
  /** True when this came from recorded metrics rather than an assumption. */
  measured: boolean;
  /** What it was computed from, so a reader can check it. */
  basis: string;
};

export function funnelRates(input: FunnelInput): Rate[] {
  const bookingRate =
    input.firstTouches > 0 ? clamp01(input.callsBooked / input.firstTouches) : null;

  return [
    {
      key: "booking",
      label: "Booking rate",
      value: bookingRate,
      measured: true,
      basis:
        input.firstTouches > 0
          ? `${input.callsBooked} calls booked from ${input.firstTouches} first touches`
          : "No first touches recorded, so this cannot be derived",
    },
    {
      key: "show",
      label: "Show rate",
      value: pctToRate(input.showRatePct),
      measured: true,
      basis: "Recorded against the period",
    },
    qualifiedRate(input),
    {
      key: "close",
      label: "Close rate",
      value: pctToRate(input.closeRatePct),
      measured: true,
      basis: "Recorded against the period",
    },
  ];
}

/**
 * Qualification: measured where call outcomes exist, an assumption otherwise.
 *
 * The rate itself is the same arithmetic either way. What changes is whether a
 * reader is entitled to believe it, so the two cases are labelled differently
 * and never merged.
 */
function qualifiedRate(input: FunnelInput): Rate {
  const records = input.qualifiedFromRecords;
  if (records && records.showed > 0) {
    return {
      key: "qualified",
      label: "Qualified rate",
      value: clamp01(records.qualified / records.showed),
      measured: true,
      basis: `${records.qualified} of ${records.showed} attended ${records.showed === 1 ? "call was" : "calls were"} a genuine fit`,
    };
  }

  return {
    key: "qualified",
    label: "Qualified rate",
    value: pctToRate(input.qualifiedRatePct),
    measured: false,
    basis: records
      ? "No attended calls recorded yet. An operator assumption, not a measurement."
      : "Not recorded. An operator assumption, not a measurement.",
  };
}

export type FunnelProjection =
  | {
      ok: true;
      /** First touches needed to hit the target, rounded up. */
      requiredFirstTouches: number;
      /** Compound conversion from a first touch to a win, 0-1. */
      conversion: number;
      rates: Rate[];
      /** True when any factor was assumed rather than measured. */
      containsAssumption: boolean;
    }
  | {
      ok: false;
      /** Which factors prevented a projection. */
      missing: string[];
      reason: string;
      rates: Rate[];
    };

/**
 * How many first touches a target implies.
 *
 * Returns a refusal rather than a guess when the recorded data cannot support
 * the calculation — which, early in a launch, is the normal and correct answer.
 */
export function requiredFirstTouches(
  targetWins: number,
  input: FunnelInput,
): FunnelProjection {
  return projectFromRates(targetWins, funnelRates(input));
}

/**
 * Planning rates, before Threadline has enough of its own data to derive them.
 *
 * Every one is labelled unmeasured, because every one is a guess. They exist so
 * the arithmetic can run at all in week one — not so a projection can be
 * presented as though it came from evidence. Borrowing another business's
 * conversion rates and treating them as Threadline's is the specific failure
 * this labelling is here to prevent.
 */
export function assumedRates(pcts: {
  booking: number;
  show: number;
  qualified: number;
  close: number;
}): Rate[] {
  const basis = "Planning assumption. Nothing has been measured yet.";
  return [
    { key: "booking", label: "Booking rate", value: pctToRate(pcts.booking), measured: false, basis },
    { key: "show", label: "Show rate", value: pctToRate(pcts.show), measured: false, basis },
    { key: "qualified", label: "Qualified rate", value: pctToRate(pcts.qualified), measured: false, basis },
    { key: "close", label: "Close rate", value: pctToRate(pcts.close), measured: false, basis },
  ];
}

/** The projection itself, over rates from any source. */
export function projectFromRates(targetWins: number, rates: Rate[]): FunnelProjection {
  const missing = rates.filter((r) => r.value === null || r.value === 0);

  if (!Number.isFinite(targetWins) || targetWins <= 0) {
    return {
      ok: false,
      missing: ["target"],
      reason: "Set a target number of wins above zero.",
      rates,
    };
  }

  if (missing.length > 0) {
    return {
      ok: false,
      missing: missing.map((r) => r.label),
      reason: sentence(
        `${missing.map((r) => r.label.toLowerCase()).join(", ")} ${missing.length === 1 ? "is" : "are"} zero or not yet recorded, so this cannot be projected honestly. Record a full cycle first.`,
      ),
      rates,
    };
  }

  const conversion = rates.reduce((product, rate) => product * (rate.value as number), 1);
  if (conversion <= 0) {
    return {
      ok: false,
      missing: ["conversion"],
      reason: "The compound conversion works out at zero.",
      rates,
    };
  }

  return {
    ok: true,
    requiredFirstTouches: Math.ceil(targetWins / conversion),
    conversion,
    rates,
    containsAssumption: rates.some((r) => !r.measured),
  };
}

/** Touches per remaining workday. Null when there are no workdays left. */
export function dailyTouches(required: number, workdaysRemaining: number): number | null {
  if (!Number.isFinite(required) || required <= 0) return null;
  if (!Number.isFinite(workdaysRemaining) || workdaysRemaining <= 0) return null;
  return Math.ceil(required / workdaysRemaining);
}

/** Weekdays remaining in the month containing `from`, inclusive of today. */
export function workdaysRemainingInMonth(from = new Date()): number {
  const year = from.getFullYear();
  const month = from.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let count = 0;
  for (let day = from.getDate(); day <= lastDay; day += 1) {
    const weekday = new Date(year, month, day).getDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

/** Capitalise a generated sentence so it does not read as a fragment. */
function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function pctToRate(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return clamp01(value / 100);
}

function clamp01(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.min(1, value);
}

/* ---------------------------- The measured funnel --------------------------- */

/**
 * Raw counts for one period, from real records rather than typed-in figures.
 *
 * Every number here is derived: a first touch is a prospect whose first message
 * actually went out, a booking is a call that exists, a show is a call someone
 * attended. Counting them from the records rather than asking an operator to
 * remember them is the difference between a funnel and a feeling.
 */
export type FunnelCounts = {
  firstTouches: number;
  replies: number;
  positiveReplies: number;
  booked: number;
  showed: number;
  qualified: number;
  offers: number;
  won: number;
};

export const EMPTY_COUNTS: FunnelCounts = {
  firstTouches: 0,
  replies: 0,
  positiveReplies: 0,
  booked: 0,
  showed: 0,
  qualified: 0,
  offers: 0,
  won: 0,
};

export type FunnelStep = {
  key: string;
  label: string;
  from: number;
  to: number;
  /** Conversion 0–1, or null when the denominator is zero. */
  rate: number | null;
  /**
   * True when the denominator is too small for the rate to mean anything.
   * A single win out of two calls is not a 50% close rate.
   */
  thin: boolean;
};

/**
 * Below this many observations a rate is arithmetic, not evidence.
 *
 * Chosen to be conservative rather than clever: with fewer than ten
 * observations one outcome moves the number by ten percentage points or more,
 * and a plan rebuilt on that is a plan rebuilt on noise.
 */
export const THIN_SAMPLE = 10;

export function funnelSteps(counts: FunnelCounts): FunnelStep[] {
  const step = (key: string, label: string, from: number, to: number): FunnelStep => ({
    key,
    label,
    from,
    to,
    rate: from > 0 ? to / from : null,
    thin: from < THIN_SAMPLE,
  });

  return [
    step("reply", "Touch to reply", counts.firstTouches, counts.replies),
    step("positive", "Reply to positive", counts.replies, counts.positiveReplies),
    step("booking", "Positive to booked", counts.positiveReplies, counts.booked),
    step("show", "Booked to showed", counts.booked, counts.showed),
    step("qualified", "Showed to qualified", counts.showed, counts.qualified),
    step("offer", "Qualified to offer", counts.qualified, counts.offers),
    step("close", "Offer to won", counts.offers, counts.won),
  ];
}

/**
 * The lowest conversion with enough data to be worth looking at.
 *
 * Deliberately **not** called the broken one. Funnel steps are not comparable
 * to each other: a 30% reply rate and a 30% close rate are not the same kind of
 * number, and no threshold this module could invent would tell them apart.
 * Importing industry benchmarks to decide would mean treating another business
 * as evidence about this one, which is the thing the whole model refuses to do.
 *
 * So this reports where the numbers are lowest and stops there. Which step is
 * actually the constraint is the operator's judgement, made with the funnel in
 * front of them — the weekly review asks them to record it, and pre-fills the
 * answer from here as a suggestion rather than a verdict.
 *
 * Returns null when nothing has a big enough denominator to read, which early
 * in a launch is the honest answer.
 */
export function weakestConversion(counts: FunnelCounts): FunnelStep | null {
  const judgeable = funnelSteps(counts).filter((s) => s.rate !== null && !s.thin);
  if (judgeable.length === 0) return null;

  return judgeable.reduce((lowest, step) =>
    (step.rate as number) < (lowest.rate as number) ? step : lowest,
  );
}

/**
 * Rates for the planning equation, derived from counts.
 *
 * Qualification stops being an assumption the moment call outcomes are
 * recorded, which is what `qualifiedFromRecords` carries.
 */
export function inputFromCounts(counts: FunnelCounts): FunnelInput {
  return {
    firstTouches: counts.firstTouches,
    callsBooked: counts.booked,
    showRatePct: counts.booked > 0 ? (counts.showed / counts.booked) * 100 : 0,
    closeRatePct: counts.qualified > 0 ? (counts.won / counts.qualified) * 100 : 0,
    qualifiedFromRecords: { showed: counts.showed, qualified: counts.qualified },
  };
}

/* --------------------------------- The quota -------------------------------- */

/**
 * Above this many first touches a day, the answer is not "work harder".
 *
 * A genuinely researched first touch — verify the business, find one real
 * observation, write something specific — takes the better part of ten minutes.
 * Forty of them is most of a working day with nothing else in it. When the
 * arithmetic demands that, the input making the arithmetic bad is the niche,
 * the message, the list quality, the booking rate or the price, and increasing
 * volume against a broken funnel just produces more of the same result.
 */
export const ABSURD_DAILY_TOUCHES = 40;

export type Quota = {
  /** Total first touches the target implies. */
  required: number;
  completed: number;
  remaining: number;
  workdaysRemaining: number;
  /** Touches per remaining workday, rounded up. Null when there are no days left. */
  perDay: number | null;
  completedToday: number;
  remainingToday: number;
  /** Set when the arithmetic is telling you to diagnose rather than grind. */
  warning: string | null;
};

export function quota(input: {
  required: number;
  completed: number;
  completedToday: number;
  workdaysRemaining: number;
}): Quota {
  const remaining = Math.max(0, input.required - input.completed);
  const perDay = dailyTouches(remaining, input.workdaysRemaining);

  let warning: string | null = null;
  if (perDay !== null && perDay > ABSURD_DAILY_TOUCHES) {
    warning = `${perDay} researched first touches a day is not a plan, it is a diagnosis. Something upstream — the wedge, the list, the message, the booking rate or the price — is making this arithmetic bad. Fix that rather than raising the volume.`;
  } else if (input.workdaysRemaining <= 0 && remaining > 0) {
    warning = "The period is over and the target was not reached. Reset the target rather than carrying it silently.";
  }

  return {
    required: input.required,
    completed: input.completed,
    remaining,
    workdaysRemaining: input.workdaysRemaining,
    perDay,
    completedToday: input.completedToday,
    remainingToday: Math.max(0, (perDay ?? 0) - input.completedToday),
    warning,
  };
}

/** Weekdays from `from` to `until` inclusive. Zero when the period has passed. */
export function workdaysBetween(from: Date, until: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(until.getFullYear(), until.getMonth(), until.getDate());
  if (end < start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
