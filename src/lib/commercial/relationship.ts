import "server-only";
import { prisma } from "@/lib/db/client";
import { enqueue } from "@/lib/jobs";
import { isoFromDbDate } from "./calendar";
import { planCadence, TOUCH_KEYS } from "./cadence";

/**
 * Keeps an engagement's planned relationship touches in step with its clock.
 *
 * - Idempotent: one row per (engagement, key); re-running changes nothing.
 * - Rebase: a planned touch moves when the start date, check-in slot, kickoff
 *   or pause offset changes. A touch already done (in the app or ticked in
 *   Attio) never moves and is never recreated.
 * - Stop: an ended or terminated engagement cancels every touch still planned.
 * - A paused engagement keeps its touches; resuming adds the paused days to
 *   `cadenceOffsetDays`, which rebases what is left.
 * Attio is updated afterwards by the `crm.cadence` job (see crm/cadence-sync).
 */
export async function syncCadence(engagementId: string, now = new Date()) {
  const e = await prisma.engagement.findUnique({ where: { id: engagementId }, include: { touches: true } });
  if (!e || e.status === "draft" || !e.startDate) return { created: 0, moved: 0, cancelled: 0 };
  let created = 0;
  let moved = 0;
  let cancelled = 0;

  if (e.status === "ended" || e.status === "terminated") {
    const r = await prisma.relationshipTouch.updateMany({ where: { engagementId: e.id, status: "planned" }, data: { status: "cancelled" } });
    cancelled = r.count;
  } else if (e.status === "active") {
    const plan = planCadence({ startDate: isoFromDbDate(e.startDate), timezone: e.timezone, kickoffAt: e.kickoffAt, checkInWeekday: e.checkInWeekday, checkInTime: e.checkInTime, offsetDays: e.cadenceOffsetDays });
    const existing = new Map(e.touches.map((t) => [t.key, t]));
    for (const p of plan) {
      const row = existing.get(p.key);
      if (!row) {
        await prisma.relationshipTouch.upsert({
          where: { engagementId_key: { engagementId: e.id, key: p.key } },
          create: { engagementId: e.id, orgId: e.orgId, key: p.key, title: p.title, dueAt: p.dueAt },
          update: {},
        });
        created++;
      } else if (row.status === "planned" && (row.dueAt.getTime() !== p.dueAt.getTime() || row.title !== p.title)) {
        await prisma.relationshipTouch.update({ where: { id: row.id }, data: { dueAt: p.dueAt, title: p.title } });
        moved++;
      }
    }
  }
  if (created || moved || cancelled || e.touches.some((t) => t.status === "planned" && (!t.attioTaskId || t.syncedDueAt?.getTime() !== t.dueAt.getTime()))) {
    await enqueue("crm.cadence", { engagementId: e.id }, { idempotencyKey: `crm.cadence:${e.id}:${now.getTime()}`, orgId: e.orgId });
  }
  return { created, moved, cancelled };
}

/** Relationship touches for the admin screen, in order. */
export async function cadenceFor(engagementId: string) {
  const rows = await prisma.relationshipTouch.findMany({ where: { engagementId } });
  return rows.sort((a, b) => TOUCH_KEYS.indexOf(a.key as never) - TOUCH_KEYS.indexOf(b.key as never));
}

/** A touch the relationship owner completed in the app rather than in Attio. */
export async function markTouchDone(touchId: string, now = new Date()) {
  const t = await prisma.relationshipTouch.update({ where: { id: touchId }, data: { status: "done", completedAt: now } });
  await enqueue("crm.cadence", { engagementId: t.engagementId }, { idempotencyKey: `crm.cadence:${t.engagementId}:${now.getTime()}`, orgId: t.orgId });
  return t;
}
