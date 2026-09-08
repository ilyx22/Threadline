import "server-only";
import { prisma } from "@/lib/db/client";

/**
 * Idea repository. Every function is scoped by an `orgId` that must originate
 * from an AuthContext — no function here accepts a caller-supplied organisation.
 */

export type IdeaFilters = {
  status?: string[];
  platform?: string[];
  format?: string[];
  pillar?: string[];
  commercialIntent?: string[];
  source?: string[];
  search?: string;
  sort?: "priority" | "recent" | "title" | "novelty";
};

export async function listIdeas(orgId: string, filters: IdeaFilters = {}) {
  const where: Record<string, unknown> = { orgId };

  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.platform?.length) where.platform = { in: filters.platform };
  if (filters.format?.length) where.format = { in: filters.format };
  if (filters.pillar?.length) where.pillar = { in: filters.pillar };
  if (filters.commercialIntent?.length) where.commercialIntent = { in: filters.commercialIntent };
  if (filters.source?.length) where.source = { in: filters.source };

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q } },
      { concept: { contains: q } },
      { angle: { contains: q } },
      { hookConcept: { contains: q } },
      { painDesire: { contains: q } },
    ];
  }

  const orderBy =
    filters.sort === "recent"
      ? [{ createdAt: "desc" as const }]
      : filters.sort === "title"
        ? [{ title: "asc" as const }]
        : filters.sort === "novelty"
          ? [{ noveltyScore: "desc" as const }]
          : [{ priorityScore: "desc" as const }, { createdAt: "desc" as const }];

  return prisma.idea.findMany({
    where,
    orderBy,
    include: {
      pattern: { select: { id: true, title: true, kind: true } },
      createdBy: { select: { name: true, avatarHue: true } },
      _count: { select: { evidence: true, scripts: true } },
    },
  });
}

export type IdeaListItem = Awaited<ReturnType<typeof listIdeas>>[number];

export async function getIdea(orgId: string, ideaId: string) {
  return prisma.idea.findFirst({
    where: { id: ideaId, orgId },
    include: {
      pattern: { select: { id: true, title: true, kind: true, description: true } },
      createdBy: { select: { name: true, avatarHue: true } },
      evidence: {
        include: {
          researchItem: {
            select: { id: true, title: true, kind: true, url: true, sourceName: true, body: true },
          },
        },
      },
      scripts: {
        select: { id: true, title: true, qaState: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
      },
      contentItems: {
        select: { id: true, title: true, stage: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type IdeaDetail = NonNullable<Awaited<ReturnType<typeof getIdea>>>;

export async function ideaCounts(orgId: string) {
  const rows = await prisma.idea.groupBy({
    by: ["status"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

/** Distinct pillars actually in use, for filter options. */
export async function ideaPillars(orgId: string) {
  const rows = await prisma.idea.findMany({
    where: { orgId, pillar: { not: null } },
    select: { pillar: true },
    distinct: ["pillar"],
  });
  return rows.map((r) => r.pillar).filter((p): p is string => Boolean(p)).sort();
}

/** Ideas approved and not yet scripted — the scripting queue. */
export async function scriptingQueue(orgId: string) {
  return prisma.idea.findMany({
    where: { orgId, status: "approved" },
    orderBy: { priorityScore: "desc" },
    select: {
      id: true,
      title: true,
      platform: true,
      format: true,
      angle: true,
      hookConcept: true,
      cta: true,
      priorityScore: true,
    },
  });
}
