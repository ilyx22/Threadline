import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { prisma } from "@/lib/db/client";
import { __setStorage, MemoryStorageAdapter } from "./index";
import { abortDirectUpload, completeDirectUpload, expireStaleUploads, partLength, partTargets, planParts, startDirectUpload, writeLocalPart } from "./direct";
import { S3StorageAdapter } from "./s3";
import { applyCallback, parseCallback, sign, verifySignature } from "@/lib/processing";

const stamp = Date.now();
let orgId = "";
let userId = "";
let otherId = "";
const mem = new MemoryStorageAdapter();
const MP4 = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d];

function mp4(size: number) {
  const b = Buffer.alloc(size, 7);
  Buffer.from(MP4).copy(b);
  return b;
}

async function sendAll(owner: { orgId: string; userId: string }, sessionId: string, file: Buffer, partSize: number, count: number) {
  const parts = [];
  for (let n = 1; n <= count; n++) {
    const body = file.subarray((n - 1) * partSize, (n - 1) * partSize + partLength(file.length, partSize, n));
    parts.push({ partNumber: n, etag: await writeLocalPart(owner, sessionId, n, Buffer.from(body)) });
  }
  return parts;
}

before(async () => {
  __setStorage(mem);
  orgId = (await prisma.organization.create({ data: { slug: `qa-direct-${stamp}`, name: "QA Direct", kind: "client", synthetic: true } })).id;
  userId = (await prisma.user.create({ data: { email: `direct-${stamp}@example.com`, name: "Uploader", passwordHash: "x" } })).id;
  otherId = (await prisma.user.create({ data: { email: `direct-other-${stamp}@example.com`, name: "Other", passwordHash: "x" } })).id;
});
after(async () => {
  __setStorage(null);
  await prisma.organization.delete({ where: { id: orgId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } });
  await prisma.job.deleteMany({ where: { orgId } });
});

