"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { assertContentInScope } from "@/lib/team/scope";
import { err, guarded, okVoid, type ActionResult } from "./shared";

/**
 * Owner, due date and blocker on every work item (DEL-01). Content pieces
 * already carry an editor (owner) and a due date; these actions add the
 * blocker, with its history, and give scripts the same three fields.
 */
export async function setContentBlockerAction(orgSlug: string, contentItemId: string, reason: string | null): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "production.edit");
    await assertContentInScope(ctx, contentItemId);
    const item = await prisma.contentItem.findFirst({ where: { id: contentItemId, orgId: ctx.org.id }, select: { id: true, stage: true, blockedReason: true } });
    if (!item) return err("That piece no longer exists.", "not_found");
    const text = reason?.trim().slice(0, 500) || null;
    if (reason !== null && !text) return err("Say what is blocking it.", "validation");
    await prisma.contentItem.update({ where: { id: item.id }, data: text ? { blockedReason: text, blockedAt: new Date(), blockedById: ctx.user.id } : { blockedReason: null, blockedAt: null, blockedById: null } });
    await prisma.contentEvent.create({ data: { orgId: ctx.org.id, contentItemId: item.id, type: text ? "blocked" : "unblocked", fromStage: item.stage, toStage: item.stage, note: text ?? `Unblocked (was: ${item.blockedReason ?? "blocked"})`, actorId: ctx.user.id } });
    await audit(ctx, { action: text ? "content.block" : "content.unblock", entityType: "content_item", entityId: item.id, summary: text ? `Blocked: ${text}` : "Unblocked" });
    revalidatePath(`/app/${orgSlug}/production/${item.id}`);
    revalidatePath(`/app/${orgSlug}/production`);
    return okVoid(text ? "Marked blocked." : "Unblocked.");
  });
}

const scriptOwnership = z.object({
  ownerId: z.string().max(60).nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  blockedReason: z.string().max(500).nullable(),
});

export async function setScriptOwnershipAction(orgSlug: string, scriptId: string, input: z.input<typeof scriptOwnership>): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "scripts.edit");
    const parsed = scriptOwnership.safeParse(input);
    if (!parsed.success) return err("Check the owner, date and blocker.", "validation");
    const script = await prisma.script.findFirst({ where: { id: scriptId, orgId: ctx.org.id }, select: { id: true, blockedReason: true } });
    if (!script) return err("That script no longer exists.", "not_found");
    const { ownerId, dueDate, blockedReason } = parsed.data;
    if (ownerId) {
      const member = await prisma.membership.findFirst({ where: { orgId: ctx.org.id, userId: ownerId, status: "active" }, select: { id: true } });
      const staff = ctx.isInternal ? await prisma.membership.findFirst({ where: { userId: ownerId, status: "active", org: { kind: "internal" } }, select: { id: true } }) : null;
      if (!member && !staff) return err("The owner must be a member of this workspace or Threadline staff.", "validation");
    }
    const reason = blockedReason?.trim() || null;
    await prisma.script.update({
      where: { id: script.id },
      data: { ownerId, dueDate: dueDate ? new Date(`${dueDate}T17:00:00.000Z`) : null, blockedReason: reason, blockedAt: reason ? (script.blockedReason === reason ? undefined : new Date()) : null },
    });
    await audit(ctx, { action: "script.ownership", entityType: "script", entityId: script.id, summary: `Owner ${ownerId ? "set" : "cleared"}, due ${dueDate ?? "none"}${reason ? `, blocked: ${reason}` : ""}` });
    revalidatePath(`/app/${orgSlug}/create/scripts/${script.id}`);
    return okVoid("Saved.");
  });
}
