import { createHash, createHmac, randomUUID } from "node:crypto";
import path from "node:path";
import type { StorageAdapter, StoredFile } from "./index";
import { StorageError, assertContent, checkFile } from "./index";

/**
 * S3-compatible private storage. Plain `fetch` + AWS Signature V4, so it works
 * against AWS S3, Cloudflare R2, MinIO and Backblaze without a client library.
 *
 * Every object key is tenant-scoped (`{orgId}/…`), the bucket is expected to be
 * private, and reads are proxied through `/api/files/[...path]`, which
 * re-checks organisation membership on every request; the bucket is never
 * public. The only pre-signed URLs are short-lived part PUTs for a direct
 * upload the server has already authorised (FILE-02), and short-lived GETs for
 * a processing worker (FILE-05).
 */

export type S3Config = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** e.g. https://s3.eu-west-2.amazonaws.com or https://<account>.r2.cloudflarestorage.com */
  endpoint: string;
  /** Path-style addressing (MinIO/R2 need it). Default true. */
  forcePathStyle?: boolean;
};

export function s3ConfigFromEnv(env: NodeJS.ProcessEnv = process.env): S3Config | null {
  const { S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT } = env;
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_ENDPOINT) return null;
  return { bucket: S3_BUCKET, region: S3_REGION, accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY, endpoint: S3_ENDPOINT.replace(/\/$/, ""), forcePathStyle: env.S3_FORCE_PATH_STYLE !== "false" };
}

const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data).digest();

function amzDate(d = new Date()) {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amz: iso, short: iso.slice(0, 8) };
}

