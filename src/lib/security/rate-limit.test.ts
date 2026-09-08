import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { __resetRateLimits, __setRateLimitStore, memoryStore, rateLimit, rateLimitAsync, redisRestStore } from "./rate-limit";

describe("rate limiter stores", () => {
  test("memory store counts per key and resets after the window", async () => {
    __resetRateLimits();
    __setRateLimitStore(memoryStore);
    const a = await rateLimitAsync("k", { limit: 2, windowMs: 60_000 });
    const b = await rateLimitAsync("k", { limit: 2, windowMs: 60_000 });
    const c = await rateLimitAsync("k", { limit: 2, windowMs: 60_000 });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(c.ok, false);
    assert.ok(c.retryAfterSeconds >= 1);
    assert.equal(rateLimit("other", { limit: 1, windowMs: 1000 }).ok, true);
  });

  test("redis-compatible store sends INCR then sets the expiry on the first hit only", async () => {
    const calls: unknown[][] = [];
    let count = 0;
    const fake: typeof fetch = async (_url, init) => {
      const cmd = JSON.parse(String(init?.body)) as unknown[];
      calls.push(cmd);
      if (cmd[0] === "INCR") return new Response(JSON.stringify({ result: ++count }));
      if (cmd[0] === "PTTL") return new Response(JSON.stringify({ result: count === 1 ? -1 : 50_000 }));
      return new Response(JSON.stringify({ result: 1 }));
    };
    const store = redisRestStore("https://example.test", "token", fake);
    __setRateLimitStore(store);
    const first = await rateLimitAsync("shared", { limit: 1, windowMs: 60_000 });
    const second = await rateLimitAsync("shared", { limit: 1, windowMs: 60_000 });
    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
    assert.equal(calls.filter((c) => c[0] === "PEXPIRE").length, 1);
    __setRateLimitStore(null);
  });

  test("a redis store that is down fails CLOSED by default and OPEN only when configured", async () => {
    const down: typeof fetch = async () => new Response("nope", { status: 503 });
    __setRateLimitStore(redisRestStore("https://example.test", "token", down));
    delete process.env.RATE_LIMIT_FAIL_OPEN;
    const closed = await rateLimitAsync("x", { limit: 5, windowMs: 1000 });
    assert.equal(closed.ok, false);
    process.env.RATE_LIMIT_FAIL_OPEN = "true";
    const open = await rateLimitAsync("x", { limit: 5, windowMs: 1000 });
    assert.equal(open.ok, true);
    delete process.env.RATE_LIMIT_FAIL_OPEN;
    __setRateLimitStore(null);
  });
});
