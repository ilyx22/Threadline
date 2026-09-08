import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  INITIAL_ENGAGEMENT_PERIODS,
  INITIAL_ENGAGEMENT_WEEKS,
  PERIODS_PER_YEAR,
  SERVICE_PERIOD_WEEKS,
  initialContractValue,
  monthlyEquivalent,
  periodNumberFor,
} from "./service-period";

/**
 * The cadence is four weeks, not a month.
 *
 * The difference looks pedantic and is not. A four-week cycle bills thirteen
 * times a year; treating a period fee as a monthly fee understates the year by
 * one whole period, and the error compounds through every pipeline and revenue
 * figure that touches it.
 */

describe("the service period", () => {
  it("is four weeks, and an engagement is three of them", () => {
    assert.equal(SERVICE_PERIOD_WEEKS, 4);
    assert.equal(INITIAL_ENGAGEMENT_PERIODS, 3);
    assert.equal(INITIAL_ENGAGEMENT_WEEKS, 12);
  });

  it("bills thirteen times a year, not twelve", () => {
    assert.equal(PERIODS_PER_YEAR, 13);
  });
});

describe("contract value", () => {
  it("is the setup fee plus three period fees", () => {
    // £1,000 setup, £2,500 a period, in minor units.
    assert.equal(initialContractValue(100_000, 250_000), 850_000);
  });

  it("does not quietly become a monthly figure", () => {
    // The mistake this guards against: "12 weeks" read as "3 months" and then
    // reported as if the client had paid three calendar months of fees.
    const twelveWeeks = initialContractValue(0, 250_000);
    assert.equal(twelveWeeks, 750_000);
  });
});

describe("the monthly equivalent", () => {
  it("converts through the year rather than assuming a period is a month", () => {
    // 250,000 x 13 / 12 — a period fee reported as MRR is about 8% low.
    assert.equal(monthlyEquivalent(250_000), 270_833);
  });

  it("is always larger than the period fee it came from", () => {
    for (const fee of [50_000, 250_000, 1_000_000]) {
      assert.ok(monthlyEquivalent(fee) > fee, `${fee} converted downwards`);
    }
  });

  it("stays at zero for a client with no fee recorded", () => {
    assert.equal(monthlyEquivalent(0), 0);
  });
});

describe("locating a date in the engagement", () => {
  const start = new Date("2026-01-05T00:00:00.000Z");

  it("counts the first four weeks as period one", () => {
    assert.equal(periodNumberFor(start, start), 1);
    assert.equal(periodNumberFor(start, new Date("2026-01-31T00:00:00.000Z")), 1);
  });

  it("rolls into period two after four weeks, not after a calendar month", () => {
    // 2 February is more than a calendar month later but still period two, and
    // 1 February — a new month — is the same period as 31 January.
    assert.equal(periodNumberFor(start, new Date("2026-02-01T00:00:00.000Z")), 1);
    assert.equal(periodNumberFor(start, new Date("2026-02-02T00:00:00.000Z")), 2);
  });

  it("reaches period four once the initial engagement is over", () => {
    // Twelve weeks from 5 January is 30 March; anything after that is period four.
    assert.equal(periodNumberFor(start, new Date("2026-03-29T00:00:00.000Z")), 3);
    assert.equal(periodNumberFor(start, new Date("2026-03-30T00:00:00.000Z")), 4);
  });

  it("returns nothing for a date before the engagement began", () => {
    // Not period zero and not period one — there is no period, and a caller
    // that has to handle null cannot accidentally chart pre-engagement work as
    // if we had done it.
    assert.equal(periodNumberFor(start, new Date("2026-01-04T00:00:00.000Z")), null);
  });
});
