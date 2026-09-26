import "server-only";
import { prisma } from "@/lib/db/client";

/**
 * Reads behind the client experience.
 *
 * Two things live here: what needs the client, and what Threadline is doing
 * while it does not.
 *
 * Every number is a count of persisted records. There is no activity score, no
 * engagement metric and nothing that exists to look busy — if Threadline did
 * nothing this week, this returns zeroes and the screen says so. A progress
 * display that cannot report a quiet week is worthless the first time there is
 * one, because nobody believes it afterwards.
 */

export type WorkItem = {
  key: string;
  label: string;
  count: number;
  /** What the count is actually counting, said precisely enough to check. */
  detail: string;
  href: string | null;
};

export type WorkingOn = {
  stages: WorkItem[];
  total: number;
  /** True when nothing is in flight at all — reported plainly, not padded. */
  idle: boolean;
};

/**
 * What Threadline is working on, right now, for this client.
 *
 * Ordered along the loop so it reads as a pipeline rather than a dashboard:
 * research in, ideas and scripts being made, footage being edited, work
 * scheduled and live.
 */
export async function workingOn(orgId: string, slug: string): Promise<WorkingOn> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);

  const [
    evidenceThisCycle,
    testsRunning,
    ideasInPlay,
    scriptsInDevelopment,
    editing,
    packaging,
    scheduled,
    liveThisWeek,
  ] = await Promise.all([
    // Evidence gathered by whichever cycle is currently open.
    prisma.researchItem.count({
      where: {
        orgId,
        run: { status: { in: ["scoping", "collecting", "synthesis", "review"] } },
      },
    }),
    prisma.pattern.count({ where: { orgId, kind: "test", status: "testing" } }),
    prisma.idea.count({ where: { orgId, status: { in: ["shortlisted", "approved"] } } }),
    prisma.script.count({ where: { orgId, qaState: { in: ["ai_draft", "needs_fact_check"] } } }),
    prisma.contentItem.count({ where: { orgId, stage: { in: ["raw", "editing"] } } }),
    prisma.contentItem.count({ where: { orgId, stage: "approved" } }),
    prisma.contentItem.count({ where: { orgId, stage: "scheduled" } }),
    prisma.publishRecord.count({
      where: { orgId, status: "published", publishedAt: { gte: weekAgo } },
    }),
  ]);

  const base = `/app/${slug}`;
  const stages: WorkItem[] = [
    {
      key: "research",
      label: "Reading your market",
      count: evidenceThisCycle,
      detail: "evidence items collected in the cycle currently running",
      href: null,
    },
    {
      key: "tests",
      label: "Tests running",
      count: testsRunning,
      detail: "content tests with a defined read, waiting on a result",
      href: `${base}/intelligence/runs`,
    },
    {
      key: "ideas",
      label: "Ideas in play",
      count: ideasInPlay,
      detail: "shortlisted or approved, waiting to be scripted",
      href: null,
    },
    {
      key: "scripts",
      label: "Writing scripts",
      count: scriptsInDevelopment,
      detail: "drafted or being fact-checked before they reach you",
      href: null,
    },
    {
      key: "editing",
      label: "Editing",
      count: editing,
      detail: "your footage, with an editor",
      href: `${base}/production`,
    },
    {
      key: "packaging",
      label: "Packaging",
      count: packaging,
      detail: "approved and being prepared per platform",
      href: `${base}/production`,
    },
    {
      key: "scheduled",
      label: "Scheduled",
      count: scheduled,
      detail: "booked into the calendar",
      href: `${base}/distribution`,
    },
    {
      key: "live",
      label: "Published this week",
      count: liveThisWeek,
      detail: "live and collecting performance data",
      href: `${base}/performance`,
    },
  ];

  const total = stages.reduce((sum, s) => sum + s.count, 0);
  return { stages, total, idle: total === 0 };
}

/* --------------------------------- Approvals ------------------------------- */

export type ApprovalItem = {
  id: string;
  kind: "script" | "content" | "package";
  title: string;
  /** What the client is being asked to decide. */
  ask: string;
  context: string | null;
  href: string;
  waitingSince: Date;
  /** Days it has been waiting. Shown once it stops being reasonable. */
  waitingDays: number;
};

/**
 * Everything waiting on a client decision, in one queue.
 *
 * Approvals are scattered across scripts, content and packaging in the operator
 * surface because that is where the work happens. For the client they are one
 * list, because "what needs me" is a single question.
 */
