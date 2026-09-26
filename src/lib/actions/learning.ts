"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { runStructured } from "@/lib/ai";
import { judgePrompt } from "@/lib/ai/prompts";
import { stringify } from "@/lib/db/json";
import { actualForContent, latestExpectation } from "@/lib/data/content-learning";
import {
  CORRECTION_LEVERS,
  FAILURE_CLASSES,
  prescribe,
  readGap,
  SUGGESTED_LEVER,
  type DimensionScore,
} from "@/lib/domain/content-diagnosis";
import { judgeVerdict, RUBRIC, RUBRIC_VERSION } from "@/lib/domain/judge";
import { cleanText, err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * The learning loop, written.
 *
 * Four rules run through this file:
 *
 *   1. **An expectation is frozen.** Once written it is never updated, only
 *      superseded by a newer one carrying its own rubric version. A prediction
 *      edited after the result is known is not a prediction.
 *   2. **A diagnosis starts as a draft.** The machine may propose a cause; only
 *      a person makes it authoritative, because a wrong cause recorded
 *      confidently teaches the system something false for as long as it lives.
 *   3. **Evidence is frozen into the diagnosis.** Snapshots keep arriving; the
 *      judgement has to stay readable as the conclusion drawn on the evidence
 *      available that day.
 *   4. **A correction's verdict stays null until a retest is read.** Null is
 *      not "no". Most corrections are pending most of the time and the reports
 *      say so.
 */

const zodResult =
  <T>(schema: z.ZodType<T>) =>
  (value: unknown) => {
    const parsed = schema.safeParse(value);
    return parsed.success
      ? ({ success: true, data: parsed.data } as const)
      : ({ success: false, error: parsed.error.issues.map((i) => i.message).join("; ") } as const);
  };

/* ----------------------------------- Roots ----------------------------------- */

const rootSchema = z.object({
  label: z.string().min(2, "Give the thesis a name you will recognise.").max(160),
  thesis: z.string().min(10, "State the claim being tested in a sentence.").max(1000),
  audience: z.string().max(300).optional(),
  pillar: z.string().max(120).optional(),
});

export async function createRootAction(
  slug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");
    const input = parseForm(rootSchema, formData);

    const root = await prisma.contentRoot.create({
      data: {
        orgId: ctx.org.id,
        label: cleanText(input.label, 160),
        thesis: cleanText(input.thesis, 1000),
        audience: input.audience ? cleanText(input.audience, 300) : null,
        pillar: input.pillar ? cleanText(input.pillar, 120) : null,
        createdById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "learning.root.create",
      entityType: "ContentRoot",
      entityId: root.id,
      summary: `Opened test family "${root.label}"`,
    });

    revalidatePath(`/app/${slug}/learning`);
    return ok({ id: root.id }, "Test family opened.");
  });
}

const attachSchema = z.object({
  contentItemId: z.string().min(1),
  rootId: z.string().min(1),
  lineageRole: z.enum(["source", "derivative", "retest"]).default("source"),
  derivedFromId: z.string().optional(),
});

/**
 * Put a piece of content on a thesis.
 *
 * `derivative` exists so that five cross-posts of one interview do not read as
 * five ideas tested. They are measured individually — each has its own
 * audience and its own numbers — but only `source` and `retest` count as
 * output against a service period.
 */
