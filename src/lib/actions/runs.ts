"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { stringify } from "@/lib/db/json";
import { extractSignals, generateBriefSummary } from "@/lib/ai/generators";
import { fetchPublicPage } from "@/lib/integrations/fetch-url";
import { enforceRateLimit, LIMITS } from "@/lib/security/rate-limit";
import { runGateCounts } from "@/lib/data/runs";
import {
  candidateKindSchema,
  runSourceKindSchema,
  runStatusSchema,
  type RunStatus,
} from "@/lib/domain/enums";
import {
  SOURCE_COLLECTION,
  adjustedConfidence,
  assertCandidateHasEvidence,
  assertRunTransition,
  testRankScore,
} from "@/lib/domain/intelligence";
import { patternScore } from "@/lib/domain/scoring";
import { collectInternal, hostOf, persistEvidence, researchKindForSource, type PreparedEvidence } from "@/lib/research/collect";
import {
  cleanText,
  cleanUrl,
  err,
  guarded,
  ok,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Intelligence run mutations.
 *
 * The invariant enforced throughout this file: nothing the system proposes
 * reaches the client or influences strategy until a person decides on it.
 * Candidate signals are stored as candidates, the run cannot be published while
 * any of them is undecided, and only `decideCandidateAction` can create a
 * Pattern from one.
 */

/* ----------------------------------- Runs ---------------------------------- */

const runSchema = z.object({
  label: z.string().min(3, "Give the run a label.").max(200),
  focus: z.string().max(1000).optional(),
  periodStart: optionalDate,
  periodEnd: optionalDate,
});

export async function createRunAction(
  orgSlug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const input = parseForm(runSchema, formData);

    // One cycle at a time. Two open runs means two competing views of the
    // market, and nobody can tell which one the plan came from.
    const existing = await prisma.intelligenceRun.findFirst({
      where: {
        orgId: ctx.org.id,
        status: { in: ["scoping", "collecting", "synthesis", "review"] },
      },
      select: { id: true, label: true },
    });
    if (existing) {
      return err(
        `"${existing.label}" is still open. Publish or archive it before starting another cycle.`,
        "workflow",
      );
    }

    const periodEnd = input.periodEnd ?? new Date();
    const periodStart = input.periodStart ?? addDays(periodEnd, -7);
    if (periodStart > periodEnd) {
      return err("The period start must come before the period end.", "validation", {
        periodStart: "Start after end.",
      });
    }

    const run = await prisma.intelligenceRun.create({
      data: {
        orgId: ctx.org.id,
        label: cleanText(input.label, 200),
        focus: input.focus ? cleanText(input.focus, 1000) : null,
        periodStart,
        periodEnd,
        status: "scoping",
        createdById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "run.create",
      entityType: "intelligence_run",
      entityId: run.id,
      summary: `Started intelligence run "${run.label}"`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/runs`);

    return ok({ id: run.id }, "Intelligence run started.");
  });
}

export async function updateRunAction(
  orgSlug: string,
  runId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const input = parseForm(
      runSchema.extend({ summary: z.string().max(6000).optional() }),
      formData,
    );

    const run = await prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId: ctx.org.id },
      select: { id: true, status: true },
    });
    if (!run) return err("That run no longer exists.", "not_found");
    if (run.status === "published") {
      return err(
        "A published brief is frozen. Start a new run rather than changing what the client was already sent.",
        "workflow",
      );
    }

    await prisma.intelligenceRun.update({
      where: { id: runId },
      data: {
        label: cleanText(input.label, 200),
        focus: input.focus ? cleanText(input.focus, 1000) : null,
        summary: input.summary ? cleanText(input.summary, 6000) : null,
        ...(input.periodStart ? { periodStart: input.periodStart } : {}),
        ...(input.periodEnd ? { periodEnd: input.periodEnd } : {}),
      },
    });

    await audit(ctx, {
      action: "run.update",
      entityType: "intelligence_run",
      entityId: runId,
      summary: `Updated run "${input.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${runId}`);

    return okVoid("Run updated.");
  });
}

/** Move a run forward. Every gate is re-checked here against fresh counts. */
export async function advanceRunAction(
  orgSlug: string,
  runId: string,
  target: string,
): Promise<ActionResult<{ status: RunStatus }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const to = runStatusSchema.parse(target);

    const run = await prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId: ctx.org.id },
      select: { id: true, label: true, status: true, summary: true },
    });
    if (!run) return err("That run no longer exists.", "not_found");

    const counts = await runGateCounts(ctx.org.id, runId);
    assertRunTransition(run.status as RunStatus, to, {
      ...counts,
      hasSummary: Boolean(run.summary?.trim()),
    });

    const publishing = to === "published";
    await prisma.intelligenceRun.update({
      where: { id: runId },
      data: {
        status: to,
        evidenceCount: counts.evidenceCount,
        signalCount: counts.candidateCount,
        approvedCount: counts.approvedCandidates,
        ...(publishing ? { publishedAt: new Date(), brief: await freezeBrief(ctx.org.id, runId) } : {}),
      },
    });

    if (publishing) {
      await prisma.notification.create({
        data: {
          orgId: ctx.org.id,
          kind: "intelligence_brief",
          title: "New intelligence brief",
          body: `"${run.label}" is ready to read.`,
          href: `/app/${orgSlug}/intelligence/runs/${runId}`,
        },
      });
    }

    await audit(ctx, {
      action: "run.status",
      entityType: "intelligence_run",
      entityId: runId,
      summary: `Moved run "${run.label}" to ${to}`,
      meta: { from: run.status, to },
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/runs`);
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${runId}`);
    revalidatePath(`/app/${orgSlug}`);

    return ok({ status: to }, publishing ? "Brief published." : "Run moved forward.");
  });
}

