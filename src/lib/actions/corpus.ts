"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { auditInternal } from "@/lib/auth/audit";
import { requireInternalStrict } from "@/lib/auth/guard";
import { runStructured } from "@/lib/ai";
import { analyseExamplePrompt, judgePrompt } from "@/lib/ai/prompts";
import { stringify } from "@/lib/db/json";
import { calibrationPairs } from "@/lib/data/corpus";
import { calibrationReading, judgeVerdict, RUBRIC, RUBRIC_VERSION } from "@/lib/domain/judge";
import {
  BULK_CAPTURE_LIMIT,
  BUYER_RELEVANCE,
  COMMERCIAL_INTENT,
  EXAMPLE_FORMATS,
} from "@/lib/domain/corpus";
import { enrichExampleUrl, parseUrlList } from "@/lib/integrations/corpus-enrich";
import { cleanText, cleanUrl, err, guarded, ok, okVoid, optionalDate, parseForm, type ActionResult } from "./shared";

/**
 * The research corpus and the Judge.
 *
 * Three rules run through this file:
 *
 *   1. **Examples are captured, never invented.** The URL is required and
 *      unique. An example with no source is an opinion with a view count.
 *   2. **The Judge scores criteria; the verdict is our arithmetic.** The model
 *      is never asked for an overall or a pass/fail, so the threshold stays
 *      auditable and cannot drift between runs.
 *   3. **Every verdict is written `calibrated: false`.** Stored rather than
 *      computed, so a later calibration run cannot retrospectively promote an
 *      opinion formed before there was any evidence for it.
 */

const zodResult =
  <T>(schema: z.ZodType<T>) =>
  (value: unknown) => {
    const parsed = schema.safeParse(value);
    return parsed.success
      ? ({ success: true, data: parsed.data } as const)
      : ({ success: false, error: parsed.error.issues.map((i) => i.message).join("; ") } as const);
  };

/* ------------------------------ Adding examples ----------------------------- */

const exampleSchema = z.object({
  url: z.string().min(8, "The source URL is what makes this an example rather than an anecdote."),
  platform: z.string().min(2).max(40),
  format: z.enum(EXAMPLE_FORMATS).default("unknown"),
  buyerRelevance: z.enum(BUYER_RELEVANCE).default("unrated"),
  commercialIntent: z.enum(COMMERCIAL_INTENT).default("unrated"),
  creatorHandle: z.string().min(1, "Which creator published it?").max(120),
  creatorName: z.string().max(200).optional(),
  title: z.string().min(2, "Give it a title you will recognise.").max(400),
  wedgeId: z.string().optional(),
  publishedAt: optionalDate,
  views: z.coerce.number().int().min(0).default(0),
  likes: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
  shares: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  followers: z.coerce.number().int().min(0).default(0),
  transcript: z.string().max(60_000).optional(),
  notes: z.string().max(8000).optional(),
});

export async function addExampleAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    const input = parseForm(exampleSchema, formData);

    const url = cleanUrl(input.url);
    if (!url) return err("That is not a URL the example can be traced back to.", "validation");

    const existing = await prisma.researchExample.findUnique({ where: { url }, select: { id: true } });
    if (existing) {
      // Counting the same piece twice would inflate the corpus and distort the
      // creator baseline it contributes to.
      return err("That URL is already in the corpus.", "validation");
    }

    const example = await prisma.researchExample.create({
      data: {
        url,
        platform: input.platform,
        format: input.format,
        buyerRelevance: input.buyerRelevance,
        commercialIntent: input.commercialIntent,
        creatorHandle: cleanText(input.creatorHandle, 120),
        creatorName: input.creatorName ? cleanText(input.creatorName, 200) : null,
        title: cleanText(input.title, 400),
        wedgeId: input.wedgeId || null,
        publishedAt: input.publishedAt ?? null,
        views: input.views,
        likes: input.likes,
        comments: input.comments,
        shares: input.shares,
        saves: input.saves,
        followers: input.followers,
        transcript: input.transcript ? cleanText(input.transcript, 60_000) : null,
        notes: input.notes ? cleanText(input.notes) : null,
        addedById: admin.user.id,
      },
    });

    await auditInternal(admin.user.id, {
      action: "corpus.example.add",
      entityType: "ResearchExample",
      entityId: example.id,
      summary: `Added "${example.title}" to the research corpus`,
      meta: { platform: example.platform, creator: example.creatorHandle },
    });

    revalidatePath("/admin/research");
    return ok({ id: example.id }, "Added.");
  });
}