export async function attachToRootAction(
  slug: string,
  input: { contentItemId: string; rootId: string; lineageRole?: string; derivedFromId?: string },
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");
    const parsed = attachSchema.safeParse(input);
    if (!parsed.success) return err("That is not a lineage this system understands.", "validation");

    const [item, root] = await Promise.all([
      prisma.contentItem.findFirst({
        where: { id: parsed.data.contentItemId, orgId: ctx.org.id },
        select: { id: true, title: true },
      }),
      prisma.contentRoot.findFirst({
        where: { id: parsed.data.rootId, orgId: ctx.org.id },
        select: { id: true, label: true },
      }),
    ]);
    if (!item || !root) return err("That content or test family is no longer here.", "not_found");

    if (parsed.data.derivedFromId) {
      // A derivative must point at something in the same workspace, or the
      // lineage becomes a cross-tenant reference.
      const parent = await prisma.contentItem.findFirst({
        where: { id: parsed.data.derivedFromId, orgId: ctx.org.id },
        select: { id: true },
      });
      if (!parent) return err("The source piece is not in this workspace.", "validation");
      if (parent.id === item.id) return err("A piece cannot be derived from itself.", "validation");
    }

    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        rootId: root.id,
        lineageRole: parsed.data.lineageRole,
        derivedFromId: parsed.data.derivedFromId ?? null,
      },
    });

    await audit(ctx, {
      action: "learning.lineage.attach",
      entityType: "ContentItem",
      entityId: item.id,
      summary: `"${item.title}" attached to "${root.label}" as ${parsed.data.lineageRole}`,
    });

    revalidatePath(`/app/${slug}/learning`);
    return okVoid("Attached.");
  });
}

/* -------------------------------- Expectations -------------------------------- */

const judgeResponseSchema = z.object({
  scores: z
    .array(
      z.object({
        key: z.string().max(60),
        score: z.coerce.number().min(0).max(5),
        reason: z.string().max(1000).default(""),
      }),
    )
    .max(20),
  predictedStrengths: z.array(z.string().max(300)).max(6).default([]),
  predictedWeaknesses: z.array(z.string().max(300)).max(6).default([]),
});

/**
 * Freeze what we expect, before the piece goes out.
 *
 * The model scores criteria; the overall is our arithmetic (ADR-018). The
 * prediction is stored `calibrated: false` and is never rewritten — running
 * this again writes a *new* expectation rather than editing the old one, so the
 * record of what we believed at the time survives every rubric change.
 */
export async function recordExpectationAction(
  slug: string,
  input: { subjectType: "idea" | "script" | "content"; subjectId: string; rootId?: string },
): Promise<ActionResult<{ id: string; overall: number }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");

    const subject = await loadSubject(ctx.org.id, input.subjectType, input.subjectId);
    if (!subject) return err("That is no longer in this workspace.", "not_found");

    // LRN-01 / brief 14: an expectation is a forecast. Once the piece is out, a
    // new one would be written with the result in view, so it is refused.
    if (input.subjectType === "content") {
      const live = await prisma.contentItem.findFirst({ where: { id: input.subjectId, orgId: ctx.org.id }, select: { liveAt: true, publishRecords: { where: { status: "published" }, select: { id: true }, take: 1 } } });
      if (live && (live.liveAt || live.publishRecords.length)) return err("This piece is already published. An expectation can only be recorded before publication; the one frozen then is what it is judged against.", "workflow");
    }

    const template = judgePrompt({
      rubric: RUBRIC.map(({ key, label, question, why }) => ({ key, label, question, why })),
      subjectKind: `${input.subjectType} being considered for this client, scored before publication`,
      subject: subject.text,
      context: subject.context,
    });

    const { data, meta } = await runStructured(
      template,
      {
        orgId: ctx.org.id,
        userId: ctx.user.id,
        kind: "expectation",
        entityType: input.subjectType,
        entityId: input.subjectId,
        demoContext: { rubricKeys: RUBRIC.map((c) => c.key) },
      },
      zodResult(judgeResponseSchema),
    );

    const verdict = judgeVerdict(
      data.scores.map((s) => ({ key: s.key, score: Math.round(s.score), reason: s.reason })),
    );

    const dimensions: DimensionScore[] = verdict.scores.map((s) => ({
      key: s.key as DimensionScore["key"],
      score: s.score,
      source: "rubric",
      reason: s.reason,
    }));

    const expectation = await prisma.contentExpectation.create({
      data: {
        orgId: ctx.org.id,
        rootId: input.rootId ?? subject.rootId ?? null,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        rubricVersion: RUBRIC_VERSION,
        overall: verdict.overall,
        dimensions: stringify(dimensions),
        predictedStrengths: stringify(data.predictedStrengths),
        predictedWeaknesses: stringify(data.predictedWeaknesses),
        expectedClass:
          verdict.overall >= 85 ? "exceptional" : verdict.overall >= 70 ? "strong" : verdict.overall >= 50 ? "typical" : "under",
        confidence: "low",
        calibrated: false,
        provider: meta.provider,
        model: meta.model,
        promptVersion: template.key,
      },
    });

    await audit(ctx, {
      action: "learning.expectation.record",
      entityType: "ContentExpectation",
      entityId: expectation.id,
      summary: `Expectation frozen for ${input.subjectType} at ${verdict.overall}/100 (uncalibrated)`,
    });

    revalidatePath(`/app/${slug}/learning`);
    return ok(
      { id: expectation.id, overall: verdict.overall },
      meta.isDemo
        ? `Scored ${verdict.overall}/100 with the offline provider — set an API key before reading anything into it.`
        : `Expectation frozen at ${verdict.overall}/100. Uncalibrated and advisory.`,
    );
  });
}

