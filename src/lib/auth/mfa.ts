import "server-only";
import { prisma } from "@/lib/db/client";
import { appEnv } from "@/lib/env";
import { credentialStorageConfigured, open, seal, type SealedSecret } from "@/lib/security/secret-box";
import { consumeRecoveryCode, generateRecoveryCodes, generateSecret, hashRecoveryCode, otpauthUri, verifyCode } from "./totp";

/**
 * Staff two-factor authentication (SEC-08).
 *
 * Staff (anyone who can act across client workspaces) must enrol a TOTP
 * authenticator in production. Clients may enrol voluntarily. The secret is
 * sealed with the credential keyring, bound to the user id; recovery codes are
 * stored as hashes and each works once. A code's time step is recorded with a
 * conditional update, so the same code cannot be used twice even concurrently.
 *
 * Enforcement is on when APP_ENV/VERCEL_ENV is production and the keyring is
 * configured, unless MFA_STAFF_REQUIRED=false; MFA_STAFF_REQUIRED=true forces
 * it anywhere (for testing the flow).
 */
const aad = (userId: string) => `mfa:totp:${userId}`;

export function mfaRequiredForStaff(env: Record<string, string | undefined> = process.env): boolean {
  if (env.MFA_STAFF_REQUIRED === "false") return false;
  if (env.MFA_STAFF_REQUIRED === "true") return true;
  return appEnv(env) === "production" && credentialStorageConfigured();
}

function readSecret(userId: string, stored: string | null): string | null {
  if (!stored) return null;
  return open(JSON.parse(stored) as SealedSecret, aad(userId));
}

/** Start (or restart) enrolment: a new secret, not yet active until confirmed. */
export async function beginEnrolment(userId: string, email: string) {
  if (!credentialStorageConfigured()) throw new Error("Credential encryption keys are not configured, so two-factor cannot be enrolled on this deployment.");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { mfaEnabledAt: true } });
  if (user.mfaEnabledAt) throw new Error("Two-factor is already on. Turn it off first to enrol a new device.");
  const secret = generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: JSON.stringify(seal(secret, aad(userId))), mfaLastStep: null } });
  return { secret, uri: otpauthUri(secret, email) };
}

/** Confirm enrolment with a first code. Returns the recovery codes, shown once. */
export async function confirmEnrolment(userId: string, code: string): Promise<string[] | null> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { mfaSecret: true, mfaEnabledAt: true } });
  if (user.mfaEnabledAt) return null;
  const secret = readSecret(userId, user.mfaSecret);
  if (!secret) return null;
  const step = verifyCode(secret, code);
  if (step === null) return null;
  const codes = generateRecoveryCodes();
  await prisma.user.update({ where: { id: userId }, data: { mfaEnabledAt: new Date(), mfaLastStep: step, mfaRecoveryHashes: JSON.stringify(codes.map(hashRecoveryCode)) } });
  return codes;
}

/**
 * Check a second factor for a user with two-factor on: an authenticator code
 * or a recovery code. True only once per code.
 */
export async function verifySecondFactor(userId: string, input: string): Promise<{ ok: boolean; usedRecovery?: boolean; remainingRecovery?: number }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { mfaSecret: true, mfaEnabledAt: true, mfaLastStep: true, mfaRecoveryHashes: true } });
  if (!user.mfaEnabledAt) return { ok: false };
  const code = input.trim();
  if (/^\d{6}$/.test(code.replace(/\s/g, ""))) {
    const secret = readSecret(userId, user.mfaSecret);
    const step = secret ? verifyCode(secret, code, Date.now(), user.mfaLastStep) : null;
    if (step === null) return { ok: false };
    const claimed = await prisma.user.updateMany({
      where: { id: userId, OR: [{ mfaLastStep: null }, { mfaLastStep: { lt: step } }] },
      data: { mfaLastStep: step },
    });
    return { ok: claimed.count === 1 };
  }
  const hashes = JSON.parse(user.mfaRecoveryHashes) as string[];
  const left = consumeRecoveryCode(hashes, code);
  if (!left) return { ok: false };
  const claimed = await prisma.user.updateMany({
    where: { id: userId, mfaRecoveryHashes: user.mfaRecoveryHashes },
    data: { mfaRecoveryHashes: JSON.stringify(left) },
  });
  return { ok: claimed.count === 1, usedRecovery: true, remainingRecovery: left.length };
}

/** Turn two-factor off (requires a valid current code). */
export async function disableMfa(userId: string, code: string): Promise<boolean> {
  const check = await verifySecondFactor(userId, code);
  if (!check.ok) return false;
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: null, mfaEnabledAt: null, mfaLastStep: null, mfaRecoveryHashes: "[]" } });
  return true;
}

/** Operator recovery for a locked-out colleague: a super admin clears it; the user re-enrols. */
export async function resetMfaForUser(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { mfaSecret: null, mfaEnabledAt: null, mfaLastStep: null, mfaRecoveryHashes: "[]" } });
  await prisma.session.deleteMany({ where: { userId } });
}
