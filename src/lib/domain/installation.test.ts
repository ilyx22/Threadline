import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MILESTONES,
  MILESTONE_KEYS,
  installationDay,
  installationProgress,
  isInstallationComplete,
  nextMilestone,
  resolveMilestones,
  type InstallationFacts,
} from "./installation";

/**
 * The rule these tests protect: a milestone reads as complete only when the
 * work behind it genuinely exists, and an operator's blocker always wins over
 * a healthy-looking count.
 */

const EMPTY: InstallationFacts = {
  brandBrainCompleteness: 0,
  readinessStatus: "not_assessed",
  readinessSubmitted: false,
  onboardingComplete: false,
  diagnosisActive: false,
  diagnosisDimensionsRated: 0,
  publishedRuns: 0,
  runsInProgress: 0,
  approvedSignals: 0,
  scriptsReady: 0,
  scriptsDrafted: 0,
  contentItems: 0,
  contentInProduction: 0,
  recordingQueue: 0,
};

const DONE: InstallationFacts = {
  brandBrainCompleteness: 92,
  readinessStatus: "ready",
  readinessSubmitted: true,
  onboardingComplete: true,
  diagnosisActive: true,
  diagnosisDimensionsRated: 9,
  publishedRuns: 1,
  runsInProgress: 0,
  approvedSignals: 4,
  scriptsReady: 6,
  scriptsDrafted: 2,
  contentItems: 9,
  contentInProduction: 6,
  recordingQueue: 0,
};

const byKey = (states: ReturnType<typeof resolveMilestones>) =>
  Object.fromEntries(states.map((s) => [s.key, s]));

describe("milestone definitions", () => {
  it("defines every declared key exactly once", () => {
    assert.equal(MILESTONES.length, MILESTONE_KEYS.length);
    assert.equal(new Set(MILESTONES.map((m) => m.key)).size, MILESTONE_KEYS.length);
  });

  it("keeps every milestone inside the first week", () => {
    for (const milestone of MILESTONES) {
      assert.ok(milestone.targetDay >= 1 && milestone.targetDay <= 7, milestone.key);
    }
  });

  it("requires a sign-off only where completion is a decision, not a record", () => {
    const signOff = MILESTONES.filter((m) => m.requiresSignOff).map((m) => m.key);
    assert.deepEqual(signOff, ["strategy_approved"]);
  });
});

