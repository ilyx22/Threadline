import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clientIpFrom } from "./client-ip";

describe("client IP (SEC-03)", () => {
  const spoofed = new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9", "x-real-ip": "203.0.113.9" });
  it("never trusts the client-controlled first X-Forwarded-For entry", () => {
    assert.equal(clientIpFrom(spoofed, {}), null);
    assert.equal(clientIpFrom(spoofed, { TRUSTED_PROXY_HOPS: "1" }), "203.0.113.9");
  });
  it("uses the platform-set header on Vercel", () => {
    assert.equal(clientIpFrom(new Headers({ "x-forwarded-for": "6.6.6.6", "x-vercel-forwarded-for": "198.51.100.4" }), { VERCEL: "1" }), "198.51.100.4");
    assert.equal(clientIpFrom(spoofed, { VERCEL: "1" }), "203.0.113.9");
  });
  it("rejects junk values", () => {
    assert.equal(clientIpFrom(new Headers({ "x-real-ip": "<script>" }), { VERCEL: "1" }), null);
  });
});
