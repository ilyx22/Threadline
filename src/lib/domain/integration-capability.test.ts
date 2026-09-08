import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCanPublish,
  readCapability,
  type IntegrationState,
} from "./integration-capability";

/**
 * The rules these tests protect:
 *
 *   1. "Connected" is never shown when only configuration exists;
 *   2. an authenticated account with no publishing permission is never
 *      described as able to publish;
 *   3. an unaudited API that silently posts to nobody REFUSES rather than
 *      publishing invisibly — the API returning success is not success;
 *   4. scopes asked for and not granted are surfaced, not swallowed;
 *   5. a manual route is described as a supported route, not as a failure.
 */

const state = (over: Partial<IntegrationState> = {}): IntegrationState => ({
  provider: "linkedin",
  authStatus: "connected",
  publishCapability: "api_public",
  analyticsCapability: "api",
  researchCapability: "unavailable",
  reviewStatus: "not_required",
  scopesRequested: [],
  scopesGranted: [],
  restrictions: [],
  tokenExpiresAt: null,
  lastVerifiedAt: null,
  lastSuccessfulSyncAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  reconnectRequired: false,
  hasCredential: true,
  ...over,
});

describe("not connected", () => {
  it("never claims to be connected", () => {
    const reading = readCapability(state({ authStatus: "none" }));
    assert.equal(reading.health, "not_connected");
    assert.doesNotMatch(reading.label, /^Connected$/);
    assert.equal(reading.canPublishPublicly, false);
    assert.equal(reading.canReadAnalytics, false);
  });

  it("describes a delegated route as a route, not a gap", () => {
    const reading = readCapability(
      state({ authStatus: "none", publishCapability: "native_delegated" }),
    );
    assert.match(reading.summary, /supported route rather than a gap/);
  });
});

describe("authenticated but limited", () => {
  it("says so when analytics is not granted", () => {
    // The LinkedIn reality: publishing is self-serve, member analytics is a
    // months-long review.
    const reading = readCapability(
      state({ analyticsCapability: "manual", reviewStatus: "in_review" }),
    );
    assert.equal(reading.health, "degraded");
    assert.equal(reading.label, "Connected · limited");
    assert.equal(reading.canPublishPublicly, true);
    assert.equal(reading.canReadAnalytics, false);
    assert.match(reading.summary, /take performance by hand/);
  });

  it("surfaces scopes that were asked for and refused", () => {
    const reading = readCapability(
      state({
        scopesRequested: ["w_member_social", "r_member_social"],
        scopesGranted: ["w_member_social"],
      }),
    );
    assert.deepEqual(reading.missingScopes, ["r_member_social"]);
    assert.ok(reading.limits.some((l) => /not granted/.test(l)));
  });

  it("warns before a token expires", () => {
    const soon = new Date(Date.now() + 3 * 86_400_000);
    const reading = readCapability(state({ tokenExpiresAt: soon }));
    assert.ok(reading.limits.some((l) => /expires in 3 days/.test(l)));
  });

  it("is healthy only when everything genuinely works", () => {
    const reading = readCapability(state());
    assert.equal(reading.health, "healthy");
    assert.equal(reading.label, "Connected");
    assert.equal(reading.canPublishPublicly, true);
    assert.equal(reading.canReadAnalytics, true);
  });
});

describe("the unaudited-API trap", () => {
  const unaudited = state({ publishCapability: "api_private_only", reviewStatus: "in_review" });

  it("does not describe private-only posting as publishing", () => {
    const reading = readCapability(unaudited);
    assert.equal(reading.health, "blocked");
    assert.equal(reading.canPublishPublicly, false);
    assert.match(reading.label, /private posts only/);
    assert.match(reading.summary, /reach nobody/);
  });

  it("refuses the publish outright", () => {
    // The API would return success. That is precisely why this has to refuse:
    // a post that silently reaches nobody while the UI says "published" is the
    // worst outcome available.
    const guard = assertCanPublish(unaudited);
    assert.equal(guard.ok, false);
    if (!guard.ok) assert.match(guard.reason, /visible only to the account owner/);
  });

  it("tells the operator the review is already running", () => {
    assert.match(readCapability(unaudited).nextAction ?? "", /platform review is running/);
  });
});

describe("broken connections", () => {
  it("asks for a reconnect when access was revoked", () => {
    const reading = readCapability(state({ authStatus: "revoked" }));
    assert.equal(reading.health, "broken");
    assert.equal(reading.nextAction, "Reconnect the account.");
  });

  it("treats an expired token as broken, not degraded", () => {
    assert.equal(readCapability(state({ authStatus: "expired" })).health, "broken");
  });

  it("shows the actual error rather than a generic one", () => {
    const reading = readCapability(
      state({ authStatus: "error", lastErrorMessage: "429 from the provider" }),
    );
    assert.equal(reading.summary, "429 from the provider");
  });
});

describe("the publish guard", () => {
  it("allows a genuinely public API connection", () => {
    assert.equal(assertCanPublish(state()).ok, true);
  });

  it("refuses a disconnected account", () => {
    assert.equal(assertCanPublish(state({ authStatus: "none" })).ok, false);
  });

  it("refuses a manual route rather than pretending it can post", () => {
    const guard = assertCanPublish(state({ publishCapability: "manual" }));
    assert.equal(guard.ok, false);
    if (!guard.ok) assert.match(guard.reason, /cannot publish through an API/);
  });

  it("refuses a delegated route through the API path", () => {
    assert.equal(assertCanPublish(state({ publishCapability: "native_delegated" })).ok, false);
  });
});
