"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { hashPassword, passwordIssues } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { audit, auditInternal } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { canAssignRole } from "@/lib/auth/roles";
import { consumeToken, inspectToken, issueToken, tokenLink, TOKEN_TTL } from "@/lib/auth/tokens";
import { enqueue } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import { emailDeliveryConfigured } from "@/lib/email";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";
import { randomBytes } from "node:crypto";

/**
 * Account lifecycle that needs email: invitations and password resets.
 *
 * Every response to an unauthenticated caller is the same whether or not the
 * address exists (enumeration-safe). The email itself is queued as a job so
 * a slow or failing provider never blocks the request, and so a retried
 * request cannot send twice (idempotency key = token id).
 */

const GENERIC_RESET_MESSAGE = "If that address belongs to an account, a reset link is on its way. It expires in 30 minutes.";

const requestResetSchema = z.object({ email: z.string().email().max(200) });

export async function requestPasswordResetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    await enforceRateLimit("password-reset", LIMITS.passwordReset);
    const input = parseForm(requestResetSchema, formData);
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, isActive: true } });
    if (user && user.isActive) {
      const token = await issueToken({ userId: user.id, kind: "password_reset" });
      await enqueue(
        "email.send",
        { to: email, template: "password_reset", data: { name: user.name, link: tokenLink("password_reset", token.raw), expiresInMinutes: TOKEN_TTL.password_reset / 60_000 } },
        { idempotencyKey: `reset:${token.id}` },
      );
      await auditInternal(user.id, { action: "auth.reset_requested", entityType: "user", entityId: user.id, summary: "Password reset requested" });
    }
    return okVoid(GENERIC_RESET_MESSAGE);
  });
}

const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(1, "Choose a password.").max(200),
  confirm: z.string().max(200),
});

export async function resetPasswordAction(_prev: ActionResult<{ redirectTo: string }> | null, formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const result = await guarded(async () => {
    await enforceRateLimit("password-reset-complete", LIMITS.passwordReset);
    const input = parseForm(resetSchema, formData);
    if (input.password !== input.confirm) return err("The two passwords do not match.", "validation", { confirm: "Does not match." });
    const issues = passwordIssues(input.password);
    if (issues.length) return err(issues.join(" "), "validation", { password: issues[0] });

    const consumed = await consumeToken(input.token, "password_reset");
    if (!consumed.ok) {
      return err(
        consumed.reason === "expired" ? "That link has expired. Request a new one." : consumed.reason === "used" ? "That link has already been used. Request a new one." : "That link is not valid.",
        "validation",
      );
    }
    const user = await prisma.user.findUnique({ where: { id: consumed.userId } });
    if (!user || !user.isActive) return err("That account is not active.", "auth");

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(input.password) } });
    // Every other session is ended: a reset is what someone does after losing control of a password.
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await createSession(user.id);
    await auditInternal(user.id, { action: "auth.reset_completed", entityType: "user", entityId: user.id, summary: "Password reset completed; other sessions ended" });
    return ok({ redirectTo: "/app" }, "Password updated.");
  });
  if (result.ok) redirect(result.data.redirectTo);
  return result;
}

/* ---------------------------------- Invites --------------------------------- */

const inviteSchema = z.object({
  name: z.string().min(2, "Enter their name.").max(120),
  email: z.string().email("Enter a valid email address.").max(200),
  role: z.enum(["client_admin", "client_member", "editor", "internal_operator"]),
  title: z.string().max(120).optional(),
});

/**
 * Invite by email. The account is created with an unusable password and a
 * single-use invite link is queued. With `EMAIL_PROVIDER=capture` the link is
 * also returned to the inviter so the workflow completes in development.
 */
