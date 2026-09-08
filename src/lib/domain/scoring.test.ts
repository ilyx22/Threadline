import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyPerformance,
  engagementRate,
  healthBand,
  healthScore,
  ideaPriority,
  median,
  patternBand,
  patternScore,
  periodDelta,
  priorityBand,
} from "./scoring";

describe("idea priority", () => {
  const base = {
    relevanceScore: 50,
    noveltyScore: 50,
    proofStrength: 50,
    formatFit: 50,
    commercialIntent: "low",
  };

  it("returns the weighted blend with no intent bonus", () => {
    assert.equal(ideaPriority(base), 50);
  });

  it("adds the commercial intent bonus", () => {
    assert.equal(ideaPriority({ ...base, commercialIntent: "medium" }), 53);
    assert.equal(ideaPriority({ ...base, commercialIntent: "high" }), 58);
  });

  it("weights relevance most heavily", () => {
    const relevance = ideaPriority({ ...base, relevanceScore: 100 });
    const formatFit = ideaPriority({ ...base, formatFit: 100 });
    assert.ok(relevance > formatFit, "relevance should outweigh format fit");
  });

  it("never exceeds 100", () => {
    assert.equal(
      ideaPriority({
        relevanceScore: 100,
        noveltyScore: 100,
        proofStrength: 100,
        formatFit: 100,
        commercialIntent: "high",
      }),
      100,
    );
  });

  it("clamps out-of-range and non-finite inputs", () => {
    assert.equal(ideaPriority({ ...base, relevanceScore: 500 }), 65);
    assert.equal(
      ideaPriority({ ...base, relevanceScore: Number.NaN }),
      35,
      "NaN should be treated as zero, not propagate",
    );
  });

  it("bands sensibly", () => {
    assert.equal(priorityBand(85).label, "High");
    assert.equal(priorityBand(65).label, "Medium");
    assert.equal(priorityBand(20).label, "Low");
  });
});

describe("pattern score", () => {
  it("is zero at zero confidence", () => {
    assert.equal(patternScore({ confidence: 0, impact: 5, effort: 1 }), 0);
  });

  it("peaks at full confidence, max impact, minimum effort", () => {
    assert.equal(patternScore({ confidence: 100, impact: 5, effort: 1 }), 25);
  });

  it("discounts for effort", () => {
    const cheap = patternScore({ confidence: 80, impact: 4, effort: 1 });
    const costly = patternScore({ confidence: 80, impact: 4, effort: 5 });
    assert.ok(cheap > costly);
  });

  it("bands sensibly", () => {
    assert.equal(patternBand(20).label, "Act now");
    assert.equal(patternBand(10).label, "Worth testing");
    assert.equal(patternBand(3).label, "Watch");
  });
});

describe("engagement rate", () => {
  it("guards zero views instead of returning Infinity", () => {
    const rate = engagementRate({ likes: 10, comments: 2, shares: 1, saves: 0, views: 0 });
    assert.equal(rate, 0);
    assert.ok(Number.isFinite(rate));
  });

  it("computes interactions over views", () => {
    assert.equal(
      engagementRate({ likes: 40, comments: 5, shares: 3, saves: 2, views: 1000 }),
      5,
    );
  });
});

describe("period delta", () => {
  it("returns null when there is no baseline to compare against", () => {
    assert.equal(periodDelta(500, 0), null);
  });

  it("returns zero when both periods are empty", () => {
    assert.equal(periodDelta(0, 0), 0);
  });

  it("computes percentage change", () => {
    assert.equal(periodDelta(150, 100), 50);
    assert.equal(periodDelta(50, 100), -50);
  });
});

describe("performance classification", () => {
  it("uses the median so one outlier does not relabel everything", () => {
    const values = [100, 100, 100, 100, 10_000];
    const med = median(values);
    assert.equal(med, 100);
    assert.equal(classifyPerformance(10_000, med), "winner");
    assert.equal(classifyPerformance(100, med), "typical");
    assert.equal(classifyPerformance(20, med), "loser");
  });

  it("reports unknown when there is no baseline", () => {
    assert.equal(classifyPerformance(500, 0), "unknown");
  });

  it("computes the median of an even-length set", () => {
    assert.equal(median([10, 20, 30, 40]), 25);
    assert.equal(median([]), 0);
  });
});

describe("client health", () => {
  it("is perfect for a client with nothing outstanding and output on target", () => {
    assert.equal(
      healthScore({
        overdueApprovals: 0,
        missingRecordings: 0,
        daysSinceActivity: 1,
        publishedLast30: 12,
        targetLast30: 12,
      }),
      100,
    );
  });

  it("falls as work backs up", () => {
    const score = healthScore({
      overdueApprovals: 4,
      missingRecordings: 3,
      daysSinceActivity: 10,
      publishedLast30: 4,
      targetLast30: 12,
    });
    assert.ok(score < 60, `expected a poor score, got ${score}`);
    assert.ok(score >= 0);
  });

  it("never goes below zero", () => {
    assert.equal(
      healthScore({
        overdueApprovals: 100,
        missingRecordings: 100,
        daysSinceActivity: 365,
        publishedLast30: 0,
        targetLast30: 20,
      }),
      0,
    );
  });

  it("bands sensibly", () => {
    assert.equal(healthBand(90).label, "Healthy");
    assert.equal(healthBand(70).label, "Watch");
    assert.equal(healthBand(40).label, "At risk");
  });
});
