import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { costMicroUsd, monthStartUtc } from "./cost";

describe("AI run cost (AI-08)", () => {
  it("is unknown until prices are configured, never guessed", () => {
    assert.equal(costMicroUsd(1000, 500, {}), null);
  });
  it("computes micro-dollars from per-million-token prices", () => {
    // $3 / M input and $15 / M output: 1,000 in + 500 out = $0.003 + $0.0075 = 10,500 micro-dollars
    assert.equal(costMicroUsd(1000, 500, { AI_PRICE_INPUT_PER_MTOK: "3", AI_PRICE_OUTPUT_PER_MTOK: "15" }), 10_500);
  });
  it("budgets by UTC calendar month", () => {
    assert.equal(monthStartUtc(new Date("2026-09-26T23:59:00Z")).toISOString(), "2026-09-01T00:00:00.000Z");
  });
});
