import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BASELINE_MINIMUMS,
  CORPUS_WORKING_MINIMUM,
  MATURITY_DAYS,
  chooseBaseline,
  engagementRate,
  readCorpus,
  readOutlier,
  type BaselineCandidate,
  type ExampleMetrics,
  type RelevanceInput,
} from "./corpus";

/**
 * The rules these tests protect:
 *
 *   1. an outlier is a comparison, and which comparison was used is always
 *      reported — a weaker one has to clear a higher bar to earn the same word;
 *   2. a piece is never in its own baseline;
 *   3. UNKNOWN survives. When no rung is strong enough the answer is "we cannot
 *      say", not a number computed from whatever was lying around;
 *   4. raw virality never decides anything on its own. A piece that travelled
 *      to people who cannot buy is a warning, not a template;
 *   5. relevance is rated by a person. `unrated` is honest and stays visible.
 */

const CAPTURED = new Date(2026, 5, 1);

const metrics = (views: number, extra: Partial<ExampleMetrics> = {}): ExampleMetrics => ({
  views,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  followers: 0,
  publishedAt: new Date(2026, 0, 1),
  capturedAt: CAPTURED,
  ...extra,
});

/** A ladder with only the rungs the test cares about. */
const ladder = (parts: Partial<Record<BaselineCandidate["source"], number[]>>): BaselineCandidate[] =>
  (["creator_format", "creator", "cohort", "platform"] as const).map((source) => ({
    source,
    views: parts[source] ?? [],
  }));

const rated: RelevanceInput = { buyerRelevance: "direct", commercialIntent: "commercial" };
const unrated: RelevanceInput = { buyerRelevance: "unrated", commercialIntent: "unrated" };

const read = (
  views: number,
  parts: Partial<Record<BaselineCandidate["source"], number[]>>,
  relevance: RelevanceInput = rated,
  extra: Partial<ExampleMetrics> = {},
) => readOutlier({ metrics: metrics(views, extra), baselines: ladder(parts), relevance });

/* ------------------------------- The ladder --------------------------------- */

describe("choosing a baseline", () => {
  it("prefers the same creator in the same format", () => {
    const chosen = chooseBaseline(
      ladder({ creator_format: [100, 110, 120], creator: [100, 110, 120, 9_000], platform: Array(20).fill(500) }),
    );
    assert.equal(chosen.source, "creator_format");
  });

  it("falls back to the creator overall when the format set is too thin", () => {
    // Two same-format pieces is below the minimum; the creator's wider body of
    // work still holds the audience constant, which is what matters most.
    const chosen = chooseBaseline(ladder({ creator_format: [100, 110], creator: [100, 110, 120, 130] }));
    assert.equal(chosen.source, "creator");
  });

  it("falls back to a cohort only when it is big enough to mean something", () => {
    const tooSmall = chooseBaseline(ladder({ creator: [100], cohort: [200, 210, 220] }));
    assert.equal(tooSmall.source, "none", "three other creators is not a cohort");

    const enough = chooseBaseline(
      ladder({ creator: [100], cohort: Array(BASELINE_MINIMUMS.cohort).fill(200) }),
    );
    assert.equal(enough.source, "cohort");
  });

  it("uses the platform baseline last, and needs the most of it", () => {
    const chosen = chooseBaseline(
      ladder({ platform: Array(BASELINE_MINIMUMS.platform).fill(1_000) }),
    );
    assert.equal(chosen.source, "platform");
    assert.equal(chosen.confidence, "low");

    const short = chooseBaseline(ladder({ platform: Array(BASELINE_MINIMUMS.platform - 1).fill(1_000) }));
    assert.equal(short.source, "none");
  });

  it("never blends rungs", () => {
    // A weighted mixture of a good comparison and a bad one is a bad comparison
    // wearing a number that looks considered.
    const chosen = chooseBaseline(
      ladder({ creator: [100, 100, 100, 100], platform: Array(20).fill(100_000) }),
    );
    assert.deepEqual(chosen.values, [100, 100, 100, 100]);
  });

  it("refuses a baseline whose median is zero", () => {
    const chosen = chooseBaseline(ladder({ creator: [0, 0, 0, 0] }));
    assert.equal(chosen.source, "none");
  });
});

/* -------------------------------- The bands ---------------------------------- */

