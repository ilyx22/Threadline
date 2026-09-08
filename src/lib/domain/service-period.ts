/**
 * The service period.
 *
 * Threadline bills and delivers in **four-week periods**, not calendar months.
 * The initial engagement is twelve weeks, which is three service periods.
 *
 * These are not the same thing and the difference is not cosmetic:
 *
 *   - a four-week cadence produces **thirteen** periods a year, not twelve;
 *   - "monthly recurring revenue" computed by summing period fees is therefore
 *     wrong by about 8%, which is a material error on a revenue figure;
 *   - a client on a four-week cycle receives their third report before the end
 *     of month three, and an engagement described as "three months" ends a week
 *     earlier than either party expects.
 *
 * So the fee column is called `periodFee` and every commercial surface says
 * "period". Where something is *genuinely* tied to the calendar — Threadline's
 * own book-keeping in `InternalMetric`, which is reconciled monthly — it stays
 * monthly, and this module is not involved.
 */

/** Weeks in one service period. */
export const SERVICE_PERIOD_WEEKS = 4;

/** Service periods in the initial engagement. */
export const INITIAL_ENGAGEMENT_PERIODS = 3;

/** Weeks in the initial engagement. Derived, so the two can never disagree. */
export const INITIAL_ENGAGEMENT_WEEKS = SERVICE_PERIOD_WEEKS * INITIAL_ENGAGEMENT_PERIODS;

/**
 * Four-week periods in a year.
 *
 * 365 / 28 = 13.04. Thirteen is the number that matters commercially: it is how
 * many times a client is invoiced, and it is the reason a period fee is not a
 * monthly fee.
 */
export const PERIODS_PER_YEAR = 13;

/** What the client commits to up front. */
export function initialContractValue(setupFeeMinor: number, periodFeeMinor: number): number {
  return setupFeeMinor + periodFeeMinor * INITIAL_ENGAGEMENT_PERIODS;
}

/** Annualised recurring value at the current period fee. */
export function annualisedValue(periodFeeMinor: number): number {
  return periodFeeMinor * PERIODS_PER_YEAR;
}

/**
 * The calendar-monthly equivalent of a period fee.
 *
 * For comparing against anything genuinely monthly — Threadline's own accounts,
 * or a benchmark quoted per month. Always label it as an equivalent: it is a
 * conversion, not a figure anybody is invoiced.
 */
export function monthlyEquivalent(periodFeeMinor: number): number {
  return Math.round((periodFeeMinor * PERIODS_PER_YEAR) / 12);
}

/** End date of an engagement starting on `start`. */
export function engagementEnd(start: Date, periods = INITIAL_ENGAGEMENT_PERIODS): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + SERVICE_PERIOD_WEEKS * 7 * periods);
  return end;
}

/**
 * Which service period a date falls in, counting from 1.
 *
 * Returns null before the engagement starts, because "period 0" is a number
 * that would end up in a report.
 */
export function periodNumberFor(start: Date, date: Date): number | null {
  const ms = date.getTime() - start.getTime();
  if (ms < 0) return null;
  const periodMs = SERVICE_PERIOD_WEEKS * 7 * 86_400_000;
  return Math.floor(ms / periodMs) + 1;
}

/** Human label for the cadence, used wherever terms are shown. */
export const CADENCE_LABEL = `every ${SERVICE_PERIOD_WEEKS} weeks`;
export const ENGAGEMENT_LABEL = `${INITIAL_ENGAGEMENT_WEEKS} weeks (${INITIAL_ENGAGEMENT_PERIODS} service periods)`;
