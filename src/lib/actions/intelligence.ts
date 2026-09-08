"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { resolveTags } from "@/lib/data/research";
import { stringify } from "@/lib/db/json";
import {
  patternKindSchema,
  patternStatusSchema,
  researchKindSchema,
} from "@/lib/domain/enums";
import { patternScore } from "@/lib/domain/scoring";
import {
  cleanText,
  cleanUrl,
  commaField,
  err,
  guarded,
  ok,
  okVoid,
  parseForm,
  type ActionResult,
} from "./shared";

/** Market Radar and Signal Engine mutations. */

/* ------------------------------- Research items ------------------------------ */

const researchSchema = z.object({
  kind: researchKindSchema,
  title: z.string().min(3, "Give this a title.").max(300),
  body: z.string().max(8000).optional(),
  url: z.string().max(600).optional(),
  sourceName: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  platform: z.string().max(60).optional(),
  competitorId: z.string().optional(),
  tags: commaField,
  views: z.coerce.number().int().min(0).optional(),
  likes: z.coerce.number().int().min(0).optional(),
  comments: z.coerce.number().int().min(0).optional(),
});

export async function createResearchItemAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "research.edit");
    const input = parseForm(researchSchema, formData);

    if (input.competitorId) {
      const competitor = await prisma.competitor.findFirst({
        where: { id: input.competitorId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!competitor) return err("That competitor is not in this workspace.", "validation");
    }

    const metrics: Record<string, number> = {};
    if (input.views != null) metrics.views = input.views;
    if (input.likes != null) metrics.likes = input.likes;
    if (input.comments != null) metrics.comments = input.comments;

    const item = await prisma.researchItem.create({
      data: {
        orgId: ctx.org.id,
        kind: input.kind,
        title: cleanText(input.title, 300),
        body: input.body ? cleanText(input.body) : null,
        url: cleanUrl(input.url),
        sourceName: input.sourceName ?? null,
        author: input.author ?? null,
        platform: input.platform ?? null,
        competitorId: input.competitorId ?? null,
        metrics: stringify(metrics),
        collectedVia: input.url ? "url" : "manual",
      },
    });

    if (input.tags.length > 0) {
      const tags = await resolveTags(ctx.org.id, input.tags);
      await prisma.researchItemTag.createMany({
        data: tags.map((tag) => ({ researchItemId: item.id, tagId: tag.id })),
      });
    }

    await audit(ctx, {
      action: "research.create",
      entityType: "research_item",
      entityId: item.id,
      summary: `Captured research: "${item.title}"`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return ok({ id: item.id }, "Research captured.");
  });
}

export async function updateResearchItemAction(
  orgSlug: string,
  itemId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "research.edit");
    const input = parseForm(researchSchema, formData);

    const existing = await prisma.researchItem.findFirst({
      where: { id: itemId, orgId: ctx.org.id },
      select: { id: true },
    });
    if (!existing) return err("That research item no longer exists.", "not_found");

    const metrics: Record<string, number> = {};
    if (input.views != null) metrics.views = input.views;
    if (input.likes != null) metrics.likes = input.likes;
    if (input.comments != null) metrics.comments = input.comments;

    await prisma.researchItem.update({
      where: { id: itemId },
      data: {
        kind: input.kind,
        title: cleanText(input.title, 300),
        body: input.body ? cleanText(input.body) : null,
        url: cleanUrl(input.url),
        sourceName: input.sourceName ?? null,
        author: input.author ?? null,
        platform: input.platform ?? null,
        competitorId: input.competitorId ?? null,
        metrics: stringify(metrics),
      },
    });

    await prisma.researchItemTag.deleteMany({ where: { researchItemId: itemId } });
    if (input.tags.length > 0) {
      const tags = await resolveTags(ctx.org.id, input.tags);
      await prisma.researchItemTag.createMany({
        data: tags.map((tag) => ({ researchItemId: itemId, tagId: tag.id })),
      });
    }

    await audit(ctx, {
      action: "research.update",
      entityType: "research_item",
      entityId: itemId,
      summary: `Updated research: "${input.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return okVoid("Research updated.");
  });
}

export async function deleteResearchItemAction(
  orgSlug: string,
  itemId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "research.edit");
    const item = await prisma.researchItem.findFirst({
      where: { id: itemId, orgId: ctx.org.id },
      include: { _count: { select: { ideaLinks: true, evidenceFor: true } } },
    });
    if (!item) return err("That research item no longer exists.", "not_found");

    if (item._count.ideaLinks > 0 || item._count.evidenceFor > 0) {
      return err(
        "This research is cited as evidence by an idea or a signal. Removing it would break the lineage trail.",
        "workflow",
      );
    }

    await prisma.researchItem.delete({ where: { id: itemId } });
    await audit(ctx, {
      action: "research.delete",
      entityType: "research_item",
      entityId: itemId,
      summary: `Deleted research: "${item.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return okVoid("Research item deleted.");
  });
}

/* -------------------------------- Competitors -------------------------------- */