/**
 * Freeze the brief payload at publish time.
 *
 * A brief read months later must show what the client was sent, not a silent
 * re-query against data that has since moved. Same rule as WeeklyReport.
 */
async function freezeBrief(orgId: string, runId: string) {
  const [run, approved, tests, sources] = await Promise.all([
    prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId },
      select: { label: true, focus: true, summary: true, periodStart: true, periodEnd: true },
    }),
    prisma.candidateSignal.findMany({
      where: { orgId, runId, decision: "approved" },
      orderBy: { confidence: "desc" },
      include: {
        evidence: {
          include: {
            researchItem: {
              select: { id: true, title: true, url: true, sourceName: true, kind: true, capturedAt: true },
            },
          },
        },
      },
    }),
    prisma.pattern.findMany({
      where: { orgId, runId, kind: "test" },
      orderBy: [{ rank: "asc" }, { score: "desc" }],
      select: {
        id: true,
        title: true,
        description: true,
        successMetric: true,
        score: true,
        rank: true,
        confidence: true,
      },
    }),
    prisma.runSource.findMany({
      where: { orgId, runId },
      select: { kind: true, label: true, status: true, statusNote: true, itemsCollected: true },
    }),
  ]);

  return stringify({
    version: 1,
    frozenAt: new Date().toISOString(),
    label: run?.label ?? "",
    focus: run?.focus ?? null,
    summary: run?.summary ?? null,
    periodStart: run?.periodStart?.toISOString() ?? null,
    periodEnd: run?.periodEnd?.toISOString() ?? null,
    sources: sources.map((s) => ({
      kind: s.kind,
      label: s.label,
      status: s.status,
      statusNote: s.statusNote,
      itemsCollected: s.itemsCollected,
    })),
    signals: approved.map((c) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      rationale: c.rationale,
      soWhat: c.soWhat,
      confidence: c.confidence,
      editedByHuman: c.editedByHuman,
      evidence: c.evidence.map((e) => ({
        id: e.researchItem.id,
        title: e.researchItem.title,
        url: e.researchItem.url,
        sourceName: e.researchItem.sourceName,
        kind: e.researchItem.kind,
        capturedAt: e.researchItem.capturedAt.toISOString(),
      })),
    })),
    tests: tests.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      successMetric: t.successMetric,
      score: t.score,
      rank: t.rank,
      confidence: t.confidence,
    })),
  });
}

