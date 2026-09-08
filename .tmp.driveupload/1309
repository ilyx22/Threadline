import "server-only";
import { prisma } from "@/lib/db/client";
import { parseNumberRecord } from "@/lib/db/json";

/** Market Radar repository: research items, competitors and tags. */

export type ResearchFilters = {
  kind?: string[];
  tagIds?: string[];
  competitorId?: string;
  platform?: string[];
  search?: string;
  sort?: "recent" | "oldest" | "title";
};

export async function listResearch(orgId: string, filters: ResearchFilters = {}) {
  const where: Record<string, unknown> = { orgId };

  if (filters.kind?.length) where.kind = { in: filters.kind };
  if (filters.competitorId) where.competitorId = filters.competitorId;
  if (filters.platform?.length) where.platform = { in: filters.platform };
  if (filters.tagIds?.length) {
    // AND semantics: an item must carry every selected tag.
    where.AND = filters.tagIds.map((tagId) => ({ tags: { some: { tagId } } }));
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { title: { contains: q } },
      { body: { contains: q } },
      { sourceName: { contains: q } },
      { author: { contains: q } },
    ];
  }

  const orderBy =
    filters.sort === "oldest"
      ? [{ capturedAt: "asc" as const }]
      : filters.sort === "title"
        ? [{ title: "asc" as const }]
        : [{ capturedAt: "desc" as const }];

  const items = await prisma.researchItem.findMany({
    where,
    orderBy,
    include: {
      competitor: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      _count: { select: { evidenceFor: true, ideaLinks: true } },
    },
  });

  return items.map((item) => ({
    ...item,
    metricValues: parseNumberRecord(item.metrics),
    tagList: item.tags.map((t) => t.tag),
  }));
}

export type ResearchListItem = Awaited<ReturnType<typeof listResearch>>[number];

export async function getResearchItem(orgId: string, id: string) {
  const item = await prisma.researchItem.findFirst({
    where: { id, orgId },
    include: {
      competitor: true,
      tags: { include: { tag: true } },
      evidenceFor: { include: { pattern: { select: { id: true, title: true, kind: true } } } },
      ideaLinks: { include: { idea: { select: { id: true, title: true, status: true } } } },
    },
  });
  if (!item) return null;
  return { ...item, metricValues: parseNumberRecord(item.metrics), tagList: item.tags.map((t) => t.tag) };
}

export async function listCompetitors(orgId: string) {
  return prisma.competitor.findMany({
    where: { orgId },
    orderBy: [{ threatLevel: "asc" }, { name: "asc" }],
    include: { _count: { select: { researchItems: true } } },
  });
}

export async function getCompetitor(orgId: string, id: string) {
  return prisma.competitor.findFirst({
    where: { id, orgId },
    include: {
      researchItems: {
        orderBy: { capturedAt: "desc" },
        include: { tags: { include: { tag: true } } },
      },
    },
  });
}

export async function listTags(orgId: string) {
  const tags = await prisma.tag.findMany({
    where: { orgId },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: { _count: { select: { items: true } } },
  });
  return tags.map((t) => ({ ...t, usage: t._count.items }));
}

export async function researchCounts(orgId: string) {
  const rows = await prisma.researchItem.groupBy({
    by: ["kind"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.kind] = row._count._all;
  return counts;
}

/**
 * Find or create tags by name within an organisation.
 * Names are normalised so "Pain", "pain" and " pain " are one tag.
 */
export async function resolveTags(orgId: string, names: string[], kind = "theme") {
  const normalised = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
  if (normalised.length === 0) return [];

  const existing = await prisma.tag.findMany({
    where: { orgId, name: { in: normalised } },
  });
  const existingNames = new Set(existing.map((t) => t.name));
  const missing = normalised.filter((n) => !existingNames.has(n));

  const created = [];
  for (const name of missing) {
    created.push(await prisma.tag.create({ data: { orgId, name, kind } }));
  }

  return [...existing, ...created];
}
