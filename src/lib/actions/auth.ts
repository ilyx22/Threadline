"use server";

import { z } from "zod";
import { safePath } from "@/lib/security/safe-path";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, pruneExpiredSessions } from "@/lib/auth/session";
import { auditInternal } from "@/lib/auth/audit";
import { createHash } from "node:crypto";
import { enforceRateLimit, LIMITS, RateLimitError, rateLimitAsync } from "@/lib/security/rate-limit";
import { err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().optional(),
});

export async function loginAction(
  _prev: ActionResult<{ redirectTo: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const result = await guarded(async () => {
    await enforceRateLimit("login", LIMITS.login);

    const input = parseForm(loginSchema, formData);
    // SEC-06: a per-account window as well as per-address, so guesses spread
    // across many addresses still slow down against one mailbox. The key is a
    // hash, so the limiter store never holds email addresses.
    const accountKey = createHash("sha256").update(input.email.toLowerCase()).digest("hex").slice(0, 32);
    const perAccount = await rateLimitAsync(`login-account:${accountKey}`, LIMITS.loginAccount);
    if (!perAccount.ok) throw new RateLimitError(perAccount.retryAfterSeconds);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { memberships: { include: { org: { select: { slug: true, kind: true } } } } },
    });

    // Generic failure message and a comparison in both branches, so a missing
    // account and a wrong password are indistinguishable to an attacker.
    const passwordOk = user
      ? await verifyPassword(input.password, user.passwordHash)
      : await verifyPassword(input.password, DUMMY_HASH);

    if (!user || !passwordOk || !user.isActive) {
      return err("That email and password combination was not recognised.", "auth");
    }

    await pruneExpiredSessions();
    await createSession(user.id);
    await auditInternal(user.id, {
      action: "auth.login",
      entityType: "user",
      entityId: user.id,
      summary: `${user.name} signed in`,
    });

    const clientOrg = user.memberships.find((m) => m.org.kind === "client");
    const isInternal =
      user.isSuperAdmin ||
      user.memberships.some((m) => m.org.kind === "internal" && (m.role === "internal_operator" || m.role === "super_admin"));

    // `next` is attacker-controlled: it arrives on the login URL. Only an
    // unambiguous same-origin path is honoured. `startsWith("/")` alone let
    // `//evil.example` through (QA-001) — a protocol-relative redirect that
    // every browser follows off-site.
    const target =
      safePath(input.next) ??
      (isInternal ? "/admin" : clientOrg ? `/app/${clientOrg.org.slug}` : "/app");

    return { ok: true as const, data: { redirectTo: target } };
  });

  if (result.ok) redirect(result.data.redirectTo);
  return result;
}

/**
 * A valid scrypt hash of a value no user can have, so the failure path performs
 * the same work as the success path (see the comment in loginAction).
 */
const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" +
  "Y2Fubm90bWF0Y2hhbnl0aGluZ2V2ZXJiZWNhdXNldGhpc2lzbm90YXJlYWxoYXNodmFsdWU=";

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function logoutResultAction(): Promise<ActionResult> {
  return guarded(async () => {
    await destroySession();
    return okVoid("Signed out.");
  });
}
