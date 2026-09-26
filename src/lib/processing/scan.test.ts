import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { applyCallback, kindsFor, queueProcessingFor } from "./index";

const stamp = Date.now();
let orgId = "";
const saved = process.env.PROCESSING_SCAN;

before(async () => {
  orgId = (await prisma.organization.create({ data: { slug: `qa-scan-${stamp}`, name: "QA Scan", kind: "client", synthetic: true } })).id;
});
after(async () => {
  if (saved === undefined) delete process.env.PROCESSING_SCAN;
  else process.env.PROCESSING_SCAN = saved;
  await prisma.job.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
});

describe("malware scanning (FILE-03)", () => {
  it("adds a scan step to every stored file only when scanning is enabled", () => {
    assert.deepEqual(kindsFor("application/pdf", {}), []);
    assert.deepEqual(kindsFor("application/pdf", { PROCESSING_SCAN: "true" }), ["scan"]);
    assert.deepEqual(kindsFor("video/mp4", { PROCESSING_SCAN: "true" }), ["scan", "transcode", "transcribe", "thumbnail"]);
  });

  it("marks a file clean or infected from the scan result; infected is quarantined", async () => {
    process.env.PROCESSING_SCAN = "true";
    const a = await prisma.asset.create({ data: { orgId, category: "offer_doc", title: "deck.pdf", mimeType: "application/pdf", storagePath: `${orgId}/library/deck.pdf` } });
    const b = await prisma.asset.create({ data: { orgId, category: "offer_doc", title: "bad.pdf", mimeType: "application/pdf", storagePath: `${orgId}/library/bad.pdf` } });
    await queueProcessingFor(a);
    await queueProcessingFor(b);
    const ta = await prisma.processingTask.findFirstOrThrow({ where: { assetId: a.id, kind: "scan" } });
    const tb = await prisma.processingTask.findFirstOrThrow({ where: { assetId: b.id, kind: "scan" } });
    await applyCallback({ taskId: ta.id, status: "succeeded", output: { clean: true } });
    await applyCallback({ taskId: tb.id, status: "succeeded", output: { clean: false, signature: "EICAR-Test-File" } });
    assert.equal((await prisma.asset.findUniqueOrThrow({ where: { id: a.id } })).scanState, "clean");
    assert.equal((await prisma.asset.findUniqueOrThrow({ where: { id: b.id } })).scanState, "infected");
    assert.match((await prisma.processingTask.findUniqueOrThrow({ where: { id: tb.id } })).result ?? "", /EICAR/);
  });
});
