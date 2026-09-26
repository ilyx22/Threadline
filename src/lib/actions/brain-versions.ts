"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { restoreBrainVersion } from "@/lib/ai/brain-versions";
import { prisma } from "@/lib/db/client";
import { err, guarded, okVoid, type ActionResult } from "./shared";

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

const SECTIONS = ["company", "founder", "voice", "contentRules"] as const;

/** CX-04: the client confirms a section Threadline prefilled. */
export async function confirmBrainSectionAction(orgSlug: string, section: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    if (ctx.isInternal) return err("The client confirms what Threadline prefilled.", "auth");
    if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) return err("Unknown section.", "validation");
    const brain = await prisma.brandBrain.findUnique({ where: { orgId: ctx.org.id }, select: { confirmations: true, version: true } });
    if (!brain) return err("Nothing to confirm yet.", "not_found");
    const map = JSON.parse(brain.confirmations || "{}") as Record<string, { state: string }>;
    if (map[section]?.state !== "prefilled") return okVoid("Already confirmed.");
    map[section] = { state: "confirmed", by: ctx.user.id, at: new Date().toISOString(), version: brain.version } as never;
    await prisma.brandBrain.update({ where: { orgId: ctx.org.id }, data: { confirmations: JSON.stringify(map) } });
    await audit(ctx, { action: "brain.confirm", entityType: "brand_brain", entityId: ctx.org.id, summary: `Confirmed the ${section} section Threadline prefilled` });
    revalidatePath(`/app/${orgSlug}/intelligence`);
    return okVoid("Confirmed.");
  });
}
