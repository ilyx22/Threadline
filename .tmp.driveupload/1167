import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertActiveRecord,
  assertCallOutcome,
  assertInterviewEvidence,
  assertProspectTransition,
  assertWedgeTransition,
  callProgress,
  checklistStatus,
  defaultNextAction,
  missingCallStages,
  OUTCOME_TO_STATE,
  PROSPECT_SOP,
  readValidation,
  REPLY_GUIDANCE,
  requiresNextAction,
  INTERIM_CHECKPOINT,
  VALIDATION_DECISION_MINIMUM,
  CONVERGENCE_MINIMUM,
  resolveCheck,
  WEDGE_SOP,
  type CheckState,
} from "./sop";
import { PROSPECT_STATES, REPLY_CLASSES, WEDGE_STATES } from "./enums";
import { WorkflowError } from "./workflow";

/**
 * The rules these tests protect:
 *
 *   1. a checklist item that asked for a finding is not satisfied by a tick;
 *   2. a forward transition is refused while required items are outstanding,
 *      unless a reason is written down;
 *   3. closing a record honestly is always allowed;
 *   4. no active record exists without a next action and a date;
 *   5. commercial testing cannot start before the interview sample exists;
 *   6. a call ends in one outcome, with their words, and a date if it is alive.
 */

/** Every required item ticked, with a note where one was asked for. */
function satisfy(state: keyof typeof PROSPECT_SOP): CheckState[] {
  return PROSPECT_SOP[state].checklist.map((item) => ({
    key: item.key,
    done: true,
    note: item.requiresNote ? "what we found" : null,
  }));
}

describe("state definitions", () => {
  it("covers every declared state", () => {
    for (const state of PROSPECT_STATES) assert.ok(PROSPECT_SOP[state], `missing ${state}`);
    for (const state of WEDGE_STATES) assert.ok(WEDGE_SOP[state], `missing ${state}`);
  });

  it("only points at states that exist", () => {
    for (const def of Object.values(PROSPECT_SOP)) {
      for (const next of def.next) {
        assert.ok(PROSPECT_SOP[next], `${def.state} points at unknown state ${next}`);
      }
    }
    for (const def of Object.values(WEDGE_SOP)) {
      for (const next of def.next) {
        assert.ok(WEDGE_SOP[next], `${def.state} points at unknown state ${next}`);
      }
    }
  });

  it("tells the operator what the state means and what done looks like", () => {
    for (const def of [...Object.values(PROSPECT_SOP), ...Object.values(WEDGE_SOP)]) {
      assert.ok(def.meaning.length > 10, `${def.state} has no meaning`);
      assert.ok(def.why.length > 10, `${def.state} does not say why it matters`);
      assert.ok(def.completion.length > 10, `${def.state} has no completion criteria`);
    }
  });

  it("encodes no channel anywhere", () => {
    // A platform is one component of an acquisition system, not the system.
    const serialised = JSON.stringify([PROSPECT_SOP, WEDGE_SOP, REPLY_GUIDANCE]).toLowerCase();
    for (const channel of ["linkedin", "instagram", "tiktok", "twitter", "cold email"]) {
      assert.equal(serialised.includes(channel), false, `the SOP must not hard-code ${channel}`);
    }
  });
});

describe("checklist", () => {
  it("does not accept a tick where a finding was asked for", () => {
    const status = checklistStatus(PROSPECT_SOP.qualified_a, [
      { key: "specific", done: true, note: null },
    ]);
    const item = status.items.find((i) => i.key === "specific");
    assert.equal(item?.done, true);
    assert.equal(item?.satisfied, false, "a tick records that someone looked, not what they found");
  });

  it("accepts it once the finding is written", () => {
    const status = checklistStatus(PROSPECT_SOP.qualified_a, [
      { key: "specific", done: true, note: "They rebuilt an airport baggage system in 2024." },
    ]);
    assert.equal(status.items.find((i) => i.key === "specific")?.satisfied, true);
  });

  it("ignores whitespace passed off as a note", () => {
    const status = checklistStatus(PROSPECT_SOP.qualified_a, [
      { key: "specific", done: true, note: "   " },
    ]);
    assert.equal(status.items.find((i) => i.key === "specific")?.satisfied, false);
  });

  it("does not let an optional item hold a state open", () => {
    // The personalised walkthrough is a judgement call, not an obligation.
    const checks = satisfy("qualified_a").filter((c) => c.key !== "loom");
    const status = checklistStatus(PROSPECT_SOP.qualified_a, checks);
    assert.equal(status.complete, true);
    assert.equal(status.progress, 100);
  });

  it("reports progress over required items only", () => {
    const status = checklistStatus(PROSPECT_SOP.qualified_b, [
      { key: "research", done: true, note: "They publish weekly and nobody watches it." },
    ]);
    assert.equal(status.progress, 50);
    assert.equal(status.complete, false);
  });
});