export async function deleteRunAction(orgSlug: string, runId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const run = await prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId: ctx.org.id },
      select: { id: true, label: true, status: true, _count: { select: { patterns: true } } },
    });
    if (!run) return err("That run no longer exists.", "not_found");
    if (run.status === "published") {
      return err("A published brief cannot be deleted. Archive it instead.", "workflow");
    }
    if (run._count.patterns > 0) {
      return err(
        "This run has produced signals that are now part of the strategy. Archive it so the lineage survives.",
        "workflow",
      );
    }

    // Evidence outlives the run: research items keep their provenance metadata
    // and simply lose the run association.
    await prisma.researchItem.updateMany({ where: { orgId: ctx.org.id, runId }, data: { runId: null } });
    await prisma.intelligenceRun.delete({ where: { id: runId } });

    await audit(ctx, {
      action: "run.delete",
      entityType: "intelligence_run",
      entityId: runId,
      summary: `Deleted run "${run.label}". Evidence was kept.`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs`);

    return okVoid("Run deleted. The evidence it collected was kept.");
  });
}

/* --------------------------------- Sources --------------------------------- */

const sourceSchema = z.object({
  kind: runSourceKindSchema,
  label: z.string().min(2, "Name the source.").max(200),
  url: z.string().max(600).optional(),
  competitorId: z.string().optional(),
  content: z.string().max(60_000).optional(),
});

export async function addRunSourceAction(
  orgSlug: string,
  runId: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const input = parseForm(sourceSchema, formData);

    const run = await prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId: ctx.org.id },
      select: { id: true, status: true },
    });
    if (!run) return err("That run no longer exists.", "not_found");
    if (run.status === "published" || run.status === "archived") {
      return err("This run is closed. Start a new cycle to add sources.", "workflow");
    }

    if (input.competitorId) {
      const competitor = await prisma.competitor.findFirst({
        where: { id: input.competitorId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!competitor) return err("That competitor is not in this workspace.", "validation");
    }

    const collection = SOURCE_COLLECTION[input.kind];
    const source = await prisma.runSource.create({
      data: {
        orgId: ctx.org.id,
        runId,
        kind: input.kind,
        label: cleanText(input.label, 200),
        url: cleanUrl(input.url),
        competitorId: input.competitorId ?? null,
        content: input.content ? cleanText(input.content, 60_000) : null,
        collectionMode: collection.mode === "internal" ? "adapter" : collection.mode,
        status: "pending",
      },
    });

    await audit(ctx, {
      action: "run.source.add",
      entityType: "run_source",
      entityId: source.id,
      summary: `Added ${input.kind.replace(/_/g, " ")} source "${input.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${runId}`);

    return ok({ id: source.id }, "Source added.");
  });
}

export async function removeRunSourceAction(
  orgSlug: string,
  sourceId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const source = await prisma.runSource.findFirst({
      where: { id: sourceId, orgId: ctx.org.id },
      select: { id: true, runId: true, label: true },
    });
    if (!source) return err("That source no longer exists.", "not_found");

    await prisma.runSource.delete({ where: { id: sourceId } });
    await audit(ctx, {
      action: "run.source.remove",
      entityType: "run_source",
      entityId: sourceId,
      summary: `Removed source "${source.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${source.runId}`);

    return okVoid("Source removed. Anything already collected from it was kept.");
  });
}

