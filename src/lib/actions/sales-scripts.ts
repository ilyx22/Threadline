"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireInternal } from "@/lib/auth/guard";
import { auditInternal } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/client";
import { approveScript, createScriptVersion, retireScript, snapshotScriptForCall, SCRIPT_STAGES } from "@/lib/sales/scripts";
import { importCanonicalDrafts } from "@/lib/sales/canonical-import";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

const versionSchema = z.object({
  key: z.string().min(3).max(120).regex(/^[a-z0-9_.-]+$/, "Lowercase key such as discovery.open"),
  stage: z.enum(SCRIPT_STAGES),
  context: z.string().min(3).max(300),
  exactText: z.string().min(10).max(8000),
  provenance: z.string().min(3).max(300),
});

export async function createScriptVersionAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternal("admin.sops");
    const input = parseForm(versionSchema, formData);
    const row = await createScriptVersion({ ...input, context: cleanText(input.context, 300), provenance: cleanText(input.provenance, 300) });
    await auditInternal(admin.user.id, { action: "sales_script.version", entityType: "SalesScript", entityId: row.id, summary: `New draft ${row.key} v${row.version}` });
    revalidatePath("/admin/scripts");
    return ok({ id: row.id }, `Draft ${row.key} v${row.version} saved. Approve it before it can be used.`);
  });
}

export async function approveScriptAction(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternal("admin.sops");
    const row = await approveScript(id);
    await auditInternal(admin.user.id, { action: "sales_script.approve", entityType: "SalesScript", entityId: id, summary: `Approved ${row.key} v${row.version}` });
    revalidatePath("/admin/scripts");
    return okVoid(`${row.key} v${row.version} is now the canonical wording.`);
  });
}

export async function retireScriptAction(id: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternal("admin.sops");
    const row = await retireScript(id);
    await auditInternal(admin.user.id, { action: "sales_script.retire", entityType: "SalesScript", entityId: id, summary: `Retired ${row.key} v${row.version}` });
    revalidatePath("/admin/scripts");
    return okVoid("Retired.");
  });
}

export async function importCanonicalDraftsAction(): Promise<ActionResult<{ created: number; unchanged: number }>> {
  return guarded(async () => {
    const admin = await requireInternal("admin.sops");
    const results = await importCanonicalDrafts();
    const created = results.reduce((a, r) => a + r.created, 0);
    const unchanged = results.reduce((a, r) => a + r.unchanged, 0);
    await auditInternal(admin.user.id, { action: "sales_script.import", entityType: "SalesScript", entityId: "import", summary: `Imported ${created} draft block(s) verbatim from the working documents` });
    revalidatePath("/admin/scripts");
    return ok({ created, unchanged }, `${created} block${created === 1 ? "" : "s"} imported as drafts; ${unchanged} already present.`);
  });
}

/** Record that an approved block was used on a call — exact text and version frozen against the call. */
export async function recordScriptUseAction(callId: string, scriptId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternal("acquisition.manage");
    const call = await prisma.salesCall.findUnique({ where: { id: callId }, select: { id: true, prospectId: true } });
    if (!call) return err("That call no longer exists.", "not_found");
    const snap = await snapshotScriptForCall(callId, scriptId);
    await auditInternal(admin.user.id, { action: "sales_script.use", entityType: "SalesCall", entityId: callId, summary: `Used ${snap.key} v${snap.version} on the call` });
    revalidatePath(`/admin/prospects/${call.prospectId}`);
    return okVoid(`${snap.key} v${snap.version} recorded against the call.`);
  });
}
