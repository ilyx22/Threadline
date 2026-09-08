import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Authenticated encryption for credentials at rest.
 *
 * Threadline is about to hold OAuth access and refresh tokens for other
 * people's social accounts. A leaked refresh token is not an inconvenience —
 * it is the ability to publish as the client, indefinitely, until they notice.
 * So this module is deliberately small, boring and strict.
 *
 * AES-256-GCM: authenticated, so tampering with stored ciphertext fails loudly
 * rather than silently decrypting to something else. A fresh 12-byte nonce per
 * encryption, never reused — GCM nonce reuse under the same key is a total
 * break, not a weakness.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It does not fall back to a default key, an empty key, or a key derived from
 * something guessable. In production a missing key throws at the point of use.
 * A credential store that quietly encrypts with a known constant is worse than
 * one that refuses to start, because it looks like it is working.
 */

/** Wire format version. Bumped only if the algorithm or layout changes. */
const FORMAT = 1;

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export type SealedSecret = {
  /** Format version, so a future change can migrate rather than guess. */
  v: number;
  /** Which key sealed this. Rotation writes a new id; old rows stay readable. */
  keyId: string;
  /** base64url */
  nonce: string;
  /** base64url */
  ciphertext: string;
  /** base64url */
  tag: string;
};

export class SecretKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecretKeyError";
  }
}

/* ---------------------------------- Keys ------------------------------------ */

/**
 * Parse the configured keyring.
 *
 * `CREDENTIAL_ENCRYPTION_KEYS` holds one or more `id:base64key` pairs separated
 * by commas, newest first. Multiple entries exist so a key can be rotated
 * without a migration: new writes use the first, reads find the key by id.
 *
 *   CREDENTIAL_ENCRYPTION_KEYS="2026-09:BASE64...,2026-03:BASE64..."
 */
function readKeyring(): { id: string; key: Buffer }[] {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEYS?.trim();
  if (!raw) return [];

  const entries: { id: string; key: Buffer }[] = [];
  for (const chunk of raw.split(",")) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator <= 0) {
      throw new SecretKeyError(
        "CREDENTIAL_ENCRYPTION_KEYS entries must look like `id:base64key`.",
      );
    }
    const id = trimmed.slice(0, separator);
    const key = Buffer.from(trimmed.slice(separator + 1), "base64");
    if (key.length !== KEY_BYTES) {
      throw new SecretKeyError(
        `Encryption key "${id}" is ${key.length} bytes; AES-256 needs exactly ${KEY_BYTES}.`,
      );
    }
    entries.push({ id, key });
  }
  return entries;
}

/** True when credentials can be stored at all. Surfaces let the operator know. */
export function credentialStorageConfigured(): boolean {
  try {
    return readKeyring().length > 0;
  } catch {
    return false;
  }
}

function activeKey(): { id: string; key: Buffer } {
  const ring = readKeyring();
  if (ring.length === 0) {
    throw new SecretKeyError(
      "No credential encryption key is configured. Set CREDENTIAL_ENCRYPTION_KEYS before connecting any account — Threadline will not store a token it cannot encrypt.",
    );
  }
  return ring[0];
}

function keyById(id: string): Buffer {
  const found = readKeyring().find((entry) => entry.id === id);
  if (!found) {
    throw new SecretKeyError(
      `This credential was sealed with key "${id}", which is not in CREDENTIAL_ENCRYPTION_KEYS. Restore that key or reconnect the account.`,
    );
  }
  return found.key;
}

/* -------------------------------- Seal / open -------------------------------- */

/**
 * Encrypt a secret.
 *
 * `aad` binds the ciphertext to its context — the org and provider it belongs
 * to. Moving a sealed blob from one tenant's row to another's then fails
 * authentication instead of decrypting cleanly, so a database-level mix-up
 * cannot become a cross-tenant credential leak.
 */
export function seal(plaintext: string, aad: string): SealedSecret {
  const { id, key } = activeKey();
  const nonce = randomBytes(NONCE_BYTES);

  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(aad, "utf8"));

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: FORMAT,
    keyId: id,
    nonce: nonce.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: tag.toString("base64url"),
  };
}

/** Decrypt a secret. Throws if the ciphertext, tag or context has been altered. */
export function open(sealed: SealedSecret, aad: string): string {
  if (sealed.v !== FORMAT) {
    throw new SecretKeyError(`Unsupported sealed-secret format v${sealed.v}.`);
  }

  const key = keyById(sealed.keyId);
  const nonce = Buffer.from(sealed.nonce, "base64url");
  const tag = Buffer.from(sealed.tag, "base64url");

  if (nonce.length !== NONCE_BYTES || tag.length !== TAG_BYTES) {
    throw new SecretKeyError("Sealed secret is malformed.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, nonce, { authTagLength: TAG_BYTES });
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/* --------------------------------- Helpers ----------------------------------- */

/**
 * The context string a credential is bound to.
 *
 * Deliberately includes the tenant. See `seal`.
 */
export function credentialAad(orgId: string, provider: string, purpose: string): string {
  return `threadline:credential:v${FORMAT}:${orgId}:${provider}:${purpose}`;
}

/** Whether a sealed secret was written with a key that is no longer active. */
export function needsRotation(sealed: SealedSecret): boolean {
  try {
    return sealed.keyId !== activeKey().id;
  } catch {
    return false;
  }
}

/**
 * Constant-time compare for secrets that arrive from outside — OAuth `state`,
 * webhook signatures, invitation tokens. Length is not secret; content is.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Generate a keyring entry. Used by the setup docs and never at runtime.
 *
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
export function generateKeyMaterial(): string {
  return randomBytes(KEY_BYTES).toString("base64");
}
