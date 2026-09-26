"use server";

import { revalidatePath } from "next/cache";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { requeueDead } from "@/lib/jobs";
import { retryOutboxRow } from "@/lib/crm/outbox";
import { err, guarded, okVoid, type ActionResult } from "./shared";
import { prisma } from "@/lib/db/client";
import { resetMfaForUser } from "@/lib/auth/mfa";
import { liftSuppression } from "@/lib/email/delivery";

/** Operator recovery for background work (OPS-02). Audited. */
export async function requeueJobAction(jobId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.view");
    await requeueDead(jobId);
    await auditInternal(admin.user.id, { action: "system.job_requeue", entityType: "job", entityId: jobId, summary: "Requeued a dead job" });
    revalidatePath("/admin/system");
    return okVoid("Requeued.");
  });
}

export async function retryCrmAction(outboxId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.view");
    await retryOutboxRow(outboxId);
    await auditInternal(admin.user.id, { action: "system.crm_retry", entityType: "crm_outbox", entityId: outboxId, summary: "Retried a CRM sync row" });
    revalidatePath("/admin/system");
    return okVoid("Queued for another attempt.");
  });
}

/** NOT-02: lift an email suppression once the address is known to work again. */
export async function liftSuppressionAction(email: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.view");
    await liftSuppression(email);
    await auditInternal(admin.user.id, { action: "system.email_unsuppress", entityType: "email", entityId: email, summary: `Lifted the email suppression for ${email}` });
    revalidatePath("/admin/system");
    return okVoid("Suppression lifted.");
  });
}

/** A super admin resets a colleague's two-factor after identity is confirmed out of band. */
export async function resetMfaAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("workspace.delete");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    if (!user) return err("No account has that email address.", "not_found");
    if (user.id === admin.user.id) return err("Reset your own two-factor with another super admin.", "validation");
    await resetMfaForUser(user.id);
    await auditInternal(admin.user.id, { action: "auth.mfa_reset", entityType: "user", entityId: user.id, summary: `Reset two-factor for ${user.name}; their sessions were ended` });
    return okVoid(`${user.name}'s two-factor was reset. They set it up again at their next sign-in.`);
  });
}
