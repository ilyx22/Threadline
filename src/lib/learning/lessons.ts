import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * Lessons in generation (LRN-02). A lesson enters the AI context only with a
 * basis: a correction whose retest worked, or a written reason from staff.
 * It can be scoped to one platform. Retiring it removes it from every later
 * generation; the record stays, so what the model was told is always known.
 */
export async function activateLesson(orgId: string, userId: string, input: { text: string; basis?: string; correctionId?: string | null; platform?: string | null }) {
  const text = input.text.trim().slice(0, 500);
  if (text.length < 8) throw new WorkflowError("Write the lesson as one clear instruction.");
  let basis = input.basis?.trim() ?? "";
  if (input.correctionId) {
    const c = await prisma.correctionEntry.findFirst({ where: { id: input.correctionId, orgId }, select: { worked: true, correction: true, verdictNote: true } });
    if (!c) throw new WorkflowError("That correction is not in this workspace.");
    if (c.worked !== true) throw new WorkflowError("Only a correction a retest confirmed can become a lesson.");
    basis = basis || `Retest confirmed: ${c.verdictNote ?? c.correction}`.slice(0, 500);
  }
  if (basis.length < 8) throw new WorkflowError("Say what this lesson is based on.");
  const open = await prisma.generationLesson.count({ where: { orgId, status: "active" } });
  if (open >= 20) throw new WorkflowError("Twenty lessons are in force. Retire one before adding another.");
  return prisma.generationLesson.create({
    data: { orgId, text, basis, correctionId: input.correctionId ?? null, scope: input.platform ? "platform" : "workspace", platform: input.platform ?? null, activatedById: userId },
  });
}

export async function retireLesson(orgId: string, lessonId: string, userId: string, reason: string) {
  const r = await prisma.generationLesson.updateMany({ where: { id: lessonId, orgId, status: "active" }, data: { status: "retired", retiredById: userId, retiredAt: new Date(), retiredReason: reason.trim().slice(0, 300) || null } });
  if (r.count !== 1) throw new WorkflowError("That lesson is not in force.");
}

export async function listLessons(orgId: string) {
  return prisma.generationLesson.findMany({ where: { orgId }, orderBy: [{ status: "asc" }, { activatedAt: "desc" }], take: 50 });
}
