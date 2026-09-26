import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { runGeneration } from "./index";

const stamp = Date.now();
let orgId = "";
const tpl = { key: "report.narrative", system: "s", user: "u", maxTokens: 100, temperature: 0 };

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-cancel-${stamp}`, name: "QA Cancel", kind: "client", synthetic: true } })).id;
});
after(async () => {
  await prisma.aiGeneration.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("generation cancellation and time limit (AI-08)", () => {
  it("a cancelled generation stops, is recorded as cancelled and is not retried", async () => {
    const c = new AbortController();
    const started = Date.now();
    setTimeout(() => c.abort(), 50);
    await assert.rejects(runGeneration(tpl, { orgId, userId: null, kind: "report", signal: c.signal }), /cancelled/);
    assert.ok(Date.now() - started < 300, "stops promptly instead of finishing the request");
    const rows = await prisma.aiGeneration.findMany({ where: { orgId } });
    assert.equal(rows.length, 1, "one attempt, no retry");
    assert.equal(rows[0].status, "error");
    assert.match(rows[0].error ?? "", /cancelled/);
  });

  it("a generation that exceeds its time limit is stopped the same way", async () => {
    await assert.rejects(runGeneration(tpl, { orgId, userId: null, kind: "report", timeoutMs: 20 }), /took too long/);
  });
});
