import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { followUpQueue, remindProspectFollowUps } from "./follow-ups";

const stamp = Date.now();
let internalId = "";
let createdInternal = false;
let prospectId = "";
let closedId = "";

before(async () => {
  const existing = await prisma.organization.findFirst({ where: { kind: "internal" }, select: { id: true } });
  if (existing) internalId = existing.id;
  else {
    internalId = (await prisma.organization.create({ data: { slug: `qa-internal-${stamp}`, name: "QA Internal", kind: "internal", synthetic: true } })).id;
    createdInternal = true;
  }
  prospectId = (await prisma.prospect.create({ data: { company: `QA Prospect ${stamp}`, contactName: "Dana", nextAction: "Send the diagnosis summary", nextActionDueAt: new Date(Date.now() - 60_000) } })).id;
  closedId = (await prisma.prospect.create({ data: { company: `QA Closed ${stamp}`, nextAction: "x", nextActionDueAt: new Date(Date.now() - 60_000), closedAt: new Date() } })).id;
});
after(async () => {
  await prisma.task.deleteMany({ where: { entityType: "prospect", entityId: { in: [prospectId, closedId] } } });
  await prisma.prospect.deleteMany({ where: { id: { in: [prospectId, closedId] } } });
  if (createdInternal) await prisma.organization.delete({ where: { id: internalId } });
});

describe("prospect follow-ups (COM-07)", () => {
  it("one task per due follow-up for open prospects only, and the queue lists it", async () => {
    await remindProspectFollowUps();
    await remindProspectFollowUps();
    const tasks = await prisma.task.findMany({ where: { orgId: internalId, entityType: "prospect", entityId: { in: [prospectId, closedId] } } });
    assert.equal(tasks.length, 1);
    assert.match(tasks[0].title, /Dana, QA Prospect .*: Send the diagnosis summary/);
    const q = await followUpQueue();
    assert.ok(q.some((p) => p.id === prospectId));
    assert.ok(!q.some((p) => p.id === closedId));
  });
});
