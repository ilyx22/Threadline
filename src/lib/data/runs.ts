import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/db/json";
import type { Role } from "@/lib/domain/enums";
import { clientScope, seesOperatorSurface } from "@/lib/domain/visibility";

/**
 * Intelligence run repository.
 *
 * Every function takes an `orgId` that must have come from an `AuthContext`.
 * Nothing here accepts an organisation identifier from client input.
 */

export type RunFilters = { status?: string[]; search?: string };

/**
 * Cycles this caller may see.
 *
 * A client sees published briefs. Working state — half-collected sources,
 * undecided candidates — is the tentative internal thinking the curated surface
 * exists to keep off their screen.
 */
export async function listRuns(orgId: string, role: Role, filters: RunFilters = {}) {
  const where: Record<string, unknown> = { orgId, ...clientScope.runs(role) };
  if (filters.status?.length && seesOperatorSurface(role)) where.status = { in: filters.status };
  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [{ label: { contains: q } }, { focus: { contains: q } }, { summary: { contains: q } }];
  }

  return prisma.intelligenceRun.findMany({
    where,
    orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { sources: true, candidates: true, research: true, patterns: true } },
    },
  });
}

export type RunListItem = Awaited<ReturnType<typeof listRuns>>[number];

/** Briefs the client can read. Working state is never surfaced as a brief. */
export async function publishedRuns(orgId: string, limit = 12) {
  return prisma.intelligenceRun.findMany({
    where: { orgId, status: "published" },
    orderBy: { periodStart: "desc" },
    take: limit,
    include: { _count: { select: { candidates: true, research: true } } },
  });
}