async function loadSubject(
  orgId: string,
  kind: string,
  id: string,
): Promise<{ text: string; context: string; rootId: string | null } | null> {
  if (kind === "idea") {
    const idea = await prisma.idea.findFirst({ where: { id, orgId } });
    if (!idea) return null;
    return {
      text: [idea.title, idea.concept, idea.painDesire, idea.angle, idea.hookConcept]
        .filter(Boolean)
        .join("\n"),
      context: `Platform: ${idea.platform} · Format: ${idea.format}`,
      rootId: idea.rootId,
    };
  }
  if (kind === "script") {
    const script = await prisma.script.findFirst({
      where: { id, orgId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 }, idea: { select: { rootId: true } } },
    });
    if (!script) return null;
    const version = script.versions[0];
    return {
      text: [script.title, version?.hook, version?.body, version?.cta].filter(Boolean).join("\n"),
      context: `Platform: ${script.platform} · ${script.estimatedSeconds}s`,
      rootId: script.idea?.rootId ?? null,
    };
  }
  const item = await prisma.contentItem.findFirst({
    where: { id, orgId },
    include: { script: { include: { versions: { orderBy: { version: "desc" }, take: 1 } } } },
  });
  if (!item) return null;
  const version = item.script?.versions[0];
  return {
    text: [item.title, item.selectedHook, version?.hook, version?.body].filter(Boolean).join("\n"),
    context: `Platform: ${item.platform} · Format: ${item.format}`,
    rootId: item.rootId,
  };
}

/* --------------------------------- Diagnosis ---------------------------------- */

/**
 * Read a published piece against what we expected, and write a draft diagnosis.
 *
 * The failure class and prescription come from `readGap`, which is deterministic
 * arithmetic over the evidence — not an LLM opinion. A model asked "why did this
 * fail?" will always produce a fluent cause, including when the honest answer is
 * that there is not enough data to say.
 */