const competitorSchema = z.object({
  name: z.string().min(2, "Give the competitor a name.").max(200),
  url: z.string().max(600).optional(),
  positioning: z.string().max(1000).optional(),
  notes: z.string().max(4000).optional(),
  threatLevel: z.enum(["low", "medium", "high"]).default("medium"),
  platforms: commaField,
});

export async function saveCompetitorAction(
  orgSlug: string,
  competitorId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "research.edit");
    const input = parseForm(competitorSchema, formData);

    const data = {
      name: cleanText(input.name, 200),
      url: cleanUrl(input.url),
      positioning: input.positioning ?? null,
      notes: input.notes ? cleanText(input.notes) : null,
      threatLevel: input.threatLevel,
      platforms: stringify(input.platforms),
    };

    let id = competitorId;
    if (competitorId) {
      const existing = await prisma.competitor.findFirst({
        where: { id: competitorId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!existing) return err("That competitor no longer exists.", "not_found");
      await prisma.competitor.update({ where: { id: competitorId }, data });
    } else {
      const created = await prisma.competitor.create({ data: { ...data, orgId: ctx.org.id } });
      id = created.id;
    }

    await audit(ctx, {
      action: competitorId ? "competitor.update" : "competitor.create",
      entityType: "competitor",
      entityId: id,
      summary: `${competitorId ? "Updated" : "Added"} competitor "${input.name}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return ok({ id: id as string }, competitorId ? "Competitor updated." : "Competitor added.");
  });
}

export async function deleteCompetitorAction(
  orgSlug: string,
  competitorId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "research.edit");
    const competitor = await prisma.competitor.findFirst({
      where: { id: competitorId, orgId: ctx.org.id },
      select: { id: true, name: true },
    });
    if (!competitor) return err("That competitor no longer exists.", "not_found");

    // Research captured about them survives; it simply loses the association.
    await prisma.competitor.delete({ where: { id: competitorId } });
    await audit(ctx, {
      action: "competitor.delete",
      entityType: "competitor",
      entityId: competitorId,
      summary: `Removed competitor "${competitor.name}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return okVoid("Competitor removed. Research items were kept.");
  });
}

/* ---------------------------------- Patterns --------------------------------- */

const patternSchema = z.object({
  kind: patternKindSchema,
  title: z.string().min(3, "Give the signal a title.").max(300),
  description: z.string().max(4000).optional(),
  status: patternStatusSchema.default("open"),
  confidence: z.coerce.number().min(0).max(100).default(50),
  impact: z.coerce.number().min(1).max(5).default(3),
  effort: z.coerce.number().min(1).max(5).default(3),
  nextExperiment: z.string().max(1000).optional(),
});

export async function savePatternAction(
  orgSlug: string,
  patternId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    const input = parseForm(patternSchema, formData);

    const data = {
      kind: input.kind,
      title: cleanText(input.title, 300),
      description: input.description ? cleanText(input.description) : null,
      status: input.status,
      confidence: Math.round(input.confidence),
      impact: Math.round(input.impact),
      effort: Math.round(input.effort),
      score: patternScore(input),
      nextExperiment: input.nextExperiment ?? null,
    };

    let id = patternId;
    if (patternId) {
      const existing = await prisma.pattern.findFirst({
        where: { id: patternId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!existing) return err("That signal no longer exists.", "not_found");
      await prisma.pattern.update({ where: { id: patternId }, data });
    } else {
      const created = await prisma.pattern.create({
        data: { ...data, orgId: ctx.org.id, detectedBy: "manual" },
      });
      id = created.id;
    }

    await audit(ctx, {
      action: patternId ? "pattern.update" : "pattern.create",
      entityType: "pattern",
      entityId: id,
      summary: `${patternId ? "Updated" : "Created"} signal "${input.title}"`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);
    if (id) revalidatePath(`/app/${orgSlug}/intelligence/signals/${id}`);

    return ok({ id: id as string }, patternId ? "Signal updated." : "Signal created.");
  });
}

export async function setPatternStatusAction(
  orgSlug: string,
  patternId: string,
  status: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    const target = patternStatusSchema.parse(status);

    const pattern = await prisma.pattern.findFirst({
      where: { id: patternId, orgId: ctx.org.id },
      select: { id: true, title: true, status: true },
    });
    if (!pattern) return err("That signal no longer exists.", "not_found");

    await prisma.pattern.update({ where: { id: patternId }, data: { status: target } });
    await audit(ctx, {
      action: "pattern.status",
      entityType: "pattern",
      entityId: patternId,
      summary: `Moved signal "${pattern.title}" to ${target}`,
      meta: { from: pattern.status, to: target },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);
    revalidatePath(`/app/${orgSlug}/intelligence/signals/${patternId}`);

    return okVoid("Signal updated.");
  });
}

/** Promote a signal into an idea, carrying the evidence trail forward. */
export async function promotePatternToIdeaAction(
  orgSlug: string,
  patternId: string,
): Promise<ActionResult<{ ideaId: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "ideas.create");

    const pattern = await prisma.pattern.findFirst({
      where: { id: patternId, orgId: ctx.org.id },
      include: { evidence: { select: { researchItemId: true } } },
    });
    if (!pattern) return err("That signal no longer exists.", "not_found");

    const idea = await prisma.idea.create({
      data: {
        orgId: ctx.org.id,
        title: pattern.title,
        concept: pattern.description,
        angle: pattern.nextExperiment,
        patternId: pattern.id,
        source: "learning",
        status: "shortlisted",
        // Confidence in the signal is real evidence of relevance.
        relevanceScore: Math.min(100, pattern.confidence + 15),
        noveltyScore: 60,
        proofStrength: pattern.evidence.length > 0 ? 70 : 45,
        formatFit: 60,
        priorityScore: 0,
        createdById: ctx.user.id,
      },
    });

    const researchIds = pattern.evidence
      .map((e) => e.researchItemId)
      .filter((id): id is string => Boolean(id));

    if (researchIds.length > 0) {
      await prisma.ideaEvidence.createMany({
        data: researchIds.map((researchItemId) => ({ ideaId: idea.id, researchItemId })),
      });
    }

    // Recompute the derived priority now that the components are set.
    const { ideaPriority } = await import("@/lib/domain/scoring");
    await prisma.idea.update({
      where: { id: idea.id },
      data: {
        priorityScore: ideaPriority({
          relevanceScore: idea.relevanceScore,
          noveltyScore: idea.noveltyScore,
          proofStrength: idea.proofStrength,
          formatFit: idea.formatFit,
          commercialIntent: idea.commercialIntent,
        }),
      },
    });

    await audit(ctx, {
      action: "pattern.promote",
      entityType: "idea",
      entityId: idea.id,
      summary: `Promoted signal "${pattern.title}" into an idea`,
    });
    revalidatePath(`/app/${orgSlug}/create/ideas`);
    revalidatePath(`/app/${orgSlug}/intelligence/signals/${patternId}`);

    return ok({ ideaId: idea.id }, "Idea created from this signal.");
  });
}

