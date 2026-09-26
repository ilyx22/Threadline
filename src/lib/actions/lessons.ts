"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { activateLesson, retireLesson } from "@/lib/learning/lessons";
import { guarded, okVoid, type ActionResult } from "./shared";

/** LRN-02: staff put a lesson into the generation context, or take one out. */
export async function activateLessonAction(orgSlug: string, input: { text: string; basis?: string; correctionId?: string; platform?: string }): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "learning.manage");
    const l = await activateLesson(ctx.org.id, ctx.user.id, { text: String(input.text ?? ""), basis: input.basis, correctionId: input.correctionId || null, platform: input.platform || null });
    await audit(ctx, { action: "lesson.activate", entityType: "generation_lesson", entityId: l.id, summary: `Lesson in force: ${l.text.slice(0, 120)}` });
    revalidatePath(`/app/${orgSlug}/learning`);
    return okVoid("Lesson in force for later generation.");
  });
}

export async function retireLessonAction(orgSlug: string, lessonId: string, reason: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "learning.manage");
    await retireLesson(ctx.org.id, lessonId, ctx.user.id, String(reason ?? ""));
    await audit(ctx, { action: "lesson.retire", entityType: "generation_lesson", entityId: lessonId, summary: "Retired a lesson" });
    revalidatePath(`/app/${orgSlug}/learning`);
    return okVoid("Retired. Later generation no longer sees it.");
  });
}