export async function diagnoseContentAction(
  slug: string,
  contentItemId: string,
): Promise<ActionResult<{ id: string; failureClass: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");

    const item = await prisma.contentItem.findFirst({
      where: { id: contentItemId, orgId: ctx.org.id },
      select: { id: true, title: true, rootId: true, intendedJob: true },
    });
    if (!item) return err("That content is no longer in this workspace.", "not_found");

    const [expectation, actual] = await Promise.all([
      latestExpectation(ctx.org.id, "content", contentItemId),
      actualForContent(ctx.org.id, contentItemId),
    ]);
    if (!actual) return err("That content has no publication record to read.", "validation");

    const gap = readGap({ expectation, actual, intendedJob: item.intendedJob as "discovery" | "authority" | "conversion" });
    const prescription = prescribe(gap);

    const diagnosis = await prisma.contentDiagnosis.create({
      data: {
        orgId: ctx.org.id,
        rootId: item.rootId,
        contentItemId: item.id,
        expectationId: expectation?.id ?? null,
        maturityDays: actual.maturityDays === null ? null : Math.round(actual.maturityDays),
        // Frozen: the snapshots keep arriving and this judgement must stay
        // readable as the conclusion drawn on the evidence available today.
        evidence: stringify({
          metrics: actual.metrics,
          band: actual.band,
          snapshotCount: actual.snapshotCount,
          buyerRelevanceObserved: actual.buyerRelevanceObserved,
          sufficiency: gap.sufficiency,
          positives: gap.positives,
        }),
        strongestDimension: gap.strongestDimension,
        weakestDimension: gap.weakestDimension,
        failureClass: gap.failureClass,
        explanation: gap.explanation,
        failedAssumption: gap.failedAssumption,
        confidence: gap.confidence,
        preserveThesis: gap.preserveThesis,
        prescription: prescription?.headline ?? null,
        nextIntervention: prescription?.lever ?? null,
        retestBatchSize: prescription?.retestBatchSize ?? null,
        aiAssisted: false,
        approvalState: "draft",
        createdById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "learning.diagnosis.draft",
      entityType: "ContentDiagnosis",
      entityId: diagnosis.id,
      summary: `Draft diagnosis for "${item.title}": ${gap.failureClass}`,
      meta: { confidence: gap.confidence, preserveThesis: gap.preserveThesis },
    });

    revalidatePath(`/app/${slug}/learning`);
    return ok({ id: diagnosis.id, failureClass: gap.failureClass }, "Draft diagnosis written. Review it before it counts.");
  });
}

const approveSchema = z.object({
  diagnosisId: z.string().min(1),
  failureClass: z.enum(FAILURE_CLASSES),
  explanation: z.string().min(10, "Say what happened, in a sentence somebody can check.").max(4000),
  failedAssumption: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  preserveThesis: z.coerce.boolean().default(true),
});

/**
 * A human makes the diagnosis authoritative.
 *
 * The operator may overwrite the machine's classification entirely. That is the
 * point of the review step — and the change is audited, so a pattern of the
 * arithmetic being overruled in one direction becomes visible rather than
 * disappearing into the record.
 */
export async function approveDiagnosisAction(
  slug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");
    const input = parseForm(approveSchema, formData);

    const existing = await prisma.contentDiagnosis.findFirst({
      where: { id: input.diagnosisId, orgId: ctx.org.id },
      select: { id: true, failureClass: true, approvalState: true },
    });
    if (!existing) return err("That diagnosis is no longer here.", "not_found");
    if (existing.approvalState === "approved") {
      return err("That diagnosis has already been approved.", "validation");
    }

    await prisma.contentDiagnosis.update({
      where: { id: existing.id },
      data: {
        failureClass: input.failureClass,
        explanation: cleanText(input.explanation, 4000),
        failedAssumption: input.failedAssumption ? cleanText(input.failedAssumption, 1000) : null,
        prescription: input.prescription ? cleanText(input.prescription, 1000) : null,
        preserveThesis: input.preserveThesis,
        approvalState: "approved",
        approvedAt: new Date(),
        approvedById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "learning.diagnosis.approve",
      entityType: "ContentDiagnosis",
      entityId: existing.id,
      summary:
        existing.failureClass === input.failureClass
          ? `Diagnosis approved: ${input.failureClass}`
          : `Diagnosis approved, reclassified ${existing.failureClass} → ${input.failureClass}`,
      meta: { machineClass: existing.failureClass, humanClass: input.failureClass },
    });

    revalidatePath(`/app/${slug}/learning`);
    return okVoid("Approved.");
  });
}

/* -------------------------------- Corrections ---------------------------------- */

