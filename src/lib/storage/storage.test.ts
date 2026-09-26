import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MemoryStorageAdapter, LocalStorageAdapter, StorageError, checkFile } from "./index";
import { S3StorageAdapter, assertScopedKey, signV4 } from "./s3";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Real leading bytes per type: uploads are checked against their contents (SEC-02).
const HEAD: Record<string, number[]> = {
  "video/mp4": [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d],
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, 0x25, 0x25, 0x0a],
  "text/plain": [0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x0a],
};
const file = (name: string, type: string, bytes = 12) => {
  const b = new Uint8Array(bytes);
  b.set((HEAD[type] ?? []).slice(0, bytes));
  return new File([b], name, { type });
};

describe("storage validation", () => {
  test("refuses empty, oversized and disallowed files before any adapter runs", () => {
    assert.throws(() => checkFile(new File([], "x.mp4", { type: "video/mp4" })), StorageError);
    assert.throws(() => checkFile(file("evil.exe", "application/x-msdownload")), StorageError);
    assert.equal(checkFile(file("clip.mp4", "video/mp4")).mimeType, "video/mp4");
    assert.equal(checkFile(file("../../etc/passwd", "text/plain")).safeName.includes("/"), false);
  });
});

describe("memory adapter", () => {
  test("tenant-scoped keys, round trip, traversal refused", async () => {
    const m = new MemoryStorageAdapter();
    const stored = await m.put({ orgId: "org1", file: file("a.pdf", "application/pdf") });
    assert.ok(stored.storagePath.startsWith("org1/assets/"));
    assert.equal((await m.get(stored.storagePath)).length, 12);
    await assert.rejects(() => m.get("../secret"), StorageError);
    await assert.rejects(() => m.get("org1/assets/missing.pdf"), StorageError);
  });
});

describe("local adapter", () => {
  test("writes under the root and refuses escapes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "tl-storage-"));
    const local = new LocalStorageAdapter(root);
    const stored = await local.put({ orgId: "org2", file: file("b.txt", "text/plain") });
    assert.ok(await local.exists(stored.storagePath));
    await assert.rejects(() => local.get("../../outside.txt"), StorageError);
    await local.delete(stored.storagePath);
    assert.equal(await local.exists(stored.storagePath), false);
  });
});

describe("s3 adapter", () => {
  const config = { bucket: "b", region: "eu-west-2", accessKeyId: "AKIA", secretAccessKey: "secret", endpoint: "https://s3.example.test" };

  test("SigV4 is deterministic for a fixed time and signs the payload hash", () => {
    const h1 = signV4({ method: "PUT", url: new URL("https://s3.example.test/b/org/assets/x.mp4"), headers: { "content-type": "video/mp4" }, body: "abc", config, now: new Date("2026-09-09T00:00:00Z") });
    const h2 = signV4({ method: "PUT", url: new URL("https://s3.example.test/b/org/assets/x.mp4"), headers: { "content-type": "video/mp4" }, body: "abc", config, now: new Date("2026-09-09T00:00:00Z") });
    assert.equal(h1.authorization, h2.authorization);
    assert.match(h1.authorization, /^AWS4-HMAC-SHA256 Credential=AKIA\/20260909\/eu-west-2\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
    const h3 = signV4({ method: "PUT", url: new URL("https://s3.example.test/b/org/assets/x.mp4"), headers: { "content-type": "video/mp4" }, body: "abd", config, now: new Date("2026-09-09T00:00:00Z") });
    assert.notEqual(h1.authorization, h3.authorization);
  });

  test("put/get/delete go through a mocked HTTP boundary with tenant-scoped keys", async () => {
    const seen: { method: string; url: string; auth: string }[] = [];
    const fake: typeof fetch = async (input, init) => {
      const url = String(input);
      seen.push({ method: init?.method ?? "GET", url, auth: String((init?.headers as Record<string, string>).authorization ?? "") });
      if (init?.method === "GET") return new Response(new Uint8Array([1, 2, 3]));
      if (init?.method === "HEAD") return new Response(null, { status: 404 });
      return new Response(null, { status: 200 });
    };
    const s3 = new S3StorageAdapter(config, fake);
    const stored = await s3.put({ orgId: "orgz", file: file("clip.mp4", "video/mp4") });
    assert.ok(stored.storagePath.startsWith("orgz/assets/"));
    assert.equal((await s3.get(stored.storagePath)).length, 3);
    assert.equal(await s3.exists(stored.storagePath), false);
    assert.ok(seen.every((s) => s.url.startsWith("https://s3.example.test/b/orgz/assets/") && s.auth.startsWith("AWS4-HMAC-SHA256")));
    await assert.rejects(() => s3.get("../etc/passwd"), StorageError);
    await assert.rejects(() => s3.get("orgz/assets/../../other/x"), StorageError);
  });

  test("signed GET urls are short-lived and scoped", () => {
    const s3 = new S3StorageAdapter(config, async () => new Response(null));
    const url = s3.signedGetUrl("orgz/assets/abc.mp4", 60, new Date("2026-09-09T00:00:00Z"));
    assert.match(url, /X-Amz-Expires=60/);
    assert.match(url, /X-Amz-Signature=[0-9a-f]{64}/);
    assert.throws(() => assertScopedKey("orgz/assets"), StorageError);
  });
});