/** Record that a source cannot be collected, in the operator's own words. */
export async function markSourceUnavailableAction(
  orgSlug: string,
  sourceId: string,
  reason: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const note = cleanText(reason ?? "", 1000);
    if (note.length < 5) {
      return err(
        "Say why it could not be collected. A source marked unavailable with no reason tells the next person nothing.",
        "validation",
        { reason: "Give a reason." },
      );
    }

    const source = await prisma.runSource.findFirst({
      where: { id: sourceId, orgId: ctx.org.id },
      select: { id: true, runId: true, label: true },
    });
    if (!source) return err("That source no longer exists.", "not_found");

    await prisma.runSource.update({
      where: { id: sourceId },
      data: { status: "unavailable", statusNote: note },
    });
    await audit(ctx, {
      action: "run.source.unavailable",
      entityType: "run_source",
      entityId: sourceId,
      summary: `Marked "${source.label}" not collectable: ${note}`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${source.runId}`);

    return okVoid("Recorded as not collectable.");
  });
}

const collectSchema = z.object({
  content: z.string().max(60_000).optional(),
  url: z.string().max(600).optional(),
  kind: z.string().max(60).optional(),
});

/**
 * Collect a source.
 *
 * Three genuine paths, and no fourth that pretends:
 *   - internal: read the records this workspace already holds
 *   - url: fetch a public page the operator supplied (SSRF-guarded)
 *   - manual: store the text a person pasted
 *
 * Everything collected becomes a `ResearchItem` carrying its source URL, source
 * type, timestamp and metadata, fingerprinted so the same item collected twice
 * does not inflate the apparent weight of a signal.
 */
export async function collectSourceAction(
  orgSlug: string,
  sourceId: string,
  _prev: ActionResult<{ collected: number; duplicates: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ collected: number; duplicates: number }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    const input = parseForm(collectSchema, formData);

    const source = await prisma.runSource.findFirst({
      where: { id: sourceId, orgId: ctx.org.id },
      include: { run: { select: { id: true, status: true, periodStart: true, periodEnd: true } } },
    });
    if (!source) return err("That source no longer exists.", "not_found");
    if (source.run.status === "published" || source.run.status === "archived") {
      return err("This run is closed.", "workflow");
    }

    const kind = source.kind as keyof typeof SOURCE_COLLECTION;
    const mode = SOURCE_COLLECTION[kind].mode;

    let items: PreparedEvidence[] = [];

    if (mode === "internal") {
      items = await collectInternal(ctx.org.id, kind, source.run.periodStart, source.run.periodEnd);
      if (items.length === 0) {
        await prisma.runSource.update({
          where: { id: sourceId },
          data: {
            status: "unavailable",
            statusNote:
              "There are no records in this workspace for the period, so this source contributed nothing.",
            collectedAt: new Date(),
          },
        });
        revalidatePath(`/app/${orgSlug}/intelligence/runs/${source.runId}`);
        return ok(
          { collected: 0, duplicates: 0 },
          "Nothing to read for this period. Recorded honestly rather than left pending.",
        );
      }
    } else if (mode === "url" && !input.content?.trim()) {
      const target = cleanUrl(input.url) ?? source.url;
      if (!target) {
        return err("Add the URL to read, or paste the content instead.", "validation", {
          url: "A URL is required.",
        });
      }

      await enforceRateLimit("url-fetch", { limit: 30, windowMs: 60 * 60_000 });
      const outcome = await fetchPublicPage(target);

      if (!outcome.ok) {
        await prisma.runSource.update({
          where: { id: sourceId },
          data: { status: "unavailable", statusNote: outcome.reason, collectedAt: new Date() },
        });
        await audit(ctx, {
          action: "run.source.fetch_failed",
          entityType: "run_source",
          entityId: sourceId,
          summary: `Could not read "${source.label}": ${outcome.reason}`,
        });
        revalidatePath(`/app/${orgSlug}/intelligence/runs/${source.runId}`);
        return err(outcome.reason, "workflow");
      }

      items = [
        {
          kind: researchKindForSource(kind),
          title: outcome.title.slice(0, 300),
          body: outcome.text,
          url: outcome.url,
          sourceName: hostOf(outcome.url),
          collectedVia: "run",
          meta: {
            sourceType: kind,
            collectionMode: "url",
            contentType: outcome.contentType,
            fetchedAt: outcome.fetchedAt.toISOString(),
            runSourceId: sourceId,
          },
        },
      ];
    } else {
      const content = cleanText(input.content ?? source.content ?? "", 60_000);
      if (content.length < 20) {
        return err(
          "Paste the material this source contributes. A source with no content cannot support a signal.",
          "validation",
          { content: "Add the content." },
        );
      }
      items = splitPastedContent(content, source.label, kind, cleanUrl(input.url) ?? source.url, sourceId);
    }

    const { collected, duplicates } = await persistEvidence(ctx.org.id, source.runId, items);

    await prisma.runSource.update({
      where: { id: sourceId },
      data: {
        status: "collected",
        statusNote: duplicates > 0 ? `${duplicates} item(s) were already in the workspace.` : null,
        itemsCollected: collected,
        collectedAt: new Date(),
        ...(mode !== "internal" && input.content ? { content: cleanText(input.content, 60_000) } : {}),
      },
    });

    await prisma.intelligenceRun.update({
      where: { id: source.runId },
      data: { evidenceCount: await prisma.researchItem.count({ where: { orgId: ctx.org.id, runId: source.runId } }) },
    });

    await audit(ctx, {
      action: "run.source.collect",
      entityType: "run_source",
      entityId: sourceId,
      summary: `Collected ${collected} item(s) from "${source.label}"${duplicates ? `, ${duplicates} duplicate(s) skipped` : ""}`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${source.runId}`);
    revalidatePath(`/app/${orgSlug}/intelligence/radar`);

    return ok(
      { collected, duplicates },
      duplicates > 0
        ? `${collected} new item(s) collected. ${duplicates} were already in the workspace and were not duplicated.`
        : `${collected} item(s) collected.`,
    );
  });
}

/**
 * Split pasted material into separate evidence items.
 *
 * Blank-line separated blocks become one item each, which is how call notes and
 * quote collections are actually written. A single block stays a single item.
 */
