import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { currentBrainVersion, listBrainVersions, restoreBrainVersion, staleDrafts } from "./brain-versions";

const stamp = Date.now();
let orgId = "";

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-brain-${stamp}`, name: "QA Brain", kind: "client", synthetic: true } })).id;
  await prisma.brandBrain.create({ data: { orgId, voice: '{"tone":"plain"}' } });
});
after(async () => {
  await prisma.brandBrainVersion.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("Brand Brain versions (AI-03, ENG-04)", () => {
  it("the database versions every content change, whatever writes it, and ignores no-op writes", async () => {
    assert.equal(await currentBrainVersion(orgId), 1);
    await prisma.brandBrain.update({ where: { orgId }, data: { voice: '{"tone":"blunt"}' } });
    await prisma.brandBrain.update({ where: { orgId }, data: { completeness: 40 } }); // not a content change
    await prisma.brandBrain.update({ where: { orgId }, data: { company: '{"name":"Acme"}', contentRules: '{"cadencePerWeek":3}' } });
    assert.equal(await currentBrainVersion(orgId), 3);
    const versions = await listBrainVersions(orgId);
    assert.deepEqual(versions.map((v) => [v.version, JSON.parse(v.changed)]), [[3, ["company", "contentRules"]], [2, ["voice"]], [1, []]]);
  });

  it("restoring an old version is a new version; nothing is lost", async () => {
    const now = await restoreBrainVersion(orgId, 1);
    assert.equal(now, 4);
    const brain = await prisma.brandBrain.findUniqueOrThrow({ where: { orgId } });
    assert.equal(brain.voice, '{"tone":"plain"}');
    assert.equal((await listBrainVersions(orgId)).length, 4);
  });

  it("finds AI drafts written against an older version", async () => {
    const s = await prisma.script.create({ data: { orgId, title: "Old draft", qaState: "ai_draft" } as never });
    await prisma.scriptVersion.create({ data: { scriptId: s.id, version: 1, hook: "h", body: "b", generatedBy: "ai", brainVersion: 2 } });
    const fresh = await prisma.script.create({ data: { orgId, title: "Fresh draft", qaState: "ai_draft" } as never });
    await prisma.scriptVersion.create({ data: { scriptId: fresh.id, version: 1, hook: "h", body: "b", generatedBy: "ai", brainVersion: 4 } });
    assert.deepEqual((await staleDrafts(orgId)).map((d) => [d.title, d.writtenAgainst, d.current]), [["Old draft", 2, 4]]);
  });
});
