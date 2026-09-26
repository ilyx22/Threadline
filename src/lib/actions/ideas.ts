"use server";

import { assertLongFormAllowed, isLongForm, longFormEnabled } from "@/lib/domain/longform";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { generateIdeas } from "@/lib/ai/generators";
import {
  commercialIntentSchema,
  formatSchema,
  ideaStatusSchema,
  platformSchema,
} from "@/lib/domain/enums";
import { ideaPriority } from "@/lib/domain/scoring";
import { canMoveIdea, WorkflowError } from "@/lib/domain/workflow";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Idea engine mutations.
 *
 * Pattern used by every action in this codebase:
 *   requireOrgAccess -> validate -> write scoped by ctx.org.id -> audit -> revalidate.
 * `orgId` is never read from client input.
 */

const scoreField = z.coerce.number().int("Use a whole number from 0 to 100.").min(0).max(100);

const ideaInputSchema = z.object({
  title: z.string().min(3, "Give the idea a title.").max(240),
  concept: z.string().max(2000).optional(),
  audience: z.string().max(300).optional(),
  painDesire: z.string().max(500).optional(),
  pillar: z.string().max(120).optional(),
  platform: platformSchema.default("linkedin"),
  format: formatSchema.default("short_form"),
  angle: z.string().max(1000).optional(),
  hookConcept: z.string().max(600).optional(),
  objective: z.string().max(200).optional(),
  cta: z.string().max(300).optional(),
  commercialIntent: commercialIntentSchema.default("medium"),
  intendedJob: z.enum(["discovery", "authority", "conversion"]).default("authority"),
  /** Client-supplied idempotency key: two submits of one form make one idea. */
  requestId: z.string().max(80).optional(),
  noveltyScore: scoreField.default(50),
  relevanceScore: scoreField.default(50),
  proofStrength: scoreField.default(50),
  formatFit: scoreField.default(50),
  rationale: z.string().max(1500).optional(),
});

export async function createIdeaAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ideas.create");
    const input = parseForm(ideaInputSchema, formData);
    // ENG-05: long-form is a separately priced module; refuse it unless the client has it.
    {
      const scope = await prisma.organization.findUnique({ where: { id: ctx.org.id }, select: { modulesEnabled: true, name: true } });
      assertLongFormAllowed(input.format, scope?.modulesEnabled, scope?.name);
    }

    if (input.requestId) {
      const already = await prisma.idea.findUnique({ where: { orgId_requestId: { orgId: ctx.org.id, requestId: input.requestId } }, select: { id: true } });
      if (already) return ok({ id: already.id }, "Idea created.");
    }

    let idea;
    try {
      idea = await prisma.idea.create({
      data: {
        orgId: ctx.org.id,
        requestId: input.requestId ?? null,
        intendedJob: input.intendedJob,
        title: cleanText(input.title, 240),
        concept: input.concept ? cleanText(input.concept) : null,
        audience: input.audience ?? null,
        painDesire: input.painDesire ?? null,
        pillar: input.pillar ?? null,
        platform: input.platform,
        format: input.format,
        angle: input.angle ? cleanText(input.angle) : null,
        hookConcept: input.hookConcept ?? null,
        objective: input.objective ?? null,
        cta: input.cta ?? null,
        commercialIntent: input.commercialIntent,
        noveltyScore: input.noveltyScore,
        relevanceScore: input.relevanceScore,
        proofStrength: input.proofStrength,
        formatFit: input.formatFit,
        priorityScore: ideaPriority(input),
        rationale: input.rationale ?? null,
        source: "manual",
        status: "backlog",
        createdById: ctx.user.id,
      },
    });
    } catch (error) {
      // Two submits raced past the lookup; the unique index caught the second.
      if (input.requestId && String(error).includes("Unique")) {
        const winner = await prisma.idea.findUniqueOrThrow({ where: { orgId_requestId: { orgId: ctx.org.id, requestId: input.requestId } }, select: { id: true } });
        return ok({ id: winner.id }, "Idea created.");
      }
      throw error;
    }

    await audit(ctx, {
      action: "idea.create",
      entityType: "idea",
      entityId: idea.id,
      summary: `Created idea "${idea.title}"`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/create/ideas`);

    return ok({ id: idea.id }, "Idea created.");
  });
}

export async function updateIdeaAction(
  orgSlug: string,
  ideaId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ideas.create");
    const input = parseForm(ideaInputSchema, formData);
    // ENG-05: long-form is a separately priced module; refuse it unless the client has it.
    {
      const scope = await prisma.organization.findUnique({ where: { id: ctx.org.id }, select: { modulesEnabled: true, name: true } });
      assertLongFormAllowed(input.format, scope?.modulesEnabled, scope?.name);
    }

    const existing = await prisma.idea.findFirst({
      where: { id: ideaId, orgId: ctx.org.id },
      select: { id: true },
    });
    if (!existing) return err("That idea no longer exists.", "not_found");

    await prisma.idea.update({
      where: { id: ideaId },
      data: {
        title: cleanText(input.title, 240),
        concept: input.concept ? cleanText(input.concept) : null,
        audience: input.audience ?? null,
        painDesire: input.painDesire ?? null,
        pillar: input.pillar ?? null,
        platform: input.platform,
        format: input.format,
        angle: input.angle ? cleanText(input.angle) : null,
        hookConcept: input.hookConcept ?? null,
        objective: input.objective ?? null,
        cta: input.cta ?? null,
        commercialIntent: input.commercialIntent,
        noveltyScore: input.noveltyScore,
        relevanceScore: input.relevanceScore,
        proofStrength: input.proofStrength,
        formatFit: input.formatFit,
        priorityScore: ideaPriority(input),
        rationale: input.rationale ?? null,
      },
    });

    await audit(ctx, {
      action: "idea.update",
      entityType: "idea",
      entityId: ideaId,
      summary: `Updated idea "${input.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/create/ideas/${ideaId}`);
    revalidatePath(`/app/${orgSlug}/create/ideas`);

    return okVoid("Idea saved.");
  });
}