function splitPastedContent(
  content: string,
  label: string,
  kind: string,
  url: string | null,
  sourceId: string,
): PreparedEvidence[] {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length >= 20);

  const chosen = blocks.length > 1 ? blocks.slice(0, 40) : [content.trim()];

  return chosen.map((block, index) => ({
    kind: researchKindForSource(kind),
    title:
      chosen.length > 1
        ? `${label} — ${firstLine(block).slice(0, 160)}`
        : `${label}`.slice(0, 300),
    body: block,
    url,
    sourceName: label,
    collectedVia: "run",
    meta: {
      sourceType: kind,
      collectionMode: "manual",
      runSourceId: sourceId,
      blockIndex: index,
      suppliedBy: "human",
    },
  }));
}

/* -------------------------------- Synthesis -------------------------------- */

/**
 * Propose candidate signals from the evidence gathered.
 *
 * Nothing written here influences strategy. Every row lands as `pending` and
 * needs a human decision, and any candidate whose citations do not resolve to
 * evidence actually supplied is dropped by the generator before it gets here.
 */
export async function synthesiseRunAction(
  orgSlug: string,
  runId: string,
): Promise<ActionResult<{ created: number; dropped: number; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    await enforceRateLimit("ai", LIMITS.aiGeneration);

    const run = await prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId: ctx.org.id },
      select: { id: true, status: true, focus: true },
    });
    if (!run) return err("That run no longer exists.", "not_found");
    if (run.status === "published" || run.status === "archived") {
      return err("This run is closed.", "workflow");
    }

    const evidence = await prisma.researchItem.findMany({
      where: { orgId: ctx.org.id, runId },
      orderBy: { capturedAt: "desc" },
      take: 60,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        url: true,
        sourceName: true,
        author: true,
        capturedAt: true,
      },
    });

    if (evidence.length === 0) {
      return err(
        "There is no evidence in this run yet. Collect at least one source before extracting signals.",
        "workflow",
      );
    }

    const { signals, dropped, meta } = await extractSignals({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      evidence,
      focus: run.focus ?? undefined,
      maxSignals: 8,
    });

    // Do not re-propose a title this run has already put in front of a person.
    const existingTitles = new Set(
      (
        await prisma.candidateSignal.findMany({
          where: { orgId: ctx.org.id, runId },
          select: { title: true },
        })
      ).map((c) => c.title.toLowerCase().trim()),
    );

    let created = 0;
    for (const signal of signals) {
      if (existingTitles.has(signal.title.toLowerCase().trim())) continue;
      assertCandidateHasEvidence(signal.kind, signal.evidenceItemIds.length);

      const candidate = await prisma.candidateSignal.create({
        data: {
          orgId: ctx.org.id,
          runId,
          kind: signal.kind,
          title: cleanText(signal.title, 300),
          rationale: signal.rationale ? cleanText(signal.rationale, 3000) : null,
          soWhat: signal.soWhat ? cleanText(signal.soWhat, 1000) : null,
          confidence: Math.round(signal.confidence),
          decision: "pending",
          generatedBy: "ai",
        },
      });

      await prisma.candidateEvidence.createMany({
        data: signal.evidenceItemIds.map((researchItemId) => ({
          candidateSignalId: candidate.id,
          researchItemId,
        })),
      });
      created += 1;
    }

    await prisma.intelligenceRun.update({
      where: { id: runId },
      data: {
        status: run.status === "collecting" ? "synthesis" : run.status,
        signalCount: await prisma.candidateSignal.count({ where: { orgId: ctx.org.id, runId } }),
      },
    });

    await audit(ctx, {
      action: "run.synthesise",
      entityType: "intelligence_run",
      entityId: runId,
      summary: `Proposed ${created} candidate signal(s) from ${evidence.length} evidence item(s)`,
      meta: { dropped, provider: meta.provider, isDemo: meta.isDemo },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${runId}`);

    return ok(
      { created, dropped, isDemo: meta.isDemo },
      dropped > 0
        ? `${created} candidate(s) proposed. ${dropped} were discarded because their citations did not resolve to collected evidence.`
        : `${created} candidate(s) proposed for review.`,
    );
  });
}

/* -------------------------------- Candidates ------------------------------- */

const candidateEditSchema = z.object({
  kind: candidateKindSchema,
  title: z.string().min(3, "Give the signal a title.").max(300),
  rationale: z.string().max(3000).optional(),
  soWhat: z.string().max(1000).optional(),
  confidence: z.coerce.number().min(0).max(100).default(50),
});

/** Edit a candidate before deciding on it. Records that a human changed it. */
export async function updateCandidateAction(
  orgSlug: string,
  candidateId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    const input = parseForm(candidateEditSchema, formData);

    const candidate = await prisma.candidateSignal.findFirst({
      where: { id: candidateId, orgId: ctx.org.id },
      select: { id: true, runId: true, decision: true, title: true },
    });
    if (!candidate) return err("That candidate no longer exists.", "not_found");
    if (candidate.decision !== "pending") {
      return err("This candidate has already been decided.", "workflow");
    }

    await prisma.candidateSignal.update({
      where: { id: candidateId },
      data: {
        kind: input.kind,
        title: cleanText(input.title, 300),
        rationale: input.rationale ? cleanText(input.rationale, 3000) : null,
        soWhat: input.soWhat ? cleanText(input.soWhat, 1000) : null,
        confidence: Math.round(input.confidence),
        editedByHuman: true,
      },
    });

    await audit(ctx, {
      action: "candidate.edit",
      entityType: "candidate_signal",
      entityId: candidateId,
      summary: `Edited candidate "${candidate.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${candidate.runId}`);

    return okVoid("Candidate updated.");
  });
}

