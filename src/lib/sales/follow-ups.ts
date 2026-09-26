import "server-only";
import { prisma } from "@/lib/db/client";

/**
 * Threadline's own follow-up queue (COM-07). Every open prospect whose next
 * action is due gets one task for its owner, in the internal workspace, on
 * the day. Applications left unread for a day are flagged the same way. The
 * task names the action; wording for any message comes only from approved
 * script blocks, and nothing is sent.
 */
export async function remindProspectFollowUps(now = new Date()) {
  const internal = await prisma.organization.findFirst({ where: { kind: "internal" }, select: { id: true } });
  if (!internal) return 0;
  const due = await prisma.prospect.findMany({
    where: { nextActionDueAt: { lte: now }, closedAt: null },
    select: { id: true, company: true, contactName: true, nextAction: true, nextActionDueAt: true, ownerId: true },
    take: 500,
  });
  const unread = await prisma.application.findMany({
    where: { status: "new", createdAt: { lte: new Date(now.getTime() - 86_400_000) } },
    select: { id: true, name: true, company: true },
    take: 200,
  });
  let created = 0;
  const ensure = async (entityType: string, entityId: string, title: string, assigneeId: string | null, dueDate: Date | null) => {
    const exists = await prisma.task.findFirst({ where: { orgId: internal.id, entityType, entityId, title, status: { in: ["open", "in_progress"] } }, select: { id: true } });
    if (exists) return;
    await prisma.task.create({ data: { orgId: internal.id, title, kind: "ops", audience: "internal", assigneeId, entityType, entityId, dueDate } as never });
    created++;
  };
  for (const p of due) await ensure("prospect", p.id, `Follow up: ${p.contactName ? `${p.contactName}, ` : ""}${p.company}${p.nextAction ? `: ${p.nextAction}` : ""}`.slice(0, 200), p.ownerId, p.nextActionDueAt);
  for (const a of unread) await ensure("application", a.id, `Unread application for a day: ${a.name}${a.company ? `, ${a.company}` : ""}`.slice(0, 200), null, now);
  return created;
}

/** The queue as staff see it: due and overdue prospect actions, soonest first. */
export async function followUpQueue(now = new Date()) {
  return prisma.prospect.findMany({
    where: { nextActionDueAt: { lte: new Date(now.getTime() + 86_400_000) }, closedAt: null },
    orderBy: { nextActionDueAt: "asc" },
    select: { id: true, company: true, contactName: true, nextAction: true, nextActionDueAt: true, owner: { select: { name: true } } },
    take: 100,
  });
}