const statusChangeSchema = z.object({
  ideaIds: z.array(z.string().min(1)).min(1).max(200),
  status: ideaStatusSchema,
});

/** Status change, used for single items and bulk selections alike. */
export async function setIdeaStatusAction(
  orgSlug: string,
  ideaIds: string[],
  status: string,
): Promise<ActionResult<{ updated: number }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug);
    const input = statusChangeSchema.parse({ ideaIds, status });

    const needsApproval = ["approved", "scripted"].includes(input.status);
    if (needsApproval && !ctx.can("ideas.approve")) {
      return err("Only a workspace admin can approve ideas.", "auth");
    }

    const ideas = await prisma.idea.findMany({
      where: { id: { in: input.ideaIds }, orgId: ctx.org.id },
      select: { id: true, status: true, title: true },
    });

    if (ideas.length === 0) return err("No matching ideas found.", "not_found");

    const illegal = ideas.filter((i) => i.status !== input.status && !canMoveIdea(i.status as never, input.status));
    if (illegal.length > 0) {
      throw new WorkflowError(
        `"${illegal[0]!.title}" cannot move from ${illegal[0]!.status.replace(/_/g, " ")} to ${input.status.replace(/_/g, " ")}.`,
      );
    }

    await prisma.idea.updateMany({
      where: { id: { in: ideas.map((i) => i.id) }, orgId: ctx.org.id },
      data: { status: input.status },
    });

    await audit(ctx, {
      action: "idea.status",
      entityType: "idea",
      entityId: ideas.length === 1 ? ideas[0]!.id : null,
      summary:
        ideas.length === 1
          ? `Moved "${ideas[0]!.title}" to ${input.status}`
          : `Moved ${ideas.length} ideas to ${input.status}`,
      meta: { status: input.status, count: ideas.length },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}/create/ideas`);
    for (const idea of ideas) revalidatePath(`/app/${orgSlug}/create/ideas/${idea.id}`);

    return ok(
      { updated: ideas.length },
      ideas.length === 1 ? "Idea updated." : `${ideas.length} ideas updated.`,
    );
  });
}

export async function deleteIdeaAction(orgSlug: string, ideaId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ideas.approve");

    const idea = await prisma.idea.findFirst({
      where: { id: ideaId, orgId: ctx.org.id },
      include: { _count: { select: { scripts: true, contentItems: true } } },
    });
    if (!idea) return err("That idea no longer exists.", "not_found");

    if (idea._count.scripts > 0 || idea._count.contentItems > 0) {
      return err(
        "This idea has produced a script or content. Archive it instead so the lineage is preserved.",
        "workflow",
      );
    }

    await prisma.idea.delete({ where: { id: ideaId } });
    await audit(ctx, {
      action: "idea.delete",
      entityType: "idea",
      entityId: ideaId,
      summary: `Deleted idea "${idea.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/create/ideas`);

    return okVoid("Idea deleted.");
  });
}

