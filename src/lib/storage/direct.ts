import "server-only";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { getStorage, sanitiseFileName, StorageError, supportsMultipart, storageProviderName } from "./index";
import { ACCEPTED, contentProblem } from "./sniff";
import { queueProcessingFor } from "@/lib/processing";

/**
 * Direct-to-storage uploads (FILE-02).
 *
 * Large files (raw video) never pass through a server function. The server
 * authorises the upload and opens a multipart upload; the browser sends each
 * part straight to the bucket with a signed URL that lives fifteen minutes;
 * the server then assembles the object, checks its size and its first bytes
 * against the declared type, and only then creates the Asset. A file that
 * fails the check is deleted, never kept. Open uploads expire after a day and
 * are aborted by the daily tick, so abandoned parts do not accumulate.
 */
export const DIRECT_MAX_BYTES = 2000 * 1024 * 1024; // 2,000 MB: Asset.sizeBytes is a 32-bit integer
const MIN_PART = 8 * 1024 * 1024; // S3 needs at least 5 MB for every part but the last
const MAX_PARTS = 10_000;
const OPEN_FOR_MS = 24 * 3_600_000;

export type Owner = { orgId: string; userId: string };

export function planParts(sizeBytes: number) {
  const partSize = Math.max(MIN_PART, Math.ceil(sizeBytes / MAX_PARTS));
  return { partSize, partCount: Math.max(1, Math.ceil(sizeBytes / partSize)) };
}

/** Expected byte length of part n (1-based). */
export function partLength(sizeBytes: number, partSize: number, n: number) {
  const count = Math.max(1, Math.ceil(sizeBytes / partSize));
  return n < count ? partSize : sizeBytes - partSize * (count - 1);
}

function multipart() {
  const a = getStorage();
  if (!supportsMultipart(a)) throw new StorageError("This storage does not support direct uploads.");
  return a;
}

export async function startDirectUpload(
  owner: Owner,
  input: { fileName: string; mimeType: string; sizeBytes: number; category: string; title?: string | null; contentItemId?: string | null },
) {
  const mimeType = input.mimeType.toLowerCase().split(";")[0].trim();
  if (!ACCEPTED[mimeType]) throw new StorageError(contentProblem(mimeType, new Uint8Array()) ?? `Files of type "${mimeType}" are not accepted.`);
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) throw new StorageError("The file is empty.");
  if (input.sizeBytes > DIRECT_MAX_BYTES) throw new StorageError(`Files must be smaller than ${DIRECT_MAX_BYTES / 1024 / 1024} MB.`);
  if (input.contentItemId) {
    const item = await prisma.contentItem.findFirst({ where: { id: input.contentItemId, orgId: owner.orgId }, select: { id: true } });
    if (!item) throw new StorageError("That content item is not in this workspace.");
  }
  const safeName = sanitiseFileName(input.fileName);
  const ext = path.extname(safeName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const key = path.posix.join(owner.orgId, "library", `${randomUUID()}${ext}`);
  const { partSize, partCount } = planParts(input.sizeBytes);
  const uploadId = await multipart().createMultipart(key, mimeType);
  return prisma.uploadSession.create({
    data: {
      orgId: owner.orgId,
      userId: owner.userId,
      storagePath: key,
      storageProvider: storageProviderName(),
      uploadId,
      fileName: safeName,
      mimeType,
      sizeBytes: input.sizeBytes,
      partSize,
      partCount,
      category: input.category,
      title: input.title?.trim() || null,
      contentItemId: input.contentItemId ?? null,
      expiresAt: new Date(Date.now() + OPEN_FOR_MS),
    },
    select: { id: true, partSize: true, partCount: true, sizeBytes: true },
  });
}

async function openSession(owner: Owner, sessionId: string) {
  const s = await prisma.uploadSession.findFirst({ where: { id: sessionId, orgId: owner.orgId, userId: owner.userId } });
  if (!s) throw new StorageError("That upload does not exist.");
  if (s.status !== "uploading") throw new StorageError(`That upload is ${s.status}.`);
  if (s.expiresAt < new Date()) throw new StorageError("That upload has expired. Start it again.");
  return s;
}

/** Where the browser sends each part: a signed bucket URL, or the app's own part route in development. */
export async function partTargets(owner: Owner, sessionId: string, partNumbers: number[]) {
  const s = await openSession(owner, sessionId);
  const wanted = [...new Set(partNumbers)].slice(0, 100);
  if (wanted.some((n) => !Number.isInteger(n) || n < 1 || n > s.partCount)) throw new StorageError("Part number out of range.");
  const store = multipart();
  return wanted.map((n) => ({
    partNumber: n,
    bytes: partLength(s.sizeBytes, s.partSize, n),
    url: store.partUrl ? store.partUrl(s.storagePath, s.uploadId!, n) : `/api/uploads/${s.id}/parts/${n}`,
  }));
}