describe("derived milestone state", () => {
  it("starts everything not started on an empty workspace", () => {
    const states = resolveMilestones(EMPTY);
    assert.ok(states.every((s) => s.status === "not_started"));
    assert.equal(installationProgress(states), 0);
    assert.equal(isInstallationComplete(states), false);
  });

  it("does not complete the strategy without a sign-off, even when the work exists", () => {
    const states = byKey(resolveMilestones(DONE));
    assert.equal(states.strategy_approved?.status, "in_progress");
    assert.match(states.strategy_approved?.detail ?? "", /awaiting sign-off/i);
  });

  it("completes the strategy once a person signs it off", () => {
    const states = byKey(
      resolveMilestones(DONE, [
        {
          key: "strategy_approved",
          note: null,
          blockedReason: null,
          signedOffAt: new Date(),
          targetDate: null,
        },
      ]),
    );
    assert.equal(states.strategy_approved?.status, "complete");
  });

  it("completes the whole installation only with the sign-off present", () => {
    const withoutSignOff = resolveMilestones(DONE);
    assert.equal(isInstallationComplete(withoutSignOff), false);

    const withSignOff = resolveMilestones(DONE, [
      {
        key: "strategy_approved",
        note: null,
        blockedReason: null,
        signedOffAt: new Date(),
        targetDate: null,
      },
    ]);
    assert.equal(isInstallationComplete(withSignOff), true);
    assert.equal(installationProgress(withSignOff), 100);
  });

  it("A BLOCKER OVERRIDES A COMPLETE DERIVED STATE", () => {
    const states = byKey(
      resolveMilestones(DONE, [
        {
          key: "first_brief",
          note: null,
          blockedReason: "Waiting on the founder to send the call recordings.",
          signedOffAt: null,
          targetDate: null,
        },
      ]),
    );
    assert.equal(states.first_brief?.status, "blocked");
    assert.equal(
      states.first_brief?.blockedReason,
      "Waiting on the founder to send the call recordings.",
    );
  });

  it("reports partial progress rather than nothing", () => {
    const states = byKey(
      resolveMilestones({
        ...EMPTY,
        brandBrainCompleteness: 30,
        diagnosisDimensionsRated: 4,
        scriptsReady: 1,
      }),
    );
    assert.equal(states.context_captured?.status, "in_progress");
    assert.ok((states.context_captured?.progress ?? 0) > 0);
    assert.equal(states.diagnosis_complete?.status, "in_progress");
    assert.match(states.diagnosis_complete?.detail ?? "", /4 of 9/);
    assert.equal(states.first_scripts?.status, "in_progress");
  });

  it("does not complete context capture on a high score alone", () => {
    const states = byKey(
      resolveMilestones({ ...EMPTY, brandBrainCompleteness: 90, onboardingComplete: false }),
    );
    assert.equal(states.context_captured?.status, "in_progress");
    assert.match(states.context_captured?.detail ?? "", /onboarding/i);
  });

  it("treats a named limitation as a completed recording check", () => {
    // Somebody looked, named the constraint and decided it is workable. That is
    // a finished check, not a half-done one.
    const limited = byKey(resolveMilestones({ ...DONE, readinessStatus: "ready_with_limitation" }));
    assert.equal(limited.recording_ready?.status, "complete");
    assert.match(limited.recording_ready?.detail ?? "", /limitation/i);
  });

  it("BLOCKS the recording check when the setup cannot produce footage", () => {
    const blocked = byKey(resolveMilestones({ ...DONE, readinessStatus: "blocked" }));
    assert.equal(blocked.recording_ready?.status, "blocked");
    assert.equal(
      isInstallationComplete(resolveMilestones({ ...DONE, readinessStatus: "blocked" })),
      false,
      "a blocked recording setup must stop the installation reading as complete",
    );
  });

  it("distinguishes submitted-awaiting-review from never described", () => {
    const submitted = byKey(
      resolveMilestones({ ...EMPTY, readinessStatus: "not_assessed", readinessSubmitted: true }),
    );
    assert.equal(submitted.recording_ready?.status, "in_progress");
    assert.match(submitted.recording_ready?.detail ?? "", /awaiting review/i);

    const untouched = byKey(resolveMilestones(EMPTY));
    assert.equal(untouched.recording_ready?.status, "not_started");
  });

  it("never reports a completion the records do not support", () => {
    const states = byKey(resolveMilestones(EMPTY));
    assert.equal(states.first_brief?.status, "not_started");
    assert.equal(states.first_recording?.status, "not_started");
    assert.equal(states.first_production?.status, "not_started");
  });
});

describe("next action", () => {
  it("surfaces a blocker ahead of anything else", () => {
    const states = resolveMilestones(DONE, [
      {
        key: "first_production",
        note: null,
        blockedReason: "No editor available this week.",
        signedOffAt: null,
        targetDate: null,
      },
    ]);
    assert.equal(nextMilestone(states)?.key, "first_production");
  });

  it("otherwise surfaces the first thing in progress", () => {
    const states = resolveMilestones({ ...EMPTY, brandBrainCompleteness: 40 });
    assert.equal(nextMilestone(states)?.key, "context_captured");
  });

  it("returns nothing once everything is complete", () => {
    const states = resolveMilestones(DONE, [
      {
        key: "strategy_approved",
        note: null,
        blockedReason: null,
        signedOffAt: new Date(),
        targetDate: null,
      },
    ]);
    assert.equal(nextMilestone(states), null);
  });
});

describe("installation day", () => {
  it("counts from the start date, 1-indexed", () => {
    const start = new Date("2026-03-01T09:00:00Z");
    assert.equal(installationDay(start, new Date("2026-03-01T18:00:00Z")), 1);
    assert.equal(installationDay(start, new Date("2026-03-07T10:00:00Z")), 7);
  });

  it("is null with no start date", () => {
    assert.equal(installationDay(null), null);
  });

  it("caps rather than running away for a long-running engagement", () => {
    const start = new Date("2020-01-01T00:00:00Z");
    assert.equal(installationDay(start, new Date("2026-01-01T00:00:00Z")), 99);
  });
});
