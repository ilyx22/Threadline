import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { assertContentInScope, assetInScope, contentScope } from "./scope";
import { listContent } from "@/lib/data/content";

const stamp = Date.now();
let orgId = "";
let editorId = "";
let mine = "";
let theirs = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-scope-${stamp}`, name: "QA Scope", kind: "client", synthetic: true } })).id;
  editorId = (await prisma.user.create({ data: { email: `scope-${stamp}@example.com`, name: "Contractor", passwordHash: "x" } })).id;
  await prisma.membership.create({ data: { userId: editorId, orgId, role: "editor" } });
  mine = (await prisma.contentItem.create({ data: { orgId, title: "Assigned piece", editorId } as never })).id;
  theirs = (await prisma.contentItem.create({ data: { orgId, title: "Someone else's piece" } as never })).id;
  await prisma.asset.create({ data: { orgId, contentItemId: theirs, category: "raw_media", title: "Their raw" } });
  await prisma.asset.create({ data: { orgId, contentItemId: mine, category: "raw_media", title: "My raw" } });
});
after(async () => {
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: editorId } });
});

describe("contractor scope (TEAM-09)", () => {
  it("an editor sees only assigned pieces and their files; other roles are unrestricted", async () => {
    assert.equal(await contentScope(orgId, editorId, "client_admin"), null);
    const scope = await contentScope(orgId, editorId, "editor");
    assert.deepEqual(scope, [mine]);
    assert.deepEqual((await listContent(orgId, { ids: scope! })).map((c) => c.id), [mine]);
    assert.equal(await assetInScope(orgId, editorId, "editor", { contentItemId: theirs, uploadedById: null }), false);
    assert.equal(await assetInScope(orgId, editorId, "editor", { contentItemId: theirs, uploadedById: editorId }), true, "a file they uploaded stays visible");
    await assert.rejects(assertContentInScope({ org: { id: orgId }, user: { id: editorId }, role: "editor" }, theirs), /not assigned/);
    await assertContentInScope({ org: { id: orgId }, user: { id: editorId }, role: "editor" }, mine);
  });

  it("a work assignment adds a piece; one without a piece opens the whole workspace", async () => {
    await prisma.workAssignment.create({ data: { orgId, userId: editorId, kind: "qa_reviewer", contentItemId: theirs } });
    assert.deepEqual((await contentScope(orgId, editorId, "editor"))?.sort(), [mine, theirs].sort());
    await prisma.workAssignment.create({ data: { orgId, userId: editorId, kind: "editor", contentItemId: null } });
    assert.equal(await contentScope(orgId, editorId, "editor"), null);
  });
});