describe("prospect transitions", () => {
  it("refuses a jump that does not exist", () => {
    assert.throws(
      () => assertProspectTransition("new", "won", { checks: satisfy("new") }),
      WorkflowError,
    );
  });

  it("refuses a forward move while required work is outstanding", () => {
    assert.throws(
      () => assertProspectTransition("qualified_a", "contacted", { checks: [] }),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        // The message must name the outstanding items, not just refuse.
        assert.match(error.message, /Send the first touch/);
        return true;
      },
    );
  });

  it("allows it once the checklist is satisfied", () => {
    assert.doesNotThrow(() =>
      assertProspectTransition("qualified_a", "contacted", { checks: satisfy("qualified_a") }),
    );
  });

  it("allows an override, which is what makes the reason recordable", () => {
    assert.doesNotThrow(() =>
      assertProspectTransition("qualified_a", "contacted", {
        checks: [],
        override: "Known company, the founder asked us to send it today.",
      }),
    );
  });

  it("treats blank whitespace as no reason at all", () => {
    assert.throws(() =>
      assertProspectTransition("qualified_a", "contacted", { checks: [], override: "   " }),
    );
  });

  it("always allows an honest close", () => {
    // Being unable to write "not a fit" without finishing a checklist is how
    // dead pipeline accumulates.
    for (const from of ["new", "qualified_a", "booked", "proposal"] as const) {
      assert.doesNotThrow(
        () => assertProspectTransition(from, "not_fit", { checks: [] }),
        `${from} -> not_fit should never be gated`,
      );
    }
  });
});

describe("wedge transitions", () => {
  it("cannot skip immersion", () => {
    assert.throws(() => assertWedgeTransition("candidate", "interviews", { checks: [] }));
  });

  it("can always be revised", () => {
    assert.doesNotThrow(() => assertWedgeTransition("interviews", "revised", { checks: [] }));
  });
});

describe("the operating invariant", () => {
  it("refuses an active record with no next action", () => {
    assert.throws(
      () => assertActiveRecord("contacted", { nextAction: null, nextActionDueAt: new Date() }),
      /next action/i,
    );
  });

  it("refuses an active record with no date", () => {
    assert.throws(
      () => assertActiveRecord("contacted", { nextAction: "Follow up", nextActionDueAt: null }),
      /date/i,
    );
  });

  it("accepts a record that has both", () => {
    assert.doesNotThrow(() =>
      assertActiveRecord("contacted", { nextAction: "Follow up", nextActionDueAt: new Date() }),
    );
  });

  it("does not demand one of a closed record", () => {
    for (const state of ["won", "lost", "not_fit"]) {
      assert.doesNotThrow(() =>
        assertActiveRecord(state, { nextAction: null, nextActionDueAt: null }),
      );
      assert.equal(requiresNextAction(state), false);
    }
  });

  it("applies to wedges too, except a revised one", () => {
    assert.equal(requiresNextAction("immersion"), true);
    assert.equal(requiresNextAction("revised"), false);
  });

  it("supplies a default where the timing is genuinely deterministic", () => {
    const from = new Date(2026, 8, 1, 9, 0, 0);
    const next = defaultNextAction(PROSPECT_SOP.replied, from);
    assert.ok(next);
    assert.equal(next?.dueAt.getDate(), 2);
    assert.equal(next?.dueAt.getHours(), 12);
  });

  it("returns nothing where it is not", () => {
    // A won record's timing belongs to a different SOP.
    assert.equal(defaultNextAction(PROSPECT_SOP.won), null);
  });
});