describe("outlier reading", () => {
  it("says unknown rather than inventing a comparison", () => {
    const reading = read(100_000, { creator: [5_000, 6_000] });
    assert.equal(reading.band, "unknown");
    assert.equal(reading.multiple, null);
    assert.equal(reading.baselineSource, "none");
    assert.match(reading.reason, /Only 2 other examples/);
  });

  it("does not band a piece that has no view count yet (QA-004)", () => {
    // Captured from a URL, numbers not yet entered. 0 / median = 0x looked like
    // "under" — an underperformer — and would have fed calibration as a loser.
    const reading = read(0, { creator: [1_000, 1_000, 1_000, 1_000] });
    assert.equal(reading.band, "unknown");
    assert.equal(reading.multiple, null);
    assert.equal(reading.confidence, "none");
    assert.match(reading.reason, /No view count has been recorded/);
  });

  it("reads naturally when the creator is brand new to the corpus", () => {
    // Browser QA 2026-09-07 caught this rendering as "Only 0 other examples",
    // which reads like a bug even though the number was right.
    const reading = read(1_234, {});
    assert.equal(reading.band, "unknown");
    assert.doesNotMatch(reading.reason, /Only 0/);
    assert.match(reading.reason, /Nothing else from this creator yet/);
  });

  it("bands against the creator's own median, not raw views", () => {
    // 30,000 views is unremarkable for this creator and would top a
    // views-ranked list of anybody smaller.
    const reading = read(30_000, { creator: [28_000, 30_000, 32_000, 31_000] });
    assert.equal(reading.band, "typical");
  });

  it("raises the bar when the comparison is cross-creator", () => {
    // 2.5x is the interesting case: a real jump against your own history, and
    // well inside the noise between different accounts.
    const views = 2_500;
    const ownWork = read(views, { creator: [1_000, 1_000, 1_000, 1_000] });
    const strangers = read(views, { cohort: Array(10).fill(1_000) });

    assert.equal(ownWork.band, "strong", "2.5x your own median is a real jump");
    assert.equal(
      strangers.band,
      "typical",
      "2.5x the median of other people is mostly a statement about account size",
    );

    // And the bar really is higher rather than the band merely being relabelled.
    assert.equal(read(9_000, { cohort: Array(10).fill(1_000) }).band, "exceptional");
    assert.equal(read(4_000, { cohort: Array(10).fill(1_000) }).band, "strong");
  });

  it("reports which rung it landed on and how much to trust it", () => {
    const reading = read(5_000, { cohort: Array(6).fill(1_000) });
    assert.equal(reading.baselineSource, "cohort");
    assert.equal(reading.confidence, "low");
    assert.match(reading.reason, /cross-creator comparison/i);
  });

  it("separates strong from exceptional on the creator's own work", () => {
    const base = [1_000, 1_000, 1_000, 1_000];
    assert.equal(read(2_500, { creator: base }).band, "strong");
    assert.equal(read(6_000, { creator: base }).band, "exceptional");
  });

  it("notices content that underperformed its own creator", () => {
    const reading = read(300, { creator: [1_000, 1_000, 1_000, 1_000] });
    assert.equal(reading.band, "under");
    assert.match(reading.reason, /Underperformed/);
  });
});

/* --------------------------------- Freshness --------------------------------- */

describe("age and velocity", () => {
  it("derives views per day from the publish date", () => {
    const reading = read(
      3_000,
      { creator: [1_000, 1_000, 1_000, 1_000] },
      rated,
      { publishedAt: new Date(2026, 4, 2), capturedAt: new Date(2026, 5, 1) },
    );
    assert.equal(reading.ageDays !== null && Math.round(reading.ageDays), 30);
    assert.equal(reading.viewsPerDay, 100);
  });

  it("flags a piece whose numbers have not settled", () => {
    const reading = read(
      5_000,
      { creator: [1_000, 1_000, 1_000, 1_000] },
      rated,
      { publishedAt: new Date(2026, 4, 29), capturedAt: new Date(2026, 5, 1) },
    );
    assert.equal(reading.stillMoving, true);
    assert.match(reading.reason, new RegExp(`Re-capture after ${MATURITY_DAYS} days`));
  });

  it("treats a settled piece as settled", () => {
    const reading = read(5_000, { creator: [1_000, 1_000, 1_000, 1_000] });
    assert.equal(reading.stillMoving, false);
    assert.doesNotMatch(reading.reason, /Re-capture/);
  });

  it("has no velocity without a publish date", () => {
    const reading = read(5_000, { creator: [1_000, 1_000, 1_000, 1_000] }, rated, {
      publishedAt: null,
    });
    assert.equal(reading.viewsPerDay, null);
    assert.equal(reading.ageDays, null);
    assert.equal(reading.stillMoving, false);
  });

  it("reports engagement rate rather than banding on it", () => {
    const m = metrics(1_000, { likes: 80, comments: 15, shares: 5, saves: 0 });
    assert.equal(engagementRate(m), 0.1);
    assert.equal(engagementRate(metrics(0)), null);
  });

  it("computes reach against followers only when followers are known", () => {
    assert.equal(read(10_000, {}, rated, { followers: 5_000 }).reachRatio, 2);
    assert.equal(read(10_000, {}).reachRatio, null);
  });
});

