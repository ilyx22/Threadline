"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { requestExport } from "@/lib/exports";
import { guarded, okVoid, type ActionResult } from "./shared";

/** FILE-06: a workspace admin asks for a copy of the workspace's records. */
export async function requestExportAction(orgSlug: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");
    const e = await requestExport(ctx.org.id, ctx.user.id);
    await audit(ctx, { action: "export.request", entityType: "data_export", entityId: e.id, summary: "Requested a data export" });
    revalidatePath(`/app/${orgSlug}/settings`);
    return okVoid("Preparing the export. It appears here when ready, for seven days.");
  });
}
