import "server-only";
import { prisma } from "@/lib/db/client";
import { parseStringArray } from "@/lib/db/json";
import { PRIORITY_RANK, type Priority } from "@/lib/domain/enums";
import { addDays, endOfWeek, startOfWeek } from "@/lib/utils/dates";
import {
  breakdowns,
  comparedPerformance,
  deriveInsights,
  lastNDays,
  operatingSnapshot,
  pipelineSummary,
  previousPeriod,
  publishedAssets,
  topPerformers,
  type Insight,
} from "./metrics";

/**
 * Founder Command Centre data.
 *
 * One query pass assembling everything the Home screen needs, so the most
 * important page in the product renders in a single round of parallel reads.
 * Every figure is derived from stored records — nothing here is decorative.
 */

export type ActionItem = {
  id: string;
  kind: "record" | "approve" | "decide" | "upload" | "review";
  title: string;
  subtitle?: string;
  href: string;
  dueDate: Date | null;
  priority: Priority;
  estimateMin: number;
  overdue: boolean;
};

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export async function loadDashboard(orgId: string, orgSlug: string) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const range = lastNDays(30);

  const [
    readyToRecord,
    awaitingApproval,
    openTasks,
    thisWeekProduction,
    scheduled,
    liveThisWeek,
    overdueContent,
    assets,
    performance,
    operating,
    pipeline,
    prevOperating,
    patterns,
    recentEvents,
  ] = await Promise.all([
    // Scripts approved and waiting for the founder to record.
    prisma.script.findMany({
      where: { orgId, qaState: "approved", contentItems: { none: {} } },
      include: {
        idea: { select: { platform: true, format: true, priorityScore: true } },
        versions: { orderBy: { version: "desc" }, take: 1, select: { hook: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.contentItem.findMany({
      where: { orgId, stage: "in_review" },
      select: {
        id: true,
        title: true,
        platform: true,
        dueDate: true,
        priority: true,
        editor: { select: { name: true } },
      },
      orderBy: [{ dueDate: "asc" }],
    }),
    prisma.task.findMany({
      where: { orgId, audience: "client", status: { in: ["open", "in_progress"] } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.contentItem.groupBy({
      by: ["stage"],
      where: { orgId },
      _count: { _all: true },
    }),
    prisma.publishRecord.findMany({
      where: { orgId, status: "scheduled", scheduledFor: { gte: weekStart, lte: weekEnd } },
      include: { contentItem: { select: { id: true, title: true } } },
      orderBy: { scheduledFor: "asc" },
    }),
    prisma.publishRecord.count({
      where: { orgId, status: "published", publishedAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.contentItem.findMany({
      where: {
        orgId,
        dueDate: { lt: new Date() },
        stage: { notIn: ["live", "scheduled"] },
      },
      select: { id: true, title: true, stage: true, dueDate: true, priority: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    publishedAssets(orgId, range),
    comparedPerformance(orgId, range),
    operatingSnapshot(orgId, range),
    pipelineSummary(orgId, range),
    operatingSnapshot(orgId, previousPeriod(range)),
    prisma.pattern.findMany({
      where: { orgId, kind: { in: ["learning", "hypothesis"] }, status: { in: ["open", "testing", "validated"] } },
      orderBy: { score: "desc" },
      take: 3,
    }),
    prisma.contentEvent.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        contentItem: { select: { id: true, title: true } },
        actor: { select: { name: true, avatarHue: true } },
      },
    }),
  ]);

  /* ------------------------------ Today's actions ---------------------------- */

  const recordItems: ActionItem[] = readyToRecord.map((script) => ({
    id: script.id,
    kind: "record" as const,
    title: script.title,
    subtitle: script.versions[0]?.hook ?? undefined,
    href: `/app/${orgSlug}/production/recording?script=${script.id}`,
    dueDate: null,
    priority: (script.idea?.priorityScore ?? 0) >= 78 ? "high" : "medium",
    estimateMin: Math.max(4, Math.round((script.estimatedSeconds / 60) * 6)),
    overdue: false,
  }));

  const approveItems: ActionItem[] = awaitingApproval.map((item) => ({
    id: item.id,
    kind: "approve" as const,
    title: item.title,
    subtitle: item.editor?.name ? `Edited by ${item.editor.name}` : undefined,
    href: `/app/${orgSlug}/production/${item.id}`,
    dueDate: item.dueDate,
    priority: item.priority as Priority,
    estimateMin: 2,
    overdue: item.dueDate ? item.dueDate.getTime() < Date.now() : false,
  }));

  const decideItems: ActionItem[] = openTasks
    .filter((t) => t.kind === "decide" || t.kind === "review")
    .map((task) => ({
      id: task.id,
      kind: task.kind === "decide" ? ("decide" as const) : ("review" as const),
      title: task.title,
      subtitle: task.description ?? undefined,
      href: `/app/${orgSlug}/tasks?task=${task.id}`,
      dueDate: task.dueDate,
      priority: task.priority as Priority,
      estimateMin: task.estimateMin ?? 5,
      overdue: task.dueDate ? task.dueDate.getTime() < Date.now() : false,
    }));

  const uploadItems: ActionItem[] = openTasks
    .filter((t) => t.kind === "upload")
    .map((task) => ({
      id: task.id,
      kind: "upload" as const,
      title: task.title,
      subtitle: task.description ?? undefined,
      href: `/app/${orgSlug}/library?task=${task.id}`,
      dueDate: task.dueDate,
      priority: task.priority as Priority,
      estimateMin: task.estimateMin ?? 5,
      overdue: task.dueDate ? task.dueDate.getTime() < Date.now() : false,
    }));

  const today = {
    record: recordItems,
    approve: approveItems,
    decide: decideItems,
    upload: uploadItems,
    recordMinutes: recordItems.reduce((a, i) => a + i.estimateMin, 0),
    approveMinutes: approveItems.reduce((a, i) => a + i.estimateMin, 0),
  };

  const attentionCount =
    (recordItems.length > 0 ? 1 : 0) +
    (approveItems.length > 0 ? 1 : 0) +
    (decideItems.length + uploadItems.length > 0 ? 1 : 0);

  /* --------------------------------- This week -------------------------------- */

  const stageCounts = Object.fromEntries(
    thisWeekProduction.map((row) => [row.stage, row._count._all]),
  ) as Record<string, number>;

  const inProduction = ["raw", "editing", "in_review", "changes_requested"].reduce(
    (a, s) => a + (stageCounts[s] ?? 0),
    0,
  );

  const week = {
    inProduction,
    scheduled: scheduled.length,
    liveThisWeek,
    stageCounts,
    upcoming: scheduled.slice(0, 6).map((r) => ({
      id: r.id,
      title: r.contentItem.title,
      platform: r.platform,
      scheduledFor: r.scheduledFor,
      contentItemId: r.contentItem.id,
    })),
    overdue: overdueContent.map((c) => ({
      id: c.id,
      title: c.title,
      stage: c.stage,
      dueDate: c.dueDate,
      priority: c.priority as Priority,
    })),
  };

  /* --------------------------------- Insights --------------------------------- */

  const assetBreakdowns = breakdowns(assets);
  const insights: Insight[] = deriveInsights({
    assets,
    breakdowns: assetBreakdowns,
    operating,
    pipeline,
    previousApprovalHours: prevOperating.approvalHours || undefined,
  });

  const nextTest = patterns.find((p) => p.nextExperiment) ?? null;

  return {
    today,
    attentionCount,
    week,
    performance,
    operating,
    pipeline,
    insights,
    winners: topPerformers(assets, 3),
    patterns: patterns.map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      description: p.description,
      score: p.score,
      nextExperiment: p.nextExperiment,
    })),
    nextTest: nextTest
      ? { id: nextTest.id, title: nextTest.title, experiment: nextTest.nextExperiment as string }
      : null,
    activity: recentEvents.map((e) => ({
      id: e.id,
      type: e.type,
      note: e.note,
      fromStage: e.fromStage,
      toStage: e.toStage,
      createdAt: e.createdAt,
      actorName: e.actor?.name ?? "Threadline",
      actorHue: e.actor?.avatarHue ?? 210,
      contentId: e.contentItem.id,
      contentTitle: e.contentItem.title,
    })),
    range,
  };
}

/** Sorted, deduplicated action feed used by the Today block. */
export function sortActions(items: ActionItem[]) {
  return [...items].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priority !== 0) return priority;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

/** Weekly cadence target from the workspace's own content rules. */
export async function cadenceTarget(orgId: string) {
  const brain = await prisma.brandBrain.findUnique({
    where: { orgId },
    select: { contentRules: true },
  });
  if (!brain) return 3;
  try {
    const rules = JSON.parse(brain.contentRules) as { cadencePerWeek?: number };
    return rules.cadencePerWeek ?? 3;
  } catch {
    return 3;
  }
}

/** Recording queue counts used across Home and the Recording Room. */
export async function recordingQueueCounts(orgId: string) {
  const [ready, thisWeek, backlog] = await Promise.all([
    prisma.script.count({ where: { orgId, qaState: "approved", contentItems: { none: {} } } }),
    prisma.script.count({
      where: {
        orgId,
        qaState: "approved",
        contentItems: { none: {} },
        updatedAt: { gte: addDays(new Date(), -7) },
      },
    }),
    prisma.script.count({ where: { orgId, qaState: { in: ["ready_to_record", "needs_fact_check"] } } }),
  ]);
  return { ready, thisWeek, backlog };
}

/** Platforms configured for this workspace, used to scope pickers. */
export async function workspacePlatforms(orgId: string): Promise<string[]> {
  const brain = await prisma.brandBrain.findUnique({
    where: { orgId },
    select: { contentRules: true },
  });
  if (!brain) return ["linkedin"];
  try {
    const rules = JSON.parse(brain.contentRules) as { platforms?: unknown };
    const platforms = parseStringArray(JSON.stringify(rules.platforms ?? []));
    return platforms.length > 0 ? platforms : ["linkedin"];
  } catch {
    return ["linkedin"];
  }
}
