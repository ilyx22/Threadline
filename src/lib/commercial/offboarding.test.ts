import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { __setStorage, MemoryStorageAdapter } from "@/lib/storage";
import { activateEngagement, createDraftEngagement } from "./engagements";
import { closeExpiredAccess, deleteTenant, dueForDeletion, startOffboarding } from "./offboarding";

const stamp = Date.now();
let orgId = "";
let memberId = "";
const storage = new MemoryStorageAdapter();

before(async () => {
  __setStorage(storage);
  orgId = (await prisma.organization.create({ data: { slug: `qa-off-${stamp}`, name: "QA Offboard", kind: "client", synthetic: true } })).id;
  memberId = (await prisma.user.create({ data: { email: `leaver-${stamp}@example.com`, name: "Lee Leaver", passwordHash: "x" } })).id;
  await prisma.membership.create({ data: { userId: memberId, orgId, role: "client_admin", isOwner: true } });
  const e = await prisma.$transaction((tx) => createDraftEngagement(tx, { orgId, timezone: "Europe/London" }));
  await activateEngagement(e.id, "2026-06-01", new Date("2026-06-02T09:00:00Z"));
  await prisma.credential.create({ data: { orgId, provider: "linkedin", purpose: "oauth_access", sealed: "{}", keyId: "k1" } });
  await prisma.job.create({ data: { type: "email.send", payload: "{}", orgId } });
});
after(async () => {
  __setStorage(null);
  await prisma.offboardingRecord.deleteMany({ where: { orgId } });
  await prisma.job.deleteMany({ where: { orgId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
  await prisma.user.deleteMany({ where: { id: memberId } });
});

describe("offboarding (OFF-01)", () => {
  it("ends the engagement, cancels queued work, removes credentials and writes an export", async () => {
    const now = new Date("2026-09-10T09:00:00Z");
    const rec = await startOffboarding(orgId, memberId, { reason: "Client chose not to renew", exportDays: 30, retentionDays: 90, now });
    const steps = JSON.parse(rec.steps) as { step: string }[];
    assert.deepEqual(steps.map((s) => s.step), ["engagement", "jobs", "integrations", "export", "access"]);
    assert.equal((await prisma.engagement.findFirstOrThrow({ where: { orgId } })).status, "ended");
    assert.equal(await prisma.credential.count({ where: { orgId } }), 0);
    assert.equal(await prisma.job.count({ where: { orgId, status: "queued" } }), 0);
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: rec.exportAssetId! } });
    const exported = JSON.parse((await storage.get(asset.storagePath!)).toString("utf8"));
    assert.equal(exported.format, "threadline-workspace-export/1");
    assert.equal(exported.workspace.name, "QA Offboard");
    await assert.rejects(startOffboarding(orgId, memberId, { reason: "again" }), /already being offboarded/);
  });

  it("keeps access through the export window, then suspends client members", async () => {
    assert.equal(await closeExpiredAccess(new Date("2026-09-20T09:00:00Z")), 0);
    assert.ok((await closeExpiredAccess(new Date("2026-10-20T09:00:00Z"))) >= 1);
    assert.equal((await prisma.membership.findFirstOrThrow({ where: { orgId } })).status, "suspended");
  });

  it("deletes only after retention, only with the typed address, never under legal hold, and keeps the evidence", async () => {
    const early = new Date("2026-11-01T09:00:00Z");
    await assert.rejects(deleteTenant(orgId, `qa-off-${stamp}`, early), /Data is kept until/);
    const late = new Date("2027-02-01T09:00:00Z");
    assert.ok((await dueForDeletion(late)).some((o) => o.id === orgId));
    await prisma.organization.update({ where: { id: orgId }, data: { legalHold: true } });
    await assert.rejects(deleteTenant(orgId, `qa-off-${stamp}`, late), /legal hold/);
    await prisma.organization.update({ where: { id: orgId }, data: { legalHold: false } });
    await assert.rejects(deleteTenant(orgId, "wrong", late), /Type the workspace address/);
    const counts = await deleteTenant(orgId, `qa-off-${stamp}`, late);
    assert.equal(counts.memberships, 1);
    assert.equal(await prisma.organization.count({ where: { id: orgId } }), 0);
    const rec = await prisma.offboardingRecord.findUniqueOrThrow({ where: { orgId } });
    assert.ok(rec.deletedAt);
    assert.equal(rec.orgName, "QA Offboard");
  });
});
