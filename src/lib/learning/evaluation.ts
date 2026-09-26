import "server-only";
import { prisma } from "@/lib/db/client";
import { WorkflowError } from "@/lib/domain/workflow";
import { evaluateVariants, type EvalPair } from "@/lib/domain/evaluation";
import { listExamples } from "@/lib/data/corpus";

/**
 * Held-out evaluation and human promotion of Judge variants (LRN-03).
 * See src/lib/domain/evaluation.ts for the method.
 */
const OUTPERFORMED = new Set(["strong", "exceptional"]);

/** The text the Judge saw for an example, rebuilt the same way it was built for judging. */
function subjectOf(e: { title: string; transcript: string | null; notes: string | null; analysis: { hook: string | null; thesis: string | null } | null }) {
  return [`Title: ${e.title}`, e.analysis?.hook ? `Hook: ${e.analysis.hook}` : "", e.analysis?.thesis ? `Thesis: ${e.analysis.thesis}` : "", e.transcript ? `Transcript:\n${e.transcript.slice(0, 12_000)}` : "", e.notes ? `Notes: ${e.notes}` : ""].filter(Boolean).join("\n");
}

export async function runEvaluation(userId: string | null, fraction = 0.3) {
  const examples = (await listExamples()).filter((e) => !e.illustrative && e.outlier.band !== "unknown");
  const ids = examples.map((e) => e.id);
  const [verdicts, rows] = await Promise.all([
    prisma.judgeVerdict.findMany({ where: { subjectType: "example", exampleId: { in: ids } }, select: { exampleId: true, overall: true, rubricVersion: true, model: true } }),
    prisma.researchExample.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, transcript: true, notes: true, views: true, likes: true, comments: true, analysis: { select: { hook: true, thesis: true } } } }),
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const band = new Map(examples.map((e) => [e.id, e.outlier.band]));
  const pairs: EvalPair[] = verdicts.flatMap((v) => {
    const ex = v.exampleId ? byId.get(v.exampleId) : undefined;
    if (!ex) return [];
    return [{ exampleId: ex.id, outperformed: OUTPERFORMED.has(String(band.get(ex.id))), overall: v.overall, variant: `${v.rubricVersion}/${v.model}`, subject: subjectOf(ex), outcome: { views: ex.views, likes: ex.likes, comments: ex.comments } }];
  });
  const results = evaluateVariants(pairs, fraction);
  return prisma.judgeEvaluation.create({ data: { fraction, results: JSON.stringify(results), runById: userId } });
}

export async function currentPromotion() {
  return prisma.judgePromotion.findFirst({ where: { retiredAt: null }, orderBy: { promotedAt: "desc" } });
}

/** A person promotes a variant; only one that was evaluated with a sufficient held-out set. */
export async function promoteVariant(userId: string, evaluationId: string, variant: string, note?: string) {
  const ev = await prisma.judgeEvaluation.findUnique({ where: { id: evaluationId } });
  if (!ev) throw new WorkflowError("That evaluation no longer exists.");
  const result = (JSON.parse(ev.results) as { variant: string; sufficient: boolean; auc: number | null }[]).find((r) => r.variant === variant);
  if (!result) throw new WorkflowError("That variant was not in the evaluation.");
  if (!result.sufficient) throw new WorkflowError("Too few held-out examples to promote on this evaluation.");
  if (result.auc === null || result.auc <= 0.5) throw new WorkflowError(`Its held-out ranking (AUC ${result.auc ?? "n/a"}) is no better than chance.`);
  return prisma.judgePromotion.create({ data: { variant, evaluationId, note: note?.trim().slice(0, 500) || null, promotedById: userId } });
}

/** Retire the current promotion; the previous one is in force again. */
export async function rollbackPromotion(userId: string) {
  const cur = await currentPromotion();
  if (!cur) throw new WorkflowError("Nothing is promoted.");
  await prisma.judgePromotion.update({ where: { id: cur.id }, data: { retiredAt: new Date(), retiredById: userId } });
  return currentPromotion();
}
