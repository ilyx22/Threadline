import "server-only";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ACCEPTED, contentProblem } from "./sniff";

/**
 * Storage adapter.
 *
 * v1 writes to local disk under `storage/{orgId}/…`. Files are NEVER served from
 * a public static path — reads go through `/api/files/[...path]`, which re-checks
 * organisation membership on every request (see docs/ARCHITECTURE.md ADR-004).
 *
 * Swapping in S3 or Supabase Storage means implementing this interface; call
 * sites do not change.
 */

export type StoredFile = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  readonly name?: string;
  put(input: {
    orgId: string;
    file: File;
    prefix?: string;
  }): Promise<StoredFile>;
  get(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  exists(storagePath: string): Promise<boolean>;
}

const MAX_BYTES = 512 * 1024 * 1024; // 512MB — raw video is the largest realistic upload

/**
 * Multipart upload (FILE-02). S3 hands the browser pre-signed part URLs
 * (`partUrl`); the local and memory adapters take parts through the app
 * (`writePart`) so the same flow runs in development and tests.
 */
export interface MultipartStorage {
  createMultipart(key: string, mimeType: string): Promise<string>;
  partUrl?(key: string, uploadId: string, partNumber: number, expiresSeconds?: number): string;
  writePart?(key: string, uploadId: string, partNumber: number, body: Buffer): Promise<string>;
  completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]): Promise<void>;
  abortMultipart(key: string, uploadId: string): Promise<void>;
  size(key: string): Promise<number | null>;
  head(key: string, bytes?: number): Promise<Uint8Array>;
}

export function supportsMultipart(a: StorageAdapter): a is StorageAdapter & MultipartStorage {
  return typeof (a as Partial<MultipartStorage>).createMultipart === "function";
}

const etagOf = (b: Buffer) => `"${createHash("md5").update(b).digest("hex")}"`;


export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

/**
 * Shared validation for every adapter: empty, oversize and disallowed MIME
 * types are refused before a byte is written anywhere.
 */
export function checkFile(file: File): { mimeType: string; safeName: string } {
  if (file.size <= 0) throw new StorageError("The file is empty.");
  if (file.size > MAX_BYTES) {
    throw new StorageError(`Files must be smaller than ${Math.floor(MAX_BYTES / 1024 / 1024)}MB.`);
  }
  const mimeType = (file.type || "application/octet-stream").toLowerCase().split(";")[0].trim();
  // SEC-02: the declared type is client input. It must be on the allowlist
  // here, and the bytes are checked against it in assertContent before storing.
  if (!ACCEPTED[mimeType] || mimeType === "image/svg+xml") {
    throw new StorageError(contentProblem(mimeType, new Uint8Array()) ?? `Files of type "${mimeType}" are not accepted.`);
  }
  return { mimeType, safeName: sanitiseFileName(file.name || "upload") };
}

/** Refuse a file whose first bytes do not match its declared type (SEC-02). */
export function assertContent(mimeType: string, buffer: Uint8Array) {
  const problem = contentProblem(mimeType, buffer.subarray(0, 4096));
  if (problem) throw new StorageError(problem);
}

/** In-memory adapter for tests and for the S3 boundary to be exercised without credentials. */
export class MemoryStorageAdapter implements StorageAdapter {
  readonly name = "memory";
  files = new Map<string, { buffer: Buffer; mimeType: string }>();
  async put({ orgId, file, prefix }: { orgId: string; file: File; prefix?: string }) {
    const { mimeType, safeName } = checkFile(file);
    const key = path.posix.join(orgId, prefix ?? "assets", `${randomUUID()}${path.extname(safeName)}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    assertContent(mimeType, buffer);
    this.files.set(key, { buffer, mimeType });
    return { storagePath: key, fileName: safeName, mimeType, sizeBytes: buffer.byteLength };
  }
  async get(storagePath: string) {
    if (storagePath.includes("..")) throw new StorageError("Invalid storage path.");
    const f = this.files.get(storagePath);
    if (!f) throw new StorageError("Not found.");
    return f.buffer;
  }
  async delete(storagePath: string) {
    this.files.delete(storagePath);
  }
  async exists(storagePath: string) {
    return this.files.has(storagePath);
  }

  parts = new Map<string, Map<number, Buffer>>();
  async createMultipart(key: string) {
    const id = randomUUID();
    this.parts.set(`${key}#${id}`, new Map());
    return id;
  }
  async writePart(key: string, uploadId: string, partNumber: number, body: Buffer) {
    const p = this.parts.get(`${key}#${uploadId}`);
    if (!p) throw new StorageError("That upload is no longer open.");
    p.set(partNumber, body);
    return etagOf(body);
  }
  async completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
    const p = this.parts.get(`${key}#${uploadId}`);
    if (!p) throw new StorageError("That upload is no longer open.");
    const chunks = parts.map((x) => {
      const b = p.get(x.partNumber);
      if (!b || etagOf(b) !== x.etag) throw new StorageError(`Part ${x.partNumber} is missing or changed.`);
      return b;
    });
    this.files.set(key, { buffer: Buffer.concat(chunks), mimeType: "" });
    this.parts.delete(`${key}#${uploadId}`);
  }
  async abortMultipart(key: string, uploadId: string) {
    this.parts.delete(`${key}#${uploadId}`);
  }
  async size(key: string) {
    return this.files.get(key)?.buffer.byteLength ?? null;
  }
  async head(key: string, bytes = 4096) {
    const f = this.files.get(key);
    if (!f) throw new StorageError("Not found.");
    return new Uint8Array(f.buffer.subarray(0, bytes));
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly name = "local";
  private root: string;

  constructor(root = process.env.STORAGE_ROOT || "./storage") {
    this.root = path.resolve(process.cwd(), root);
  }

  /**
   * Resolve a storage path safely.
   *
   * Rejects any path that escapes the storage root, which is what stops a
   * crafted `storagePath` from reading arbitrary files off the server.
   */
  private resolve(storagePath: string) {
    if (storagePath.includes("..") || path.isAbsolute(storagePath)) throw new StorageError("Invalid storage path.");
    const normalised = path.normalize(storagePath).replace(/^(\.\.[/\\])+/, "");
    const full = path.resolve(this.root, normalised);
    if (!full.startsWith(this.root + path.sep) && full !== this.root) {
      throw new StorageError("Invalid storage path.");
    }
    return full;
  }

  async put({ orgId, file, prefix }: { orgId: string; file: File; prefix?: string }) {
    const { mimeType, safeName } = checkFile(file);
    const ext = path.extname(safeName);
    const key = `${randomUUID()}${ext}`;
    const relative = path.posix.join(orgId, prefix ?? "assets", key);
    const full = this.resolve(relative);

    const buffer = Buffer.from(await file.arrayBuffer());
    assertContent(mimeType, buffer);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);

    return {
      storagePath: relative,
      fileName: safeName,
      mimeType,
      sizeBytes: buffer.byteLength,
    };
  }

