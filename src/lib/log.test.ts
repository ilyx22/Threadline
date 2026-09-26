import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDsn, redact, reportError } from "./log";

describe("structured logging (INF-10)", () => {
  it("redacts secret-looking keys and masks email addresses", () => {
    const out = redact({ password: "p", nested: { apiKey: "k", authorization: "Bearer x" }, note: "from founder@firm.co.uk" }) as Record<string, unknown>;
    assert.equal(out.password, "[redacted]");
    assert.deepEqual(out.nested, { apiKey: "[redacted]", authorization: "[redacted]" });
    assert.equal(out.note, "from f***@firm.co.uk");
  });
  it("parses a Sentry-format DSN into its envelope endpoint", () => {
    assert.deepEqual(parseDsn("https://abc123@o42.ingest.sentry.io/77"), { endpoint: "https://o42.ingest.sentry.io/api/77/envelope/", key: "abc123" });
    assert.equal(parseDsn("nonsense"), null);
  });
  it("sends a redacted envelope when configured and never throws", async () => {
    const saved = process.env.ERROR_REPORTING_DSN;
    process.env.ERROR_REPORTING_DSN = "https://abc123@o42.ingest.sentry.io/77";
    const calls: { url: string; body: string }[] = [];
    const fake = (async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) });
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    const errorOut = console.error;
    console.error = () => {};
    try {
      await reportError(new Error("failed for owner@x.com"), { token: "t" }, fake);
      await reportError(new Error("x"), {}, (async () => { throw new Error("down"); }) as unknown as typeof fetch);
    } finally {
      console.error = errorOut;
      process.env.ERROR_REPORTING_DSN = saved;
    }
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /envelope/);
    assert.doesNotMatch(calls[0].body, /owner@x\.com|"t"/);
  });
});