export async function deleteExampleAction(exampleId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    const example = await prisma.researchExample.findUnique({
      where: { id: exampleId },
      select: { id: true, title: true },
    });
    if (!example) return err("That example is no longer in the corpus.", "not_found");

    await prisma.researchExample.delete({ where: { id: exampleId } });
    await auditInternal(admin.user.id, {
      action: "corpus.example.remove",
      entityType: "ResearchExample",
      entityId: exampleId,
      summary: `Removed "${example.title}" from the corpus`,
    });

    revalidatePath("/admin/research");
    return okVoid("Removed.");
  });
}

/* ------------------------------- Bulk capture -------------------------------- */

export type BulkCaptureResult = {
  added: number;
  duplicates: number;
  failed: { url: string; reason: string }[];
  /** Rows created without metrics, which is nearly all of them. */
  needMetrics: number;
  notes: string[];
};

/**
 * Paste a block of URLs and get rows.
 *
 * This is the seeding workflow. The design constraint is that a person has to
 * be able to do this 300 times without resenting it, so the paste box takes
 * whatever shape the links arrive in and everything that can be derived is
 * derived.
 *
 * **It never invents metrics.** Every row lands with `views: 0` and
 * `metricsProvenance: "manual"`, and the corpus surfaces them as needing
 * detail. A view count guessed from an engagement heuristic would flow into the
 * creator baseline and corrupt every band computed against it — a corpus that
 * lies quietly is worse than one that is visibly incomplete.
 */
export async function bulkCaptureAction(rawText: string): Promise<ActionResult<BulkCaptureResult>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");

    const urls = parseUrlList(rawText ?? "");
    if (urls.length === 0) {
      return err("No URLs in that. Paste links — one per line is easiest.", "validation");
    }
    if (urls.length > BULK_CAPTURE_LIMIT) {
      return err(
        `That is ${urls.length} URLs. ${BULK_CAPTURE_LIMIT} at a time keeps the capture quick enough to stay interactive — split the rest into a second paste.`,
        "validation",
      );
    }

    const result: BulkCaptureResult = {
      added: 0,
      duplicates: 0,
      failed: [],
      needMetrics: 0,
      notes: [],
    };

    const wedge = await prisma.marketWedge.findFirst({
      where: { active: true },
      select: { id: true },
    });

    for (const raw of urls) {
      const url = cleanUrl(raw);
      if (!url) {
        result.failed.push({ url: raw, reason: "Not a URL that can be stored." });
        continue;
      }

      const existing = await prisma.researchExample.findUnique({
        where: { url },
        select: { id: true },
      });
      if (existing) {
        result.duplicates += 1;
        continue;
      }

      const enriched = await enrichExampleUrl(url);
      if ("error" in enriched) {
        result.failed.push({ url, reason: enriched.error });
        continue;
      }

      await prisma.researchExample.create({
        data: {
          url: enriched.url,
          platform: enriched.platform,
          format: enriched.format,
          // The title falls back to the URL rather than to something invented,
          // so an unenriched row is obviously unfinished at a glance.
          title: enriched.title ?? enriched.url,
          creatorHandle: enriched.creatorHandle ?? "unattributed",
          creatorName: enriched.creatorName,
          wedgeId: wedge?.id ?? null,
          transcript: enriched.transcript,
          provenance: enriched.provenance,
          metricsProvenance: "manual",
          enrichedAt: new Date(),
          enrichmentNote: enriched.note,
          addedById: admin.user.id,
        },
      });

      result.added += 1;
      result.needMetrics += 1;
      if (enriched.note && !result.notes.includes(enriched.note)) result.notes.push(enriched.note);
    }

    await auditInternal(admin.user.id, {
      action: "corpus.bulk_capture",
      entityType: "ResearchExample",
      summary: `Captured ${result.added} of ${urls.length} pasted URLs`,
      meta: { duplicates: result.duplicates, failed: result.failed.length },
    });

    revalidatePath("/admin/research");

    const summary = [
      `${result.added} added`,
      result.duplicates ? `${result.duplicates} already in the corpus` : "",
      result.failed.length ? `${result.failed.length} could not be read` : "",
    ]
      .filter(Boolean)
      .join(", ");

    return ok(result, `${summary}. Every row still needs its numbers.`);
  });
}

/* ------------------------------- Adding detail ------------------------------- */

const metricsSchema = z.object({
  exampleId: z.string().min(1),
  creatorHandle: z.string().min(1).max(120).optional(),
  title: z.string().min(2).max(400).optional(),
  publishedAt: z.string().optional(),
  views: z.coerce.number().int().min(0),
  likes: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
  shares: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  followers: z.coerce.number().int().min(0).default(0),
  transcript: z.string().max(60_000).optional(),
});

