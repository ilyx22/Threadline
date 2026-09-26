import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * Effort records (CX-08, CAP-01).
 *
 * The offer promises the founder "under an hour a week"; the capacity model
 * needs operator minutes per client. Both come from minutes people record
 * against a step, by hand or from a timer. Nothing here is inferred from
 * activity, so a week with no entries shows as "not recorded", never as zero.
 */
export const EFFORT_STEPS = ["onboarding", "recording", "review", "approval", "call", "scripting", "editing", "packaging", "reporting", "publishing", "other"] as const;
export type EffortStep = (typeof EFFORT_STEPS)[number];
export const ACTOR_KINDS = ["founder", "client_team", "operator", "editor"] as const;
export type ActorKind = (typeof ACTOR_KINDS)[number];

/** The founder-time promise, in minutes per week. */
export const FOUNDER_WEEKLY_BUDGET = 60;

const DAY = 86_400_000;
/** A calendar date (UTC midnight) from YYYY-MM-DD. */
export function calendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new WorkflowError("Give the date as YYYY-MM-DD.");
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) throw new WorkflowError("That date does not exist.");
  return d;
}

/** Monday (UTC) of the week containing d. */
export function weekStart(d: Date) {
  const day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
}

export async function recordEffort(
  orgId: string,
  userId: string,
  input: { actorKind: ActorKind; step: EffortStep; minutes: number; workDate: string; contentItemId?: string | null; note?: string | null; source?: "manual" | "timer" },
  now = new Date(),
) {
  if (!ACTOR_KINDS.includes(input.actorKind)) throw new WorkflowError("Unknown role for this time.");
  if (!EFFORT_STEPS.includes(input.step)) throw new WorkflowError("Unknown step.");
  if (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 1440) throw new WorkflowError("Minutes must be a whole number from 1 to 1,440.");
  const workDate = calendarDate(input.workDate);
  if (workDate.getTime() > now.getTime() + DAY) throw new WorkflowError("Time cannot be recorded for a future day.");
  if (workDate.getTime() < now.getTime() - 90 * DAY) throw new WorkflowError("Time older than 90 days cannot be added.");
  if (input.contentItemId) {
    const item = await prisma.contentItem.findFirst({ where: { id: input.contentItemId, orgId }, select: { id: true } });
    if (!item) throw new WorkflowError("That content item is not in this workspace.");
  }
  return prisma.effortEntry.create({
    data: { orgId, userId, actorKind: input.actorKind, step: input.step, minutes: input.minutes, workDate, contentItemId: input.contentItemId ?? null, note: input.note?.trim().slice(0, 500) || null, source: input.source ?? "manual" },
  });
}

/** A person removes their own entry within seven days; staff may remove any. */
export async function deleteEffort(orgId: string, entryId: string, actor: { userId: string; isStaff: boolean }, now = new Date()) {
  const e = await prisma.effortEntry.findFirst({ where: { id: entryId, orgId } });
  if (!e) throw new WorkflowError("That entry no longer exists.");
  if (!actor.isStaff && (e.userId !== actor.userId || now.getTime() - e.createdAt.getTime() > 7 * DAY)) throw new WorkflowError("Only your own entries from the last seven days can be removed.");
  await prisma.effortEntry.delete({ where: { id: e.id } });
}

export type WeekEffort = { weekStart: string; founder: number | null; clientTeam: number | null; operator: number | null; editor: number | null; overBudget: boolean };

/** Minutes per week by who spent them; null means nothing was recorded. */
export async function weeklyEffort(orgId: string, weeks = 8, now = new Date()): Promise<WeekEffort[]> {
  const first = new Date(weekStart(now).getTime() - (weeks - 1) * 7 * DAY);
  const rows = await prisma.effortEntry.groupBy({ by: ["workDate", "actorKind"], where: { orgId, workDate: { gte: first } }, _sum: { minutes: true } });
  const out: WeekEffort[] = [];
  for (let i = 0; i < weeks; i++) {
    const start = new Date(first.getTime() + i * 7 * DAY);
    const end = start.getTime() + 7 * DAY;
    const sum = (kind: string) => {
      const inWeek = rows.filter((r) => r.actorKind === kind && r.workDate.getTime() >= start.getTime() && r.workDate.getTime() < end);
      return inWeek.length ? inWeek.reduce((a, r) => a + (r._sum.minutes ?? 0), 0) : null;
    };
    const founder = sum("founder");
    out.push({ weekStart: start.toISOString().slice(0, 10), founder, clientTeam: sum("client_team"), operator: sum("operator"), editor: sum("editor"), overBudget: (founder ?? 0) > FOUNDER_WEEKLY_BUDGET });
  }
  return out;
}

/** Founder minutes by step over a window: where the founder's hour goes. */
export async function founderMinutesByStep(orgId: string, since: Date) {
  const rows = await prisma.effortEntry.groupBy({ by: ["step"], where: { orgId, actorKind: "founder", workDate: { gte: since } }, _sum: { minutes: true } });
  return rows.map((r) => ({ step: r.step, minutes: r._sum.minutes ?? 0 })).sort((a, b) => b.minutes - a.minutes);
}

/**
 * Operator capacity input (CAP-01): recorded operator and editor minutes per
 * client over the last four weeks, and the average per week. A client with no
 * entries is reported as not recorded.
 */
export async function operatorLoad(now = new Date()) {
  const since = new Date(weekStart(now).getTime() - 3 * 7 * DAY);
  const rows = await prisma.effortEntry.groupBy({ by: ["orgId"], where: { actorKind: { in: ["operator", "editor"] }, workDate: { gte: since } }, _sum: { minutes: true } });
  const orgs = await prisma.organization.findMany({ where: { kind: "client", status: { not: "churned" } }, select: { id: true, name: true } });
  return orgs.map((o) => {
    const m = rows.find((r) => r.orgId === o.id)?._sum.minutes ?? null;
    return { orgId: o.id, name: o.name, minutes4w: m, perWeek: m === null ? null : Math.round(m / 4) };
  });
}

export async function recentEntries(orgId: string, take = 30) {
  return prisma.effortEntry.findMany({ where: { orgId }, orderBy: [{ workDate: "desc" }, { createdAt: "desc" }], take });
}
