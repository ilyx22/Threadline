"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { WorkflowError } from "@/lib/domain/workflow";
import { mineAsset, setAssetRoute } from "@/lib/research/miner";
import { isSourceRoute } from "@/lib/research/source-route";
import { err, guarded, okVoid, type ActionResult } from "./shared";

/** BUILD-03: record how a source may be used, before it is mined. */
export async function setAssetRouteAction(orgSlug: string, assetId: string, route: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    if (!isSourceRoute(route)) return err("Choose a valid route.", "validation");
    try {
      const r = await setAssetRoute(ctx.org.id, assetId, route);
      await audit(ctx, { action: "source.route", entityType: "asset", entityId: assetId, summary: `Routed source as ${route} (${r.updated} mined items updated)` });
      revalidatePath(`/app/${orgSlug}/library`);
      return okVoid(r.citedByIdeas ? `Route saved. ${r.citedByIdeas} idea link(s) cite this source, so review those ideas.` : "Route saved.");
    } catch (e) {
      if (e instanceof WorkflowError) return err(e.message, "workflow");
      throw e;
    }
  });
}

/** AI-01: mine a text file in the library for exact-quote evidence. */
export async function mineAssetAction(orgSlug: string, assetId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);
    try {
      const r = await mineAsset(ctx.org.id, ctx.user.id, assetId);
      await audit(ctx, { action: "source.mine", entityType: "asset", entityId: assetId, summary: `Mined ${r.kept.length} exact quotes (${r.dropped} dropped as not in the source)` });
      revalidatePath(`/app/${orgSlug}/library`);
      return okVoid(`${r.kept.length} quotes added to research${r.dropped ? `; ${r.dropped} were not exact and were dropped` : ""}${r.isDemo ? " (demo mode)" : ""}.`);
    } catch (e) {
      if (e instanceof WorkflowError) return err(e.message, "workflow");
      throw e;
    }
  });
}
