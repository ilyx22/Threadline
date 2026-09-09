import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readGap, EMPTY_METRICS, type ActualContext } from "./content-diagnosis";
import { isTextLed } from "./workflow";

const strongEngaged: ActualContext = {
  metrics: { ...EMPTY_METRICS, views: 9000, likes: 400, comments: 90, shares: 60, saves: 120, trackedClicks: 2 },
  band: "strong",
  maturityDays: 21,
  snapshotCount: 3,
  buyerRelevanceObserved: "unknown",
};

describe("intended job", () => {
  test("a discovery piece that travelled and engaged but produced no action is 'none', not cta_conversion", () => {
    const authority = readGap({ expectation: null, actual: strongEngaged, intendedJob: "authority" });
    const discovery = readGap({ expectation: null, actual: strongEngaged, intendedJob: "discovery" });
    assert.equal(authority.failureClass, "cta_conversion");
    assert.equal(discovery.failureClass, "none");
    assert.equal(discovery.preserveThesis, true);
  });

  test("the default job is authority, so existing behaviour is unchanged", () => {
    assert.equal(readGap({ expectation: null, actual: strongEngaged }).failureClass, "cta_conversion");
  });
});

describe("text-led detection", () => {
  test("text posts, carousels and text platforms are text-led; video formats are not", () => {
    assert.equal(isTextLed({ format: "text_post", platform: "linkedin" }), true);
    assert.equal(isTextLed({ format: "carousel", platform: "linkedin" }), true);
    assert.equal(isTextLed({ format: "short_form", platform: "x" }), true);
    assert.equal(isTextLed({ format: "short_form", platform: "threads" }), true);
    assert.equal(isTextLed({ format: "short_form", platform: "linkedin" }), false);
    assert.equal(isTextLed({ format: "long_form", platform: "youtube" }), false);
  });
});
