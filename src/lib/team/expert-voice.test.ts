import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { loadWorkspaceContext, renderContext } from "@/lib/ai/context";

const stamp = Date.now();
let orgId = "";
let expertId = "";
let otherId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-expert-${stamp}`, name: "QA Expert", kind: "client", synthetic: true } })).id;
  expertId = (await prisma.user.create({ data: { email: `expert-${stamp}@example.com`, name: "Priya Shah", title: "Head of Tax", passwordHash: "x" } })).id;
  otherId = (await prisma.user.create({ data: { email: `nonexpert-${stamp}@example.com`, name: "Sam", passwordHash: "x" } })).id;
  await prisma.membership.create({ data: { userId: expertId, orgId, role: "client_member", isExpert: true, voiceNotes: "Short sentences. Says 'in practice'. Never says 'leverage'." } });
  await prisma.membership.create({ data: { userId: otherId, orgId, role: "client_member", voiceNotes: "should not appear" } });
});
after(async () => {
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.deleteMany({ where: { id: { in: [expertId, otherId] } } });
});

describe("per-expert voice (TEAM-08)", () => {
  it("writes in the named expert's voice only when they are the speaker", async () => {
    const forExpert = renderContext(await loadWorkspaceContext(orgId, { blocks: ["FOUNDER_VOICE"], speakerUserId: expertId }), ["FOUNDER_VOICE"]);
    assert.match(forExpert, /WRITING FOR: Priya Shah, Head of Tax/);
    assert.match(forExpert, /Never says 'leverage'/);
    const plain = renderContext(await loadWorkspaceContext(orgId, { blocks: ["FOUNDER_VOICE"] }), ["FOUNDER_VOICE"]);
    assert.doesNotMatch(plain, /Priya/);
    const notExpert = renderContext(await loadWorkspaceContext(orgId, { blocks: ["FOUNDER_VOICE"], speakerUserId: otherId }), ["FOUNDER_VOICE"]);
    assert.doesNotMatch(notExpert, /should not appear/, "only an expert's voice is used");
  });
});
