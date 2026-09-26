"use server";

import { revalidatePath } from "next/cache";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { requeueDead } from "@/lib/jobs";
import { retryOutboxRow } from "@/lib/crm/outbox";
import { guarded, okVoid, type ActionResult } from "./shared";

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
