"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { ACTOR_KINDS, deleteEffort, EFFORT_STEPS, recordEffort } from "@/lib/effort";
import { err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Effort (CX-08). A client member records their own time as founder or team;
 * staff record operator or editor time, and may record a founder's time taken
 * on a call on their behalf (the entry keeps who recorded it).
 */
const schema = z.object({
  actorKind: z.enum(ACTOR_KINDS),
  step: z.enum(EFFORT_STEPS),
  minutes: z.coerce.number().int().min(1, "At least one minute.").max(1440),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  contentItemId: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
});

export async function recordEffortAction(orgSlug: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.view");
    const input = parseForm(schema, formData);
    const clientKinds = ["founder", "client_team"];
    if (!ctx.isInternal && !clientKinds.includes(input.actorKind)) return err("Record your own time as founder or team.", "validation");
    await recordEffort(ctx.org.id, ctx.user.id, { ...input, contentItemId: input.contentItemId || null, note: input.note || null });
    await audit(ctx, { action: "effort.record", entityType: "effort", entityId: ctx.org.id, summary: `Recorded ${input.minutes} min (${input.actorKind}, ${input.step})` });
    revalidatePath(`/app/${orgSlug}/effort`);
    return okVoid("Time recorded.");
  });
}

export async function deleteEffortAction(orgSlug: string, entryId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.view");
    await deleteEffort(ctx.org.id, entryId, { userId: ctx.user.id, isStaff: ctx.isInternal });
    revalidatePath(`/app/${orgSlug}/effort`);
    return okVoid("Entry removed.");
  });
}
