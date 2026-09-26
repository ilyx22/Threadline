"use server";

import { revalidatePath } from "next/cache";
import { auditInternal } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { beginEnrolment, confirmEnrolment, disableMfa } from "@/lib/auth/mfa";
import { revokeOtherSessions, revokeSession, rotateSession } from "@/lib/auth/session";
import { err, guarded, ok, okVoid, type ActionResult } from "./shared";

/**
 * The signed-in person's own security settings (SEC-07, SEC-08): two-factor
 * enrolment and removal, and their sessions. Every action acts on the caller
 * only; nothing here takes a user id from the client.
 */
export async function beginMfaEnrolmentAction(): Promise<ActionResult<{ secret: string; uri: string }>> {
  return guarded(async () => {
    const user = await requireUser("/account");
    try {
      return ok(await beginEnrolment(user.id, user.email));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Could not start enrolment.", "workflow");
    }
  });
}

export async function confirmMfaEnrolmentAction(_prev: ActionResult<{ recoveryCodes: string[] }> | null, formData: FormData): Promise<ActionResult<{ recoveryCodes: string[] }>> {
  return guarded(async () => {
    const user = await requireUser("/account");
    const codes = await confirmEnrolment(user.id, String(formData.get("code") ?? ""));
    if (!codes) return err("That code did not match. Check the time on your phone and try the current code.", "validation", { code: "Not accepted." });
    // Privilege changed: issue a fresh, verified session token.
    await rotateSession(user.id, { mfaVerified: true });
    await auditInternal(user.id, { action: "auth.mfa_enabled", entityType: "user", entityId: user.id, summary: `${user.name} turned on two-factor authentication` });
    revalidatePath("/account");
    return ok({ recoveryCodes: codes }, "Two-factor is on. Save the recovery codes now; they are not shown again.");
  });
}

export async function disableMfaAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser("/account");
    const done = await disableMfa(user.id, String(formData.get("code") ?? ""));
    if (!done) return err("That code was not accepted.", "validation", { code: "Not accepted." });
    await auditInternal(user.id, { action: "auth.mfa_disabled", entityType: "user", entityId: user.id, summary: `${user.name} turned off two-factor authentication` });
    revalidatePath("/account");
    return okVoid("Two-factor is off.");
  });
}

export async function revokeSessionAction(sessionId: string): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser("/account");
    if (sessionId === user.sessionId) return err("That is this session. Use sign out instead.", "validation");
    const done = await revokeSession(user.id, sessionId);
    if (!done) return err("That session has already ended.", "not_found");
    await auditInternal(user.id, { action: "auth.session_revoked", entityType: "session", entityId: sessionId, summary: `${user.name} ended a session` });
    revalidatePath("/account");
    return okVoid("Session ended.");
  });
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  return guarded(async () => {
    const user = await requireUser("/account");
    const n = await revokeOtherSessions(user.id, user.sessionId);
    await auditInternal(user.id, { action: "auth.sessions_revoked", entityType: "user", entityId: user.id, summary: `${user.name} ended ${n} other session(s)` });
    revalidatePath("/account");
    return okVoid(n ? `Ended ${n} other session${n === 1 ? "" : "s"}.` : "No other sessions were open.");
  });
}