const generateSchema = z.object({
  count: z.coerce.number().int().min(1).max(12).default(6),
  steer: z.string().max(500).optional(),
});

export async function generateIdeasAction(
  orgSlug: string,
  _prev: ActionResult<{ created: number; isDemo: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ created: number; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ai.generate");
    await enforceRateLimit(`ai:${ctx.org.id}`, LIMITS.aiGeneration);

    const input = parseForm(generateSchema, formData);

    const generated = await generateIdeas({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      count: input.count,
      steer: input.steer,
    });
    const meta = generated.meta;
    // ENG-05: without the long-form module, a generated long-form idea is kept as a short one
    // rather than quietly adding long-form work to the retainer.
    const modules = (await prisma.organization.findUnique({ where: { id: ctx.org.id }, select: { modulesEnabled: true } }))?.modulesEnabled;
    const ideas = generated.ideas.map((i) => (isLongForm(i.format) && !longFormEnabled(modules) ? { ...i, format: "short_form" } : i));

    const created = await prisma.$transaction(
      ideas.map((idea) =>
        prisma.idea.create({
          data: {
            orgId: ctx.org.id,
            title: cleanText(idea.title, 240),
            concept: cleanText(idea.concept),
            audience: idea.audience || null,
            painDesire: idea.painDesire || null,
            pillar: idea.pillar || null,
            platform: idea.platform,
            format: idea.format,
            angle: idea.angle || null,
            hookConcept: idea.hookConcept || null,
            objective: idea.objective || null,
            cta: idea.cta || null,
            commercialIntent: idea.commercialIntent,
            noveltyScore: Math.round(idea.noveltyScore),
            relevanceScore: Math.round(idea.relevanceScore),
            proofStrength: Math.round(idea.proofStrength),
            formatFit: Math.round(idea.formatFit),
            priorityScore: ideaPriority(idea),
            rationale: idea.rationale || null,
            pesto: idea.pesto ?? null,
            funnelRole: idea.funnelRole ?? null,
            source: "ai",
            status: "backlog",
            createdById: ctx.user.id,
          },
        }),
      ),
    );

    await audit(ctx, {
      action: "idea.generate",
      entityType: "idea",
      summary: `Generated ${created.length} ideas${meta.isDemo ? " (demo mode)" : ""}`,
      meta: { count: created.length, provider: meta.provider, model: meta.model },
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/create/ideas`);

    return ok(
      { created: created.length, isDemo: meta.isDemo },
      `${created.length} ideas added to the backlog.`,
    );
  });
}

/** Link an idea to the research that justified it. */
export async function linkIdeaEvidenceAction(
  orgSlug: string,
  ideaId: string,
  researchItemIds: string[],
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ideas.create");

    const [idea, research] = await Promise.all([
      prisma.idea.findFirst({ where: { id: ideaId, orgId: ctx.org.id }, select: { id: true } }),
      prisma.researchItem.findMany({
        where: { id: { in: researchItemIds }, orgId: ctx.org.id },
        select: { id: true },
      }),
    ]);

    if (!idea) return err("That idea no longer exists.", "not_found");

    await prisma.ideaEvidence.deleteMany({ where: { ideaId } });
    if (research.length > 0) {
      await prisma.ideaEvidence.createMany({
        data: research.map((r) => ({ ideaId, researchItemId: r.id })),
      });
    }

    await audit(ctx, {
      action: "idea.evidence",
      entityType: "idea",
      entityId: ideaId,
      summary: `Linked ${research.length} research items to an idea`,
    });
    revalidatePath(`/app/${orgSlug}/create/ideas/${ideaId}`);

    return okVoid("Evidence updated.");
  });
}