function encodeKey(key: string) {
  return key.split("/").map((seg) => encodeURIComponent(seg).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}

/** Sign a request per SigV4. Exported for tests. */
export function signV4(input: { method: string; url: URL; headers: Record<string, string>; body: Buffer | string; config: S3Config; now?: Date }) {
  const { method, url, config } = input;
  const { amz, short } = amzDate(input.now);
  const payloadHash = sha256(input.body);
  const headers: Record<string, string> = { ...input.headers, host: url.host, "x-amz-date": amz, "x-amz-content-sha256": payloadHash };
  const signedHeaderNames = Object.keys(headers).map((h) => h.toLowerCase()).sort();
  const canonicalHeaders = signedHeaderNames.map((h) => `${h}:${String(headers[h] ?? headers[Object.keys(headers).find((k) => k.toLowerCase() === h)!]).trim()}\n`).join("");
  const canonicalQuery = [...url.searchParams.entries()].sort().map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const canonicalRequest = [method, url.pathname, canonicalQuery, canonicalHeaders, signedHeaderNames.join(";"), payloadHash].join("\n");
  const scope = `${short}/${config.region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amz, scope, sha256(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${config.secretAccessKey}`, short);
  const kRegion = hmac(kDate, config.region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(";")}, Signature=${signature}`;
  return headers;
}

export class S3StorageAdapter implements StorageAdapter {
  readonly name = "s3";
  constructor(private config: S3Config, private fetchImpl: typeof fetch = fetch) {}

  private objectUrl(key: string) {
    const encoded = encodeKey(key);
    return this.config.forcePathStyle === false
      ? new URL(`${this.config.endpoint.replace("://", `://${this.config.bucket}.`)}/${encoded}`)
      : new URL(`${this.config.endpoint}/${this.config.bucket}/${encoded}`);
  }

  private async request(method: string, key: string, body: Buffer | string = "", extra: Record<string, string> = {}, query: Record<string, string> = {}) {
    const url = this.objectUrl(key);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const headers = signV4({ method, url, headers: extra, body, config: this.config });
    return this.fetchImpl(url, { method, headers, body: body.length ? (typeof body === "string" ? body : new Uint8Array(body)) : undefined });
  }

  async put({ orgId, file, prefix }: { orgId: string; file: File; prefix?: string }): Promise<StoredFile> {
    const { mimeType, safeName } = checkFile(file);
    const key = path.posix.join(orgId, prefix ?? "assets", `${randomUUID()}${path.extname(safeName)}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    assertContent(mimeType, buffer);
    const res = await this.request("PUT", key, buffer, { "content-type": mimeType, "content-length": String(buffer.byteLength) });
    if (!res.ok) throw new StorageError(`Storage refused the upload (${res.status}).`);
    return { storagePath: key, fileName: safeName, mimeType, sizeBytes: buffer.byteLength };
  }

  async get(storagePath: string) {
    assertScopedKey(storagePath);
    const res = await this.request("GET", storagePath);
    if (res.status === 404) throw new StorageError("Not found.");
    if (!res.ok) throw new StorageError(`Storage read failed (${res.status}).`);
    return Buffer.from(await res.arrayBuffer());
  }

  async delete(storagePath: string) {
    assertScopedKey(storagePath);
    await this.request("DELETE", storagePath);
  }

  async exists(storagePath: string) {
    assertScopedKey(storagePath);
    const res = await this.request("HEAD", storagePath);
    return res.ok;
  }

  /* ---------------- Direct multipart upload (FILE-02) ---------------- */

  /** Start a multipart upload; returns the provider's upload id. */
  async createMultipart(key: string, mimeType: string) {
    assertScopedKey(key);
    const res = await this.request("POST", key, "", { "content-type": mimeType }, { uploads: "" });
    const text = await res.text();
    const id = /<UploadId>([^<]+)<\/UploadId>/.exec(text)?.[1];
    if (!res.ok || !id) throw new StorageError(`Storage refused to start the upload (${res.status}).`);
    return id;
  }

  /** A pre-signed PUT for one part; the browser sends the bytes straight to the bucket. */
  partUrl(key: string, uploadId: string, partNumber: number, expiresSeconds = 900) {
    return this.presign("PUT", key, { partNumber: String(partNumber), uploadId }, expiresSeconds);
  }

  async completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
    assertScopedKey(key);
    const esc = (v: string) => v.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
    const body = `<CompleteMultipartUpload>${parts.map((p) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${esc(p.etag)}</ETag></Part>`).join("")}</CompleteMultipartUpload>`;
    const res = await this.request("POST", key, body, { "content-type": "application/xml" }, { uploadId });
    const text = await res.text();
    // S3 can answer 200 with an <Error> body when assembly fails late.
    if (!res.ok || /<Error>/.test(text)) throw new StorageError(`Storage could not assemble the upload (${res.status}).`);
  }

  async abortMultipart(key: string, uploadId: string) {
    assertScopedKey(key);
    await this.request("DELETE", key, "", {}, { uploadId });
  }

  /** Size of a stored object, or null when it does not exist. */
  async size(key: string) {
    assertScopedKey(key);
    const res = await this.request("HEAD", key);
    if (!res.ok) return null;
    return Number(res.headers.get("content-length") ?? "0");
  }

  /** The first bytes of an object, for the content check after assembly. */
  async head(key: string, bytes = 4096) {
    assertScopedKey(key);
    const res = await this.request("GET", key, "", { range: `bytes=0-${bytes - 1}` });
    if (!res.ok) throw new StorageError(`Storage read failed (${res.status}).`);
    return new Uint8Array(await res.arrayBuffer());
  }

  /**
   * Short-lived pre-signed GET (query-string auth): for a processing worker, a
   * platform fetching media to publish, or a large download (FILE-04). The
   * response headers can be pinned, so the bucket serves the file with the
   * same safe type and disposition the app would.
   */
  signedGetUrl(storagePath: string, expiresSeconds = 120, now = new Date(), response?: { contentType?: string; contentDisposition?: string }) {
    const query: Record<string, string> = {};
    if (response?.contentType) query["response-content-type"] = response.contentType;
    if (response?.contentDisposition) query["response-content-disposition"] = response.contentDisposition;
    return this.presign("GET", storagePath, query, expiresSeconds, now);
  }

  private presign(method: string, storagePath: string, query: Record<string, string>, expiresSeconds: number, now = new Date()) {
    assertScopedKey(storagePath);
    const url = this.objectUrl(storagePath);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    const { amz, short } = amzDate(now);
    const scope = `${short}/${this.config.region}/s3/aws4_request`;
    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set("X-Amz-Credential", `${this.config.accessKeyId}/${scope}`);
    url.searchParams.set("X-Amz-Date", amz);
    url.searchParams.set("X-Amz-Expires", String(Math.min(expiresSeconds, 900)));
    url.searchParams.set("X-Amz-SignedHeaders", "host");
    const canonicalQuery = [...url.searchParams.entries()].sort().map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
    const canonicalRequest = [method, url.pathname, canonicalQuery, `host:${url.host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
    const stringToSign = ["AWS4-HMAC-SHA256", amz, scope, sha256(canonicalRequest)].join("\n");
    const kSigning = hmac(hmac(hmac(hmac(`AWS4${this.config.secretAccessKey}`, short), this.config.region), "s3"), "aws4_request");
    url.searchParams.set("X-Amz-Signature", createHmac("sha256", kSigning).update(stringToSign).digest("hex"));
    return url.toString();
  }
}

/** Object keys are always `{orgId}/{prefix}[/{sub}]/{file}`; anything else is refused before it reaches the network. */
export function assertScopedKey(key: string) {
  if (!/^[a-z0-9]+(\/[a-z0-9_-]+){1,3}\/[A-Za-z0-9._-]+$/i.test(key) || key.includes("..")) {
    throw new StorageError("Invalid storage path.");
  }
}
