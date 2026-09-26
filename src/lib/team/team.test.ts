import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { acceptInvitation, createInvitation, inspectInvitation, InvitationError, resendInvitation, revokeInvitation } from "./invitations";
import { MemberError, removeMember, suspendMember, transferOwnership } from "./members";

const stamp = Date.now();
const mail = (n: string) => `${n}-${stamp}@example.com`;
let org: { id: string; name: string; kind: string };
let adminId = "";
let owner = { userId: "", name: "Owner", role: "client_admin" as const };

const tokenOf = (link: string) => new URL(link).searchParams.get("token")!;

before(async () => {
  const o = await prisma.organization.create({ data: { slug: `qa-team-${stamp}`, name: "QA Team Org", kind: "client", synthetic: true } });
  org = { id: o.id, name: o.name, kind: o.kind };
  const u = await prisma.user.create({ data: { email: mail("owner"), name: "Owner", passwordHash: "x" } });
  await prisma.membership.create({ data: { userId: u.id, orgId: o.id, role: "client_admin", isOwner: true } });
  adminId = u.id;
  owner = { userId: u.id, name: "Owner", role: "client_admin" };
});
after(async () => {
  const users = await prisma.membership.findMany({ where: { orgId: org.id }, select: { userId: true } });
  await prisma.organization.delete({ where: { id: org.id } });
  await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.userId) } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@example.com` } } });
  await prisma.job.deleteMany({ where: { orgId: org.id } });
});

describe("invitations (TEAM-02, TEAM-03, TEAM-04)", () => {
  it("creates no account or membership until accepted, and refuses a second pending invite", async () => {
    const { link } = await createInvitation(owner, org, { name: "New Person", email: mail("new"), role: "client_member", profiles: ["contributor"] });
    assert.equal(await prisma.user.count({ where: { email: mail("new") } }), 0);
    await assert.rejects(createInvitation(owner, org, { name: "Again", email: mail("NEW").toUpperCase(), role: "client_member" }), InvitationError);
    const view = await inspectInvitation(tokenOf(link));
    assert.equal(view.ok && view.accountExists, false);
  });

  it("refuses staff roles in a client workspace", async () => {
    await assert.rejects(createInvitation(owner, org, { name: "X", email: mail("x"), role: "internal_operator" }), /cannot grant/);
  });

  it("accepts once with a new password; a second accept is refused", async () => {
    const { link } = await createInvitation(owner, org, { name: "Acceptor", email: mail("acceptor"), role: "client_member", profiles: ["approver"] });
    const token = tokenOf(link);
    const [a, b] = await Promise.all([acceptInvitation(token, null, "a-strong-password-1"), acceptInvitation(token, null, "a-strong-password-2")]);
    assert.equal([a, b].filter((r) => r.ok).length, 1, "exactly one concurrent accept wins");
    const m = await prisma.membership.findFirst({ where: { orgId: org.id, user: { email: mail("acceptor") } } });
    assert.equal(m?.role, "client_member");
    assert.equal(m?.profiles, '["approver"]');
  });

  it("never lets a link set the password of an existing account, and refuses the wrong signed-in account", async () => {
    const existing = await prisma.user.create({ data: { email: mail("existing"), name: "Existing", passwordHash: "original" } });
    const { link } = await createInvitation(owner, org, { name: "Existing", email: mail("existing"), role: "client_member" });
    const token = tokenOf(link);
    assert.deepEqual(await acceptInvitation(token, null, "takeover-password-1"), { ok: false, reason: "sign_in_required" });
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).passwordHash, "original");
    assert.deepEqual(await acceptInvitation(token, { id: adminId, email: mail("owner") }, null), { ok: false, reason: "wrong_account" });
    const ok = await acceptInvitation(token, { id: existing.id, email: existing.email }, null);
    assert.equal(ok.ok, true);
    const again = await acceptInvitation(token, { id: existing.id, email: existing.email }, null);
    assert.equal(again.ok, true, "a repeat by the same person is idempotent");
    assert.equal(await prisma.membership.count({ where: { orgId: org.id, userId: existing.id } }), 1);
  });

  it("resend replaces the token; revoke kills it", async () => {
    const { invitation, link } = await createInvitation(owner, org, { name: "Resend", email: mail("resend"), role: "client_member" });
    await prisma.invitation.update({ where: { id: invitation.id }, data: { lastSentAt: new Date(Date.now() - 3_600_000) } });
    const { link: fresh } = await resendInvitation(owner, org, invitation.id);
    assert.equal((await inspectInvitation(tokenOf(link))).ok, false, "old link stops working");
    assert.equal((await inspectInvitation(tokenOf(fresh))).ok, true);
    await revokeInvitation(owner, org, invitation.id);
    assert.deepEqual(await acceptInvitation(tokenOf(fresh), null, "a-strong-password-3"), { ok: false, reason: "revoked" });
  });

  it("refuses an expired invitation", async () => {
    const { invitation, link } = await createInvitation(owner, org, { name: "Late", email: mail("late"), role: "client_member" });
    await prisma.invitation.update({ where: { id: invitation.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.deepEqual(await acceptInvitation(tokenOf(link), null, "a-strong-password-4"), { ok: false, reason: "expired" });
  });
});

describe("member lifecycle (TEAM-05, TEAM-06, TEAM-07)", () => {
  it("protects the owner and the last admin, and transfers ownership explicitly", async () => {
    await assert.rejects(removeMember({ userId: "someone", role: "internal_operator" }, org, adminId), MemberError);
    const second = await prisma.user.create({ data: { email: mail("admin2"), name: "Second Admin", passwordHash: "x" } });
    await prisma.membership.create({ data: { userId: second.id, orgId: org.id, role: "client_admin" } });
    await transferOwnership(owner, org, second.id);
    const owners = await prisma.membership.findMany({ where: { orgId: org.id, isOwner: true } });
    assert.deepEqual(owners.map((o) => o.userId), [second.id]);
    // the former owner can now be suspended by the new owner, which returns their tasks
    const task = await prisma.task.create({ data: { orgId: org.id, title: "held", kind: "general", assigneeId: adminId } as never });
    const r = await suspendMember({ userId: second.id, role: "client_admin" }, org, adminId);
    assert.equal(r.released, 1);
    assert.equal((await prisma.task.findUniqueOrThrow({ where: { id: task.id } })).assigneeId, null);
    assert.equal((await prisma.membership.findFirstOrThrow({ where: { orgId: org.id, userId: adminId } })).status, "suspended");
  });
});