export async function approvalQueue(orgId: string, slug: string): Promise<ApprovalItem[]> {
  const base = `/app/${slug}`;

  const [scripts, content, packages] = await Promise.all([
    prisma.script.findMany({
      where: { orgId, qaState: "ready_to_record" },
      orderBy: { updatedAt: "asc" },
      select: { id: true, title: true, scriptType: true, updatedAt: true, estimatedSeconds: true },
    }),
    prisma.contentItem.findMany({
      where: { orgId, stage: "in_review" },
      orderBy: { updatedAt: "asc" },
      select: {
        id: true,
        title: true,
        platform: true,
        format: true,
        revisionCount: true,
        updatedAt: true,
      },
    }),
    prisma.platformPackage.findMany({
      where: { orgId, status: "ready" },
      orderBy: { updatedAt: "asc" },
      select: {
        id: true,
        platform: true,
        title: true,
        workingTitle: true,
        updatedAt: true,
        contentItem: { select: { id: true, title: true, format: true } },
      },
    }),
  ]);

  const now = Date.now();
  const days = (d: Date) => Math.floor((now - d.getTime()) / 86_400_000);

  return [
    ...scripts.map((s): ApprovalItem => ({
      id: s.id,
      kind: "script",
      title: s.title,
      ask: "Read it and approve, or send it back",
      context: `${s.scriptType.replace(/_/g, " ")} · about ${Math.round(s.estimatedSeconds / 15) * 15}s`,
      href: `${base}/create/scripts/${s.id}`,
      waitingSince: s.updatedAt,
      waitingDays: days(s.updatedAt),
    })),
    ...content.map((c): ApprovalItem => ({
      id: c.id,
      kind: "content",
      title: c.title,
      ask: "Watch the edit and approve, or request changes",
      context:
        c.revisionCount > 0
          ? `${c.platform} · revision ${c.revisionCount}`
          : `${c.platform} · ${c.format.replace(/_/g, " ")}`,
      href: `${base}/production/${c.id}`,
      waitingSince: c.updatedAt,
      waitingDays: days(c.updatedAt),
    })),
    ...packages.map((p): ApprovalItem => ({
      id: p.id,
      kind: "package",
      title: p.title || p.workingTitle || p.contentItem.title,
      ask: "Approve the title, thumbnail and description",
      context: `${p.platform} packaging`,
      href: `${base}/production/${p.contentItem.id}`,
      waitingSince: p.updatedAt,
      waitingDays: days(p.updatedAt),
    })),
  ].sort((a, b) => a.waitingSince.getTime() - b.waitingSince.getTime());
}

/** Counts for the nav badge, without loading the queue itself. */
export async function approvalCount(orgId: string): Promise<number> {
  const [scripts, content, packages] = await Promise.all([
    prisma.script.count({ where: { orgId, qaState: "ready_to_record" } }),
    prisma.contentItem.count({ where: { orgId, stage: "in_review" } }),
    prisma.platformPackage.count({ where: { orgId, status: "ready" } }),
  ]);
  return scripts + content + packages;
}

export type ColleagueWait = { who: string; what: string; count: number; href: string };

/**
 * Work waiting on someone else in the client's team (CX-01): approvals the
 * viewer cannot give (with the names of the people who can), and open tasks
 * assigned to other members. Counted from real records.
 */
export async function waitingOnColleagues(orgId: string, slug: string, viewerId: string, viewerCanApprove: boolean): Promise<ColleagueWait[]> {
  const out: ColleagueWait[] = [];
  if (!viewerCanApprove) {
    const [content, scripts, packages] = await Promise.all([
      prisma.contentItem.count({ where: { orgId, stage: "in_review" } }),
      prisma.script.count({ where: { orgId, qaState: "ready_to_record" } }),
      prisma.platformPackage.count({ where: { orgId, status: "ready" } }),
    ]);
    const pending = content + scripts + packages;
    if (pending) {
      const approvers = await prisma.membership.findMany({
        where: { orgId, status: "active", OR: [{ role: "client_admin" }, { profiles: { contains: '"approver"' } }] },
        select: { user: { select: { name: true } }, contactRole: true },
        orderBy: [{ contactRole: "asc" }],
      });
      const names = approvers.map((a) => a.user.name.split(" ")[0]).slice(0, 3);
      out.push({ who: names.length ? names.join(", ") : "your approver", what: "approvals", count: pending, href: `/app/${slug}/approvals` });
    }
  }
  const tasks = await prisma.task.groupBy({
    by: ["assigneeId"],
    where: { orgId, status: { in: ["open", "in_progress"] }, assigneeId: { not: null }, NOT: { assigneeId: viewerId } },
    _count: { _all: true },
  });
  if (tasks.length) {
    const members = await prisma.membership.findMany({
      where: { orgId, userId: { in: tasks.map((t) => t.assigneeId!) }, role: { in: ["client_admin", "client_member", "editor"] } },
      select: { userId: true, user: { select: { name: true } } },
    });
    for (const t of tasks) {
      const m = members.find((x) => x.userId === t.assigneeId);
      if (m) out.push({ who: m.user.name.split(" ")[0], what: "tasks", count: t._count._all, href: `/app/${slug}/tasks` });
    }
  }
  return out;
}