/**
 * Fill in the half no public endpoint will give us.
 *
 * Separate from rating on purpose: this is transcription, which is fast and
 * mechanical, while rating is judgement. Mixing them produces worse ratings.
 */
export async function fillMetricsAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    const input = parseForm(metricsSchema, formData);

    const example = await prisma.researchExample.findUnique({
      where: { id: input.exampleId },
      select: { id: true, title: true },
    });
    if (!example) return err("That example is no longer in the corpus.", "not_found");

    const published = input.publishedAt ? new Date(input.publishedAt) : null;

    await prisma.researchExample.update({
      where: { id: example.id },
      data: {
        views: input.views,
        likes: input.likes,
        comments: input.comments,
        shares: input.shares,
        saves: input.saves,
        followers: input.followers,
        metricsProvenance: "manual",
        ...(input.creatorHandle ? { creatorHandle: cleanText(input.creatorHandle, 120) } : {}),
        ...(input.title ? { title: cleanText(input.title, 400) } : {}),
        ...(published && !Number.isNaN(published.getTime()) ? { publishedAt: published } : {}),
        ...(input.transcript ? { transcript: cleanText(input.transcript, 60_000) } : {}),
      },
    });

    await auditInternal(admin.user.id, {
      action: "corpus.example.metrics",
      entityType: "ResearchExample",
      entityId: example.id,
      summary: `Recorded metrics for "${example.title}"`,
      meta: { views: input.views },
    });

    revalidatePath("/admin/research");
    return ok({ id: example.id }, "Recorded.");
  });
}

/* --------------------------------- Rating ----------------------------------- */

const rateSchema = z.object({
  exampleId: z.string().min(1),
  buyerRelevance: z.enum(BUYER_RELEVANCE),
  commercialIntent: z.enum(COMMERCIAL_INTENT),
  format: z.enum(EXAMPLE_FORMATS).optional(),
});

/**
 * Rate one example for who it was actually for.
 *
 * This is the judgement the corpus cannot make for itself and will not fake. It
 * is separated from `addExampleAction` on purpose: capture should be fast enough
 * to paste fifty URLs in a sitting, and rating is a slower, more considered pass
 * done afterwards. Forcing them together would make the operator do the hard
 * part fifty times in a row and produce worse ratings for it.
 */
export async function rateExampleAction(input: {
  exampleId: string;
  buyerRelevance: string;
  commercialIntent: string;
  format?: string;
}): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");
    const parsed = rateSchema.safeParse(input);
    if (!parsed.success) return err("That is not a rating this corpus understands.", "validation");

    const example = await prisma.researchExample.findUnique({
      where: { id: parsed.data.exampleId },
      select: { id: true, title: true },
    });
    if (!example) return err("That example is no longer in the corpus.", "not_found");

    await prisma.researchExample.update({
      where: { id: example.id },
      data: {
        buyerRelevance: parsed.data.buyerRelevance,
        commercialIntent: parsed.data.commercialIntent,
        ...(parsed.data.format ? { format: parsed.data.format } : {}),
      },
    });

    await auditInternal(admin.user.id, {
      action: "corpus.example.rate",
      entityType: "ResearchExample",
      entityId: example.id,
      summary: `Rated "${example.title}" ${parsed.data.buyerRelevance} / ${parsed.data.commercialIntent}`,
    });

    revalidatePath("/admin/research");
    return okVoid("Rated.");
  });
}

/* -------------------------------- Analysis ---------------------------------- */

const analysisSchema = z.object({
  topic: z.string().max(400).default(""),
  buyerPain: z.string().max(600).default(""),
  hook: z.string().max(600).default(""),
  thesis: z.string().max(800).default(""),
  promise: z.string().max(600).default(""),
  proof: z.string().max(800).default(""),
  format: z.string().max(200).default(""),
  storyStructure: z.string().max(600).default(""),
  cta: z.string().max(400).default(""),
  emotionalDriver: z.string().max(400).default(""),
  whyItWorked: z.string().max(1200).default(""),
  commercialRelevance: z.enum(["commercial", "mixed", "entertainment"]).default("mixed"),
});