export async function latestPublishedRun(orgId: string) {
  return prisma.intelligenceRun.findFirst({
    where: { orgId, status: "published" },
    orderBy: { periodStart: "desc" },
    include: {
      candidates: {
        where: { decision: "approved" },
        orderBy: { confidence: "desc" },
        include: {
          pattern: { select: { id: true, title: true, kind: true, status: true } },
          evidence: {
            include: {
              researchItem: {
                select: { id: true, title: true, url: true, sourceName: true, kind: true, capturedAt: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getRun(orgId: string, id: string, role: Role) {
  return prisma.intelligenceRun.findFirst({
    where: { id, orgId, ...clientScope.runs(role) },
    include: {
      createdBy: { select: { id: true, name: true } },
      sources: {
        orderBy: [{ createdAt: "asc" }],
        include: { competitor: { select: { id: true, name: true } } },
      },
      candidates: {
        orderBy: [{ decision: "asc" }, { confidence: "desc" }],
        include: {
          decidedBy: { select: { id: true, name: true } },
          pattern: { select: { id: true, title: true, kind: true, status: true, score: true } },
          evidence: {
            include: {
              researchItem: {
                select: {
                  id: true,
                  title: true,
                  body: true,
                  url: true,
                  kind: true,
                  sourceName: true,
                  author: true,
                  platform: true,
                  capturedAt: true,
                  collectedVia: true,
                  sourceMeta: true,
                },
              },
            },
          },
        },
      },
      patterns: {
        where: { kind: "test" },
        orderBy: [{ rank: "asc" }, { score: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          score: true,
          rank: true,
          confidence: true,
          successMetric: true,
          nextExperiment: true,
          derivedFromId: true,
          feedbackNote: true,
          lastFeedbackAt: true,
          _count: { select: { ideas: true } },
        },
      },
      _count: { select: { research: true } },
    },
  });
}

export type RunDetail = NonNullable<Awaited<ReturnType<typeof getRun>>>;

/** Evidence gathered by a run, newest first. */
export async function runEvidence(orgId: string, runId: string) {
  return prisma.researchItem.findMany({
    where: { orgId, runId },
    orderBy: { capturedAt: "desc" },
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      url: true,
      sourceName: true,
      author: true,
      platform: true,
      capturedAt: true,
      collectedVia: true,
      sourceMeta: true,
    },
  });
}

export type RunEvidenceItem = Awaited<ReturnType<typeof runEvidence>>[number];

export function readSourceMeta(value: string | null | undefined) {
  return parseJson<Record<string, unknown>>(value, {});
}

/**
 * Counts used by the run gates. Read fresh inside the action so a decision is
 * never made against a stale page render.
 */
export async function runGateCounts(orgId: string, runId: string) {
  const [sources, resolvedSources, evidenceCount, candidateCount, pendingCandidates, approvedCandidates] =
    await Promise.all([
      prisma.runSource.count({ where: { orgId, runId } }),
      prisma.runSource.count({
        where: { orgId, runId, status: { in: ["collected", "unavailable", "skipped"] } },
      }),
      prisma.researchItem.count({ where: { orgId, runId } }),
      prisma.candidateSignal.count({ where: { orgId, runId } }),
      prisma.candidateSignal.count({ where: { orgId, runId, decision: "pending" } }),
      prisma.candidateSignal.count({ where: { orgId, runId, decision: "approved" } }),
    ]);

  return {
    totalSources: sources,
    resolvedSources,
    evidenceCount,
    candidateCount,
    pendingCandidates,
    approvedCandidates,
  };
}

export async function runCounts(orgId: string) {
  const rows = await prisma.intelligenceRun.groupBy({
    by: ["status"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

/** The run currently being worked on, if any. Only one should be open at a time. */
export async function openRun(orgId: string) {
  return prisma.intelligenceRun.findFirst({
    where: { orgId, status: { in: ["scoping", "collecting", "synthesis", "review"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, status: true, periodStart: true, periodEnd: true },
  });
}

/**
 * Tests derived from approved signals, ranked. Feeds the client-facing "what we
 * are doing because of it" half of the brief.
 */
export async function rankedTests(orgId: string, role: Role, limit = 10) {
  return prisma.pattern.findMany({
    where: {
      orgId,
      kind: "test",
      status: { in: ["open", "testing"] },
      ...clientScope.patterns(role),
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      derivedFrom: { select: { id: true, title: true, kind: true } },
      run: { select: { id: true, label: true } },
      _count: { select: { ideas: true, evidence: true } },
    },
  });
}

export type RankedTest = Awaited<ReturnType<typeof rankedTests>>[number];

/**
 * Performance and commercial results for content descended from a test.
 *
 * The chain is real foreign keys the whole way: test -> idea -> content ->
 * publish record -> snapshots and inquiries. Nothing is inferred by matching
 * titles or dates.
 */
export async function testOutcomes(orgId: string, patternId: string) {
  const ideas = await prisma.idea.findMany({
    where: { orgId, patternId },
    select: {
      id: true,
      title: true,
      contentItems: {
        select: {
          id: true,
          title: true,
          stage: true,
          publishRecords: {
            where: { status: "published" },
            select: {
              id: true,
              platform: true,
              url: true,
              publishedAt: true,
              snapshots: {
                orderBy: { capturedAt: "desc" },
                take: 1,
                select: { views: true, likes: true, comments: true, leads: true },
              },
            },
          },
          inquiries: { select: { id: true, stage: true, valueMinor: true } },
        },
      },
    },
  });

  let views = 0;
  let engagements = 0;
  let published = 0;
  let inquiries = 0;
  let wonValueMinor = 0;

  for (const idea of ideas) {
    for (const item of idea.contentItems) {
      for (const record of item.publishRecords) {
        published += 1;
        const snapshot = record.snapshots[0];
        if (snapshot) {
          views += snapshot.views;
          engagements += snapshot.likes + snapshot.comments;
        }
      }
      for (const inquiry of item.inquiries) {
        inquiries += 1;
        if (inquiry.stage === "won") wonValueMinor += inquiry.valueMinor ?? 0;
      }
    }
  }

  return { ideas: ideas.length, published, views, engagements, inquiries, wonValueMinor };
}
