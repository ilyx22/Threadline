import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { figuresIn, guaranteesIn, packageClaimProblems } from "./package-claims";

describe("claim checks on packaging (DEL-05)", () => {
  it("finds figures and promise language", () => {
    assert.deepEqual(figuresIn("We cut churn 38% and added £1.2m, 3x faster, in 90 days with 12 clients."), ["38%", "£1.2m", "3x", "90 days", "12 clients"]);
    assert.deepEqual(guaranteesIn("Guaranteed results, risk-free."), ["guaranteed", "risk-free"]);
    assert.deepEqual(figuresIn("Why founders stall after the first hire"), []);
  });

  it("clears a package with no figures, or figures backed by a verified script", () => {
    assert.deepEqual(packageClaimProblems("Why founders stall", null), []);
    assert.deepEqual(packageClaimProblems("How we cut churn 38%", { text: "We cut churn 38% over two quarters.", claimsVerified: true }), []);
  });

  it("refuses unbacked figures, unverified scripts and any guarantee", () => {
    assert.match(packageClaimProblems("Cut churn 45%", { text: "We cut churn 38%.", claimsVerified: true }).join(" "), /not in the script: 45%/);
    assert.match(packageClaimProblems("Cut churn 38%", { text: "We cut churn 38%.", claimsVerified: false }).join(" "), /not verified/);
    assert.match(packageClaimProblems("Cut churn 38%", null).join(" "), /no script behind them/);
    assert.match(packageClaimProblems("Guaranteed growth", null).join(" "), /promise language: guaranteed/);
  });
});
