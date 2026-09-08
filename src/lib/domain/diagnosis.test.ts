import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DIMENSION_QUESTION,
  VOLUME_HELPS,
  constrainedDimensions,
  defaultReviewDate,
  diagnosisAverage,
  isComplete,
  isReviewOverdue,
  missingDimensions,
  provisionalRatings,
  suggestedSeverity,
  volumeVerdict,
  weakestDimension,
  type DimensionRating,
} from "./diagnosis";
import { CONSTRAINT_DIMENSIONS } from "./enums";

const ALL: DimensionRating[] = CONSTRAINT_DIMENSIONS.map((dimension) => ({
  dimension,
  rating: 4,
}));

describe("dimension definitions", () => {
  it("asks a question for every dimension", () => {
    for (const dimension of CONSTRAINT_DIMENSIONS) {
      assert.ok(DIMENSION_QUESTION[dimension], `no question for ${dimension}`);
    }
  });

  it("says whether volume helps for every dimension", () => {
    for (const dimension of CONSTRAINT_DIMENSIONS) {
      assert.equal(typeof VOLUME_HELPS[dimension], "boolean", `no verdict for ${dimension}`);
    }
  });

  it("REFUSES to claim more content fixes a positioning or offer problem", () => {
    // This is the whole reason the module exists.
    assert.equal(VOLUME_HELPS.positioning, false);
    assert.equal(VOLUME_HELPS.offer_alignment, false);
    assert.equal(VOLUME_HELPS.differentiation, false);
    assert.equal(VOLUME_HELPS.conversion, false);
    assert.equal(VOLUME_HELPS.audience, false);

    assert.match(volumeVerdict("positioning"), /will not fix/i);
    assert.match(volumeVerdict("conversion"), /more expensive/i);
  });

  it("allows that volume helps where it genuinely does", () => {
    assert.equal(VOLUME_HELPS.distribution, true);
    assert.match(volumeVerdict("distribution"), /plausibly helps/i);
  });

  it("keeps volume-helps a minority answer", () => {
    const helps = CONSTRAINT_DIMENSIONS.filter((d) => VOLUME_HELPS[d]).length;
    assert.ok(helps < CONSTRAINT_DIMENSIONS.length / 2, "more content must not be the usual answer");
  });
});

describe("weakest dimension", () => {
  it("finds the single weakest", () => {
    const ratings: DimensionRating[] = [
      { dimension: "positioning", rating: 4 },
      { dimension: "conversion", rating: 2 },
      { dimension: "operations", rating: 3 },
    ];
    assert.equal(weakestDimension(ratings), "conversion");
  });

  it("breaks ties deterministically by declared order", () => {
    const ratings: DimensionRating[] = [
      { dimension: "operations", rating: 2 },
      { dimension: "positioning", rating: 2 },
    ];
    // positioning comes first in CONSTRAINT_DIMENSIONS, so it wins both ways round.
    assert.equal(weakestDimension(ratings), "positioning");
    assert.equal(weakestDimension([...ratings].reverse()), "positioning");
  });

  it("returns null with nothing rated", () => {
    assert.equal(weakestDimension([]), null);
  });
});

describe("severity and averages", () => {
  it("escalates severity as the rating falls", () => {
    assert.equal(suggestedSeverity(1), "critical");
    assert.equal(suggestedSeverity(2), "high");
    assert.equal(suggestedSeverity(3), "medium");
    assert.equal(suggestedSeverity(5), "low");
  });

  it("averages only what was rated", () => {
    assert.equal(diagnosisAverage([]), 0);
    assert.equal(
      diagnosisAverage([
        { dimension: "positioning", rating: 2 },
        { dimension: "audience", rating: 4 },
      ]),
      3,
    );
  });

  it("clamps nonsense input rather than producing NaN", () => {
    const average = diagnosisAverage([
      { dimension: "positioning", rating: Number.NaN },
      { dimension: "audience", rating: 99 },
    ]);
    assert.ok(Number.isFinite(average));
    assert.ok(average >= 1 && average <= 5);
  });

  it("lists constrained dimensions weakest first", () => {
    const constrained = constrainedDimensions([
      { dimension: "positioning", rating: 2 },
      { dimension: "audience", rating: 1 },
      { dimension: "operations", rating: 4 },
    ]);
    assert.deepEqual(
      constrained.map((c) => c.dimension),
      ["audience", "positioning"],
    );
  });
});

describe("completeness gate", () => {
  it("is incomplete until all nine are rated", () => {
    assert.equal(isComplete([{ dimension: "positioning", rating: 2 }]), false);
    assert.equal(isComplete(ALL), true);
  });

  it("names what is missing", () => {
    const missing = missingDimensions([{ dimension: "positioning", rating: 2 }]);
    assert.equal(missing.length, CONSTRAINT_DIMENSIONS.length - 1);
    assert.equal(missing.includes("positioning"), false);
  });
});

describe("review cadence", () => {
  it("defaults a review a month out", () => {
    const from = new Date("2026-03-15T12:00:00Z");
    const next = defaultReviewDate(from);
    assert.ok(next > from);
    assert.equal(next.getMonth(), (from.getMonth() + 1) % 12);
  });

  it("flags an overdue review", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    assert.equal(isReviewOverdue(new Date("2026-04-01T00:00:00Z"), now), true);
    assert.equal(isReviewOverdue(new Date("2026-06-01T00:00:00Z"), now), false);
    assert.equal(isReviewOverdue(null, now), false);
  });
});

describe("provisional ratings from onboarding", () => {
  const base = {
    differentiatorCount: 0,
    painCount: 0,
    hasBookingUrl: false,
    leadMagnetCount: 0,
  };

  it("rates only the four dimensions onboarding can honestly answer", () => {
    const { ratings } = provisionalRatings(base);
    assert.deepEqual(
      ratings.map((r) => r.dimension).sort(),
      ["audience", "conversion", "offer_alignment", "operations"],
    );
  });

  it("never produces a complete diagnosis on its own", () => {
    const { ratings } = provisionalRatings(base);
    assert.equal(
      isComplete(ratings),
      false,
      "a questionnaire must never be able to activate a diagnosis",
    );
  });

  it("rates a stated mechanism and outcome above a missing one", () => {
    const stated = provisionalRatings({
      ...base,
      offerMechanism: "A twelve-week installation",
      offerOutcome: "A forecast you can plan against",
      differentiatorCount: 3,
    });
    const missing = provisionalRatings(base);

    const statedRating = stated.ratings.find((r) => r.dimension === "offer_alignment")?.rating ?? 0;
    const missingRating = missing.ratings.find((r) => r.dimension === "offer_alignment")?.rating ?? 0;
    assert.ok(statedRating > missingRating);
  });

  it("marks a one-person, high-hours operation as severely constrained", () => {
    const { ratings } = provisionalRatings({
      ...base,
      founderHoursPerWeek: 12,
      peopleInvolved: 1,
    });
    const operations = ratings.find((r) => r.dimension === "operations")?.rating;
    assert.equal(operations, 1);
  });

  it("marks a missing conversion path as severely constrained", () => {
    const { ratings } = provisionalRatings(base);
    const conversion = ratings.find((r) => r.dimension === "conversion")?.rating;
    assert.equal(conversion, 1);
  });

  it("writes a note against every rating it produces", () => {
    const { ratings, notes } = provisionalRatings(base);
    for (const rating of ratings) {
      assert.ok(notes[rating.dimension], `no note recorded for ${rating.dimension}`);
      assert.match(notes[rating.dimension] as string, /^Onboarding:/);
    }
  });
});