export async function addPatternEvidenceAction(
  orgSlug: string,
  patternId: string,
  input: { researchItemIds?: string[]; contentItemIds?: string[]; note?: string },
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");

    const pattern = await prisma.pattern.findFirst({
      where: { id: patternId, orgId: ctx.org.id },
      select: { id: true },
    });
    if (!pattern) return err("That signal no longer exists.", "not_found");

    const [research, content] = await Promise.all([
      prisma.researchItem.findMany({
        where: { id: { in: input.researchItemIds ?? [] }, orgId: ctx.org.id },
        select: { id: true },
      }),
      prisma.contentItem.findMany({
        where: { id: { in: input.contentItemIds ?? [] }, orgId: ctx.org.id },
        select: { id: true },
      }),
    ]);

    const rows = [
      ...research.map((r) => ({ patternId, researchItemId: r.id, note: input.note ?? null })),
      ...content.map((c) => ({ patternId, contentItemId: c.id, note: input.note ?? null })),
    ];

    if (rows.length === 0) return err("Select at least one piece of evidence.", "validation");

    await prisma.patternEvidence.createMany({ data: rows });
    await audit(ctx, {
      action: "pattern.evidence",
      entityType: "pattern",
      entityId: patternId,
      summary: `Added ${rows.length} evidence link${rows.length === 1 ? "" : "s"}`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/signals/${patternId}`);

    return okVoid("Evidence added.");
  });
}

export async function deletePatternAction(orgSlug: string, patternId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    const pattern = await prisma.pattern.findFirst({
      where: { id: patternId, orgId: ctx.org.id },
      include: { _count: { select: { ideas: true } } },
    });
    if (!pattern) return err("That signal no longer exists.", "not_found");
    if (pattern._count.ideas > 0) {
      return err("This signal has produced ideas. Archive it instead so the lineage survives.", "workflow");
    }

    await prisma.pattern.delete({ where: { id: patternId } });
    await audit(ctx, {
      action: "pattern.delete",
      entityType: "pattern",
      entityId: patternId,
      summary: `Deleted signal "${pattern.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);

    return okVoid("Signal deleted.");
  });
}

/* ----------------------------------- Tags ------------------------------------ */

export async function createTagAction(
  orgSlug: string,
  name: string,
  kind: string,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "research.edit");
    const parsed = z.object({ name: z.string().min(1).max(60), kind: z.string().max(40) }).parse({
      name: name.trim().toLowerCase(),
      kind,
    });

    const existing = await prisma.tag.findUnique({
      where: { orgId_name: { orgId: ctx.org.id, name: parsed.name } },
    });
    if (existing) return ok({ id: existing.id }, "That tag already exists.");

    const tag = await prisma.tag.create({
      data: { orgId: ctx.org.id, name: parsed.name, kind: parsed.kind },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return ok({ id: tag.id }, "Tag created.");
  });
}
