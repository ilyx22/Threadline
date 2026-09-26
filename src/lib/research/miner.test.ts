import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { locate, mineSource } from "./miner";

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

  it("refuses a source too short to mine", async () => {
    await assert.rejects(mineSource(orgId, userId, { text: "Too short.", sourceType: "document", sourceRef: "x" }), /not enough text/);
  });
});
