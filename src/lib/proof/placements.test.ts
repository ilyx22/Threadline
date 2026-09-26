import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { flagWithdrawnPlacements, recordPlacement } from "./placements";

const stamp = Date.now();
let orgId = "";
before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-proof-${stamp}`, name: "QA Proof", kind: "client", synthetic: true } })).id;
});
after(async () => {
  await prisma.proofPlacement.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("proof placements (PRF-01)", () => {
  it("refuses a placement without permission", async () => {
    await assert.rejects(recordPlacement(orgId, { permission: "allowPublicTestimonial", content: "Great work", location: "homepage", placedById: "s" }), /not been permitted/);
  });
  it("flags placements when the permission is withdrawn or expires", async () => {
    await prisma.proofPermission.create({ data: { orgId, allowPublicTestimonial: true, allowLogo: true, grantedAt: new Date() } });
    const a = await recordPlacement(orgId, { permission: "allowPublicTestimonial", content: "Quote", location: "/who-its-for", placedById: "s" });
    const b = await recordPlacement(orgId, { permission: "allowLogo", content: "logo", location: "deck", placedById: "s" });
    await prisma.proofPermission.update({ where: { orgId }, data: { allowPublicTestimonial: false } });
    assert.equal(await flagWithdrawnPlacements(orgId), 1);
    assert.equal((await prisma.proofPlacement.findUniqueOrThrow({ where: { id: a.id } })).flagReason, "Permission withdrawn by the client");
    await prisma.proofPermission.update({ where: { orgId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal(await flagWithdrawnPlacements(orgId), 1);
    assert.equal((await prisma.proofPlacement.findUniqueOrThrow({ where: { id: b.id } })).flagReason, "Permission expired");
    await assert.rejects(recordPlacement(orgId, { permission: "allowLogo", content: "logo", location: "site", placedById: "s" }), /expired/);
  });
});
