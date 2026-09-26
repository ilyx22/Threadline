"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgAccess } from "@/lib/auth/guard";
import { fingerprint, type ApprovableType } from "@/lib/delivery/approvals";
import { moveContentAction, approvePackageAction } from "./content";
import { setScriptStateAction } from "./scripts";
import { err, guarded, ok, type ActionResult } from "./shared";

/**
 * Bulk approval of selected items (CX-02).
 *
 * Each item carries the fingerprint of the version the reviewer saw when the
 * page loaded. An item that changed since is skipped and reported, never
 * approved on the reviewer's behalf; the rest go through the same single-item
 * actions (and therefore the same capability and workflow checks) as a
 * one-at-a-time approval. Only approvals are bulk: sending work back needs a
 * note per item.
 */
const itemSchema = z.object({ kind: z.enum(["script", "content", "package"]), id: z.string().min(1).max(60), hash: z.string().length(64) });

const TYPE: Record<"script" | "content" | "package", ApprovableType> = { script: "script", content: "content_item", package: "platform_package" };

export async function bulkApproveAction(orgSlug: string, items: unknown): Promise<ActionResult<{ approved: number; changed: string[]; refused: string[] }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.view");
    const list = z.array(itemSchema).min(1).max(50).parse(items);
    let approved = 0;
    const changed: string[] = [];
    const refused: string[] = [];
    for (const item of list) {
      const fp = await fingerprint(ctx.org.id, { type: TYPE[item.kind], id: item.id });
      if (!fp || fp.hash !== item.hash) {
        changed.push(item.id);
        continue;
      }
      const r =
        item.kind === "script"
          ? await setScriptStateAction(orgSlug, item.id, "approved")
          : item.kind === "content"
            ? await moveContentAction(orgSlug, item.id, "approved")
            : await approvePackageAction(orgSlug, item.id);
      if (r.ok) approved++;
      else refused.push(`${item.id}: ${r.error}`);
    }
    revalidatePath(`/app/${orgSlug}/approvals`);
    if (!approved && !changed.length) return err(refused[0]?.split(": ").slice(1).join(": ") || "Nothing was approved.", "workflow");
    const parts = [`${approved} approved`];
    if (changed.length) parts.push(`${changed.length} changed since you opened this page and were left for you to look at again`);
    if (refused.length) parts.push(`${refused.length} could not be approved`);
    return ok({ approved, changed, refused }, `${parts.join("; ")}.`);
  });
}