  async get(storagePath: string) {
    return fs.readFile(this.resolve(storagePath));
  }

  async delete(storagePath: string) {
    await fs.unlink(this.resolve(storagePath)).catch(() => {});
  }

  async exists(storagePath: string) {
    try {
      await fs.access(this.resolve(storagePath));
      return true;
    } catch {
      return false;
    }
  }

  private partDir(key: string, uploadId: string) {
    if (!/^[0-9a-f-]{36}$/.test(uploadId)) throw new StorageError("Invalid upload.");
    return path.join(this.resolve(path.posix.dirname(key)), ".parts", uploadId);
  }
  async createMultipart(key: string) {
    const id = randomUUID();
    await fs.mkdir(this.partDir(key, id), { recursive: true });
    return id;
  }
  async writePart(key: string, uploadId: string, partNumber: number, body: Buffer) {
    const dir = this.partDir(key, uploadId);
    await fs.access(dir).catch(() => {
      throw new StorageError("That upload is no longer open.");
    });
    await fs.writeFile(path.join(dir, String(partNumber)), body);
    return etagOf(body);
  }
  async completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
    const dir = this.partDir(key, uploadId);
    const full = this.resolve(key);
    const chunks: Buffer[] = [];
    for (const x of parts) {
      const b = await fs.readFile(path.join(dir, String(x.partNumber))).catch(() => null);
      if (!b || etagOf(b) !== x.etag) throw new StorageError(`Part ${x.partNumber} is missing or changed.`);
      chunks.push(b);
    }
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, Buffer.concat(chunks));
    await fs.rm(dir, { recursive: true, force: true });
  }
  async abortMultipart(key: string, uploadId: string) {
    await fs.rm(this.partDir(key, uploadId), { recursive: true, force: true });
  }
  async size(key: string) {
    return fs.stat(this.resolve(key)).then((st) => st.size, () => null);
  }
  async head(key: string, bytes = 4096) {
    const fh = await fs.open(this.resolve(key), "r");
    try {
      const buf = Buffer.alloc(bytes);
      const { bytesRead } = await fh.read(buf, 0, bytes, 0);
      return new Uint8Array(buf.subarray(0, bytesRead));
    } finally {
      await fh.close();
    }
  }
}

let adapter: StorageAdapter | null = null;

/**
 * `STORAGE_PROVIDER=local` (default) writes under STORAGE_ROOT.
 * `STORAGE_PROVIDER=s3` needs S3_BUCKET/S3_REGION/S3_ENDPOINT/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY
 * and refuses to start half-configured rather than silently falling back to disk.
 */
export function getStorage(): StorageAdapter {
  if (adapter) return adapter;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "s3") {
    // Lazy import keeps the local path free of the signer.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3StorageAdapter, s3ConfigFromEnv } = require("./s3") as typeof import("./s3");
    const config = s3ConfigFromEnv();
    if (!config) throw new StorageError("STORAGE_PROVIDER=s3 is set but S3_* variables are incomplete.");
    adapter = new S3StorageAdapter(config);
  } else {
    adapter = new LocalStorageAdapter();
  }
  return adapter;
}

/** Name of the active adapter — recorded on Asset.storageProvider. */
export function storageProviderName(): string {
  return (getStorage() as { name?: string }).name ?? "local";
}

/** Test seam. */
export function __setStorage(next: StorageAdapter | null) {
  adapter = next;
}

/** The orgId a storage path belongs to. Used by the file route's access check. */
export function orgIdFromStoragePath(storagePath: string): string | null {
  const [orgId] = storagePath.split("/");
  return orgId || null;
}

export function sanitiseFileName(name: string) {
  const base = path.basename(name).replace(/[^\w.\- ]+/g, "_").trim();
  return (base || "upload").slice(0, 180);
}

/** Stable content hash, used to detect duplicate uploads. */
export function hashBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}

export function categoryForMime(mimeType: string): string {
  if (mimeType.startsWith("video/")) return "raw_media";
  if (mimeType.startsWith("image/")) return "brand_asset";
  if (mimeType.startsWith("audio/")) return "raw_media";
  if (mimeType === "application/pdf") return "offer_doc";
  return "research_doc";
}
