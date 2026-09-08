import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { redirectUriFor, safeReturnTo } from "./oauth";

/**
 * The rules these tests protect:
 *
 *   1. the redirect URI comes from configuration, never from a request — a
 *      caller-steered callback hands an authorisation code to an attacker;
 *   2. `returnTo` can only ever be a same-origin path, so an OAuth callback
 *      cannot be turned into an open redirect.
 *
 * The state lifecycle (single-use consumption, expiry, PKCE) is exercised
 * against the database in the integration tests rather than mocked here, because
 * the property that matters — that a replayed callback loses the race — is a
 * property of the query, not of the function around it.
 */

describe("the redirect URI", () => {
  it("is built from configuration alone", () => {
    const saved = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_APP_URL = "https://app.threadline.example";
      assert.equal(
        redirectUriFor("linkedin"),
        "https://app.threadline.example/api/oauth/linkedin/callback",
      );
    } finally {
      if (saved === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = saved;
    }
  });

  it("tolerates a trailing slash without doubling it", () => {
    const saved = process.env.NEXT_PUBLIC_APP_URL;
    try {
      process.env.NEXT_PUBLIC_APP_URL = "https://app.threadline.example/";
      assert.equal(
        redirectUriFor("tiktok"),
        "https://app.threadline.example/api/oauth/tiktok/callback",
      );
    } finally {
      if (saved === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = saved;
    }
  });
});

describe("returnTo", () => {
  it("accepts a same-origin path", () => {
    assert.equal(safeReturnTo("/app/northbeam/settings"), "/app/northbeam/settings");
  });

  it("refuses an absolute URL", () => {
    assert.equal(safeReturnTo("https://evil.example/steal"), null);
    assert.equal(safeReturnTo("http://evil.example"), null);
  });

  it("refuses a protocol-relative URL", () => {
    // The classic open-redirect payload: browsers read //host as absolute.
    assert.equal(safeReturnTo("//evil.example/steal"), null);
  });

  it("refuses anything that is not a path", () => {
    assert.equal(safeReturnTo("javascript:alert(1)"), null);
    assert.equal(safeReturnTo("app/northbeam"), null);
    assert.equal(safeReturnTo(""), null);
    assert.equal(safeReturnTo(undefined), null);
  });

  it("refuses an over-long path rather than truncating it", () => {
    // Truncation can turn a harmless path into a different one. Rejection
    // cannot. (Changed with QA-001: safeReturnTo now delegates to safePath.)
    assert.equal(safeReturnTo("/" + "a".repeat(2000)), null);
  });
});