describe("validation evidence", () => {
  const problem = "Nobody owns the content, so it stops whenever a deal gets busy";
  const theme = "expertise never leaves the room";

  /** n conversations, all on the same operator-assigned theme. */
  const converging = (n: number, volunteered = true) =>
    Array.from({ length: n }, () => ({ volunteered, problem, theme }));

  describe("the two thresholds", () => {
    it("treats five as a checkpoint, not a gate", () => {
      const reading = readValidation(converging(INTERIM_CHECKPOINT));
      assert.equal(reading.checkpointReached, true);
      assert.equal(reading.decisionEligible, false);
      // The specific failure this prevents: freezing a wedge on five
      // conversations, which mostly measures our ability to find five
      // agreeable people.
      assert.match(reading.reading, /not a decision|progress check/i);
    });

    it("refuses commercial testing below ten, saying five is only a checkpoint", () => {
      assert.throws(() => assertInterviewEvidence(5, 5), /5 of 10/);
      assert.throws(() => assertInterviewEvidence(5, 5), /interim checkpoint, not a validation gate/i);
    });

    it("refuses below ten without mentioning the checkpoint when nowhere near it", () => {
      assert.throws(() => assertInterviewEvidence(2, 2), /2 of 10/);
      assert.doesNotMatch(
        (() => {
          try {
            assertInterviewEvidence(2, 2);
            return "";
          } catch (e) {
            return (e as Error).message;
          }
        })(),
        /interim checkpoint, not a validation gate/i,
      );
    });

    it("becomes eligible for a decision at ten", () => {
      const reading = readValidation(converging(VALIDATION_DECISION_MINIMUM));
      assert.equal(reading.decisionEligible, true);
    });
  });

  describe("convergence", () => {
    it("requires more than five converging, not merely ten conversations", () => {
      // Ten people who said ten different things is a large sample that agrees
      // on nothing — evidence the hypothesis is wrong, not evidence to test it.
      const scattered = Array.from({ length: 10 }, (_, i) => ({
        volunteered: true,
        problem: `problem ${i}`,
        theme: `theme ${i}`,
      }));
      assert.throws(() => assertInterviewEvidence(10, 1), /only 1 converge/i);
      const reading = readValidation(scattered);
      assert.equal(reading.convergenceMet, false);
      assert.match(reading.reading, /interview more|change the hypothesis/i);
    });

    it("passes at six converging out of ten", () => {
      const mixed = [
        ...converging(CONVERGENCE_MINIMUM),
        ...Array.from({ length: 4 }, (_, i) => ({
          volunteered: true,
          problem: "something else",
          theme: `other ${i}`,
        })),
      ];
      const reading = readValidation(mixed);
      assert.equal(reading.convergence, CONVERGENCE_MINIMUM);
      assert.equal(reading.convergenceMet, true);
      assert.doesNotThrow(() => assertInterviewEvidence(reading.total, reading.convergence));
    });

    it("fails at exactly five converging, because the rule is more than five", () => {
      assert.throws(() => assertInterviewEvidence(12, 5), /more than 5 converging/i);
    });

    it("counts only conversations an operator has themed", () => {
      // Convergence is a judgement about whether two people described the same
      // expensive problem in different words. No string comparison makes that
      // judgement, so an unthemed conversation is excluded rather than guessed.
      const reading = readValidation([
        ...converging(3),
        ...Array.from({ length: 7 }, () => ({ volunteered: true, problem, theme: null })),
      ]);
      assert.equal(reading.total, 10);
      assert.equal(reading.convergence, 3);
      assert.equal(reading.unclassified, 7);
      assert.match(reading.reading, /no theme assigned/i);
    });

    it("does not converge identical wording without a theme", () => {
      const reading = readValidation(
        Array.from({ length: 10 }, () => ({ volunteered: true, problem })),
      );
      assert.equal(reading.convergence, 0);
      assert.equal(reading.headline, null);
    });
  });

  describe("how it is described", () => {
    it("never expresses the reading as a rate", () => {
      const reading = readValidation(converging(VALIDATION_DECISION_MINIMUM));
      // A percentage here is false precision somebody would eventually quote in
      // a sales call.
      assert.doesNotMatch(reading.reading, /\d+\s*%/);
      assert.match(reading.reading, /not a measured rate/i);
    });

    it("says so when the sample is too small to read at all", () => {
      const reading = readValidation(converging(1));
      assert.equal(reading.checkpointReached, false);
      assert.match(reading.reading, /too early/i);
    });

    it("calls out a sample where we named every problem first", () => {
      const reading = readValidation(converging(VALIDATION_DECISION_MINIMUM, false));
      assert.equal(reading.volunteered, 0);
      assert.match(reading.reading, /weakest evidence/i);
      // And it says so regardless of how large the sample got.
      assert.match(reading.reading, /whatever the sample size/i);
    });

    it("reads nothing at all out of nothing", () => {
      const reading = readValidation([]);
      assert.equal(reading.convergence, 0);
      assert.match(reading.reading, /no conversations/i);
    });
  });
});

