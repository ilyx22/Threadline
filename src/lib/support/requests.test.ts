import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { listRequests, raiseRequest } from "./requests";

const stamp = Date.now();
let orgId = "";
let otherOrg = "";
let userId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-help-${stamp}`, name: "QA Help", kind: "client", synthetic: true } })).id;
  otherOrg = (await prisma.organization.create({ data: { slug: `qa-help2-${stamp}`, name: "QA Help 2", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `help-${stamp}@example.com`, name: "Founder", passwordHash: "x" } })).id;
});
after(async () => {
  await prisma.organization.deleteMany({ where: { id: { in: [orgId, otherOrg] } } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("client support requests (CX-07)", () => {
  it("lands in the support queue with the workspace, and a client sees only their own", async () => {
    await assert.rejects(raiseRequest(orgId, userId, { title: "x", blocking: false }), /few words/);
    const issue = await raiseRequest(orgId, userId, { title: "Cannot upload the raw take", description: "Stuck at 40%", blocking: true });
    assert.equal(issue.severity, "high");
    assert.match(issue.description ?? "", /Raised by Founder/);
    await raiseRequest(otherOrg, userId, { title: "Another workspace", blocking: false });
    assert.deepEqual((await listRequests(orgId)).map((r) => r.title), ["Cannot upload the raw take"]);
  });

  it("emails the operations inbox for a blocking request only (C09)", async () => {
    const was = process.env.OPS_NOTIFY_EMAIL;
    process.env.OPS_NOTIFY_EMAIL = "ops-inbox@example.com";
    try {
      const blocking = await raiseRequest(orgId, userId, { title: "Recording Room will not open", blocking: true });
      const quiet = await raiseRequest(orgId, userId, { title: "Question about the report", blocking: false });
      const job = await prisma.job.findUnique({ where: { idempotencyKey: `support:${blocking.id}:ops-alert` } });
      assert.ok(job, "blocking request queued an ops email");
      assert.match(job.payload, /ops-inbox@example\.com/);
      assert.match(job.payload, /QA Help: Recording Room will not open/);
      assert.equal(await prisma.job.count({ where: { idempotencyKey: `support:${quiet.id}:ops-alert` } }), 0);
      await prisma.job.deleteMany({ where: { idempotencyKey: { startsWith: "support:" }, payload: { contains: "ops-inbox@example.com" } } });
    } finally {
      if (was === undefined) delete process.env.OPS_NOTIFY_EMAIL;
      else process.env.OPS_NOTIFY_EMAIL = was;
    }
  });
});
