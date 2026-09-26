import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import type { AuthContext } from "@/lib/auth/guard";
import { assertReleasable, authorityOf, currentApproval, fingerprint, recordDecision, supersedeApprovals } from "./approvals";

const stamp = Date.now();
let ctx: AuthContext;
let staffCtx: AuthContext;
let contentId = "";
let packageId = "";

before(async () => {
  const org = await prisma.organization.create({ data: { slug: `qa-appr-${stamp}`, name: "QA Approvals", kind: "client", synthetic: true } });
  const u = await prisma.user.create({ data: { email: `approver-${stamp}@example.com`, name: "Approver", passwordHash: "x" } });
  await prisma.membership.create({ data: { userId: u.id, orgId: org.id, role: "client_member", profiles: '["approver"]', contactRole: "primary" } });
  const base = { org: { ...org, startedAt: null }, can: () => true } as unknown as AuthContext;
  ctx = { ...base, user: { id: u.id, email: u.email, name: u.name, title: null, avatarHue: 1, isSuperAdmin: false, sessionId: "s", mfaEnabled: false }, role: "client_member", isInternal: false, profiles: ["approver"] };
  staffCtx = { ...base, user: { ...ctx.user, id: u.id }, role: "internal_operator", isInternal: true, profiles: [] };
  contentId = (await prisma.contentItem.create({ data: { orgId: org.id, title: "A piece", stage: "in_review" } as never })).id;
  packageId = (await prisma.platformPackage.create({ data: { orgId: org.id, contentItemId: contentId, platform: "linkedin", title: "Hook v1", caption: "Caption v1" } as never })).id;
});
after(async () => {
  await prisma.approval.deleteMany({ where: { orgId: ctx.org.id } });
  await prisma.organization.delete({ where: { id: ctx.org.id } });
  await prisma.user.delete({ where: { id: ctx.user.id } });
});

describe("exact-version approvals (DEL-02, DEL-03)", () => {
  it("records reviewer, authority, version and hash", async () => {
    const a = await recordDecision(ctx, { type: "platform_package", id: packageId }, "approved", { scope: "LinkedIn post" });
    assert.equal(a.authority, "designated_approver");
    assert.equal(a.reviewerId, ctx.user.id);
    assert.equal(a.scope, "LinkedIn post");
    assert.equal(a.contentHash, (await fingerprint(ctx.org.id, { type: "platform_package", id: packageId }))!.hash);
    assert.equal(await authorityOf(staffCtx), "staff_on_behalf");
  });

  it("a material edit makes the approval stale and blocks release until re-approved", async () => {
    await assertReleasable(ctx.org.id, [{ type: "platform_package", id: packageId }]);
    await prisma.platformPackage.update({ where: { id: packageId }, data: { caption: "Caption v2 with a new claim" } });
    assert.equal(await currentApproval(ctx.org.id, { type: "platform_package", id: packageId }), null);
    await assert.rejects(assertReleasable(ctx.org.id, [{ type: "platform_package", id: packageId }]), /changed since it was approved/);
    await recordDecision(ctx, { type: "platform_package", id: packageId }, "approved");
    await assertReleasable(ctx.org.id, [{ type: "platform_package", id: packageId }]);
  });

  it("refuses a decision on a version the reviewer did not see", async () => {
    await assert.rejects(recordDecision(ctx, { type: "content_item", id: contentId }, "approved", { expectedHash: "an-old-hash" }), /changed after you opened it/);
  });

  it("a later changes-requested decision and a superseded approval both block release", async () => {
    await recordDecision(ctx, { type: "content_item", id: contentId }, "approved");
    await assertReleasable(ctx.org.id, [{ type: "content_item", id: contentId }]);
    await recordDecision(ctx, { type: "content_item", id: contentId }, "changes_requested", { note: "Trim the opening" });
    await assert.rejects(assertReleasable(ctx.org.id, [{ type: "content_item", id: contentId }]));
    await recordDecision(ctx, { type: "content_item", id: contentId }, "approved");
    assert.equal(await supersedeApprovals(ctx.org.id, { type: "content_item", id: contentId }, "new cut"), 2);
    await assert.rejects(assertReleasable(ctx.org.id, [{ type: "content_item", id: contentId }]));
  });
});
