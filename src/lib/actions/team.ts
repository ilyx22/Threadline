"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, auditInternal } from "@/lib/auth/audit";
import { currentUser, requireOrgAccess } from "@/lib/auth/guard";
import { passwordIssues } from "@/lib/auth/password";
import { CLIENT_PROFILES, type ClientProfile } from "@/lib/auth/roles";
import { createSession } from "@/lib/auth/session";
import { emailDeliveryConfigured } from "@/lib/email";
import { roleSchema } from "@/lib/domain/enums";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { acceptInvitation, createInvitation, InvitationError, resendInvitation, revokeInvitation } from "@/lib/team/invitations";
import { MemberError, reinstateMember, removeMember, suspendMember, transferOwnership, updateMemberProfile } from "@/lib/team/members";
import { err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Team management (TEAM-01 to TEAM-10). Admins invite; nobody types another
 * person's password. Every action re-resolves the caller from the session and
 * the workspace from the URL.
 */
const profileList = z.preprocess(
  (v) => (Array.isArray(v) ? v : typeof v === "string" && v ? [v] : []),
  z.array(z.enum(CLIENT_PROFILES)).max(5),
);

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter their name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  title: z.string().trim().max(120).optional(),
  role: roleSchema,
  isExpert: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

function formProfiles(formData: FormData): ClientProfile[] {
  return profileList.parse(formData.getAll("profiles"));
}

const translate = (e: unknown) => (e instanceof InvitationError || e instanceof MemberError ? err(e.message, "workflow") : null);
const members = (slug: string) => revalidatePath(`/app/${slug}/settings/members`);

export async function inviteAction(orgSlug: string, _prev: ActionResult<{ link: string | null }> | null, formData: FormData): Promise<ActionResult<{ link: string | null }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    await enforceRateLimit(`invite:${ctx.org.id}`, { limit: 30, windowMs: 60 * 60_000 });
    const input = parseForm(inviteSchema, formData);
    try {
      const { invitation, link } = await createInvitation({ userId: ctx.user.id, name: ctx.user.name, role: ctx.role }, ctx.org, { ...input, profiles: formProfiles(formData) });
      await audit(ctx, { action: "invitation.create", entityType: "invitation", entityId: invitation.id, summary: `Invited ${invitation.name} as ${input.role.replace(/_/g, " ")}` });
      members(orgSlug);
      const captured = !emailDeliveryConfigured();
      return ok({ link: captured ? link : null }, captured ? `${invitation.name} invited. Email is not configured here, so share the link below directly.` : `${invitation.name} invited. The link is on its way.`);
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}

export async function resendInvitationAction(orgSlug: string, invitationId: string): Promise<ActionResult<{ link: string | null }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    try {
      const { invitation, link } = await resendInvitation({ userId: ctx.user.id, name: ctx.user.name, role: ctx.role }, ctx.org, invitationId);
      await audit(ctx, { action: "invitation.resend", entityType: "invitation", entityId: invitation.id, summary: `Resent the invitation to ${invitation.name}` });
      members(orgSlug);
      const captured = !emailDeliveryConfigured();
      return ok({ link: captured ? link : null }, captured ? "New link issued (the old one no longer works). Share it directly." : "Sent again with a new link. The old link no longer works.");
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}

export async function revokeInvitationAction(orgSlug: string, invitationId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    try {
      await revokeInvitation({ userId: ctx.user.id, name: ctx.user.name, role: ctx.role }, ctx.org, invitationId);
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
    await audit(ctx, { action: "invitation.revoke", entityType: "invitation", entityId: invitationId, summary: "Revoked an invitation" });
    members(orgSlug);
    return okVoid("Invitation revoked. The link no longer works.");
  });
}

const acceptSchema = z.object({ token: z.string().min(10).max(200), password: z.string().max(200).optional(), confirm: z.string().max(200).optional() });