describe("direct uploads (FILE-02)", () => {
  it("plans parts within storage limits", () => {
    assert.deepEqual(planParts(1), { partSize: 8 * 1024 * 1024, partCount: 1 });
    const big = planParts(2000 * 1024 * 1024);
    assert.ok(big.partCount <= 10_000 && big.partSize >= 5 * 1024 * 1024);
    assert.equal(partLength(20, 8, 3), 4);
  });

  it("refuses disallowed types, empty and oversized files before opening anything", async () => {
    const owner = { orgId, userId };
    await assert.rejects(startDirectUpload(owner, { fileName: "x.svg", mimeType: "image/svg+xml", sizeBytes: 10, category: "brand_asset" }), /SVG/);
    await assert.rejects(startDirectUpload(owner, { fileName: "x.mp4", mimeType: "video/mp4", sizeBytes: 0, category: "raw_media" }), /empty/);
    await assert.rejects(startDirectUpload(owner, { fileName: "x.mp4", mimeType: "video/mp4", sizeBytes: 3000 * 1024 * 1024, category: "raw_media" }), /smaller/);
    assert.equal(await prisma.uploadSession.count({ where: { orgId } }), 0);
  });

  it("uploads in parts, verifies, records one asset and queues processing; a repeat returns the same asset", async () => {
    const owner = { orgId, userId };
    const size = 8 * 1024 * 1024 + 1000;
    const s = await startDirectUpload(owner, { fileName: "Raw take.mp4", mimeType: "video/mp4", sizeBytes: size, category: "raw_media", title: "Take 1" });
    assert.equal(s.partCount, 2);
    const targets = await partTargets(owner, s.id, [1, 2]);
    assert.match(targets[0].url, new RegExp(`/api/uploads/${s.id}/parts/1$`));
    // another person cannot use the session
    await assert.rejects(partTargets({ orgId, userId: otherId }, s.id, [1]), /does not exist/);
    await assert.rejects(writeLocalPart(owner, s.id, 1, Buffer.alloc(10)), /wrong size/);
    const parts = await sendAll(owner, s.id, mp4(size), s.partSize, s.partCount);
    const { assetId } = await completeDirectUpload(owner, s.id, parts);
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });
    assert.equal(asset.sizeBytes, size);
    assert.equal(asset.title, "Take 1");
    assert.equal(asset.processingState, "queued");
    assert.equal(await prisma.processingTask.count({ where: { assetId } }), 3, "transcode, transcribe, thumbnail");
    assert.deepEqual(await completeDirectUpload(owner, s.id, parts), { assetId });
    assert.equal(await prisma.asset.count({ where: { orgId, storagePath: asset.storagePath } }), 1);
  });

  it("deletes an assembled file whose bytes do not match its type, and records no asset", async () => {
    const owner = { orgId, userId };
    const s = await startDirectUpload(owner, { fileName: "fake.mp4", mimeType: "video/mp4", sizeBytes: 100, category: "raw_media" });
    const parts = await sendAll(owner, s.id, Buffer.from("<html><script>alert(1)</script>".padEnd(100, " ")), s.partSize, 1);
    await assert.rejects(completeDirectUpload(owner, s.id, parts), /do not match/);
    const row = await prisma.uploadSession.findUniqueOrThrow({ where: { id: s.id } });
    assert.equal(row.status, "failed");
    assert.equal(await mem.exists(row.storagePath), false);
    assert.equal(row.assetId, null);
  });

  it("refuses completion with missing parts, and aborts and expires open uploads", async () => {
    const owner = { orgId, userId };
    const s = await startDirectUpload(owner, { fileName: "a.mp4", mimeType: "video/mp4", sizeBytes: 9 * 1024 * 1024, category: "raw_media" });
    await assert.rejects(completeDirectUpload(owner, s.id, [{ partNumber: 1, etag: '"x"' }]), /missing/);
    await abortDirectUpload(owner, s.id);
    assert.equal((await prisma.uploadSession.findUniqueOrThrow({ where: { id: s.id } })).status, "aborted");
    const t = await startDirectUpload(owner, { fileName: "b.mp4", mimeType: "video/mp4", sizeBytes: 100, category: "raw_media" });
    await prisma.uploadSession.update({ where: { id: t.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.ok((await expireStaleUploads()) >= 1);
    assert.equal((await prisma.uploadSession.findUniqueOrThrow({ where: { id: t.id } })).status, "expired");
  });

  it("S3: starts, signs part URLs and assembles with the documented requests", async () => {
    const calls: { method: string; url: string; body?: string }[] = [];
    const fake = (async (input: URL | string, init?: RequestInit) => {
      const url = String(input);
      calls.push({ method: init?.method ?? "GET", url, body: typeof init?.body === "string" ? init.body : undefined });
      if (url.includes("uploads=")) return new Response("<InitiateMultipartUploadResult><UploadId>up-1</UploadId></InitiateMultipartUploadResult>");
      return new Response("<CompleteMultipartUploadResult/>");
    }) as typeof fetch;
    const s3 = new S3StorageAdapter({ bucket: "b", region: "auto", accessKeyId: "AK", secretAccessKey: "SK", endpoint: "https://acct.r2.example.com" }, fake);
    const id = await s3.createMultipart("org1/library/f.mp4", "video/mp4");
    assert.equal(id, "up-1");
    assert.equal(calls[0].method, "POST");
    const url = new URL(s3.partUrl("org1/library/f.mp4", id, 3));
    assert.equal(url.searchParams.get("partNumber"), "3");
    assert.equal(url.searchParams.get("uploadId"), "up-1");
    assert.match(url.searchParams.get("X-Amz-Signature") ?? "", /^[0-9a-f]{64}$/);
    await s3.completeMultipart("org1/library/f.mp4", id, [{ partNumber: 1, etag: '"e1"' }]);
    assert.match(calls[1].url, /uploadId=up-1/);
    assert.match(calls[1].body ?? "", /<Part><PartNumber>1<\/PartNumber><ETag>"e1"<\/ETag><\/Part>/);
    // nested content keys are valid storage paths
    assert.doesNotThrow(() => s3.signedGetUrl("org1/content/item1/f.mp4"));
  });
});

describe("processing callbacks (FILE-05)", () => {
  it("verifies signatures over the exact body within five minutes", () => {
    const body = JSON.stringify({ taskId: "t", status: "processing" });
    const secret = "a-processing-secret-123";
    const header = sign(body, secret);
    assert.equal(verifySignature(body, header, secret), true);
    assert.equal(verifySignature(body + " ", header, secret), false);
    assert.equal(verifySignature(body, header, "another-secret-4567"), false);
    assert.equal(verifySignature(body, sign(body, secret, Date.now() - 10 * 60_000), secret), false);
    assert.equal(parseCallback({ taskId: "t", status: "exploded" }), null);
  });

  it("moves forward only, stores a transcript once, and aggregates the file state", async () => {
    const asset = await prisma.asset.findFirstOrThrow({ where: { orgId, processingState: "queued" } });
    const tasks = await prisma.processingTask.findMany({ where: { assetId: asset.id } });
    const by = (k: string) => tasks.find((t) => t.kind === k)!.id;

    assert.equal((await applyCallback({ taskId: by("transcribe"), status: "processing" })).applied, true);
    assert.equal((await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } })).processingState, "processing");
    const [a, b] = await Promise.all([
      applyCallback({ taskId: by("transcribe"), status: "succeeded", output: { transcript: "Hello, this is the take." } }),
      applyCallback({ taskId: by("transcribe"), status: "succeeded", output: { transcript: "Hello, this is the take." } }),
    ]);
    assert.equal([a, b].filter((r) => r.applied).length, 1, "one transcript from two identical callbacks");
    assert.equal(await prisma.asset.count({ where: { orgId, category: "transcript" } }), 1);
    // a late "processing" after success changes nothing
    assert.equal((await applyCallback({ taskId: by("transcribe"), status: "processing" })).applied, false);
    assert.equal((await prisma.processingTask.findUniqueOrThrow({ where: { id: by("transcribe") } })).status, "succeeded");

    await applyCallback({ taskId: by("transcode"), status: "succeeded", output: { durationMs: 61000, width: 1080, height: 1920 } });
    await applyCallback({ taskId: by("thumbnail"), status: "failed", error: "no frames" });
    assert.equal((await prisma.asset.findUniqueOrThrow({ where: { id: asset.id } })).processingState, "failed");
    assert.equal((await applyCallback({ taskId: "missing", status: "succeeded" })).applied, false);
  });
});
