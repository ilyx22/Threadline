import "server-only";
import { prisma } from "@/lib/db/client";
import { periodWindow } from "@/lib/domain/learning-velocity";

/**
 * Delivery Load aggregation — "is this client getting easier or harder to
 * serve?" Built from the minutes and cash cost operators record on tasks,
 * grouped by client, service period, work class and owner. Nothing here
 * invents a margin: cost is what was recorded, and a period with no recorded
 * load says so.
 */

export const WORK_CLASSES = ["owner_only", "delegatable", "automatable", "dependency", "repeated_blocker"] as const;

type Row = {
  orgId: string;
  orgName: string;
  synthetic: boolean;
  startedAt: Date | null;
  period: number | null;
  workClass: string;
  ownerId: string | null;
  ownerName: string;
  activeMinutes: number;
  waitingMinutes: number;
  costMinor: number;
  tasks: number;
  contextSwitches: number;
};

export async function deliveryLoad(opts: { orgId?: string; sinceDays?: number } = {}) {
  const since = new Date(Date.now() - (opts.sinceDays ?? 120) * 86_400_000);
  const tasks = await prisma.task.findMany({
    where: {
      ...(opts.orgId ? { orgId: opts.orgId } : {}),
      OR: [{ activeMinutes: { not: null } }, { waitingMinutes: { not: null } }, { costMinor: { gt: 0 } }],
      updatedAt: { gte: since },
    },
    select: { orgId: true, kind: true, workClass: true, activeMinutes: true, waitingMinutes: true, costMinor: true, completedAt: true, updatedAt: true, assigneeId: true, assignee: { select: { name: true } }, org: { select: { name: true, synthetic: true, startedAt: true, createdAt: true } } },
    orderBy: { updatedAt: "asc" },
  });

  const rows = new Map<string, Row>();
  const lastKindByOwner = new Map<string, string>();
  for (const t of tasks) {
    const start = t.org.startedAt ?? t.org.createdAt;
    const period = periodWindow(start, t.completedAt ?? t.updatedAt)?.period ?? null;
    const workClass = t.workClass ?? "unclassified";
    const ownerId = t.assigneeId;
    const key = `${t.orgId}|${period}|${workClass}|${ownerId ?? "-"}`;
    const row = rows.get(key) ?? { orgId: t.orgId, orgName: t.org.name, synthetic: t.org.synthetic, startedAt: t.org.startedAt, period, workClass, ownerId, ownerName: t.assignee?.name ?? "Unassigned", activeMinutes: 0, waitingMinutes: 0, costMinor: 0, tasks: 0, contextSwitches: 0 };
    row.activeMinutes += t.activeMinutes ?? 0;
    row.waitingMinutes += t.waitingMinutes ?? 0;
    row.costMinor += t.costMinor;
    row.tasks += 1;
    // A context switch is the same owner moving to a different kind of work than their previous task.
    const ownerKey = ownerId ?? "-";
    const prev = lastKindByOwner.get(ownerKey);
    if (prev && prev !== t.kind) row.contextSwitches += 1;
    lastKindByOwner.set(ownerKey, t.kind);
    rows.set(key, row);
  }

  const list = [...rows.values()];
  const byClient = new Map<string, { orgId: string; orgName: string; synthetic: boolean; periods: Map<number | null, { activeMinutes: number; waitingMinutes: number; costMinor: number; tasks: number; delegatableMinutes: number; automatableMinutes: number; ownerOnlyMinutes: number; blockers: number; dependencies: number; contextSwitches: number }> }>();
  for (const r of list) {
    const c = byClient.get(r.orgId) ?? { orgId: r.orgId, orgName: r.orgName, synthetic: r.synthetic, periods: new Map() };
    const p = c.periods.get(r.period) ?? { activeMinutes: 0, waitingMinutes: 0, costMinor: 0, tasks: 0, delegatableMinutes: 0, automatableMinutes: 0, ownerOnlyMinutes: 0, blockers: 0, dependencies: 0, contextSwitches: 0 };
    p.activeMinutes += r.activeMinutes;
    p.waitingMinutes += r.waitingMinutes;
    p.costMinor += r.costMinor;
    p.tasks += r.tasks;
    p.contextSwitches += r.contextSwitches;
    if (r.workClass === "delegatable") p.delegatableMinutes += r.activeMinutes;
    if (r.workClass === "automatable") p.automatableMinutes += r.activeMinutes;
    if (r.workClass === "owner_only") p.ownerOnlyMinutes += r.activeMinutes;
    if (r.workClass === "repeated_blocker") p.blockers += r.tasks;
    if (r.workClass === "dependency") p.dependencies += r.tasks;
    c.periods.set(r.period, p);
    byClient.set(r.orgId, c);
  }

  const clients = [...byClient.values()].map((c) => {
    const periods = [...c.periods.entries()].filter(([p]) => p !== null).sort((a, b) => (a[0] as number) - (b[0] as number));
    const first = periods[0]?.[1];
    const last = periods[periods.length - 1]?.[1];
    const direction: "easier" | "harder" | "flat" | "unknown" =
      periods.length < 2 || !first || !last ? "unknown" : last.activeMinutes < first.activeMinutes * 0.85 ? "easier" : last.activeMinutes > first.activeMinutes * 1.15 ? "harder" : "flat";
    return {
      orgId: c.orgId,
      orgName: c.orgName,
      synthetic: c.synthetic,
      direction,
      periods: periods.map(([period, p]) => ({ period: period as number, ...p })),
      totals: [...c.periods.values()].reduce((a, p) => ({ activeMinutes: a.activeMinutes + p.activeMinutes, waitingMinutes: a.waitingMinutes + p.waitingMinutes, costMinor: a.costMinor + p.costMinor, tasks: a.tasks + p.tasks }), { activeMinutes: 0, waitingMinutes: 0, costMinor: 0, tasks: 0 }),
    };
  });

  const byOwner = new Map<string, { ownerName: string; activeMinutes: number; waitingMinutes: number; tasks: number; contextSwitches: number }>();
  for (const r of list) {
    const o = byOwner.get(r.ownerId ?? "-") ?? { ownerName: r.ownerName, activeMinutes: 0, waitingMinutes: 0, tasks: 0, contextSwitches: 0 };
    o.activeMinutes += r.activeMinutes; o.waitingMinutes += r.waitingMinutes; o.tasks += r.tasks; o.contextSwitches += r.contextSwitches;
    byOwner.set(r.ownerId ?? "-", o);
  }
  const byClass = new Map<string, { activeMinutes: number; tasks: number; costMinor: number }>();
  for (const r of list) {
    const k = byClass.get(r.workClass) ?? { activeMinutes: 0, tasks: 0, costMinor: 0 };
    k.activeMinutes += r.activeMinutes; k.tasks += r.tasks; k.costMinor += r.costMinor;
    byClass.set(r.workClass, k);
  }

  return { clients, byOwner: [...byOwner.values()], byClass: [...byClass.entries()].map(([workClass, v]) => ({ workClass, ...v })), recordedTasks: tasks.length, sinceDays: opts.sinceDays ?? 120 };
}
