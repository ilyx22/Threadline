import "server-only";
import { prisma } from "@/lib/db/client";
import { sideEffectsAllowed } from "@/lib/env";
import { appUrl } from "@/lib/app-url";
import { AttioClient, AttioError, type AttioTask } from "./attio";

/**
 * Mirror an engagement's relationship touches into Attio as tasks linked to
 * the client company and assigned to the relationship owner.
 *
 * - Create once. Every task carries a reference marker; if a create succeeded
 *   but its id was never saved, the next run finds the task by the marker and
 *   adopts it instead of creating a duplicate.
 * - Completion flows from Attio: a task ticked there marks the touch done, and
 *   it is never moved or recreated. A touch done in the app ticks the task.
 * - Rebase: an open task's deadline follows the touch's due time.
 * - Stop: a cancelled touch's open task is deleted; a completed one is kept.
 * - A task a person deleted in Attio is not recreated; it is flagged instead.
 * Writes happen only in production with ATTIO_API_KEY; elsewhere touches are
 * held with an explanation, like the CRM outbox.
 */
export const markerFor = (engagementId: string, key: string) => `[threadline:${engagementId}:${key}]`;

export type PushResult = { held?: string; created: number; moved: number; completedFromAttio: number; completedInAttio: number; deleted: number; flagged: number };

function localLabel(dueAt: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(dueAt);
}

export async function pushCadence(engagementId: string, opts: { client?: AttioClient; env?: Record<string, string | undefined>; now?: Date } = {}): Promise<PushResult> {
  const env = opts.env ?? process.env;
  const now = opts.now ?? new Date();
  const result: PushResult = { created: 0, moved: 0, completedFromAttio: 0, completedInAttio: 0, deleted: 0, flagged: 0 };
  const token = env.ATTIO_API_KEY?.trim();
  if (!opts.client && (!token || !sideEffectsAllowed(env))) {
    result.held = token ? "Held: CRM writes run only in production." : "Held: ATTIO_API_KEY is not configured.";
    await prisma.relationshipTouch.updateMany({ where: { engagementId, attioTaskId: null, status: "planned" }, data: { syncError: result.held } });
    return result;
  }
  const client = opts.client ?? new AttioClient(token!);
  const e = await prisma.engagement.findUniqueOrThrow({ where: { id: engagementId }, include: { touches: true, org: { select: { id: true, name: true } } } });

  const link = await prisma.crmLink.findUnique({ where: { provider_entityType_entityId: { provider: "attio", entityType: "organization", entityId: e.orgId } } });
  if (!link || link.remoteObject !== "companies") throw new AttioError("Waiting for the client company to sync to Attio first.", "retry");

  const ownerId = e.relationshipOwnerId ?? e.createdById;
  const owner = ownerId ? await prisma.user.findUnique({ where: { id: ownerId }, select: { email: true } }) : null;
  const assignee = env.ATTIO_OWNER_EMAIL?.trim() || owner?.email || null;

  const remote = await client.listCompanyTasks(link.remoteId);
  const byId = new Map(remote.map((t) => [t.id, t]));
  const byMarker = new Map<string, AttioTask>();
  for (const t of remote) {
    const m = t.content.match(/\[threadline:[^\]]+\]/);
    if (m) byMarker.set(m[0], t);
  }

  for (const t of e.touches) {
    const marker = markerFor(e.id, t.key);
    const found = (t.attioTaskId ? byId.get(t.attioTaskId) : undefined) ?? byMarker.get(marker);
    try {
      if (t.status === "planned") {
        if (!found && t.attioTaskId) {
          await prisma.relationshipTouch.update({ where: { id: t.id }, data: { syncError: "This task was removed in Attio, so it was not recreated. Recreate it by hand or mark the touch done." } });
          result.flagged++;
          continue;
        }
        if (found?.isCompleted) {
          await prisma.relationshipTouch.update({ where: { id: t.id }, data: { status: "done", completedAt: now, attioTaskId: found.id, syncError: null } });
          result.completedFromAttio++;
          continue;
        }
        if (!found) {
          const content = `${t.title}. ${e.org.name}. Due ${localLabel(t.dueAt, e.timezone)} (${e.timezone}). Record the call recap and commitments in the portal: ${appUrl()}/admin/clients/${e.orgId} ${marker}`;
          const created = await client.createTask({ content, deadlineAt: t.dueAt, companyRecordId: link.remoteId, assigneeEmail: assignee });
          await prisma.relationshipTouch.update({ where: { id: t.id }, data: { attioTaskId: created.id, syncedDueAt: t.dueAt, syncError: null } });
          result.created++;
          continue;
        }
        const remoteDue = found.deadlineAt ? new Date(found.deadlineAt).getTime() : null;
        if (remoteDue !== t.dueAt.getTime()) {
          const updated = await client.updateTaskDeadline(found.id, t.dueAt);
          if (!updated) {
            await prisma.relationshipTouch.update({ where: { id: t.id }, data: { attioTaskId: found.id, syncError: "This task was removed in Attio, so it was not recreated." } });
            result.flagged++;
            continue;
          }
          result.moved++;
        }
        await prisma.relationshipTouch.update({ where: { id: t.id }, data: { attioTaskId: found.id, syncedDueAt: t.dueAt, syncError: null } });
      } else if (t.status === "done") {
        if (found && !found.isCompleted) {
          await client.completeTask(found.id);
          result.completedInAttio++;
        }
      } else if (t.status === "cancelled" && !t.remoteClosed) {
        if (found && !found.isCompleted) {
          await client.deleteTask(found.id);
          result.deleted++;
        }
        await prisma.relationshipTouch.update({ where: { id: t.id }, data: { remoteClosed: true, syncError: null } });
      }
    } catch (err) {
      if (err instanceof AttioError && err.kind === "retry") throw err;
      await prisma.relationshipTouch.update({ where: { id: t.id }, data: { syncError: (err instanceof Error ? err.message : String(err)).slice(0, 500) } });
      result.flagged++;
    }
  }
  return result;
}
