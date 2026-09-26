"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { hashPassword, passwordIssues } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { auditInternal } from "@/lib/auth/audit";
import { consumeToken, issueToken, tokenLink, TOKEN_TTL } from "@/lib/auth/tokens";
import { enqueue } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

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

/* Invitations live in src/lib/actions/team.ts (TEAM-02). */
