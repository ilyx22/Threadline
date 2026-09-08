import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/client";

/**
 * Single-use, expiring tokens for invitations and password resets.
 *
 * The raw token exists only in the link that is emailed; the database holds
 * its SHA-256. Consumption is a conditional update (`usedAt: null`), so two
 * requests racing on the same link cannot both succeed.
 */

export const TOKEN_TTL = {
  invite: 72 * 60 * 60_000,
  password_reset: 30 * 60_000,
} as const;

export type TokenKind = keyof typeof TOKEN_TTL;

const digest = (raw: string) => createHash("sha256").update(raw).digest("hex");

export async function issueToken(input: { userId: string; kind: TokenKind; orgId?: string | null; createdById?: string | null }) {
  const raw = randomBytes(32).toString("base64url");
  // A newer token supersedes older unused ones of the same kind for the user.
  await prisma.authToken.updateMany({ where: { userId: input.userId, kind: input.kind, usedAt: null }, data: { usedAt: new Date() } });
  const row = await prisma.authToken.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      tokenHash: digest(raw),
      orgId: input.orgId ?? null,
      createdById: input.createdById ?? null,
      expiresAt: new Date(Date.now() + TOKEN_TTL[input.kind]),
    },
  });
  return { raw, id: row.id, expiresAt: row.expiresAt };
}

export type ConsumeResult =
  | { ok: true; userId: string; orgId: string | null; tokenId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Peek without consuming — used to render the form only for a live link. */
export async function inspectToken(raw: string, kind: TokenKind): Promise<ConsumeResult> {
  if (!raw || raw.length < 20 || raw.length > 200) return { ok: false, reason: "invalid" };
  const row = await prisma.authToken.findUnique({ where: { tokenHash: digest(raw) } });
  if (!row || row.kind !== kind) return { ok: false, reason: "invalid" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, userId: row.userId, orgId: row.orgId, tokenId: row.id };
}

/** Consume exactly once. */
export async function consumeToken(raw: string, kind: TokenKind): Promise<ConsumeResult> {
  const peek = await inspectToken(raw, kind);
  if (!peek.ok) return peek;
  const claimed = await prisma.authToken.updateMany({ where: { id: peek.tokenId, usedAt: null }, data: { usedAt: new Date() } });
  if (claimed.count !== 1) return { ok: false, reason: "used" };
  return peek;
}

export function tokenLink(kind: TokenKind, raw: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return kind === "invite" ? `${base}/invite?token=${raw}` : `${base}/reset-password?token=${raw}`;
}

export async function pruneTokens() {
  const r = await prisma.authToken.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date(Date.now() - 7 * 86_400_000) } }, { usedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } }] } });
  return r.count;
}
