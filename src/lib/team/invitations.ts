import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { appUrl } from "@/lib/app-url";
import { enqueue } from "@/lib/jobs";
import { hashPassword } from "@/lib/auth/password";
import { canAssignRoleIn, parseProfiles, type ClientProfile } from "@/lib/auth/roles";
import type { Role } from "@/lib/domain/enums";

/**
 * Workspace invitations (TEAM-02, TEAM-03, TEAM-04).
 *
 * An invitation is a pending record, not an account: no user or membership
 * exists until the invitee accepts. The link carries a random token stored
 * only as a hash; it works once, expires after seven days, and resending
 * issues a new token (the old link stops working). Acceptance:
 *   - signed in as the invited address: the membership is added;
 *   - signed in as someone else: refused (wrong account), nothing changes;
 *   - not signed in, an account already exists for the address: the person
 *     must sign in first; a link can never set an existing account's password;
 *   - not signed in, no account: the account is created with the password
 *     they choose, then the membership.
 * The state change is a conditional update inside one transaction, so two
 * concurrent accepts cannot both succeed, and a repeat accept by the same
 * person is answered as success without creating anything twice.
 */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESEND_LIMIT = 5;
const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");
const newToken = () => {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
};
export const inviteLink = (raw: string) => `${appUrl()}/invite?token=${encodeURIComponent(raw)}`;

export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationError";
  }
}

type Actor = { userId: string; name: string; role: Role };
type Org = { id: string; name: string; kind: string };

async function sendInvite(invitation: { id: string; email: string; name: string; sentCount: number; orgId: string }, raw: string, inviterName: string, workspaceName: string) {
  await enqueue(
    "email.send",
    { to: invitation.email, template: "invite", data: { name: invitation.name, inviterName, workspaceName, link: inviteLink(raw), expiresInHours: INVITE_TTL_MS / 3_600_000 }, orgId: invitation.orgId },
    { idempotencyKey: `invitation:${invitation.id}:${invitation.sentCount}`, orgId: invitation.orgId },
  );
}

export async function createInvitation(
  actor: Actor,
  org: Org,
  input: { name: string; email: string; title?: string | null; role: Role; profiles?: ClientProfile[]; isExpert?: boolean },
) {
  if (!canAssignRoleIn(actor.role, input.role, org.kind)) throw new InvitationError("You cannot grant that role.");
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.membership.findFirst({ where: { orgId: org.id, user: { email } }, select: { status: true } });
  if (existing) throw new InvitationError(existing.status === "suspended" ? "That person is a suspended member. Reinstate them instead." : "That person is already a member of this workspace.");

  // Lapse an expired pending invitation for the same address so a fresh one can be made.
  await prisma.invitation.updateMany({ where: { orgId: org.id, email, state: "pending", expiresAt: { lt: new Date() } }, data: { state: "expired" } });

  const token = newToken();
  try {
    const invitation = await prisma.invitation.create({
      data: {
        orgId: org.id,
        email,
        name: input.name.trim().slice(0, 120),
        title: input.title?.trim().slice(0, 120) || null,
        role: input.role,
        profiles: JSON.stringify(input.profiles ?? []),
        isExpert: Boolean(input.isExpert),
        tokenHash: token.hash,
        invitedById: actor.userId,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        sentCount: 1,
        lastSentAt: new Date(),
      },
    });
    await sendInvite(invitation, token.raw, actor.name, org.name);
    return { invitation, link: inviteLink(token.raw) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new InvitationError("There is already a pending invitation for that address. Resend it instead.");
    throw e;
  }
}

/** Resend with a new token (the previous link stops working) and a fresh expiry. */
export async function resendInvitation(actor: Actor, org: Org, invitationId: string) {
  const inv = await prisma.invitation.findFirst({ where: { id: invitationId, orgId: org.id } });
  if (!inv || (inv.state !== "pending" && inv.state !== "expired")) throw new InvitationError("That invitation can no longer be resent.");
  if (inv.sentCount >= RESEND_LIMIT) throw new InvitationError("This invitation has been sent the maximum number of times. Revoke it and invite again if needed.");
  if (inv.lastSentAt && Date.now() - inv.lastSentAt.getTime() < RESEND_COOLDOWN_MS) throw new InvitationError("It was sent in the last ten minutes. Give it a little time to arrive.");
  const token = newToken();
  const updated = await prisma.invitation.update({
    where: { id: inv.id },
    data: { tokenHash: token.hash, state: "pending", expiresAt: new Date(Date.now() + INVITE_TTL_MS), sentCount: { increment: 1 }, lastSentAt: new Date() },
  });
  await sendInvite(updated, token.raw, actor.name, org.name);
  return { invitation: updated, link: inviteLink(token.raw) };
}

export async function revokeInvitation(actor: Actor, org: Org, invitationId: string) {
  const r = await prisma.invitation.updateMany({
    where: { id: invitationId, orgId: org.id, state: { in: ["pending", "expired"] } },
    data: { state: "revoked", revokedAt: new Date(), revokedById: actor.userId },
  });
  if (r.count !== 1) throw new InvitationError("That invitation is not pending.");
}

export type InvitationView =
  | { ok: true; id: string; email: string; name: string; workspace: string; orgSlug: string; accountExists: boolean }
  | { ok: false; reason: "invalid" | "expired" | "revoked" | "accepted" };

/** What the invite page shows. Reveals nothing for an invalid token. */
export async function inspectInvitation(raw: string): Promise<InvitationView> {
  if (!raw) return { ok: false, reason: "invalid" };
  const inv = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(raw) }, include: { org: { select: { name: true, slug: true } } } });
  if (!inv) return { ok: false, reason: "invalid" };
  if (inv.state === "revoked") return { ok: false, reason: "revoked" };
  if (inv.state === "accepted") return { ok: false, reason: "accepted" };
  if (inv.state === "expired" || inv.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  const accountExists = Boolean(await prisma.user.findUnique({ where: { email: inv.email }, select: { id: true } }));
  return { ok: true, id: inv.id, email: inv.email, name: inv.name, workspace: inv.org.name, orgSlug: inv.org.slug, accountExists };
}

