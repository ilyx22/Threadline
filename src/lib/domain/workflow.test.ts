import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTENT_TRANSITIONS,
  IDEA_TRANSITIONS,
  WorkflowError,
  assertPublishTransition,
  assertScriptTransition,
  canMoveContent,
  canMoveIdea,
  canMoveInquiry,
  canMovePublish,
  nextContentStages,
  requiresNote,
  unverifiedClaims,
} from "./workflow";
import { CONTENT_STAGES, IDEA_STATUSES } from "./enums";

describe("content stage machine", () => {
  it("refuses to skip review and approval", () => {
    assert.equal(canMoveContent("raw", "live"), false);
    assert.equal(canMoveContent("raw", "approved"), false);
    assert.equal(canMoveContent("editing", "live"), false);
    assert.equal(canMoveContent("editing", "approved"), false);
  });

  it("allows the intended path", () => {
    assert.equal(canMoveContent("raw", "editing"), true);
    assert.equal(canMoveContent("editing", "in_review"), true);
    assert.equal(canMoveContent("in_review", "approved"), true);
    assert.equal(canMoveContent("approved", "scheduled"), true);
    assert.equal(canMoveContent("scheduled", "live"), true);
  });

  it("allows a rejection back to the editor", () => {
    assert.equal(canMoveContent("in_review", "changes_requested"), true);
    assert.equal(canMoveContent("changes_requested", "editing"), true);
  });

  it("requires a note only for a revision request", () => {
    assert.equal(requiresNote("changes_requested"), true);
    assert.equal(requiresNote("approved"), false);
    assert.equal(requiresNote("editing"), false);
  });

  it("declares a transition map for every stage", () => {
    for (const stage of CONTENT_STAGES) {
      assert.ok(CONTENT_TRANSITIONS[stage], `no transitions declared for ${stage}`);
    }
  });

  it("only ever offers legal next stages", () => {
    for (const stage of CONTENT_STAGES) {
      for (const next of nextContentStages(stage)) {
        assert.equal(canMoveContent(stage, next), true);
      }
    }
  });
});

describe("idea status machine", () => {
  it("cannot walk a scripted idea backwards", () => {
    assert.equal(canMoveIdea("scripted", "approved"), false);
    assert.equal(canMoveIdea("scripted", "backlog"), false);
    // Archiving remains available so it can leave rotation.
    assert.equal(canMoveIdea("scripted", "archived"), true);
  });

  it("allows triage forwards and backwards before scripting", () => {
    assert.equal(canMoveIdea("backlog", "shortlisted"), true);
    assert.equal(canMoveIdea("shortlisted", "approved"), true);
    assert.equal(canMoveIdea("shortlisted", "backlog"), true);
    assert.equal(canMoveIdea("approved", "scripted"), true);
  });

  it("declares a transition map for every status", () => {
    for (const status of IDEA_STATUSES) {
      assert.ok(IDEA_TRANSITIONS[status], `no transitions declared for ${status}`);
    }
  });
});

describe("script fact-check gate", () => {
  const unverified = [{ id: "1", text: "We tripled revenue", status: "unverified" }];
  const verified = [{ id: "1", text: "We tripled revenue", status: "verified" }];

  it("counts unverified claims", () => {
    assert.equal(unverifiedClaims(unverified).length, 1);
    assert.equal(unverifiedClaims(verified).length, 0);
  });

  it("blocks ready_to_record while a claim is unverified", () => {
    assert.throws(
      () => assertScriptTransition("needs_fact_check", "ready_to_record", unverified),
      WorkflowError,
    );
  });

  it("blocks approval while a claim is unverified", () => {
    assert.throws(
      () => assertScriptTransition("ready_to_record", "approved", unverified),
      WorkflowError,
    );
  });

  it("allows the transition once every claim is resolved", () => {
    assert.doesNotThrow(() =>
      assertScriptTransition("needs_fact_check", "ready_to_record", verified),
    );
    assert.doesNotThrow(() => assertScriptTransition("ready_to_record", "approved", verified));
  });

  it("treats a removed claim as resolved", () => {
    const removed = [{ id: "1", text: "We tripled revenue", status: "removed" }];
    assert.doesNotThrow(() => assertScriptTransition("ready_to_record", "approved", removed));
  });

  it("still rejects an illegal transition even with no claims", () => {
    assert.throws(() => assertScriptTransition("ai_draft", "approved", []), WorkflowError);
  });
});

describe("publish transitions", () => {
  it("refuses to publish without a URL", () => {
    assert.throws(
      () => assertPublishTransition("scheduled", "published", { url: null, scheduledFor: new Date() }),
      WorkflowError,
    );
    assert.throws(
      () => assertPublishTransition("scheduled", "published", { url: "   ", scheduledFor: new Date() }),
      WorkflowError,
    );
  });

  it("refuses to schedule without a date", () => {
    assert.throws(
      () => assertPublishTransition("ready", "scheduled", { url: null, scheduledFor: null }),
      WorkflowError,
    );
  });

  it("allows publishing with a URL", () => {
    assert.doesNotThrow(() =>
      assertPublishTransition("scheduled", "published", {
        url: "https://example.com/post",
        scheduledFor: new Date(),
      }),
    );
  });

  it("refuses an illegal jump", () => {
    assert.equal(canMovePublish("draft", "published"), false);
  });
});

describe("inquiry stages", () => {
  it("follows the commercial path", () => {
    assert.equal(canMoveInquiry("inquiry", "qualified"), true);
    assert.equal(canMoveInquiry("qualified", "call_booked"), true);
    assert.equal(canMoveInquiry("call_booked", "won"), true);
  });

  it("cannot jump straight from an inquiry to won", () => {
    assert.equal(canMoveInquiry("inquiry", "won"), false);
    assert.equal(canMoveInquiry("inquiry", "call_booked"), false);
  });
});
