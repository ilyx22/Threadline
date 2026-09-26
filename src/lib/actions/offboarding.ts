"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { WorkflowError } from "@/lib/domain/workflow";
import { deleteTenant, startOffboarding } from "@/lib/commercial/offboarding";
import { err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

/** Offboarding actions (OFF-01). Deletion needs the highest capability and the typed workspace address. */
const handle = (e: unknown) => (e instanceof WorkflowError ? err(e.message, "workflow") : null);

export async function startOffboardingAction(orgId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    const input = parseForm(z.object({ reason: z.string().trim().min(5, "Say why the engagement is ending.").max(1000), exportDays: z.coerce.number().int().min(7).max(90).default(30), retentionDays: z.coerce.number().int().min(0).max(3650).default(90) }), formData);
    try {
      const rec = await startOffboarding(orgId, admin.user.id, input);
      await auditInternal(admin.user.id, { orgId, action: "client.offboard", entityType: "organization", entityId: orgId, summary: `Started offboarding: ${input.reason}. Access ends ${rec.accessEndsAt.toISOString().slice(0, 10)}` });
    } catch (e) {
      return handle(e) ?? Promise.reject(e);
    }
    revalidatePath(`/admin/clients/${orgId}`);
    return okVoid("Offboarding started. The client can download their export until access ends.");
  });
}

export async function setLegalHoldAction(orgId: string, hold: boolean): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("admin.clients.manage");
    await prisma.organization.update({ where: { id: orgId }, data: { legalHold: hold } });
    await auditInternal(admin.user.id, { orgId, action: hold ? "client.legal_hold_on" : "client.legal_hold_off", entityType: "organization", entityId: orgId, summary: hold ? "Legal hold set: nothing will be deleted" : "Legal hold released" });
    revalidatePath(`/admin/clients/${orgId}`);
    return okVoid(hold ? "Legal hold set." : "Legal hold released.");
  });
}

export async function deleteTenantAction(orgId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("workspace.delete");
    const { confirm } = parseForm(z.object({ confirm: z.string().trim().min(1) }), formData);
    try {
      const counts = await deleteTenant(orgId, confirm);
      await auditInternal(admin.user.id, { action: "client.delete", entityType: "organization", entityId: orgId, summary: `Deleted tenant data after retention: ${JSON.stringify(counts)}` });
    } catch (e) {
      return handle(e) ?? Promise.reject(e);
    }
    revalidatePath("/admin/clients");
    return okVoid("Deleted. The offboarding record keeps the evidence.");
  });
}
