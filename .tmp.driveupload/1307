import "server-only";
import { prisma } from "@/lib/db/client";
import { monthlyEquivalent } from "@/lib/domain/service-period";
import { healthBand, healthScore } from "@/lib/domain/scoring";
import { addDays, daysBetween } from "@/lib/utils/dates";
import { lastNDays, publishedAssets, summarise } from "./metrics";

/**
 * Admin portal repository.
 *
 * These functions intentionally read ACROSS organisations. They are only ever
 * called from routes guarded by `requireInternal()` — a client role can never
 * reach them, because there is no client route that imports this module.
 */

export type ClientRow = Awaited<ReturnType<typeof listClients>>[number];

export async function listClients() {
  const orgs = await prisma.organization.findMany({
    where: { kind: "client" },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { memberships: true, contentItems: true } },
      onboardingSession: { select: { currentStep: true, status: true } },
    },
  });

  const rows = await Promise.all(
    orgs.map(async (org) => {
      const [overdueApprovals, missingRecordings, publishedLast30, target, alerts] = await Promise.all([
        prisma.contentItem.count({
          where: { orgId: org.id, stage: "in_review", dueDate: { lt: new Date() } },
        }),
        prisma.script.count({
          where: { orgId: org.id, qaState: "approved", contentItems: { none: {} } },
        }),
        prisma.publishRecord.count({
          where: { orgId: org.id, status: "published", publishedAt: { gte: addDays(new Date(), -30) } },
        }),
        cadenceTarget(org.id),
        openAlerts(org.id),
      ]);

      const daysSinceActivity = org.lastActivityAt
        ? Math.abs(daysBetween(org.lastActivityAt, new Date()))
        : 99;

      const score = healthScore({
        overdueApprovals,
        missingRecordings,
        daysSinceActivity,
        publishedLast30,
        targetLast30: target * 4,
      });

      return {
        ...org,
        overdueApprovals,
        missingRecordings,
        publishedLast30,
        target: target * 4,
        daysSinceActivity,
        health: score,
        healthBand: healthBand(score),
        alerts,
      };
    }),
  );

  return rows;
}

async function cadenceTarget(orgId: string) {
  const brain = await prisma.brandBrain.findUnique({
    where: { orgId },
    select: { contentRules: true },
  });
  try {
    const rules = JSON.parse(brain?.contentRules ?? "{}") as { cadencePerWeek?: number };
    return rules.cadencePerWeek ?? 3;
  } catch {
    return 3;
  }
}

async function openAlerts(orgId: string) {
  const alerts: { severity: "warning" | "critical"; message: string }[] = [];

  const [staleReview, noRecent, unresolvedIssues] = await Promise.all([
    prisma.contentItem.count({
      where: { orgId, stage: "in_review", updatedAt: { lt: addDays(new Date(), -4) } },
    }),
    prisma.publishRecord.count({
      where: { orgId, status: "published", publishedAt: { gte: addDays(new Date(), -14) } },
    }),
    prisma.supportIssue.count({ where: { orgId, status: { in: ["open", "blocked"] } } }),
  ]);

  if (staleReview > 0) {
    alerts.push({
      severity: staleReview >= 3 ? "critical" : "warning",
      message: `${staleReview} piece${staleReview === 1 ? "" : "s"} waiting on approval for 4+ days`,
    });
  }
  if (noRecent === 0) {
    alerts.push({ severity: "critical", message: "Nothing published in the last 14 days" });
  }
  if (unresolvedIssues > 0) {
    alerts.push({
      severity: "warning",
      message: `${unresolvedIssues} open support issue${unresolvedIssues === 1 ? "" : "s"}`,
    });
  }

  return alerts;
}

export async function getClient(orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, avatarHue: true, lastSeenAt: true } } },
      },
      integrations: true,
      onboardingSession: true,
      brandBrain: { select: { completeness: true, updatedAt: true } },
      _count: {
        select: {
          ideas: true,
          scripts: true,
          contentItems: true,
          researchItems: true,
          publishRecords: true,
          inquiries: true,
        },
      },
    },
  });

  if (!org) return null;

  const range = lastNDays(30);
  const assets = await publishedAssets(orgId, range);

  return { ...org, performance: summarise(assets) };
}

/**
 * Cross-client operator queue.
 *
 * The point of the admin portal: what needs a Threadline operator's attention
 * right now, across every account.
 */
