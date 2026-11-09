import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { loadWorkspaceContext } from "@/lib/ai/context";
import { locate, mineAsset, mineSource, setAssetRoute } from "./miner";
import { draftableResearch } from "./source-route";

const stamp = Date.now();
let orgId = "";
let userId = "";

const TRANSCRIPT = `We started the call by talking about referrals. What happens when the referral partners retire?
Honestly I'm worried the retainer is expensive for a firm our size. We grew revenue 40% after the audit work.
When we lost our biggest client last year, the whole team had to rethink the offer.
Most firms price advisory by the hour, which punishes the fastest thinker in the room.`;

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-miner-${stamp}`, name: "QA Miner", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `miner-${stamp}@example.com`, name: "Operator", passwordHash: "x" } })).id;
});
after(async () => {
  await prisma.aiGeneration.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("source miner (AI-01)", () => {
  it("locates exact quotes, tolerating whitespace only", () => {
    const at = locate("one  two\nthree four five six", "two three four five");
    assert.deepEqual(at, { start: 5, end: 24 });
    assert.equal(locate("the source says this plainly", "the source says that plainly"), null, "a paraphrase is not a quote");
    assert.equal(locate("short", "short"), null, "too short to be a meaningful quote");
  });

  it("mines exact quotes with kinds and provenance, once per source", async () => {
    const r = await mineSource(orgId, userId, { text: TRANSCRIPT, sourceType: "transcript", sourceRef: "Discovery call 2026-09-20", assetId: null, permission: "Client consented to use of call material" });
    assert.equal(r.isDemo, true);
    const kinds = new Set(r.kept.map((k) => k.kind));
    for (const k of ["question", "objection", "claim", "story", "expertise"]) assert.ok(kinds.has(k as never), k);
    for (const k of r.kept) assert.ok(TRANSCRIPT.replace(/\s+/g, " ").includes(k.quote.replace(/\s+/g, " ")), "every quote is in the source");
    const row = await prisma.researchItem.findFirstOrThrow({ where: { orgId, kind: "claim" } });
    const meta = JSON.parse(row.sourceMeta) as { sourceRef: string; charStart: number; charEnd: number; permission: string };
    assert.equal(meta.sourceRef, "Discovery call 2026-09-20");
    assert.equal(TRANSCRIPT.slice(meta.charStart, meta.charEnd), row.body);
    const again = await mineSource(orgId, userId, { text: TRANSCRIPT, sourceType: "transcript", sourceRef: "Discovery call 2026-09-20" });
    assert.equal(await prisma.researchItem.count({ where: { orgId } }), r.kept.length, "mining the same source again adds nothing");
    assert.equal(again.kept.length, r.kept.length);
  });

  it("keeps internal, private and excluded sources away from the writer (BUILD-03)", async () => {
    const body = "INTERNAL-ONLY sales training line that must never reach a public draft.";
    const items = await Promise.all((["INTERNAL_CONVERSION_ONLY", "PRIVATE_CLIENT_DELIVERY", "EXCLUDED"] as const).map((sourceRoute) =>
      prisma.researchItem.create({ data: { orgId, kind: "objection", title: `${sourceRoute} leak probe`, body, collectedVia: "miner", sourceMeta: JSON.stringify({ sourceRoute }) } }),
    ));
    await prisma.researchItem.create({ data: { orgId, kind: "question", title: "Public eligible probe", collectedVia: "miner", sourceMeta: JSON.stringify({ sourceRoute: "PUBLIC_CONTENT_ELIGIBLE" }) } });
    await prisma.researchItem.create({ data: { orgId, kind: "trend", title: "Unrouted pasted research probe" } });

    const { blocks, demo } = await loadWorkspaceContext(orgId, { blocks: ["MARKET_CONTEXT"] });
    assert.match(blocks.MARKET_CONTEXT ?? "", /Public eligible probe/);
    assert.match(blocks.MARKET_CONTEXT ?? "", /Unrouted pasted research probe/, "research that was never mined is unaffected");
    assert.doesNotMatch(blocks.MARKET_CONTEXT ?? "", /leak probe|INTERNAL-ONLY/);
    assert.doesNotMatch(JSON.stringify(demo), /leak probe/);

    const drafted = await prisma.researchItem.findMany({ where: { id: { in: items.map((i) => i.id) }, orgId, ...draftableResearch() } });
    assert.equal(drafted.length, 0, "an explicit link by id cannot pull a withheld item either");
  });

  it("refuses to mine a file until it is routed, and re-routing reaches items already mined (BUILD-03)", async () => {
    const asset = await prisma.asset.create({ data: { orgId, category: "transcript", title: "Sales training", mimeType: "text/plain", storagePath: "not/read" } });
    await assert.rejects(mineAsset(orgId, userId, asset.id), /before mining/);
    await setAssetRoute(orgId, asset.id, "EXCLUDED");
    await assert.rejects(mineAsset(orgId, userId, asset.id), /excluded/);

    const mined = await prisma.researchItem.create({ data: { orgId, kind: "claim", title: "Mined before re-route", collectedVia: "miner", sourceMeta: JSON.stringify({ assetId: asset.id, sourceRoute: "PUBLIC_CONTENT_ELIGIBLE" }) } });
    const idea = await prisma.idea.create({ data: { orgId, title: "Idea citing it" } });
    await prisma.ideaEvidence.create({ data: { ideaId: idea.id, researchItemId: mined.id } });
    const r = await setAssetRoute(orgId, asset.id, "INTERNAL_CONVERSION_ONLY");
    assert.deepEqual(r, { updated: 1, citedByIdeas: 1 });
    const { blocks } = await loadWorkspaceContext(orgId, { blocks: ["MARKET_CONTEXT"] });
    assert.doesNotMatch(blocks.MARKET_CONTEXT ?? "", /Mined before re-route/);
  });

  it("refuses a source too short to mine", async () => {
    await assert.rejects(mineSource(orgId, userId, { text: "Too short.", sourceType: "document", sourceRef: "x" }), /not enough text/);
  });
});