describe("the call", () => {
  const covered = ["economics", "current_state", "constraint", "consequence"];

  it("knows which information is still missing", () => {
    assert.deepEqual(missingCallStages(["economics"]), [
      "current_state",
      "constraint",
      "consequence",
    ]);
    assert.deepEqual(missingCallStages(covered), []);
  });

  it("refuses an outcome when the diagnosis was not made", () => {
    assert.throws(
      () =>
        assertCallOutcome("won", {
          voc: "They said it themselves",
          stagesCovered: ["open", "demo"],
        }),
      /did not cover/i,
    );
  });

  it("still allows an honest no-fit without a full diagnosis", () => {
    // Discovering in the first two minutes that they cannot afford this is a
    // correct outcome, not an incomplete call.
    assert.doesNotThrow(() =>
      assertCallOutcome("not_fit", { voc: "We are pre-revenue", stagesCovered: ["open"] }),
    );
  });

  it("refuses any outcome without their exact words", () => {
    assert.throws(
      () => assertCallOutcome("won", { voc: "  ", stagesCovered: covered }),
      /their words/i,
    );
  });

  it("requires a dated next action for an outcome that is still alive", () => {
    assert.throws(
      () => assertCallOutcome("follow_up", { voc: "Interested, needs board sign-off", stagesCovered: covered }),
      /next action/i,
    );
    assert.throws(
      () =>
        assertCallOutcome("proposal_process", {
          voc: "Send it over",
          nextAction: "Send the proposal",
          nextActionDueAt: null,
          stagesCovered: covered,
        }),
      /date/i,
    );
  });

  it("does not demand one of a decided outcome", () => {
    assert.doesNotThrow(() =>
      assertCallOutcome("won", { voc: "Let's start in October", stagesCovered: covered }),
    );
  });

  it("maps every outcome to exactly one state", () => {
    for (const [outcome, state] of Object.entries(OUTCOME_TO_STATE)) {
      assert.ok(PROSPECT_SOP[state], `${outcome} maps to unknown state ${state}`);
    }
  });

  it("reports stage coverage with the notes attached", () => {
    const progress = callProgress(["economics"], { economics: "GBP 40k average deal" });
    const economics = progress.find((s) => s.stage === "economics");
    assert.equal(economics?.covered, true);
    assert.equal(economics?.note, "GBP 40k average deal");
    assert.equal(progress.find((s) => s.stage === "demo")?.covered, false);
  });
});

describe("reply guidance", () => {
  it("covers every reply class", () => {
    for (const cls of REPLY_CLASSES) {
      const guidance = REPLY_GUIDANCE[cls];
      assert.ok(guidance, `no guidance for ${cls}`);
      assert.ok(PROSPECT_SOP[guidance.nextState], `${cls} points at an unknown state`);
      assert.ok(guidance.dueInDays > 0, `${cls} has no follow-up interval`);
    }
  });

  it("treats a request for information as the deferral it usually is", () => {
    assert.match(REPLY_GUIDANCE.send_info.objective, /deferral/i);
  });
});

describe("saving a check", () => {
  it("toggles from what is stored rather than from what was posted", () => {
    // The posted value is deliberately wrong here — it is what the browser
    // serialised before the click. The stored value is the one that counts.
    assert.deepEqual(
      resolveCheck("toggle", { done: false, note: null }, { done: false, note: null }),
      { done: true, note: null },
    );
    assert.deepEqual(
      resolveCheck("toggle", { done: true, note: null }, { done: true, note: null }),
      { done: false, note: null },
    );
  });

  it("treats a first toggle on an unsaved item as ticking it", () => {
    assert.deepEqual(resolveCheck("toggle", { done: false, note: null }, null), {
      done: true,
      note: null,
    });
  });

  it("never erases a note when a box is toggled", () => {
    const stored = { done: true, note: "What we found last week" };
    assert.equal(resolveCheck("toggle", { done: false, note: null }, stored).note, stored.note);
  });

  it("takes the posted value on an explicit save", () => {
    assert.deepEqual(
      resolveCheck("set", { done: true, note: "Found it" }, { done: false, note: null }),
      { done: true, note: "Found it" },
    );
  });
});
