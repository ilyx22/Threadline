import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from node:crypto — no third-party dependency.
 *
 * Format: scrypt$N$r$p$<salt-b64>$<hash-b64>
 * Storing the parameters alongside the hash means the cost can be raised later
 * without invalidating existing passwords.
 */

const PARAMS = { N: 16384, r: 8, p: 1 } as const;
const KEY_LEN = 64;
const MAX_MEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LEN, {
    ...PARAMS,
    maxmem: MAX_MEM,
  });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;

    const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts;
    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

    const salt = Buffer.from(saltB64 ?? "", "base64");
    const expected = Buffer.from(hashB64 ?? "", "base64");
    if (salt.length === 0 || expected.length === 0) return false;

    const derived = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N,
      r,
      p,
      maxmem: MAX_MEM,
    });

    // Constant-time comparison; lengths are equal by construction above.
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Basic strength policy. Deliberately length-first rather than character-class theatre. */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 10) issues.push("Use at least 10 characters.");
  if (password.length > 200) issues.push("Use fewer than 200 characters.");
  if (/^\s|\s$/.test(password)) issues.push("Remove leading or trailing spaces.");
  const common = ["password", "12345678", "qwerty", "letmein", "threadline"];
  if (common.some((c) => password.toLowerCase().includes(c))) {
    issues.push("Avoid common words and the product name.");
  }
  return issues;
}
