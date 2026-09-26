"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { EngagementError } from "@/lib/commercial/engagements";
import { defineEarlyWin, recordEarlyWin, signOffInstallation } from "@/lib/commercial/installation";
import { err, guarded, okVoid, type ActionResult } from "./shared";

/** ENG-03: the client signs off installation (only once every checklist item is complete). */
export async function signOffInstallationAction(orgSlug: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "install.signoff");
    try {
      await signOffInstallation(ctx.org.id, ctx.user.id);
    } catch (e) {
      if (e instanceof EngagementError) return err(e.message, "workflow");
      throw e;
    }
    await audit(ctx, { action: "installation.signoff", entityType: "engagement", entityId: ctx.org.id, summary: "Signed off installation" });
    revalidatePath(`/app/${orgSlug}/install`);
    return okVoid("Installation signed off.");
  });
}

/** Staff: agree the concrete early win, then record when it actually happened. */
export async function earlyWinAction(orgSlug: string, input: { definition?: string; evidence?: string; achievedOn?: string }): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "install.signoff");
    if (!ctx.isInternal) return err("Threadline records the early win with you.", "auth");
    try {
      if (input.definition !== undefined) await defineEarlyWin(ctx.org.id, input.definition);
      else await recordEarlyWin(ctx.org.id, { evidence: input.evidence ?? "", achievedOn: input.achievedOn || undefined });
    } catch (e) {
      if (e instanceof EngagementError) return err(e.message, "workflow");
      throw e;
    }
    await audit(ctx, { action: input.definition !== undefined ? "early_win.define" : "early_win.record", entityType: "engagement", entityId: ctx.org.id, summary: input.definition !== undefined ? "Agreed the early win" : "Recorded the early win" });
    revalidatePath(`/app/${orgSlug}/install`);
    return okVoid("Saved.");
  });
}
