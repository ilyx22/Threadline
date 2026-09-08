import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHECK_DEFINITIONS,
  READINESS_CHECKS,
  RECORDING_FORMATS,
  RECORDING_FORMAT_META,
  assertReadinessAssessment,
  blockingChecks,
  canRecord,
  isComplete,
  missingChecks,
  needsClientAction,
  suggestedStatus,
  type CheckInput,
} from "./readiness";
import { WorkflowError } from "./workflow";

/**
 * The rule these tests protect: a recording setup cannot be called ready
 * without somebody having looked at every dimension, and a setup that is not
 * ready owes the client one specific action.
 */

const allOk: CheckInput[] = READINESS_CHECKS.map((key) => ({ key, state: "ok" }));
const withState = (key: string, state: string): CheckInput[] =>
  allOk.map((c) => (c.key === key ? { key, state } : c));

describe("check definitions", () => {
  it("defines every declared check exactly once", () => {
    assert.equal(CHECK_DEFINITIONS.length, READINESS_CHECKS.length);
    assert.equal(new Set(CHECK_DEFINITIONS.map((c) => c.key)).size, READINESS_CHECKS.length);
  });

  it("says what each check asks and why it matters", () => {
    for (const check of CHECK_DEFINITIONS) {
      assert.ok(check.question.length > 20, `${check.key} needs a real question`);
      assert.ok(check.why.length > 20, `${check.key} needs a stated reason`);
    }
  });

  it("checks audio first, because that is what viewers actually leave over", () => {
    assert.equal(CHECK_DEFINITIONS[0]?.key, "audio");
  });

  it("gives every format an orientation", () => {
    for (const format of RECORDING_FORMATS) {
      assert.ok(RECORDING_FORMAT_META[format].orientation);
    }
    assert.equal(RECORDING_FORMAT_META.vertical_short.orientation, "9:16");
    assert.equal(RECORDING_FORMAT_META.horizontal_long.orientation, "16:9");
  });
});

describe("suggested status", () => {
  it("is ready only when everything is good", () => {
    assert.equal(suggestedStatus(allOk), "ready");
  });

  it("ONE BLOCKING CHECK BLOCKS THE WHOLE SETUP", () => {
    for (const key of READINESS_CHECKS) {
      assert.equal(
        suggestedStatus(withState(key, "blocked")),
        "blocked",
        `${key} blocking should block the assessment`,
      );
    }
  });

  it("blocking outranks a limitation", () => {
    const mixed = withState("audio", "blocked").map((c) =>
      c.key === "light" ? { ...c, state: "limitation" } : c,
    );
    assert.equal(suggestedStatus(mixed), "blocked");
  });

  it("reports a limitation rather than rounding it up to ready", () => {
    assert.equal(suggestedStatus(withState("audio", "limitation")), "ready_with_limitation");
  });

  it("will not guess while a check is unlooked-at", () => {
    assert.equal(suggestedStatus(withState("background", "unknown")), "not_assessed");
    assert.equal(suggestedStatus([]), "not_assessed");
  });
});

describe("assessment gates", () => {
  const action = { clientAction: "Move the desk so the window is in front of you." };

  it("REFUSES ready while a check is blocking", () => {
    assert.throws(
      () => assertReadinessAssessment("ready", withState("audio", "blocked"), action),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /worst dimension/i);
        return true;
      },
    );
  });

  it("REFUSES ready while a check has not been looked at", () => {
    assert.throws(
      () => assertReadinessAssessment("ready", withState("light", "unknown"), action),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /not been checked/i);
        return true;
      },
    );
  });

  it("allows ready when everything is assessed and clear", () => {
    assert.doesNotThrow(() => assertReadinessAssessment("ready", allOk, { clientAction: null }));
  });

  it("REFUSES a blocker or limitation with no client action", () => {
    assert.throws(
      () =>
        assertReadinessAssessment("blocked", withState("audio", "blocked"), { clientAction: "" }),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /nobody can act on/i);
        return true;
      },
    );
    assert.throws(
      () =>
        assertReadinessAssessment("ready_with_limitation", withState("audio", "limitation"), {
          clientAction: "   ",
        }),
      WorkflowError,
    );
  });

  it("refuses a blocked status with nothing actually marked blocking", () => {
    assert.throws(
      () => assertReadinessAssessment("blocked", allOk, action),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /nothing is marked as blocking/i);
        return true;
      },
    );
  });

  it("accepts an honest blocked assessment with an action", () => {
    assert.doesNotThrow(() =>
      assertReadinessAssessment("blocked", withState("audio", "blocked"), action),
    );
  });

  it("is a no-op for not_assessed", () => {
    assert.doesNotThrow(() => assertReadinessAssessment("not_assessed", [], { clientAction: null }));
  });
});

describe("consequences", () => {
  it("owes the client an action when blocked or limited", () => {
    assert.equal(needsClientAction("blocked"), true);
    assert.equal(needsClientAction("ready_with_limitation"), true);
    assert.equal(needsClientAction("ready"), false);
    assert.equal(needsClientAction("not_assessed"), false);
  });

  it("permits recording once somebody has looked, unless it is blocked", () => {
    assert.equal(canRecord("ready"), true);
    assert.equal(canRecord("ready_with_limitation"), true, "a named limitation is workable");
    assert.equal(canRecord("blocked"), false);
    assert.equal(canRecord("not_assessed"), false, "recording before anyone looked is a guess");
  });

  it("names what is blocking and what is missing", () => {
    assert.deepEqual(blockingChecks(withState("light", "blocked")), ["light"]);
    assert.deepEqual(missingChecks(withState("format", "unknown")), ["format"]);
    assert.equal(isComplete(allOk), true);
    assert.equal(isComplete(withState("format", "unknown")), false);
  });
});
