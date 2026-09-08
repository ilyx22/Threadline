import "server-only";
import { prisma } from "@/lib/db/client";
import { parseStringArray } from "@/lib/db/json";
import {
  CHECK_DEFINITIONS,
  READINESS_CHECKS,
  suggestedStatus,
  type ReadinessStatus,
} from "@/lib/domain/readiness";

/** Recording readiness repository. Always org-scoped. */

export async function getReadiness(orgId: string) {
  return prisma.recordingReadiness.findUnique({
    where: { orgId },
    include: {
      reviewedBy: { select: { id: true, name: true } },
      checks: true,
    },
  });
}

export type ReadinessRecord = NonNullable<Awaited<ReturnType<typeof getReadiness>>>;

/**
 * The readiness view, with every check present whether or not it has been
 * assessed. Rendering only the assessed checks would hide the ones nobody has
 * looked at yet, which is the state most worth seeing.
 */
export async function readinessView(orgId: string) {
  const record = await getReadiness(orgId);
  const stored = new Map((record?.checks ?? []).map((c) => [c.key, c]));

  const checks = CHECK_DEFINITIONS.map((definition) => {
    const saved = stored.get(definition.key);
    return {
      ...definition,
      state: saved?.state ?? "unknown",
      note: saved?.note ?? null,
    };
  });

  return {
    record,
    checks,
    formats: parseStringArray(record?.formats),
    status: (record?.status ?? "not_assessed") as ReadinessStatus,
    suggested: suggestedStatus(checks.map((c) => ({ key: c.key, state: c.state }))),
    assessed: checks.filter((c) => c.state !== "unknown").length,
    total: READINESS_CHECKS.length,
  };
}

export type ReadinessView = Awaited<ReturnType<typeof readinessView>>;

/** Compact form for Home, the installation view and the admin client page. */
export async function recordingReadinessSummary(orgId: string) {
  const record = await prisma.recordingReadiness.findUnique({
    where: { orgId },
    select: {
      status: true,
      clientAction: true,
      recommendation: true,
      submittedAt: true,
      reviewedAt: true,
      _count: { select: { checks: true } },
    },
  });
  if (!record) return null;
  return {
    status: record.status,
    clientAction: record.clientAction,
    recommendation: record.recommendation,
    submittedAt: record.submittedAt,
    reviewedAt: record.reviewedAt,
    checksAssessed: record._count.checks,
  };
}

export type ReadinessSummary = NonNullable<Awaited<ReturnType<typeof recordingReadinessSummary>>>;

/** Setup photos and test clips the client has supplied. */
export async function readinessAssets(orgId: string) {
  return prisma.asset.findMany({
    where: { orgId, category: { in: ["setup_photo", "test_clip"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      title: true,
      description: true,
      externalUrl: true,
      storagePath: true,
      fileName: true,
      createdAt: true,
    },
  });
}