/**
 * Approve or reject a candidate.
 *
 * This is the only route by which anything proposed by the system becomes part
 * of the strategy. Approval creates a Pattern in the existing signal engine and
 * carries the evidence trail with it, so a published post can still be traced
 * back to the specific source that started it.
 */
export async function decideCandidateAction(
  orgSlug: string,
  candidateId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<ActionResult<{ patternId: string | null }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");

    const candidate = await prisma.candidateSignal.findFirst({
      where: { id: candidateId, orgId: ctx.org.id },
      include: { evidence: { select: { researchItemId: true } } },
    });
    if (!candidate) return err("That candidate no longer exists.", "not_found");
    if (candidate.decision !== "pending") {
      return err("This candidate has already been decided.", "workflow");
    }

    const cleanNote = note ? cleanText(note, 1000) : null;

    if (decision === "rejected") {
      if (!cleanNote || cleanNote.length < 3) {
        return err(
          "Say why it was rejected. A rejected signal with no reason teaches the next cycle nothing.",
          "validation",
          { note: "Give a reason." },
        );
      }
      await prisma.candidateSignal.update({
        where: { id: candidateId },
        data: {
          decision: "rejected",
          decisionNote: cleanNote,
          decidedById: ctx.user.id,
          decidedAt: new Date(),
        },
      });
      await audit(ctx, {
        action: "candidate.reject",
        entityType: "candidate_signal",
        entityId: candidateId,
        summary: `Rejected candidate "${candidate.title}": ${cleanNote}`,
      });
      revalidatePath(`/app/${orgSlug}/intelligence/runs/${candidate.runId}`);
      return ok<{ patternId: string | null }>({ patternId: null }, "Candidate rejected.");
    }

    assertCandidateHasEvidence(candidate.kind as never, candidate.evidence.length);

    const impact = 3;
    const effort = 3;
    const pattern = await prisma.pattern.create({
      data: {
        orgId: ctx.org.id,
        runId: candidate.runId,
        kind: "pattern",
        title: candidate.title,
        description: [candidate.rationale, candidate.soWhat ? `So what: ${candidate.soWhat}` : null]
          .filter(Boolean)
          .join("\n\n"),
        status: "open",
        confidence: candidate.confidence,
        impact,
        effort,
        score: patternScore({ confidence: candidate.confidence, impact, effort }),
        detectedBy: "intelligence_run",
      },
    });

    if (candidate.evidence.length > 0) {
      await prisma.patternEvidence.createMany({
        data: candidate.evidence.map((e) => ({
          patternId: pattern.id,
          researchItemId: e.researchItemId,
          note: "Cited when this signal was approved.",
        })),
      });
    }

    await prisma.candidateSignal.update({
      where: { id: candidateId },
      data: {
        decision: "approved",
        decisionNote: cleanNote,
        decidedById: ctx.user.id,
        decidedAt: new Date(),
        patternId: pattern.id,
      },
    });

    await prisma.intelligenceRun.update({
      where: { id: candidate.runId },
      data: {
        approvedCount: await prisma.candidateSignal.count({
          where: { orgId: ctx.org.id, runId: candidate.runId, decision: "approved" },
        }),
      },
    });

    await audit(ctx, {
      action: "candidate.approve",
      entityType: "pattern",
      entityId: pattern.id,
      summary: `Approved candidate "${candidate.title}" into the signal engine`,
      meta: { candidateId, evidence: candidate.evidence.length },
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${candidate.runId}`);
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);

    return ok<{ patternId: string | null }>(
      { patternId: pattern.id },
      "Approved. It is now a signal in this workspace.",
    );
  });
}

/* ------------------------------- Content tests ------------------------------ */

const testSchema = z.object({
  title: z.string().min(5, "Describe the test.").max(300),
  description: z.string().max(3000).optional(),
  successMetric: z.string().min(3, "Say how this will be read.").max(300),
  impact: z.coerce.number().min(1).max(5).default(3),
  effort: z.coerce.number().min(1).max(5).default(3),
});

/**
 * Turn an approved signal into a ranked content test.
 *
 * The test is a Pattern of kind `test` linked back to the signal it came from,
 * so the chain research -> signal -> test -> idea -> script -> content stays
 * navigable in both directions.
 */
export async function createTestFromSignalAction(
  orgSlug: string,
  patternId: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    const input = parseForm(testSchema, formData);

    const signal = await prisma.pattern.findFirst({
      where: { id: patternId, orgId: ctx.org.id },
      include: { evidence: { select: { researchItemId: true, contentItemId: true } } },
    });
    if (!signal) return err("That signal no longer exists.", "not_found");
    if (signal.kind === "test") {
      return err("That is already a test.", "validation");
    }

    const score = testRankScore({
      confidence: signal.confidence,
      impact: input.impact,
      effort: input.effort,
      evidenceCount: signal.evidence.length,
    });

    const siblings = await prisma.pattern.count({
      where: { orgId: ctx.org.id, kind: "test", runId: signal.runId },
    });

    const test = await prisma.pattern.create({
      data: {
        orgId: ctx.org.id,
        runId: signal.runId,
        derivedFromId: signal.id,
        kind: "test",
        title: cleanText(input.title, 300),
        description: input.description ? cleanText(input.description, 3000) : signal.description,
        status: "open",
        confidence: signal.confidence,
        impact: input.impact,
        effort: input.effort,
        score,
        rank: siblings + 1,
        successMetric: cleanText(input.successMetric, 300),
        nextExperiment: cleanText(input.title, 300),
        detectedBy: "intelligence_run",
      },
    });

    const researchIds = signal.evidence
      .map((e) => e.researchItemId)
      .filter((id): id is string => Boolean(id));
    if (researchIds.length > 0) {
      await prisma.patternEvidence.createMany({
        data: researchIds.map((researchItemId) => ({
          patternId: test.id,
          researchItemId,
          note: "Inherited from the signal this test came from.",
        })),
      });
    }

    if (signal.runId) {
      await prisma.intelligenceRun.update({
        where: { id: signal.runId },
        data: {
          testCount: await prisma.pattern.count({
            where: { orgId: ctx.org.id, kind: "test", runId: signal.runId },
          }),
        },
      });
    }

    await audit(ctx, {
      action: "test.create",
      entityType: "pattern",
      entityId: test.id,
      summary: `Queued content test "${test.title}" from signal "${signal.title}"`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);
    if (signal.runId) revalidatePath(`/app/${orgSlug}/intelligence/runs/${signal.runId}`);

    return ok({ id: test.id }, "Test queued.");
  });
}

const feedbackSchema = z.object({
  outcome: z.enum(["supported", "contradicted", "mixed"]),
  note: z.string().min(10, "Say what the numbers showed.").max(2000),
});

/**
 * Feed a measured result back into a signal.
 *
 * The confidence step is small and bounded (see `adjustedConfidence`): one
 * cycle is not proof, and a signal should need several consistent reads before
 * the system treats it as settled. The note is required because a confidence
 * number with no explanation is not evidence of anything.
 */
export async function recordTestFeedbackAction(
  orgSlug: string,
  patternId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "signals.edit");
    const input = parseForm(feedbackSchema, formData);

    const test = await prisma.pattern.findFirst({
      where: { id: patternId, orgId: ctx.org.id },
      select: { id: true, title: true, confidence: true, derivedFromId: true, runId: true, impact: true, effort: true },
    });
    if (!test) return err("That test no longer exists.", "not_found");

    const note = cleanText(input.note, 2000);
    const nextConfidence = adjustedConfidence(test.confidence, input.outcome);

    await prisma.pattern.update({
      where: { id: patternId },
      data: {
        confidence: nextConfidence,
        score: patternScore({ confidence: nextConfidence, impact: test.impact, effort: test.effort }),
        status: input.outcome === "supported" ? "validated" : input.outcome === "contradicted" ? "rejected" : "testing",
        feedbackNote: note,
        lastFeedbackAt: new Date(),
      },
    });

    // The signal the test came from moves too, by the same bounded step. That
    // is the loop closing: what actually happened changes what we believe.
    if (test.derivedFromId) {
      const parent = await prisma.pattern.findFirst({
        where: { id: test.derivedFromId, orgId: ctx.org.id },
        select: { id: true, confidence: true, impact: true, effort: true },
      });
      if (parent) {
        const parentConfidence = adjustedConfidence(parent.confidence, input.outcome);
        await prisma.pattern.update({
          where: { id: parent.id },
          data: {
            confidence: parentConfidence,
            score: patternScore({
              confidence: parentConfidence,
              impact: parent.impact,
              effort: parent.effort,
            }),
            feedbackNote: `From test "${test.title}": ${note}`,
            lastFeedbackAt: new Date(),
          },
        });
      }
    }

    await audit(ctx, {
      action: "test.feedback",
      entityType: "pattern",
      entityId: patternId,
      summary: `Recorded ${input.outcome} result for test "${test.title}"`,
      meta: { from: test.confidence, to: nextConfidence },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/signals`);
    if (test.runId) revalidatePath(`/app/${orgSlug}/intelligence/runs/${test.runId}`);

    return okVoid("Result recorded. Confidence moved by one bounded step.");
  });
}

