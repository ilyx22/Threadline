import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safePath, safePathOr } from "./safe-path";

/**
 * Regression for QA-001 (2026-09-09): the login action accepted
 * `next=//evil.example` and sent the user there after a successful sign-in.
 * Every redirect-after-action parameter in the product goes through here now.
 */
describe("safePath", () => {
  it("accepts an ordinary same-origin path", () => {
    assert.equal(safePath("/app/northbeam"), "/app/northbeam");
    assert.equal(safePath("/app/northbeam/learning?tab=1#x"), "/app/northbeam/learning?tab=1#x");
    assert.equal(safePath("/"), "/");
  });

  it("refuses the protocol-relative payload that got through login", () => {
    assert.equal(safePath("//evil.example"), null);
    assert.equal(safePath("//evil.example/phish"), null);
  });

  it("refuses the backslash variant some browsers normalise to //", () => {
    assert.equal(safePath("/\\evil.example"), null);
  });

  it("refuses absolute URLs and schemes", () => {
    assert.equal(safePath("https://evil.example"), null);
    assert.equal(safePath("http://evil.example/x"), null);
    assert.equal(safePath("javascript:alert(1)"), null);
    assert.equal(safePath("/javascript:alert(1)"), null);
    assert.equal(safePath("mailto:x@y"), null);
  });

  it("refuses relative paths, empties and control characters", () => {
    assert.equal(safePath("app/northbeam"), null);
    assert.equal(safePath(""), null);
    assert.equal(safePath(undefined), null);
    assert.equal(safePath(null), null);
    assert.equal(safePath("/app\r\nSet-Cookie: x"), null);
  });

  it("caps length", () => {
    assert.equal(safePath("/" + "a".repeat(600)), null);
  });

  it("falls back cleanly", () => {
    assert.equal(safePathOr("//evil.example", "/admin"), "/admin");
    assert.equal(safePathOr("/app/x", "/admin"), "/app/x");
  });
});
