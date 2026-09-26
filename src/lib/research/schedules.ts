import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import { SOURCE_COLLECTION } from "@/lib/domain/intelligence";
import { runSourceKindSchema } from "@/lib/domain/enums";
import { fetchPublicPage } from "@/lib/integrations/fetch-url";
import { collectInternal, hostOf, persistEvidence, researchKindForSource } from "./collect";

/**
 * Scheduled research (AI-02). See the ResearchSchedule model for the rules.
 * One open run per workspace still holds: a due schedule is skipped, with the
 * reason recorded, while a run is open.
 */
const DAY = 86_400_000;
export type ScheduleSource = { kind: string; label: string; url?: string | null };

export async function createSchedule(orgId: string, userId: string, input: { label: string; focus?: string | null; cadenceDays: number; sources: ScheduleSource[]; firstRunAt?: Date }) {
  const label = input.label.trim().slice(0, 120);
  if (label.length < 3) throw new WorkflowError("Name the schedule.");
  if (!Number.isInteger(input.cadenceDays) || input.cadenceDays < 1 || input.cadenceDays > 90) throw new WorkflowError("Run every 1 to 90 days.");
  const sources = input.sources.map((s) => ({ kind: runSourceKindSchema.parse(s.kind), label: s.label.trim().slice(0, 120) || s.kind, url: s.url?.trim() || null })).slice(0, 20);
  if (!sources.length) throw new WorkflowError("Add at least one source.");
  return prisma.researchSchedule.create({ data: { orgId, label, focus: input.focus?.trim().slice(0, 1000) || null, cadenceDays: input.cadenceDays, sources: JSON.stringify(sources), nextRunAt: input.firstRunAt ?? new Date(), createdById: userId } });
}

export async function setScheduleActive(orgId: string, id: string, active: boolean) {
  const r = await prisma.researchSchedule.updateMany({ where: { id, orgId }, data: { active } });
  if (r.count !== 1) throw new WorkflowError("That schedule no longer exists.");
}

/** Run one due schedule. Returns what happened, which is also stored on the schedule. */
export async function runSchedule(scheduleId: string, now = new Date()) {
  const sch = await prisma.researchSchedule.findUnique({ where: { id: scheduleId } });
  if (!sch || !sch.active || sch.nextRunAt > now) return null;
  // Claim this tick: move nextRunAt first so an overlapping runner does nothing.
  const claimed = await prisma.researchSchedule.updateMany({ where: { id: sch.id, nextRunAt: sch.nextRunAt }, data: { nextRunAt: new Date(now.getTime() + sch.cadenceDays * DAY), lastRunAt: now } });
  if (claimed.count !== 1) return null;

  const open = await prisma.intelligenceRun.findFirst({ where: { orgId: sch.orgId, status: { in: ["scoping", "collecting", "synthesis", "review"] } }, select: { label: true } });
  if (open) {
    const outcome = { skipped: `"${open.label}" is still open; one run at a time.` };
    await prisma.researchSchedule.update({ where: { id: sch.id }, data: { lastOutcome: JSON.stringify(outcome) } });
    return outcome;
  }

  const run = await prisma.intelligenceRun.create({
    data: { orgId: sch.orgId, label: `${sch.label} (${now.toISOString().slice(0, 10)})`.slice(0, 200), focus: sch.focus, periodStart: new Date(now.getTime() - sch.cadenceDays * DAY), periodEnd: now, status: "collecting", createdById: sch.createdById },
  });
  let collected = 0;
  let duplicates = 0;
  const unavailable: { label: string; reason: string }[] = [];
  const waiting: string[] = [];
  for (const src of JSON.parse(sch.sources) as ScheduleSource[]) {
    const kind = src.kind as keyof typeof SOURCE_COLLECTION;
    const mode = SOURCE_COLLECTION[kind]?.mode ?? "manual";
    const rs = await prisma.runSource.create({ data: { orgId: sch.orgId, runId: run.id, kind: src.kind, label: src.label, url: src.url ?? null, collectionMode: mode === "manual" ? "manual" : mode === "url" ? "url" : "adapter" } });
    if (mode === "manual") {
      await prisma.runSource.update({ where: { id: rs.id }, data: { statusNote: "Needs a person: paste the material for this source." } });
      waiting.push(src.label);
      continue;
    }
    let items: Parameters<typeof persistEvidence>[2] = [];
    if (mode === "internal") {
      items = await collectInternal(sch.orgId, src.kind, run.periodStart, run.periodEnd);
      if (!items.length) {
        await prisma.runSource.update({ where: { id: rs.id }, data: { status: "unavailable", statusNote: "No records in this workspace for the period.", collectedAt: now } });
        unavailable.push({ label: src.label, reason: "No records for the period" });
        continue;
      }
    } else {
      if (!src.url) {
        await prisma.runSource.update({ where: { id: rs.id }, data: { status: "unavailable", statusNote: "No URL was given for this source.", collectedAt: now } });
        unavailable.push({ label: src.label, reason: "No URL" });
        continue;
      }
      const page = await fetchPublicPage(src.url);
      if (!page.ok) {
        await prisma.runSource.update({ where: { id: rs.id }, data: { status: "unavailable", statusNote: page.reason, collectedAt: now } });
        unavailable.push({ label: src.label, reason: page.reason });
        continue;
      }
      items = [{ kind: researchKindForSource(src.kind), title: page.title.slice(0, 300), body: page.text, url: page.url, sourceName: hostOf(page.url), collectedVia: "schedule", meta: { sourceType: src.kind, collectionMode: "url", contentType: page.contentType, fetchedAt: page.fetchedAt.toISOString(), runSourceId: rs.id, scheduleId: sch.id } }];
    }
    const r = await persistEvidence(sch.orgId, run.id, items);
    collected += r.collected;
    duplicates += r.duplicates;
    await prisma.runSource.update({ where: { id: rs.id }, data: { status: "collected", itemsCollected: r.collected, statusNote: r.duplicates ? `${r.duplicates} item(s) were already in the workspace.` : null, collectedAt: now } });
  }
  await prisma.intelligenceRun.update({ where: { id: run.id }, data: { evidenceCount: await prisma.researchItem.count({ where: { orgId: sch.orgId, runId: run.id } }) } });
  const outcome = { runId: run.id, collected, duplicates, unavailable, waitingForPerson: waiting };
  await prisma.researchSchedule.update({ where: { id: sch.id }, data: { lastRunId: run.id, lastOutcome: JSON.stringify(outcome) } });
  return outcome;
}

/** Daily tick: run every due schedule. */
export async function runDueSchedules(now = new Date()) {
  const due = await prisma.researchSchedule.findMany({ where: { active: true, nextRunAt: { lte: now } }, select: { id: true }, take: 100 });
  const results = [];
  for (const d of due) results.push(await runSchedule(d.id, now));
  return results.filter(Boolean).length;
}