export async function analyseExampleAction(exampleId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");

    const example = await prisma.researchExample.findUnique({
      where: { id: exampleId },
      include: { wedge: { select: { label: true } } },
    });
    if (!example) return err("That example is no longer in the corpus.", "not_found");

    const template = analyseExamplePrompt({
      platform: example.platform,
      creator: example.creatorName ?? example.creatorHandle,
      title: example.title,
      transcript: example.transcript ?? "",
      notes: example.notes ?? "",
      wedge: example.wedge?.label ?? "",
    });

    const { data, meta } = await runStructured(
      template,
      {
        orgId: null,
        userId: admin.user.id,
        kind: "corpus",
        entityType: "ResearchExample",
        entityId: example.id,
        demoContext: { title: example.title, platform: example.platform },
      },
      zodResult(analysisSchema),
    );

    await prisma.exampleAnalysis.upsert({
      where: { exampleId: example.id },
      create: {
        exampleId: example.id,
        ...data,
        provider: meta.provider,
        model: meta.model,
        promptVersion: template.key,
      },
      update: {
        ...data,
        provider: meta.provider,
        model: meta.model,
        promptVersion: template.key,
      },
    });

    revalidatePath("/admin/research");
    return okVoid(meta.isDemo ? "Analysed with the offline provider — set an API key for a real reading." : "Analysed.");
  });
}

/* --------------------------------- The Judge -------------------------------- */

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
});

async function runJudge(input: {
  userId: string;
  subjectKind: string;
  subject: string;
  context: string;
  orgId: string | null;
  entityType: string;
  entityId: string;
}) {
  const template = judgePrompt({
    rubric: RUBRIC.map(({ key, label, question, why }) => ({ key, label, question, why })),
    subjectKind: input.subjectKind,
    subject: input.subject,
    context: input.context,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "judge",
      entityType: input.entityType,
      entityId: input.entityId,
      demoContext: { rubricKeys: RUBRIC.map((c) => c.key) },
    },
    zodResult(judgeResponseSchema),
  );

  // The verdict is computed here, not asked of the model.
  const result = judgeVerdict(
    data.scores.map((s) => ({ key: s.key, score: Math.round(s.score), reason: s.reason })),
  );

  return { result, meta };
}

/** Judge a corpus example, which is what makes calibration possible. */
export async function judgeExampleAction(exampleId: string): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");

    const example = await prisma.researchExample.findUnique({
      where: { id: exampleId },
      include: { analysis: true, wedge: { select: { label: true } } },
    });
    if (!example) return err("That example is no longer in the corpus.", "not_found");

    const subject = [
      `Title: ${example.title}`,
      example.analysis?.hook ? `Hook: ${example.analysis.hook}` : "",
      example.analysis?.thesis ? `Thesis: ${example.analysis.thesis}` : "",
      example.transcript ? `Transcript:\n${example.transcript.slice(0, 12_000)}` : "",
      example.notes ? `Notes: ${example.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { result, meta } = await runJudge({
      userId: admin.user.id,
      subjectKind: "piece of market content, scored as if it were a candidate for our own client",
      subject,
      context: example.wedge?.label ? `Market: ${example.wedge.label}` : "",
      orgId: null,
      entityType: "ResearchExample",
      entityId: example.id,
    });

    await prisma.judgeVerdict.create({
      data: {
        subjectType: "example",
        subjectId: example.id,
        exampleId: example.id,
        rubricVersion: result.rubricVersion,
        overall: result.overall,
        verdict: result.verdict,
        scores: stringify(result.scores),
        concerns: stringify(result.concerns),
        calibrated: false,
        provider: meta.provider,
        model: meta.model,
      },
    });

    revalidatePath("/admin/research");
    return okVoid(`Scored ${result.overall}/100 — ${result.verdict}. Uncalibrated.`);
  });
}

/* ------------------------------ Calibration run ----------------------------- */

/**
 * Freeze what the Judge's opinion looked like against reality today.
 *
 * Stored rather than always recomputed, because the corpus grows: a run records
 * what was concluded on the evidence available at the time, which is the only
 * way to see whether changing the rubric later actually helped.
 */
export async function runCalibrationAction(): Promise<ActionResult> {
  return guarded(async () => {
    const admin = await requireInternalStrict("corpus.manage");

    const { pairs, excludedIllustrative } = await calibrationPairs();
    const reading = calibrationReading(pairs);

    await prisma.judgeCalibration.create({
      data: {
        rubricVersion: RUBRIC_VERSION,
        pairs: reading.pairs,
        outperformers: reading.outperformers,
        separation: reading.separation,
        sufficient: reading.sufficient,
        reading: reading.reading,
        payload: stringify({ ...reading, excludedIllustrative }),
        runById: admin.user.id,
      },
    });

    await auditInternal(admin.user.id, {
      action: "judge.calibration",
      entityType: "JudgeCalibration",
      summary: `Calibration run over ${reading.pairs} scored examples`,
      meta: { separation: reading.separation, sufficient: reading.sufficient },
    });

    revalidatePath("/admin/research/calibration");
    return okVoid(reading.sufficient ? "Recorded." : "Recorded — and the sample is still too thin to conclude from.");
  });
}