const correctionSchema = z.object({
  diagnosisId: z.string().optional(),
  rootId: z.string().optional(),
  believed: z.string().min(5, "What did we think would happen?").max(2000),
  actual: z.string().min(5, "What actually happened?").max(2000),
  failedAssumption: z.string().min(5, "Which belief turned out to be wrong?").max(2000),
  correction: z.string().min(5, "What are we changing as a result?").max(2000),
  lever: z.enum(CORRECTION_LEVERS).default("other"),
});

/**
 * Record a correction.
 *
 * MODEL BELIEVED -> ACTUAL RESULT -> FAILED ASSUMPTION -> CORRECTION.
 *
 * `worked` is deliberately absent at creation. A correction is a hypothesis
 * until a retest has been read, and pre-filling it either way would let the
 * system congratulate itself for changes nobody has tested.
 */
export async function recordCorrectionAction(
  slug: string,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");
    const input = parseForm(correctionSchema, formData);

    let rootId = input.rootId ?? null;
    if (input.diagnosisId) {
      const diagnosis = await prisma.contentDiagnosis.findFirst({
        where: { id: input.diagnosisId, orgId: ctx.org.id },
        select: { id: true, rootId: true, failureClass: true },
      });
      if (!diagnosis) return err("That diagnosis is no longer here.", "not_found");
      rootId = rootId ?? diagnosis.rootId;
    }

    const entry = await prisma.correctionEntry.create({
      data: {
        orgId: ctx.org.id,
        rootId,
        diagnosisId: input.diagnosisId ?? null,
        believed: cleanText(input.believed, 2000),
        actual: cleanText(input.actual, 2000),
        failedAssumption: cleanText(input.failedAssumption, 2000),
        correction: cleanText(input.correction, 2000),
        lever: input.lever,
        worked: null,
        createdById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "learning.correction.record",
      entityType: "CorrectionEntry",
      entityId: entry.id,
      summary: `Correction recorded on the ${input.lever} lever`,
    });

    revalidatePath(`/app/${slug}/learning`);
    return ok({ id: entry.id }, "Correction recorded. It stays untested until a retest says otherwise.");
  });
}

const verdictSchema = z.object({
  correctionId: z.string().min(1),
  worked: z.enum(["yes", "no"]),
  verdictNote: z.string().min(5, "How do we know?").max(2000),
  retestContentItemId: z.string().optional(),
});

/** Close the loop: did the correction work? */
export async function recordCorrectionVerdictAction(
  slug: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(slug, "learning.manage");
    const input = parseForm(verdictSchema, formData);

    const entry = await prisma.correctionEntry.findFirst({
      where: { id: input.correctionId, orgId: ctx.org.id },
      select: { id: true, worked: true, lever: true },
    });
    if (!entry) return err("That correction is no longer here.", "not_found");
    // A verdict is part of the learning record. Once a retest has been read it
    // stays read; a change of mind is a new correction, not a silent rewrite.
    if (entry.worked !== null) {
      return err("A verdict has already been recorded for this correction. Record a new correction if the reading has changed.", "workflow");
    }

    await prisma.correctionEntry.update({
      where: { id: entry.id },
      data: {
        worked: input.worked === "yes",
        verdictNote: cleanText(input.verdictNote, 2000),
        verdictAt: new Date(),
        retestContentItemId: input.retestContentItemId ?? null,
      },
    });

    await audit(ctx, {
      action: "learning.correction.verdict",
      entityType: "CorrectionEntry",
      entityId: entry.id,
      summary: `Correction on the ${entry.lever} lever ${input.worked === "yes" ? "worked" : "did not work"}`,
    });

    revalidatePath(`/app/${slug}/learning`);
    return okVoid("Recorded.");
  });
}

/** The lever a failure class implies, offered as a default rather than applied. */
export async function suggestedLeverAction(failureClass: string): Promise<ActionResult<{ lever: string }>> {
  return guarded(async () => {
    const key = failureClass as keyof typeof SUGGESTED_LEVER;
    return ok({ lever: SUGGESTED_LEVER[key] ?? "other" });
  });
}
