import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { contentMix } from "./mix";
import { generateIdeas } from "@/lib/ai/generators";

const stamp = Date.now();
let orgId = "";
let userId = "";

async function piece(pesto: string, funnelRole: string, views: number, inquiries: number) {
  const idea = await prisma.idea.create({ data: { orgId, title: `${pesto} idea`, pesto, funnelRole } as never });
  const item = await prisma.contentItem.create({ data: { orgId, title: `${pesto} piece`, ideaId: idea.id, liveAt: new Date(), stage: "live" } as never });
  const rec = await prisma.publishRecord.create({ data: { orgId, contentItemId: item.id, platform: "linkedin", status: "published" } });
  await prisma.performanceSnapshot.create({ data: { orgId, publishRecordId: rec.id, views } as never });
  for (let i = 0; i < inquiries; i++) await prisma.inquiry.create({ data: { orgId, name: `Lead ${i}`, contentItemId: item.id } });
}

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-mix-${stamp}`, name: "QA Mix", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `mix-${stamp}@example.com`, name: "Mix", passwordHash: "x" } })).id;
  for (let i = 0; i < 3; i++) await piece("opinion", "awareness", 1000, 0);
  await piece("expertise", "conversion", 300, 2);
});
after(async () => {
  await prisma.aiGeneration.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("content mix and PESTO (AI-04)", () => {
  it("measures the mix by category and funnel role, and marks small groups", async () => {
    const mix = await contentMix(orgId, new Date(Date.now() - 86_400_000));
    const expertise = mix.find((m) => m.key === "pesto:expertise")!;
    const opinion = mix.find((m) => m.key === "pesto:opinion")!;
    assert.deepEqual([expertise.pieces, expertise.inquiriesPerPiece, expertise.tooFew], [1, 2, true]);
    assert.deepEqual([opinion.pieces, opinion.viewsPerPiece, opinion.tooFew], [3, 1000, false]);
    assert.equal(mix[0].key.startsWith("pesto:expertise") || mix[0].key.startsWith("funnel:conversion"), true, "commercial signal ranks first");
  });

  it("generated ideas carry a PESTO category and funnel role (demo mode, labelled)", async () => {
    const { ideas, meta } = await generateIdeas({ orgId, userId, count: 5 });
    assert.equal(meta.isDemo, true);
    assert.ok(ideas.every((i) => i.pesto && i.funnelRole));
    assert.equal(new Set(ideas.map((i) => i.pesto)).size, 5);
  });
});