export type AcceptOutcome =
  | { ok: true; userId: string; orgSlug: string; createdAccount: boolean }
  | { ok: false; reason: "invalid" | "expired" | "revoked" | "wrong_account" | "sign_in_required" | "password_required" };

/**
 * Accept an invitation. `signedIn` is the current session's user, if any;
 * `password` is only used to create a new account.
 */
export async function acceptInvitation(raw: string, signedIn: { id: string; email: string } | null, password: string | null): Promise<AcceptOutcome> {
  const tokenHash = hashToken(raw || "-");
  // Hashed before the transaction so the deliberate slowness of the password
  // hash never holds a database transaction open.
  const passwordHash = !signedIn && password ? await hashPassword(password) : null;
  return prisma.$transaction(async (tx) => {
    const inv = await tx.invitation.findUnique({ where: { tokenHash }, include: { org: { select: { slug: true } } } });
    if (!inv) return { ok: false, reason: "invalid" } as const;

    // Idempotent repeat by the person who already accepted.
    if (inv.state === "accepted") {
      if (signedIn && inv.acceptedUserId === signedIn.id) return { ok: true, userId: signedIn.id, orgSlug: inv.org.slug, createdAccount: false } as const;
      return { ok: false, reason: "invalid" } as const;
    }
    if (inv.state === "revoked") return { ok: false, reason: "revoked" } as const;
    if (inv.state !== "pending" || inv.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" } as const;

    const existing = await tx.user.findUnique({ where: { email: inv.email } });
    if (signedIn && signedIn.email.toLowerCase() !== inv.email) return { ok: false, reason: "wrong_account" } as const;
    if (!signedIn && existing) return { ok: false, reason: "sign_in_required" } as const;
    if (!signedIn && !passwordHash) return { ok: false, reason: "password_required" } as const;

    // Single use: only the first conditional update wins.
    const claimed = await tx.invitation.updateMany({ where: { id: inv.id, state: "pending" }, data: { state: "accepted", acceptedAt: new Date() } });
    if (claimed.count !== 1) return { ok: false, reason: "invalid" } as const;

    let userId: string;
    let createdAccount = false;
    if (signedIn) {
      userId = signedIn.id;
    } else {
      const user = await tx.user.create({
        data: { email: inv.email, name: inv.name, title: inv.title, passwordHash: passwordHash!, avatarHue: Math.floor(Math.random() * 360) },
      });
      userId = user.id;
      createdAccount = true;
    }
    // The first admin to join a workspace with no owner becomes its owner and
    // primary contact (a newly provisioned client's founder).
    const firstAdmin = inv.role === "client_admin" && (await tx.membership.count({ where: { orgId: inv.orgId, isOwner: true } })) === 0;
    const hasPrimary = (await tx.membership.count({ where: { orgId: inv.orgId, contactRole: "primary" } })) > 0;
    await tx.membership.upsert({
      where: { userId_orgId: { userId, orgId: inv.orgId } },
      create: { userId, orgId: inv.orgId, role: inv.role, profiles: JSON.stringify(parseProfiles(inv.profiles)), isExpert: inv.isExpert, isOwner: firstAdmin, isPrimary: firstAdmin, contactRole: firstAdmin && !hasPrimary ? "primary" : null },
      update: {},
    });
    await tx.invitation.update({ where: { id: inv.id }, data: { acceptedUserId: userId } });
    return { ok: true, userId, orgSlug: inv.org.slug, createdAccount } as const;
  });
}

/** Mark lapsed pending invitations expired (run by maintenance). */
export async function expireInvitations() {
  const r = await prisma.invitation.updateMany({ where: { state: "pending", expiresAt: { lt: new Date() } }, data: { state: "expired" } });
  return r.count;
}