export async function inviteMemberAction(orgSlug: string, _prev: ActionResult<{ inviteLink: string | null; captured: boolean }> | null, formData: FormData): Promise<ActionResult<{ inviteLink: string | null; captured: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    const input = parseForm(inviteSchema, formData);
    if (!canAssignRole(ctx.role, input.role)) return err("You cannot grant that role.", "auth");

    const email = input.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });
    const created = !user;
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: cleanText(input.name, 120), title: input.title ?? null, passwordHash: `invited:${randomBytes(24).toString("hex")}`, avatarHue: Math.floor(Math.random() * 360) },
      });
    }
    const existing = await prisma.membership.findUnique({ where: { userId_orgId: { userId: user.id, orgId: ctx.org.id } } });
    if (existing) return err("That person is already a member of this workspace.", "validation");
    await prisma.membership.create({ data: { userId: user.id, orgId: ctx.org.id, role: input.role } });

    const token = await issueToken({ userId: user.id, kind: "invite", orgId: ctx.org.id, createdById: ctx.user.id });
    const link = tokenLink("invite", token.raw);
    await enqueue(
      "email.send",
      { to: email, template: "invite", data: { name: user.name, inviterName: ctx.user.name, workspaceName: ctx.org.name, link, expiresInHours: TOKEN_TTL.invite / 3_600_000 }, orgId: ctx.org.id },
      { idempotencyKey: `invite:${token.id}`, orgId: ctx.org.id },
    );
    await audit(ctx, { action: "member.invite", entityType: "membership", entityId: user.id, summary: `Invited ${user.name} as ${input.role.replace(/_/g, " ")}${created ? "" : " (existing account)"}` });
    revalidatePath(`/app/${orgSlug}/settings/members`);

    const captured = !emailDeliveryConfigured();
    return ok({ inviteLink: captured ? link : null, captured }, captured ? `${user.name} invited. Email delivery is not configured here, so share the link below directly.` : `${user.name} invited — the link is on its way to ${email}.`);
  });
}

export async function inviteStatusAction(token: string): Promise<ActionResult<{ name: string; workspace: string | null }>> {
  return guarded(async () => {
    const peek = await inspectToken(token, "invite");
    if (!peek.ok) return err(peek.reason === "expired" ? "This invitation has expired. Ask your operator for a new one." : peek.reason === "used" ? "This invitation has already been used. Sign in instead." : "This invitation link is not valid.", "validation");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: peek.userId }, select: { name: true } });
    const org = peek.orgId ? await prisma.organization.findUnique({ where: { id: peek.orgId }, select: { name: true } }) : null;
    return ok({ name: user.name, workspace: org?.name ?? null });
  });
}

const acceptSchema = z.object({ token: z.string().min(20).max(200), password: z.string().min(1, "Choose a password.").max(200), confirm: z.string().max(200) });

export async function acceptInviteAction(_prev: ActionResult<{ redirectTo: string }> | null, formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const result = await guarded(async () => {
    await enforceRateLimit("invite-accept", LIMITS.passwordReset);
    const input = parseForm(acceptSchema, formData);
    if (input.password !== input.confirm) return err("The two passwords do not match.", "validation", { confirm: "Does not match." });
    const issues = passwordIssues(input.password);
    if (issues.length) return err(issues.join(" "), "validation", { password: issues[0] });
    const consumed = await consumeToken(input.token, "invite");
    if (!consumed.ok) return err(consumed.reason === "expired" ? "This invitation has expired. Ask your operator for a new one." : consumed.reason === "used" ? "This invitation has already been used. Sign in instead." : "This invitation link is not valid.", "validation");
    const user = await prisma.user.update({ where: { id: consumed.userId }, data: { passwordHash: await hashPassword(input.password), isActive: true } });
    await createSession(user.id);
    await auditInternal(user.id, { action: "auth.invite_accepted", entityType: "user", entityId: user.id, summary: `${user.name} accepted an invitation` });
    const org = consumed.orgId ? await prisma.organization.findUnique({ where: { id: consumed.orgId }, select: { slug: true, kind: true } }) : null;
    return ok({ redirectTo: org && org.kind === "client" ? `/app/${org.slug}` : "/app" }, "Welcome.");
  });
  if (result.ok) redirect(result.data.redirectTo);
  return result;
}
