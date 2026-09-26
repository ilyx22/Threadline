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
});
