import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson, stringify } from "@/lib/db/json";
import {
  credentialAad,
  credentialStorageConfigured,
  needsRotation,
  open,
  seal,
  type SealedSecret,
} from "@/lib/security/secret-box";

/**
 * The credential store.
 *
 * Every function here takes an `orgId` as its first argument and every query
 * filters on it. There is no "get credential by id" — an id-only lookup is how
 * cross-tenant credential leaks happen, and the encryption is bound to the
 * tenant anyway, so a mis-scoped read would fail to decrypt rather than succeed
 * quietly. Both defences exist because either alone is one mistake from a
 * catastrophe.
 *
 * Nothing in this module may be imported by a client component. `server-only`
 * makes that a build error rather than a code-review habit.
 */

export type CredentialPurpose = "oauth_access" | "oauth_refresh" | "api_key" | "webhook_secret";

export type StoredCredentialMeta = {
  provider: string;
  purpose: CredentialPurpose;
  scopes: string[];
  expiresAt: Date | null;
  externalAccountId: string | null;
  externalAccountLabel: string | null;
  lastUsedAt: Date | null;
  updatedAt: Date;
  /** True when this was sealed with a key that is no longer the active one. */
  staleKey: boolean;
};

export { credentialStorageConfigured };

/* ---------------------------------- Writes ----------------------------------- */

export async function putCredential(input: {
  orgId: string;
  provider: string;
  purpose: CredentialPurpose;
  secret: string;
  scopes?: string[];
  expiresAt?: Date | null;
  externalAccountId?: string | null;
  externalAccountLabel?: string | null;
}): Promise<void> {
  const sealed = seal(
    input.secret,
    credentialAad(input.orgId, input.provider, input.purpose),
  );

  const data = {
    sealed: stringify(sealed),
    keyId: sealed.keyId,
    scopes: stringify(input.scopes ?? []),
    expiresAt: input.expiresAt ?? null,
    externalAccountId: input.externalAccountId ?? null,
    externalAccountLabel: input.externalAccountLabel ?? null,
    rotatedAt: new Date(),
  };

  await prisma.credential.upsert({
    where: {
      orgId_provider_purpose: {
        orgId: input.orgId,
        provider: input.provider,
        purpose: input.purpose,
      },
    },
    create: { orgId: input.orgId, provider: input.provider, purpose: input.purpose, ...data },
    update: data,
  });
}

/* ---------------------------------- Reads ------------------------------------ */

/**
 * Decrypt a stored secret.
 *
 * Returns null when there is nothing stored. Throws when there is something
 * stored that cannot be opened — a missing key or a tampered row is an
 * operational emergency, not a cache miss, and swallowing it would degrade the
 * system to "silently unauthenticated".
 */
export async function readCredential(
  orgId: string,
  provider: string,
  purpose: CredentialPurpose,
): Promise<string | null> {
  const row = await prisma.credential.findFirst({
    where: { orgId, provider, purpose },
  });
  if (!row) return null;

  const sealed = parseJson<SealedSecret | null>(row.sealed, null);
  if (!sealed) throw new Error(`Credential ${provider}/${purpose} is unreadable.`);

  const plaintext = open(sealed, credentialAad(orgId, provider, purpose));

  // Best-effort touch. A failure to record usage must never block the call
  // that needed the credential.
  await prisma.credential
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return plaintext;
}

/** Metadata only. Safe to render; contains no secret material. */
export async function listCredentialMeta(orgId: string): Promise<StoredCredentialMeta[]> {
  const rows = await prisma.credential.findMany({
    where: { orgId },
    orderBy: { provider: "asc" },
  });

  return rows.map((row) => {
    const sealed = parseJson<SealedSecret | null>(row.sealed, null);
    return {
      provider: row.provider,
      purpose: row.purpose as CredentialPurpose,
      scopes: parseJson<string[]>(row.scopes, []),
      expiresAt: row.expiresAt,
      externalAccountId: row.externalAccountId,
      externalAccountLabel: row.externalAccountLabel,
      lastUsedAt: row.lastUsedAt,
      updatedAt: row.updatedAt,
      staleKey: sealed ? needsRotation(sealed) : false,
    };
  });
}

export async function hasCredential(
  orgId: string,
  provider: string,
  purpose: CredentialPurpose = "oauth_access",
): Promise<boolean> {
  const count = await prisma.credential.count({ where: { orgId, provider, purpose } });
  return count > 0;
}

/* --------------------------------- Removal ------------------------------------ */

/**
 * Forget every secret for a provider.
 *
 * Used on disconnect. Deliberately a hard delete: a "soft-deleted" OAuth
 * refresh token is still a working key to somebody else's account.
 */
export async function forgetCredentials(orgId: string, provider: string): Promise<number> {
  const result = await prisma.credential.deleteMany({ where: { orgId, provider } });
  return result.count;
}

/* ------------------------------- Rotation sweep -------------------------------- */

/**
 * Credentials sealed with a retired key.
 *
 * Found without decrypting anything, by comparing the denormalised `keyId`.
 * Re-sealing requires the old key to still be present in the keyring, which is
 * why rotation keeps the previous entry rather than replacing it.
 */
export async function credentialsNeedingRotation(activeKeyId: string) {
  return prisma.credential.findMany({
    where: { keyId: { not: activeKeyId } },
    select: { id: true, orgId: true, provider: true, purpose: true, keyId: true },
  });
}

export async function resealCredential(id: string): Promise<boolean> {
  const row = await prisma.credential.findUnique({ where: { id } });
  if (!row) return false;

  const sealed = parseJson<SealedSecret | null>(row.sealed, null);
  if (!sealed) return false;

  const aad = credentialAad(row.orgId, row.provider, row.purpose);
  const plaintext = open(sealed, aad);
  const resealed = seal(plaintext, aad);

  await prisma.credential.update({
    where: { id },
    data: { sealed: stringify(resealed), keyId: resealed.keyId, rotatedAt: new Date() },
  });
  return true;
}
