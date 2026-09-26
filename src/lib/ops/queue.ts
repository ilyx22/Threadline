import "server-only";
import { prisma } from "@/lib/db/client";
import { operatorQueue } from "@/lib/data/admin";
import { jobSummary } from "@/lib/jobs";
import { crmBacklog } from "@/lib/crm/outbox";
import { strandedWork } from "@/lib/team/members";

/**
 * One operator work queue (OPS-01). Every source of "a person must act" in one
 * ordered list: each item says what it is, why it is here (cause), who owns
 * it, when it was due or since when it has waited, and the next action, with
 * a link to where that action happens. Severity first, then the oldest.
 */
export type QueueItem = {
  kind: string;
  severity: 0 | 1 | 2 | 3; // 3 = act now
  title: string;
  org: string | null;
  owner: string | null;
  since: Date;
  cause: string;
  next: string;
  href: string;
};

const DAY = 86_400_000;

export async function unifiedQueue(now = new Date()): Promise<QueueItem[]> {
  const [q, jobs, crm, stranded, uncertain, processing, leads, internalTasks] = await Promise.all([
    operatorQueue(),
    jobSummary(),
    crmBacklog(),
    strandedWork(),
    prisma.publishRecord.findMany({ where: { providerStatus: "UNCERTAIN" }, select: { id: true, platform: true, updatedAt: true, org: { select: { name: true, slug: true } } }, take: 50 }),
    prisma.processingTask.findMany({ where: { status: "failed" }, select: { id: true, kind: true, updatedAt: true, org: { select: { name: true, slug: true } } }, take: 50 }),
    prisma.inquiry.findMany({ where: { firstResponseAt: null, stage: { notIn: ["won", "lost"] }, occurredAt: { lt: new Date(now.getTime() - DAY) }, org: { kind: "client" } }, select: { id: true, name: true, occurredAt: true, ownerId: true, org: { select: { name: true, slug: true } } }, take: 50 }),
    prisma.task.findMany({ where: { audience: "internal", status: { in: ["open", "in_progress"] }, dueDate: { lte: new Date(now.getTime() + DAY) } }, select: { id: true, title: true, dueDate: true, assignee: { select: { name: true } }, entityType: true, entityId: true }, take: 100 }),
  ]);
  const items: QueueItem[] = [];
  const push = (i: QueueItem) => items.push(i);

  for (const j of jobs.dead) push({ kind: "dead job", severity: 3, title: j.type, org: null, owner: null, since: j.updatedAt ?? now, cause: `Failed ${j.attempts} times: ${(j.lastError ?? "").slice(0, 120)}`, next: "Fix the cause, then requeue", href: "/admin/system" });
  for (const u of uncertain) push({ kind: "uncertain post", severity: 3, title: `${u.platform} post`, org: u.org.name, owner: null, since: u.updatedAt, cause: "The platform never answered after the request was sent", next: "Check the account, then record whether it posted", href: `/app/${u.org.slug}/distribution` });
  for (const s of q.issues) push({ kind: "support", severity: s.severity === "critical" ? 3 : s.severity === "high" ? 2 : 1, title: s.title, org: s.org?.name ?? null, owner: s.owner?.name ?? null, since: s.createdAt, cause: `Support request, ${s.severity}`, next: s.owner ? "Reply and resolve" : "Take ownership", href: "/admin/support" });
  for (const a of q.overdueApprovals) push({ kind: "approval overdue", severity: 2, title: a.title, org: a.org.name, owner: null, since: a.dueDate ?? a.updatedAt, cause: "Waiting on the client's approval past its due date", next: "Chase the approver or re-plan", href: `/app/${a.org.slug}/production/${a.id}` });
  for (const b of q.blockedProduction) push({ kind: "changes stuck", severity: 2, title: b.title, org: b.org.name, owner: b.editor?.name ?? null, since: b.updatedAt, cause: "Changes requested more than three days ago", next: "Get the revision done", href: `/app/${b.org.slug}/production/${b.id}` });
  for (const l of leads) push({ kind: "lead waiting", severity: 2, title: l.name, org: l.org.name, owner: null, since: l.occurredAt, cause: "No reply recorded after a day", next: "Draft a reply for the owner", href: `/app/${l.org.slug}/pipeline/${l.id}` });
  for (const c of crm.filter((r) => r.state === "dead" || r.state === "needs_review")) push({ kind: "CRM sync", severity: 1, title: `${c.operation} ${c.entityType} to the CRM`, org: null, owner: null, since: c.createdAt, cause: (c.lastError ?? "Failed to sync").slice(0, 120), next: "Retry after fixing the cause", href: "/admin/system" });
  for (const p of processing) push({ kind: "processing failed", severity: 1, title: p.kind, org: p.org.name, owner: null, since: p.updatedAt, cause: "The media worker reported a failure", next: "Retry the step", href: `/app/${p.org.slug}/library` });
  for (const t of stranded) push({ kind: "stranded work", severity: 1, title: t.title, org: null, owner: null, since: now, cause: "Assigned to a suspended member", next: "Reassign", href: "/admin/system" });
  for (const r of q.missingRecordings) push({ kind: "approved script unrecorded", severity: 1, title: r.title, org: r.org.name, owner: null, since: r.updatedAt, cause: "Approved but not recorded for five days", next: "Book the recording", href: `/app/${r.org.slug}/create/scripts/${r.id}` });
  for (const o of q.reportsDue) push({ kind: "report due", severity: 1, title: `Weekly report`, org: o.name, owner: null, since: o.weeklyReports[0]?.periodStart ?? now, cause: "No report in the last seven days", next: "Generate and finalise", href: `/app/${o.slug}/reports` });
  for (const t of internalTasks) push({ kind: t.entityType === "prospect" ? "follow-up" : "task", severity: t.dueDate && t.dueDate < now ? 2 : 1, title: t.title, org: null, owner: t.assignee?.name ?? null, since: t.dueDate ?? now, cause: t.dueDate && t.dueDate < now ? "Past due" : "Due today", next: "Do it or reschedule", href: t.entityType === "prospect" && t.entityId ? `/admin/prospects/${t.entityId}` : "/admin" });

  return items.sort((a, b) => b.severity - a.severity || a.since.getTime() - b.since.getTime());
}