/** Accept an invitation. POST only (a server action); a GET of the link never changes anything. */
export async function acceptInvitationAction(_prev: ActionResult<{ redirectTo: string }> | null, formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  const result = await guarded(async () => {
    await enforceRateLimit("invite-accept", LIMITS.passwordReset);
    const input = parseForm(acceptSchema, formData);
    const me = await currentUser();
    if (!me && input.password !== undefined) {
      if (input.password !== input.confirm) return err("The two passwords do not match.", "validation", { confirm: "Does not match." });
      const issues = passwordIssues(input.password);
      if (issues.length) return err(issues.join(" "), "validation", { password: issues[0] });
    }
    const outcome = await acceptInvitation(input.token, me ? { id: me.id, email: me.email } : null, me ? null : (input.password ?? null));
    if (!outcome.ok) {
      const messages: Record<typeof outcome.reason, string> = {
        invalid: "This invitation link is not valid, or has already been used.",
        expired: "This invitation has expired. Ask for a new one.",
        revoked: "This invitation was withdrawn.",
        wrong_account: "You are signed in as a different person from the one invited. Sign out, then open the link again.",
        sign_in_required: "You already have a Threadline account. Sign in first, then open the link again.",
        password_required: "Choose a password to create your account.",
      };
      return err(messages[outcome.reason], "validation");
    }
    if (outcome.createdAccount) await createSession(outcome.userId);
    await auditInternal(outcome.userId, { action: "invitation.accepted", entityType: "user", entityId: outcome.userId, summary: `Accepted an invitation to ${outcome.orgSlug}` });
    return ok({ redirectTo: `/app/${outcome.orgSlug}` }, "Welcome.");
  });
  if (result.ok) redirect(result.data.redirectTo);
  return result;
}

export async function suspendMemberAction(orgSlug: string, userId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    try {
      const r = await suspendMember({ userId: ctx.user.id, role: ctx.role }, ctx.org, userId);
      await audit(ctx, { action: "member.suspend", entityType: "membership", entityId: userId, summary: `Suspended ${r.name}; ${r.released} open task(s) returned to the unassigned queue` });
      members(orgSlug);
      return okVoid(`${r.name} suspended.${r.released ? ` ${r.released} open task(s) are now unassigned.` : ""}`);
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}

export async function reinstateMemberAction(orgSlug: string, userId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    try {
      const r = await reinstateMember({ userId: ctx.user.id, role: ctx.role }, ctx.org, userId);
      await audit(ctx, { action: "member.reinstate", entityType: "membership", entityId: userId, summary: `Reinstated ${r.name}` });
      members(orgSlug);
      return okVoid(`${r.name} reinstated.`);
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}

export async function removeMemberAction(orgSlug: string, userId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    try {
      const r = await removeMember({ userId: ctx.user.id, role: ctx.role }, ctx.org, userId);
      await audit(ctx, { action: "member.remove", entityType: "membership", entityId: userId, summary: `Removed ${r.name}; ${r.released} open task(s) returned to the unassigned queue` });
      members(orgSlug);
      return okVoid(`${r.name} removed.${r.released ? ` ${r.released} open task(s) are now unassigned.` : ""}`);
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}

export async function transferOwnershipAction(orgSlug: string, toUserId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    try {
      const r = await transferOwnership({ userId: ctx.user.id, role: ctx.role }, ctx.org, toUserId);
      await audit(ctx, { action: "member.ownership_transfer", entityType: "membership", entityId: toUserId, summary: `Made ${r.name} the workspace owner` });
      members(orgSlug);
      return okVoid(`${r.name} is now the owner.`);
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}

const profileSchema = z.object({ contactRole: z.enum(["primary", "backup", "none"]).default("none"), isExpert: z.preprocess((v) => v === "on" || v === "true", z.boolean()) });

export async function updateMemberProfileAction(orgSlug: string, userId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.members");
    const input = parseForm(profileSchema, formData);
    try {
      const r = await updateMemberProfile({ userId: ctx.user.id, role: ctx.role }, ctx.org, userId, { profiles: formProfiles(formData), isExpert: input.isExpert, contactRole: input.contactRole === "none" ? null : input.contactRole });
      await audit(ctx, { action: "member.profile", entityType: "membership", entityId: userId, summary: `Updated ${r.name}: ${r.profiles.join(", ") || "no profiles"}${input.isExpert ? ", expert" : ""}${input.contactRole !== "none" ? `, ${input.contactRole} contact` : ""}` });
      members(orgSlug);
      return okVoid("Saved.");
    } catch (e) {
      return translate(e) ?? Promise.reject(e);
    }
  });
}