/* ----------------------------- Commercial standing --------------------------- */

describe("commercial standing", () => {
  const base = [1_000, 1_000, 1_000, 1_000];

  it("is the point: reach in front of a buyer", () => {
    const reading = read(6_000, { creator: base }, {
      buyerRelevance: "direct",
      commercialIntent: "commercial",
    });
    assert.equal(reading.band, "exceptional");
    assert.equal(reading.commercialStanding, "commercial_outlier");
  });

  it("refuses to call a viral irrelevance a win", () => {
    // The whole reason the corpus is not ranked by views. This piece beat its
    // creator's baseline sixfold in front of nobody who could buy.
    const reading = read(6_000, { creator: base }, {
      buyerRelevance: "off_icp",
      commercialIntent: "entertainment",
    });
    assert.equal(reading.band, "exceptional");
    assert.equal(reading.commercialStanding, "popular_off_icp");
    assert.match(reading.commercialReason, /reach we cannot sell against/);
  });

  it("keeps ordinary content that is aimed correctly", () => {
    // Baseline material. A corpus of nothing but hits makes everything look
    // typical, so knowing what ordinary-and-on-target looks like is load-bearing.
    const reading = read(1_000, { creator: base }, {
      buyerRelevance: "direct",
      commercialIntent: "commercial",
    });
    assert.equal(reading.band, "typical");
    assert.equal(reading.commercialStanding, "relevant_but_ordinary");
  });

  it("counts an adjacent audience as reachable", () => {
    const reading = read(6_000, { creator: base }, {
      buyerRelevance: "adjacent",
      commercialIntent: "mixed",
    });
    assert.equal(reading.commercialStanding, "commercial_outlier");
  });

  it("will not guess when nobody has rated it", () => {
    const reading = read(6_000, { creator: base }, unrated);
    assert.equal(reading.commercialStanding, "unrated");
    assert.match(reading.commercialReason, /Nobody has said who this is for/);
  });

  it("says nothing about relevance when there is no band at all", () => {
    const reading = read(6_000, {}, rated);
    assert.equal(reading.band, "unknown");
    assert.equal(reading.commercialStanding, "unknown");
  });
});

/* -------------------------------- The corpus --------------------------------- */

describe("corpus reading", () => {
  const corpus = (extra: Partial<Parameters<typeof readCorpus>[0]> = {}) =>
    readCorpus({
      total: 150,
      analysed: 150,
      creators: 20,
      creatorsWithBaseline: 15,
      bandable: 140,
      commercialOutliers: 22,
      unrated: 0,
      ...extra,
    });

  it("calls a small corpus a reading list rather than a signal source", () => {
    const reading = corpus({ total: 12, analysed: 4, creators: 5, creatorsWithBaseline: 1, bandable: 3, commercialOutliers: 0 });
    assert.equal(reading.usable, false);
    assert.match(reading.reading, new RegExp(`of ${CORPUS_WORKING_MINIMUM}`));
    assert.match(reading.reading, /anecdote with arithmetic/i);
  });

  it("says what an empty corpus needs", () => {
    const reading = corpus({ total: 0, analysed: 0, creators: 0, creatorsWithBaseline: 0, bandable: 0, commercialOutliers: 0 });
    assert.match(reading.reading, /ordinary content/i);
  });

  it("flags a corpus of hits with no baselines", () => {
    const reading = corpus({ creators: 150, creatorsWithBaseline: 0, bandable: 0, commercialOutliers: 0 });
    assert.match(reading.reading, /no creator has/i);
  });

  it("flags a corpus nobody has rated for relevance", () => {
    // Without ratings the corpus can report what travelled and nothing about
    // whether it is worth copying, which is the only question it exists for.
    const reading = corpus({ unrated: 90 });
    assert.match(reading.reading, /unrated for buyer relevance/i);
  });

  it("leads with the number that matters once it can", () => {
    const reading = corpus();
    assert.match(reading.reading, /22 of which outperformed in front of a plausible buyer/);
  });
});
