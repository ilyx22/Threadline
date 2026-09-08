import "server-only";
import { prisma } from "@/lib/db/client";

/** Signal engine repository. */

export type PatternFilters = {
  kind?: string[];
  status?: string[];
  search?: string;
};

export async function listPatterns(orgId: string, filters: PatternFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.kind?.length) where.kind = { in: filters.kind };
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  return prisma.pattern.findMany({
    where,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { evidence: true, ideas: true } },
    },
  });
}

export type PatternListItem = Awaited<ReturnType<typeof listPatterns>>[number];

export async function getPattern(orgId: string, id: string) {
  return prisma.pattern.findFirst({
    where: { id, orgId },
    include: {
      evidence: {
        include: {
          researchItem: { select: { id: true, title: true, kind: true, url: true, body: true } },
          contentItem: {
            select: {
              id: true,
              title: true,
              stage: true,
              publishRecords: {
                where: { status: "published" },
                select: {
                  url: true,
                  platform: true,
                  snapshots: { orderBy: { capturedAt: "desc" }, take: 1, select: { views: true } },
                },
              },
            },
          },
        },
      },
      ideas: {
        select: { id: true, title: true, status: true, priorityScore: true },
        orderBy: { priorityScore: "desc" },
      },
      // Provenance in both directions: the signal a test came from, the tests a
      // signal produced, and the intelligence cycle that started the chain.
      derivedFrom: { select: { id: true, title: true, kind: true, status: true } },
      derived: {
        select: {
          id: true,
          title: true,
          kind: true,
          status: true,
          score: true,
          successMetric: true,
          feedbackNote: true,
        },
        orderBy: [{ rank: "asc" }, { score: "desc" }],
      },
      run: { select: { id: true, label: true, status: true } },
    },
  });
}

export type PatternDetail = NonNullable<Awaited<ReturnType<typeof getPattern>>>;

export async function patternCounts(orgId: string) {
  const rows = await prisma.pattern.groupBy({
    by: ["kind"],
    where: { orgId, status: { not: "archived" } },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.kind] = row._count._all;
  return counts;
}

/** Validated learnings, fed into idea generation and the weekly report. */
export async function activeLearnings(orgId: string, limit = 10) {
  return prisma.pattern.findMany({
    where: { orgId, kind: "learning", status: { in: ["validated", "open"] } },
    orderBy: { score: "desc" },
    take: limit,
  });
}

/** Open tests awaiting a read. */
export async function runningTests(orgId: string) {
  return prisma.pattern.findMany({
    where: { orgId, kind: "test", status: "testing" },
    orderBy: { updatedAt: "asc" },
    include: { _count: { select: { evidence: true } } },
  });
}
