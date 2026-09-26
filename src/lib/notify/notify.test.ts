import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { escalateStaleApprovals, inQuietHours, notify, sendDigests } from "./index";

const stamp = Date.now();
let orgId = "";
const users: Record<string, string> = {};

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-notify-${stamp}`, name: "QA Notify", kind: "client", synthetic: true } })).id;
  for (const [key, role, extra] of [
    ["owner", "client_admin", { isOwner: true }],
    ["approver", "client_member", { profiles: '["approver"]', contactRole: "primary" }],
    ["backup", "client_member", { profiles: '["approver"]', contactRole: "backup" }],
    ["member", "client_member", {}],
  ] as const) {
    const u = await prisma.user.create({ data: { email: `${key}-${stamp}@example.com`, name: key, passwordHash: "x" } });
    users[key] = u.id;
    await prisma.membership.create({ data: { userId: u.id, orgId, role, ...extra } });
  }
});
after(async () => {
  await prisma.job.deleteMany({ where: { orgId } });
  await prisma.notificationPreference.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
});

describe("notifications (NOT-01)", () => {
  it("routes to the responsible people once, with email off by default", async () => {
    const first = await notify({ orgId, audience: { orgRole: "approvers" }, kind: "approval", title: "Ready for review", dedupeKey: "k1" });
    assert.equal(first.length, 3, "owner (admin) plus two approvers, not the plain member");
    assert.equal((await notify({ orgId, audience: { orgRole: "approvers" }, kind: "approval", title: "Ready for review", dedupeKey: "k1" })).length, 0, "deduplicated");
    assert.equal(await prisma.job.count({ where: { orgId, type: "email.send" } }), 0, "nobody opted into email");
  });

  it("emails immediately only outside quiet hours and when not snoozed", async () => {
    await prisma.notificationPreference.create({ data: { userId: users.approver, orgId, email: "immediate", quietStart: 22, quietEnd: 7, timezone: "Europe/London" } });
    assert.equal(inQuietHours({ quietStart: 22, quietEnd: 7, timezone: "Europe/London" }, new Date("2026-09-26T23:30:00Z")), true);
    await notify({ orgId, audience: { userIds: [users.approver] }, kind: "approval", title: "At night", dedupeKey: "night", now: new Date("2026-09-26T23:30:00Z") });
    assert.equal(await prisma.job.count({ where: { orgId, type: "email.send" } }), 0, "held during quiet hours");
    await notify({ orgId, audience: { userIds: [users.approver] }, kind: "approval", title: "By day", dedupeKey: "day", now: new Date("2026-09-26T10:00:00Z") });
    assert.equal(await prisma.job.count({ where: { orgId, type: "email.send" } }), 1);
  });

  it("sends a daily digest to people who chose it, once per day", async () => {
    await prisma.notificationPreference.create({ data: { userId: users.member, orgId, email: "digest" } });
    await notify({ orgId, audience: { userIds: [users.member] }, kind: "report", title: "Report ready", dedupeKey: "rep" });
    const noon = new Date(Date.now() + 60_000);
    assert.ok((await sendDigests(noon)) >= 1);
    assert.equal(await sendDigests(noon), 0, "nothing new since the last digest");
  });

  it("escalates approvals waiting three days to the backup approver and the owner", async () => {
    const item = await prisma.contentItem.create({ data: { orgId, title: "Stale piece", stage: "in_review" } as never });
    await prisma.$executeRaw`UPDATE "ContentItem" SET "updatedAt" = NOW() - INTERVAL '5 days' WHERE "id" = ${item.id}`;
    const n = await escalateStaleApprovals();
    assert.ok(n >= 2);
    const to = await prisma.notification.findMany({ where: { orgId, dedupeKey: { startsWith: `escalate:${item.id}` } }, select: { userId: true } });
    assert.deepEqual(to.map((t) => t.userId).sort(), [users.backup, users.owner].sort());
    assert.equal(await escalateStaleApprovals(), 0, "once per item per day");
  });
});
