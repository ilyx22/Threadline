"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { restoreBrainVersion } from "@/lib/ai/brain-versions";
import { guarded, okVoid, type ActionResult } from "./shared";

/** AI-03/ENG-04: roll the Brand Brain back to an earlier version (recorded as a new version). */
export async function restoreBrainVersionAction(orgSlug: string, version: number): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const now = await restoreBrainVersion(ctx.org.id, Number(version));
    await audit(ctx, { action: "brain.restore", entityType: "brand_brain", entityId: ctx.org.id, summary: `Restored Brand Brain version ${version} as version ${now}` });
    revalidatePath(`/app/${orgSlug}/intelligence`);
    return okVoid(`Restored as version ${now}.`);
  });
}