/** The app's own part route (development and tests; with S3 the browser sends parts to the bucket). */
export async function writeLocalPart(owner: Owner, sessionId: string, partNumber: number, body: Buffer) {
  const s = await openSession(owner, sessionId);
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > s.partCount) throw new StorageError("Part number out of range.");
  if (body.byteLength !== partLength(s.sizeBytes, s.partSize, partNumber)) throw new StorageError("That part is the wrong size.");
  const store = multipart();
  if (!store.writePart) throw new StorageError("Send parts to storage directly.");
  return store.writePart(s.storagePath, s.uploadId!, partNumber, body);
}

/**
 * Assemble, verify and record. Exactly one caller completes a session; a
 * repeat by the same person returns the same asset.
 */
export async function completeDirectUpload(owner: Owner, sessionId: string, parts: { partNumber: number; etag: string }[]) {
  const existing = await prisma.uploadSession.findFirst({ where: { id: sessionId, orgId: owner.orgId, userId: owner.userId } });
  if (!existing) throw new StorageError("That upload does not exist.");
  if (existing.status === "complete" && existing.assetId) return { assetId: existing.assetId };
  const s = await openSession(owner, sessionId);

  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  if (sorted.length !== s.partCount || sorted.some((p, i) => p.partNumber !== i + 1 || !p.etag)) {
    throw new StorageError("Some parts are missing. Retry the upload.");
  }

  const claimed = await prisma.uploadSession.updateMany({ where: { id: s.id, status: "uploading" }, data: { status: "verifying" } });
  if (claimed.count !== 1) throw new StorageError("That upload is already being finished.");

  const store = multipart();
  const fail = async (message: string, removeObject: boolean): Promise<never> => {
    if (removeObject) await getStorage().delete(s.storagePath).catch(() => {});
    else await store.abortMultipart(s.storagePath, s.uploadId!).catch(() => {});
    await prisma.uploadSession.update({ where: { id: s.id }, data: { status: "failed", error: message.slice(0, 500) } });
    throw new StorageError(message);
  };

  try {
    await store.completeMultipart(s.storagePath, s.uploadId!, sorted);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Storage could not assemble the upload.", false);
  }
  const size = await store.size(s.storagePath);
  if (size !== s.sizeBytes) return fail(`The stored file is ${size ?? 0} bytes, not the ${s.sizeBytes} announced.`, true);
  const problem = contentProblem(s.mimeType, await store.head(s.storagePath, 4096));
  if (problem) return fail(problem, true);

  const asset = await prisma.$transaction(async (tx) => {
    const a = await tx.asset.create({
      data: {
        orgId: s.orgId,
        contentItemId: s.contentItemId,
        category: s.category,
        title: s.title || s.fileName,
        fileName: s.fileName,
        mimeType: s.mimeType,
        sizeBytes: s.sizeBytes,
        storagePath: s.storagePath,
        storageProvider: s.storageProvider,
        uploadedById: s.userId,
      },
    });
    await tx.uploadSession.update({ where: { id: s.id }, data: { status: "complete", assetId: a.id, completedAt: new Date() } });
    return a;
  });
  await queueProcessingFor(asset);
  return { assetId: asset.id };
}

export async function abortDirectUpload(owner: Owner, sessionId: string) {
  const s = await prisma.uploadSession.findFirst({ where: { id: sessionId, orgId: owner.orgId, userId: owner.userId } });
  if (!s || s.status !== "uploading") return;
  const claimed = await prisma.uploadSession.updateMany({ where: { id: s.id, status: "uploading" }, data: { status: "aborted" } });
  if (claimed.count === 1 && s.uploadId) await multipart().abortMultipart(s.storagePath, s.uploadId).catch(() => {});
}

/** Daily tick: abort uploads left open past their expiry. */
export async function expireStaleUploads(now = new Date()) {
  const stale = await prisma.uploadSession.findMany({ where: { status: "uploading", expiresAt: { lt: now } }, take: 200 });
  let expired = 0;
  for (const s of stale) {
    const claimed = await prisma.uploadSession.updateMany({ where: { id: s.id, status: "uploading" }, data: { status: "expired" } });
    if (claimed.count !== 1) continue;
    expired++;
    const store = getStorage();
    if (s.uploadId && supportsMultipart(store)) await store.abortMultipart(s.storagePath, s.uploadId).catch(() => {});
  }
  return expired;
}
