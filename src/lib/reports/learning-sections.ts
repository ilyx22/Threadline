import "server-only";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/db/json";
import { z } from "zod";
import { FAILURE_LABELS } from "@/lib/domain/content-diagnosis";
import type { PeriodRange } from "@/lib/data/metrics";

/**
 * The learning half of a client report (brief §33 / §62), built only from
 * records that exist: frozen expectations, approved diagnoses, corrections
 * and their verdicts. Nothing here is inferred by a model. Where a section
 * has no evidence it says so — a bad week reads as a bad week, and an empty
 * week reads as empty, never as "on track".
 */

export const learningSectionsSchema = z.object({
  expectedVsActual: z.array(
    z.object({
      contentItemId: z.string(),
      title: z.string(),
      expectedClass: z.string(),
      expectedOverall: z.number(),
      actualBand: z.string(),
      failureClass: z.string(),
      sufficient: z.boolean(),
    }),
  ),
  learned: z.array(z.object({ title: z.string(), detail: z.string(), failureClass: z.string(), preserveThesis: z.boolean() })),
  weakestLink: z.object({ failureClass: z.string(), label: z.string(), count: z.number(), explanation: z.string() }).nullable(),
  whatChanged: z.array(z.object({ lever: z.string(), correction: z.string(), verdict: z.string() })),
  whetherChangeWorked: z.object({ worked: z.number(), failed: z.number(), pending: z.number(), sentence: z.string() }),
  nextTests: z.array(z.string()),
  dataLimitations: z.array(z.string()),
  stillUnknown: z.array(z.string()),
});

export type LearningSections = z.infer<typeof learningSectionsSchema>;

export const EMPTY_LEARNING: LearningSections = {
  expectedVsActual: [],
  learned: [],
  weakestLink: null,
  whatChanged: [],
  whetherChangeWorked: { worked: 0, failed: 0, pending: 0, sentence: "No correction has been retested yet." },
  nextTests: [],
  dataLimitations: [],
  stillUnknown: [],
};

const FAILURE_CLASS_LABELS: Record<string, string> = FAILURE_LABELS as Record<string, string>;

