"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { recordQaReview } from "@/lib/delivery/qa";
import { WorkflowError } from "@/lib/domain/workflow";
import { assertContentInScope } from "@/lib/team/scope";
import { err, guarded, okVoid, type ActionResult } from "./shared";

/** DEL-06: staff or the assigned editor record an internal QA pass on the current cut. */
export async function recordQaReviewAction(orgSlug: string, contentItemId: string, input: { checks: { key: string; pass: boolean; note?: string }[]; notes?: string }): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.edit");
    if (!ctx.isInternal && ctx.role !== "editor") return err("Internal QA is recorded by Threadline or the editor.", "auth");
    await assertContentInScope(ctx, contentItemId);
    try {
      const r = await recordQaReview(ctx.org.id, ctx.user.id, contentItemId, input);
      await audit(ctx, { action: "qa.review", entityType: "content_item", entityId: contentItemId, summary: `Internal QA ${r.result} on ${r.versionLabel}` });
    } catch (e) {
      if (e instanceof WorkflowError) return err(e.message, "validation");
      throw e;
    }
    revalidatePath(`/app/${orgSlug}/production/${contentItemId}`);
    return okVoid("QA recorded.");
  });
}
