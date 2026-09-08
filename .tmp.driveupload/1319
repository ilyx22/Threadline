import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson, parseStringArray } from "@/lib/db/json";
import type { Claim } from "@/lib/domain/workflow";

/** Script repository. Versions are append-only; the latest version is the working copy. */

export type ScriptFilters = {
  qaState?: string[];
  scriptType?: string[];
  platform?: string[];
  search?: string;
};

export async function listScripts(orgId: string, filters: ScriptFilters = {}) {
  const where: Record<string, unknown> = { orgId };
  if (filters.qaState?.length) where.qaState = { in: filters.qaState };
  if (filters.scriptType?.length) where.scriptType = { in: filters.scriptType };
  if (filters.platform?.length) where.platform = { in: filters.platform };
  if (filters.search?.trim()) {
    where.title = { contains: filters.search.trim() };
  }

  const scripts = await prisma.script.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      idea: { select: { id: true, title: true, pillar: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { hook: true, body: true, claims: true, createdAt: true, generatedBy: true },
      },
      contentItems: { select: { id: true, stage: true } },
      _count: { select: { versions: true } },
    },
  });

  return scripts.map((script) => {
    const latest = script.versions[0];
    const claims = parseJson<Claim[]>(latest?.claims, []);
    return {
      ...script,
      latest,
      claims,
      unverifiedClaims: claims.filter((c) => c.status === "unverified").length,
      wordCount: latest?.body ? latest.body.trim().split(/\s+/).length : 0,
    };
  });
}

export type ScriptListItem = Awaited<ReturnType<typeof listScripts>>[number];

export async function getScript(orgId: string, scriptId: string) {
  const script = await prisma.script.findFirst({
    where: { id: scriptId, orgId },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          pillar: true,
          angle: true,
          hookConcept: true,
          cta: true,
          painDesire: true,
          audience: true,
          priorityScore: true,
        },
      },
      versions: {
        orderBy: { version: "desc" },
        include: { createdBy: { select: { name: true, avatarHue: true } } },
      },
      contentItems: { select: { id: true, title: true, stage: true } },
    },
  });

  if (!script) return null;

  const current = script.versions[0];
  return {
    ...script,
    current: current
      ? {
          ...current,
          altHooks: parseStringArray(current.altHooks),
          claims: parseJson<Claim[]>(current.claims, []),
          contextUsed: parseStringArray(current.contextUsed),
        }
      : null,
    history: script.versions.map((v) => ({
      id: v.id,
      version: v.version,
      changeSummary: v.changeSummary,
      generatedBy: v.generatedBy,
      createdAt: v.createdAt,
      authorName: v.createdBy?.name ?? "Threadline",
      authorHue: v.createdBy?.avatarHue ?? 210,
      wordCount: v.body.trim().split(/\s+/).length,
    })),
  };
}

export type ScriptDetail = NonNullable<Awaited<ReturnType<typeof getScript>>>;

export async function getScriptVersion(orgId: string, scriptId: string, version: number) {
  const record = await prisma.scriptVersion.findFirst({
    where: { version, script: { id: scriptId, orgId } },
    include: { createdBy: { select: { name: true } } },
  });
  if (!record) return null;
  return {
    ...record,
    altHooks: parseStringArray(record.altHooks),
    claims: parseJson<Claim[]>(record.claims, []),
    contextUsed: parseStringArray(record.contextUsed),
  };
}

export async function scriptCounts(orgId: string) {
  const rows = await prisma.script.groupBy({
    by: ["qaState"],
    where: { orgId },
    _count: { _all: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.qaState] = row._count._all;
  return counts;
}

/**
 * Scripts approved for recording that have not yet produced a content item.
 * This is the Recording Room queue.
 */
export async function recordingQueue(orgId: string) {
  const scripts = await prisma.script.findMany({
    where: { orgId, qaState: { in: ["approved", "ready_to_record"] }, contentItems: { none: {} } },
    include: {
      idea: { select: { id: true, title: true, priorityScore: true, pillar: true, cta: true } },
      versions: { orderBy: { version: "desc" }, take: 1 },
    },
    orderBy: [{ qaState: "asc" }, { updatedAt: "asc" }],
  });

  return scripts.map((script) => {
    const version = script.versions[0];
    return {
      id: script.id,
      title: script.title,
      scriptType: script.scriptType,
      platform: script.platform,
      qaState: script.qaState,
      estimatedSeconds: script.estimatedSeconds,
      priorityScore: script.idea?.priorityScore ?? 50,
      pillar: script.idea?.pillar ?? null,
      ideaId: script.idea?.id ?? null,
      hook: version?.hook ?? "",
      altHooks: parseStringArray(version?.altHooks),
      body: version?.body ?? "",
      cta: version?.cta ?? script.idea?.cta ?? "",
      filmingNotes: version?.filmingNotes ?? "",
      claims: parseJson<Claim[]>(version?.claims, []),
      updatedAt: script.updatedAt,
    };
  });
}

export type RecordingQueueItem = Awaited<ReturnType<typeof recordingQueue>>[number];

/**
 * Recording time estimate.
 *
 * Spoken duration plus setup and retakes. Founders do not record in one take, so
 * a queue that promised raw script length would be dishonest about the ask.
 */
export function estimateRecordingMinutes(items: { estimatedSeconds: number }[]) {
  if (items.length === 0) return 0;
  const SETUP_MINUTES = 6;
  const RETAKE_FACTOR = 2.8;
  const spoken = items.reduce((a, i) => a + i.estimatedSeconds, 0) / 60;
  return Math.round(SETUP_MINUTES + spoken * RETAKE_FACTOR);
}
