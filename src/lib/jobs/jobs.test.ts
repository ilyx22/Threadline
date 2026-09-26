import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db/client";
import { backoffMs, claimNext, drain, enqueue, LEASE_MS, registerHandler, requeueDead, runOnce } from "./index";

const TYPE = "qa.test";

before(async () => {
  await prisma.job.deleteMany({ where: { type: { startsWith: "qa." } } });
});
after(async () => {
  await prisma.job.deleteMany({ where: { type: { startsWith: "qa." } } });
});

describe("durable jobs", () => {
  test("enqueue is idempotent on the key", async () => {
    const a = await enqueue(TYPE, { n: 1 }, { idempotencyKey: "qa-key-1" });
    const b = await enqueue(TYPE, { n: 2 }, { idempotencyKey: "qa-key-1" });
    assert.equal(a.created, true);
    assert.equal(b.created, false);
    assert.equal(a.job.id, b.job.id);
  });

  test("success, failure with backoff, and dead after the attempt budget", async () => {
    let calls = 0;
    registerHandler("qa.flaky", async () => {
      calls++;
      throw new Error("still broken");
    });
    registerHandler("qa.ok", async () => {
      /* fine */
    });
    const ok = await enqueue("qa.ok", {});
    const flaky = await enqueue("qa.flaky", {}, { maxAttempts: 2 });
    const r1 = await runOnce("w1", ["qa.ok"]);
    assert.equal(r1?.outcome, "succeeded");
    assert.equal((await prisma.job.findUniqueOrThrow({ where: { id: ok.job.id } })).status, "succeeded");

    const r2 = await runOnce("w1", ["qa.flaky"]);
    assert.equal(r2?.outcome, "retry");
    const afterFirst = await prisma.job.findUniqueOrThrow({ where: { id: flaky.job.id } });
    assert.equal(afterFirst.status, "queued");
    assert.ok(afterFirst.runAt.getTime() > Date.now() + backoffMs(1, () => 0) - 5000);
    assert.equal(afterFirst.lastError, "still broken");

    // Not runnable yet (backoff), so nothing is claimed…
    assert.equal(await claimNext("w1", ["qa.flaky"]), null);
    // …until we pull it forward.
    await prisma.job.update({ where: { id: flaky.job.id }, data: { runAt: new Date(Date.now() - 1000) } });
    const r3 = await runOnce("w1", ["qa.flaky"]);
    assert.equal(r3?.outcome, "dead");
    assert.equal(calls, 2);
    await requeueDead(flaky.job.id);
    assert.equal((await prisma.job.findUniqueOrThrow({ where: { id: flaky.job.id } })).status, "queued");
    await prisma.job.deleteMany({ where: { id: flaky.job.id } });
  });

  test("two workers never claim the same job; a stale lease is recovered", async () => {
    registerHandler("qa.slow", async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    await enqueue("qa.slow", {}, { idempotencyKey: "qa-slow-1" });
    const [a, b] = await Promise.all([claimNext("w1", ["qa.slow"]), claimNext("w2", ["qa.slow"])]);
    assert.ok((a && !b) || (!a && b), "exactly one worker holds the lease");
    const held = (a ?? b)!;
    // Simulate a crashed worker: lease older than LEASE_MS.
    await prisma.job.update({ where: { id: held.id }, data: { lockedAt: new Date(Date.now() - LEASE_MS - 1000) } });
    const recovered = await claimNext("w3", ["qa.slow"]);
    assert.equal(recovered?.id, held.id);
    assert.equal(recovered?.lockedBy, "w3");
    await prisma.job.deleteMany({ where: { id: held.id } });
  });

  test("a job with no handler dies loudly instead of looping", async () => {
    await enqueue("qa.orphan", {}, { idempotencyKey: "qa-orphan" });
    const results = await drain("w1", 5);
    const orphan = results.find((r) => r.type === "qa.orphan");
    assert.equal(orphan?.outcome, "no_handler");
  });
});