export async function operatorQueue() {
  const [overdueApprovals, blockedProduction, missingRecordings, upcomingReports, staleResearch, issues] =
    await Promise.all([
      prisma.contentItem.findMany({
        where: { stage: "in_review", dueDate: { lt: new Date() } },
        include: { org: { select: { id: true, name: true, slug: true } } },
        orderBy: { dueDate: "asc" },
        take: 25,
      }),
      prisma.contentItem.findMany({
        where: { stage: "changes_requested", updatedAt: { lt: addDays(new Date(), -3) } },
        include: {
          org: { select: { id: true, name: true, slug: true } },
          editor: { select: { name: true } },
        },
        orderBy: { updatedAt: "asc" },
        take: 25,
      }),
      prisma.script.findMany({
        where: { qaState: "approved", contentItems: { none: {} }, updatedAt: { lt: addDays(new Date(), -5) } },
        include: { org: { select: { id: true, name: true, slug: true } } },
        orderBy: { updatedAt: "asc" },
        take: 25,
      }),
      prisma.organization.findMany({
        where: { kind: "client", status: "active" },
        select: {
          id: true,
          name: true,
          slug: true,
          weeklyReports: { orderBy: { periodStart: "desc" }, take: 1, select: { periodStart: true } },
        },
      }),
      prisma.organization.findMany({
        where: {
          kind: "client",
          status: "active",
          researchItems: { none: { capturedAt: { gte: addDays(new Date(), -21) } } },
        },
        select: { id: true, name: true, slug: true },
      }),
      prisma.supportIssue.findMany({
        where: { status: { in: ["open", "blocked"] } },
        include: { org: { select: { name: true, slug: true } }, owner: { select: { name: true } } },
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
        take: 15,
      }),
    ]);

  const reportsDue = upcomingReports.filter((org) => {
    const last = org.weeklyReports[0]?.periodStart;
    if (!last) return true;
    return daysBetween(last, new Date()) >= 7;
  });

  return {
    overdueApprovals,
    blockedProduction,
    missingRecordings,
    reportsDue,
    staleResearch,
    issues,
    total:
      overdueApprovals.length +
      blockedProduction.length +
      missingRecordings.length +
      reportsDue.length +
      issues.length,
  };
}

export async function listSupportIssues(filters: { status?: string[]; severity?: string[] } = {}) {
  const where: Record<string, unknown> = {};
  if (filters.status?.length) where.status = { in: filters.status };
  if (filters.severity?.length) where.severity = { in: filters.severity };

  return prisma.supportIssue.findMany({
    where,
    orderBy: [{ status: "asc" }, { severity: "asc" }, { createdAt: "desc" }],
    include: {
      org: { select: { id: true, name: true, slug: true } },
      owner: { select: { id: true, name: true, avatarHue: true } },
    },
  });
}

export async function listSops(category?: string) {
  return prisma.sopDocument.findMany({
    where: category ? { category } : {},
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: { updatedBy: { select: { name: true } } },
  });
}

export async function getSop(key: string) {
  return prisma.sopDocument.findUnique({
    where: { key },
    include: { updatedBy: { select: { name: true } } },
  });
}

export async function listApplications(status?: string[]) {
  return prisma.application.findMany({
    where: status?.length ? { status: { in: status } } : {},
    orderBy: { createdAt: "desc" },
  });
}

export async function applicationCounts() {
  const rows = await prisma.application.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function internalMetrics(limit = 12) {
  return prisma.internalMetric.findMany({ orderBy: { periodStart: "desc" }, take: limit });
}

/**
 * Portfolio totals shown at the top of the admin dashboard.
 *
 * Synthetic workspaces are excluded from every figure here. A dry run is not a
 * client and its notional fee is not revenue — counting either would put a
 * number on a screen that somebody would eventually repeat out loud.
 */
export async function portfolioSummary() {
  const real = { kind: "client", synthetic: false } as const;

  const [orgs, activeClients, mrr, published30, applications, synthetic] = await Promise.all([
    prisma.organization.count({ where: real }),
    prisma.organization.count({ where: { ...real, status: "active" } }),
    prisma.organization.aggregate({
      where: { ...real, status: "active" },
      _sum: { periodFee: true },
    }),
    prisma.publishRecord.count({
      where: { status: "published", publishedAt: { gte: addDays(new Date(), -30) } },
    }),
    prisma.application.count({ where: { status: "new" } }),
    prisma.organization.count({ where: { kind: "client", synthetic: true } }),
  ]);

  const recurringPerPeriod = mrr._sum.periodFee ?? 0;

  return {
    totalClients: orgs,
    activeClients,
    /** Recurring revenue for one four-week service period. */
    recurringPerPeriodMinor: recurringPerPeriod,
    /**
     * The calendar-monthly equivalent, for comparison against anything genuinely
     * monthly. Thirteen periods a year, not twelve — summing period fees and
     * calling the result MRR is wrong by about 8%.
     */
    mrrEquivalentMinor: monthlyEquivalent(recurringPerPeriod),
    published30,
    newApplications: applications,
    /** Counted separately so the exclusion is visible rather than silent. */
    syntheticWorkspaces: synthetic,
  };
}

export async function listAuditLog(orgId?: string, limit = 60) {
  return prisma.auditLog.findMany({
    where: orgId ? { orgId } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { name: true, avatarHue: true } },
      org: { select: { name: true, slug: true } },
    },
  });
}
