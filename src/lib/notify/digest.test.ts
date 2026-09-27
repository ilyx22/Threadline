import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { defaultEmailPreference, escalateStaleApprovals, notify, sendDigests } from "./index";

/**
 * Client action digest default (communication playbook, 27 Sept 2026):
 * permissions, completion suppression and no duplicate reminders.
 */
const stamp = Date.now();
let orgId = "";
const users: Record<string, string> = {};
const items: Record<string, string> = {};
const digestFor = async (key: string) =>
  (await prisma.job.findMany({ where: { orgId, type: "email.send" } }))
    .map((j) => JSON.parse(j.payload) as { to: string; template: string; data: { items: string[] } })
    .filter((p) => p.template === "digest" && p.to === `${key}-${stamp}@example.com`);

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-digest-${stamp}`, name: "QA Digest", kind: "client", synthetic: true } })).id;
  for (const [key, role, extra] of [
    ["owner", "client_admin", { isOwner: true }],
    ["approver", "client_member", { profiles: '["approver"]', contactRole: "primary" }],
    ["optedout", "client_member", { profiles: '["approver"]' }],
    ["removed", "client_member", { profiles: '["approver"]', status: "removed" }],
  ] as const) {
    const u = await prisma.user.create({ data: { email: `${key}-${stamp}@example.com`, name: key, passwordHash: "x" } });
    users[key] = u.id;
    await prisma.membership.create({ data: { userId: u.id, orgId, role, ...extra } });
  }
  await prisma.notificationPreference.create({ data: { userId: users.optedout, orgId, email: "off" } });
  for (const k of ["a", "b"]) {
    items[k] = (await prisma.contentItem.create({ data: { orgId, title: `Piece ${k.toUpperCase()}`, stage: "in_review", updatedAt: new Date("2026-09-20T10:00:00Z") } })).id;
  }
});
after(async () => {
  await prisma.job.deleteMany({ where: { orgId } });
  await prisma.notificationPreference.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
});

describe("client action digest default", () => {
  it("defaults clients to the digest and staff to no email", () => {
    assert.equal(defaultEmailPreference("client_admin"), "digest");
    assert.equal(defaultEmailPreference("client_member"), "digest");
    assert.equal(defaultEmailPreference("internal_operator"), "off");
    assert.equal(defaultEmailPreference("super_admin"), "off");
  });

  it("sends one digest per person with one line per item, only to active members who have not opted out, and drops finished items", async () => {
    const now = new Date("2026-09-27T09:00:00Z");
    for (const k of ["a", "b"]) {
      await notify({ orgId, audience: { userIds: [users.owner, users.approver, users.optedout, users.removed] }, kind: "approval", title: `Ready for your review: Piece ${k.toUpperCase()}`, dedupeKey: `review:${items[k]}:0`, subject: { type: "content_item", id: items[k] }, now: new Date("2026-09-27T08:00:00Z") });
    }
    // Piece A also escalates (waiting 3+ days): same item, must not appear twice.
    await escalateStaleApprovals(new Date("2026-09-27T08:30:00Z"), { orgId });
    // Piece B is approved before the digest goes out: it must be dropped.
    await prisma.contentItem.update({ where: { id: items.b }, data: { stage: "approved" } });

    await sendDigests(now, { orgId });
    const owner = await digestFor("owner");
    assert.equal(owner.length, 1, "the owner (no saved preference) gets the default digest");
    assert.equal(owner[0].data.items.length, 1, "one line for Piece A; Piece B was approved");
    assert.match(owner[0].data.items[0], /Piece A/);
    assert.equal((await digestFor("approver")).length, 1);
    assert.equal((await digestFor("optedout")).length, 0, "a saved 'off' preference wins");
    assert.equal((await digestFor("removed")).length, 0, "a removed member gets nothing");
  });

  it("does not repeat: a second run the same day, or the next day with nothing new, sends nothing", async () => {
    const before = await prisma.job.count({ where: { orgId, type: "email.send" } });
    await sendDigests(new Date("2026-09-27T15:00:00Z"), { orgId });
    await escalateStaleApprovals(new Date("2026-09-28T08:30:00Z"), { orgId }); // once per revision: no new chaser
    await sendDigests(new Date("2026-09-28T09:00:00Z"), { orgId });
    assert.equal(await prisma.job.count({ where: { orgId, type: "email.send" } }), before);
  });

  it("the owner's choice persists: the default becomes a saved, changeable preference", async () => {
    const pref = await prisma.notificationPreference.findUniqueOrThrow({ where: { userId_orgId: { userId: users.owner, orgId } } });
    assert.equal(pref.email, "digest");
    await prisma.notificationPreference.update({ where: { id: pref.id }, data: { email: "off" } });
    await prisma.contentItem.update({ where: { id: items.b }, data: { stage: "in_review", revisionCount: 1 } });
    await notify({ orgId, audience: { userIds: [users.owner] }, kind: "approval", title: "Ready for your review: Piece B (v2)", dedupeKey: `review:${items.b}:1`, subject: { type: "content_item", id: items.b }, now: new Date("2026-09-29T08:00:00Z") });
    await sendDigests(new Date("2026-09-29T09:00:00Z"), { orgId });
    assert.equal((await digestFor("owner")).length, 1, "no further digest after the owner turned it off");
  });
});