export async function computeLearningSections(orgId: string, range: PeriodRange): Promise<LearningSections> {
  const [items, diagnoses, corrections, openRoots] = await Promise.all([
    prisma.contentItem.findMany({
      where: { orgId, liveAt: { gte: range.start, lte: range.end } },
      select: { id: true, title: true, format: true, platform: true, publishRecords: { select: { snapshots: { select: { id: true }, take: 1 } } } },
    }),
    prisma.contentDiagnosis.findMany({
      where: { orgId, createdAt: { gte: range.start, lte: range.end } },
      orderBy: { createdAt: "asc" },
      select: { id: true, contentItemId: true, failureClass: true, explanation: true, preserveThesis: true, approvalState: true, prescription: true, evidence: true },
    }),
    prisma.correctionEntry.findMany({
      where: { orgId, OR: [{ createdAt: { gte: range.start, lte: range.end } }, { verdictAt: { gte: range.start, lte: range.end } }] },
      select: { lever: true, correction: true, worked: true, verdictNote: true, createdAt: true, verdictAt: true },
    }),
    prisma.contentRoot.findMany({ where: { orgId, status: "open" }, select: { label: true, thesis: true }, take: 5 }),
  ]);

  const expectedVsActual: LearningSections["expectedVsActual"] = [];
  for (const item of items) {
    const expectation = await prisma.contentExpectation.findFirst({ where: { orgId, subjectType: "content", subjectId: item.id }, orderBy: { createdAt: "desc" }, select: { expectedClass: true, overall: true } });
    const diagnosis = diagnoses.find((d) => d.contentItemId === item.id);
    const evidence: Record<string, unknown> = diagnosis ? parseJson<Record<string, unknown>>(diagnosis.evidence, {}) : {};
    const actualObj = (evidence.actual ?? evidence) as Record<string, unknown>;
    const gapObj = (evidence.gap ?? evidence) as Record<string, unknown>;
    const actual = { band: typeof actualObj.band === "string" ? actualObj.band : undefined, sufficient: typeof (gapObj.sufficiency as { sufficient?: boolean } | undefined)?.sufficient === "boolean" ? (gapObj.sufficiency as { sufficient: boolean }).sufficient : undefined };
    expectedVsActual.push({
      contentItemId: item.id,
      title: item.title,
      expectedClass: expectation?.expectedClass ?? "no expectation recorded",
      expectedOverall: expectation?.overall ?? 0,
      actualBand: actual.band ?? (item.publishRecords.some((r) => r.snapshots.length) ? "not yet read" : "no metrics"),
      failureClass: diagnosis?.failureClass ?? "not diagnosed",
      sufficient: actual.sufficient ?? false,
    });
  }

  const approved = diagnoses.filter((d) => d.approvalState === "approved");
  const learned = approved
    .filter((d) => d.failureClass !== "insufficient_data")
    .map((d) => ({
      title: items.find((i) => i.id === d.contentItemId)?.title ?? "Diagnosed piece",
      detail: d.explanation,
      failureClass: d.failureClass,
      preserveThesis: d.preserveThesis,
    }));

  const counts = new Map<string, number>();
  for (const d of approved) if (!["none", "insufficient_data", "mixed"].includes(d.failureClass)) counts.set(d.failureClass, (counts.get(d.failureClass) ?? 0) + 1);
  const worst = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const weakestLink = worst
    ? {
        failureClass: worst[0],
        label: FAILURE_CLASS_LABELS[worst[0]] ?? worst[0].replace(/_/g, " "),
        count: worst[1],
        explanation: `${worst[1]} approved diagnos${worst[1] === 1 ? "is" : "es"} this period named ${FAILURE_CLASS_LABELS[worst[0]] ?? worst[0]} as the cause. That is the link the next tests should press on.`,
      }
    : null;

  const whatChanged = corrections
    .filter((c) => c.createdAt >= range.start && c.createdAt <= range.end)
    .map((c) => ({ lever: c.lever, correction: c.correction, verdict: c.worked === null ? "awaiting retest" : c.worked ? "worked" : "did not work" }));

  const judged = corrections.filter((c) => c.verdictAt && c.verdictAt >= range.start && c.verdictAt <= range.end);
  const worked = judged.filter((c) => c.worked === true).length;
  const failed = judged.filter((c) => c.worked === false).length;
  const pending = corrections.filter((c) => c.worked === null).length;
  const whetherChangeWorked = {
    worked,
    failed,
    pending,
    sentence:
      judged.length === 0
        ? pending > 0
          ? `${pending} correction${pending === 1 ? " is" : "s are"} still waiting for a retest to be read.`
          : "No correction has been retested yet."
        : `Of ${judged.length} correction${judged.length === 1 ? "" : "s"} read this period, ${worked} worked and ${failed} did not.${pending ? ` ${pending} still await a retest.` : ""}`,
  };

  const nextTests = [
    ...approved.map((d) => d.prescription).filter((p): p is string => !!p && p.trim().length > 0),
    ...openRoots.map((r) => `Keep testing "${r.label}": ${r.thesis}`),
  ].slice(0, 5);

  const dataLimitations: string[] = [];
  const insufficient = diagnoses.filter((d) => d.failureClass === "insufficient_data").length;
  if (insufficient) dataLimitations.push(`${insufficient} piece${insufficient === 1 ? " was" : "s were"} too early or too thin to read — the numbers are still moving, so no cause was named.`);
  const noMetrics = items.filter((i) => !i.publishRecords.some((r) => r.snapshots.length)).length;
  if (noMetrics) dataLimitations.push(`${noMetrics} published piece${noMetrics === 1 ? " has" : "s have"} no performance recorded yet.`);
  const textOnly = items.filter((i) => i.format === "text_post" || i.format === "carousel").length;
  if (textOnly) dataLimitations.push(`${textOnly} text piece${textOnly === 1 ? "" : "s"}: retention cannot be observed for text, so only reach and engagement were read.`);
  const unexpected = items.filter((i) => !expectedVsActual.find((e) => e.contentItemId === i.id && e.expectedClass !== "no expectation recorded")).length;
  if (unexpected) dataLimitations.push(`${unexpected} piece${unexpected === 1 ? " went" : "s went"} out without a frozen expectation, so expected-vs-actual cannot be shown for ${unexpected === 1 ? "it" : "them"}.`);

  const stillUnknown: string[] = [];
  if (approved.some((d) => d.failureClass === "mixed")) stillUnknown.push("At least one result was genuinely ambiguous and was labelled mixed rather than forced into a cause.");
  stillUnknown.push("Whether the audience reached is the buyer: platform analytics scopes are not connected, so ICP relevance is observed only through named inquiries.");
  if (pending) stillUnknown.push(`Whether ${pending} pending correction${pending === 1 ? "" : "s"} worked — the retests have not matured.`);

  return learningSectionsSchema.parse({ expectedVsActual, learned, weakestLink, whatChanged, whetherChangeWorked, nextTests, dataLimitations, stillUnknown });
}