/* ---------------------------------- Brief ---------------------------------- */

/** Draft the brief opening. The operator edits it before publishing. */
export async function draftBriefSummaryAction(
  orgSlug: string,
  runId: string,
): Promise<ActionResult<{ summary: string; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "runs.manage");
    await enforceRateLimit("ai", LIMITS.aiGeneration);

    const run = await prisma.intelligenceRun.findFirst({
      where: { id: runId, orgId: ctx.org.id },
      include: {
        candidates: {
          where: { decision: "approved" },
          include: { _count: { select: { evidence: true } } },
        },
        sources: { select: { kind: true, label: true, status: true, itemsCollected: true } },
        patterns: { where: { kind: "test" }, select: { title: true, successMetric: true } },
      },
    });
    if (!run) return err("That run no longer exists.", "not_found");
    if (run.status === "published") {
      return err("This brief is published and frozen.", "workflow");
    }

    const collected = run.sources.filter((s) => s.status === "collected");
    const unavailable = run.sources.filter((s) => s.status === "unavailable");
    const sourceSummary = [
      `${collected.length} source(s) read, contributing ${collected.reduce((sum, s) => sum + s.itemsCollected, 0)} items.`,
      unavailable.length > 0
        ? `${unavailable.length} source(s) could not be collected: ${unavailable.map((s) => s.label).join(", ")}.`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    const { summary, meta } = await generateBriefSummary({
      orgId: ctx.org.id,
      userId: ctx.user.id,
      periodLabel: `${run.periodStart.toISOString().slice(0, 10)} to ${run.periodEnd.toISOString().slice(0, 10)}`,
      approvedSignals: run.candidates.map((c) => ({
        title: c.title,
        soWhat: c.soWhat,
        evidenceCount: c._count.evidence,
      })),
      tests: run.patterns.map((p) => ({ title: p.title, successMetric: p.successMetric })),
      sourceSummary,
    });

    await prisma.intelligenceRun.update({
      where: { id: runId },
      data: { summary: cleanText(summary, 6000) },
    });

    await audit(ctx, {
      action: "run.brief.draft",
      entityType: "intelligence_run",
      entityId: runId,
      summary: `Drafted the brief summary for "${run.label}"`,
      meta: { provider: meta.provider, isDemo: meta.isDemo },
    });
    revalidatePath(`/app/${orgSlug}/intelligence/runs/${runId}`);

    return ok(
      { summary, isDemo: meta.isDemo },
      "Draft written. Read it before publishing — it goes to the client as written.",
    );
  });
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function firstLine(value: string) {
  return value.split("\n")[0]?.trim() ?? value.slice(0, 120);
}

