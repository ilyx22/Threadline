/**
 * RESEARCH CORPUS, OUTLIER LADDER, JUDGE AND CALIBRATION — on persisted rows.
 *
 * The corpus is Threadline-global (no orgId), so this suite tags every row it
 * creates with a QA prefix and removes exactly those afterwards.
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section, cleanupSessions } from "./context";
import * as Corpus from "../../src/lib/actions/corpus";
import { listExamples, corpusSummary, currentCalibration } from "../../src/lib/data/corpus";
import { calibrationReading, judgeVerdict, RUBRIC, RUBRIC_VERSION, GATING_FLOOR, PASS_AT, REVISE_BELOW } from "../../src/lib/domain/judge";
import { chooseBaseline, readOutlier, BASELINE_MINIMUMS } from "../../src/lib/domain/corpus";

const OPS = "ops@threadline.com";
const Q = "https://qa.example.test/";

async function seedRow(over: Record<string, unknown>) {
  return prisma.researchExample.create({
    data: {
      url: `${Q}${Math.random().toString(36).slice(2)}`,
      platform: "LinkedIn",
      format: "short_video",
      creatorHandle: "@qa-creator",
      title: "QA row",
      views: 1000,
      followers: 5000,
      publishedAt: new Date(Date.now() - 60 * 86_400_000),
      capturedAt: new Date(),
      buyerRelevance: "direct",
      commercialIntent: "commercial",
      ...over,
    } as never,
  });
}

export async function cleanupCorpus() {
  await prisma.researchExample.deleteMany({ where: { url: { startsWith: Q } } });
  await prisma.judgeCalibration.deleteMany({ where: { reading: { contains: "[QA]" } } });
}

export async function runCorpusJudge() {
  await cleanupCorpus();
  await actAs(OPS);

  /* --------------------------- outlier ladder on persisted rows --------------------------- */
  section("corpus — outlier ladder against the database");
  // Creator A: 4 ordinary same-format pieces + one hit + one same-creator different-format piece.
  for (const v of [1000, 1100, 950, 1050]) await seedRow({ views: v, title: `A ordinary ${v}` });
  const hit = await seedRow({ views: 6000, title: "A hit" });
  const otherFormat = await seedRow({ views: 20_000, format: "long_video", title: "A long video (no same-format baseline)" });
  const wrongRoom = await seedRow({ views: 5500, title: "A viral off-ICP", buyerRelevance: "off_icp", commercialIntent: "entertainment" });
  const unrated = await seedRow({ views: 5200, title: "A unrated hit", buyerRelevance: "unrated", commercialIntent: "unrated" });
  const under = await seedRow({ views: 300, title: "A underperformer" });
  const fresh = await seedRow({ views: 4000, title: "A three days old", publishedAt: new Date(Date.now() - 3 * 86_400_000) });
  const zero = await seedRow({ views: 0, title: "A zero views" });
  const noDate = await seedRow({ views: 1000, title: "A no publish date", publishedAt: null });
  const huge = await seedRow({ views: 2_000_000_000, likes: 50_000_000, title: "A huge metrics" });
  // Creator B: one piece, no baseline of its own, but 5 same-size creators exist → cohort.
  for (let i = 0; i < 5; i++) await seedRow({ creatorHandle: `@qa-cohort-${i}`, views: 800 + i * 50, followers: 5000, title: `cohort ${i}` });
  const cohortOnly = await seedRow({ creatorHandle: "@qa-lonely", views: 4000, followers: 5000, title: "B cohort fallback" });
  // Creator C: one piece, no followers → cohort impossible; platform baseline has ≥8 → platform rung.
  const platformOnly = await seedRow({ creatorHandle: "@qa-nofollowers", views: 15_000, followers: 0, platform: "LinkedIn", title: "C platform fallback" });
  // Creator D: lonely, on a platform with nothing else → unknown.
  const nothing = await seedRow({ creatorHandle: "@qa-alone", views: 9999, followers: 0, platform: "Threads", title: "D no rung" });

  const rows = await listExamples();
  const by = (id: string) => rows.find((r) => r.id === id)!;
  const check = (name: string, id: string, band: string | string[], source: string, standing?: string) => {
    const r = by(id);
    const bands = Array.isArray(band) ? band : [band];
    const ok = bands.includes(r.outlier.band) && r.outlier.baselineSource === source && (standing === undefined || r.outlier.commercialStanding === standing);
    record("corpus:ladder", name, ok ? "PASS" : "FAIL", `band=${r.outlier.band} rung=${r.outlier.baselineSource} conf=${r.outlier.confidence} standing=${r.outlier.commercialStanding} x=${r.outlier.multiple?.toFixed(1) ?? "—"}`, ok ? undefined : "CORPUS-LADDER");
  };
  check("creator+format: 6x median → exceptional, commercial outlier", hit.id, "exceptional", "creator_format", "commercial_outlier");
  check("same creator, no same-format baseline → creator rung", otherFormat.id, "exceptional", "creator");
  check("viral off-ICP → popular_off_icp, not a winner", wrongRoom.id, "exceptional", "creator_format", "popular_off_icp");
  check("unrated hit → standing unrated, never guessed", unrated.id, ["strong", "exceptional"], "creator_format", "unrated");
  check("0.3x median → under", under.id, "under", "creator_format");
  check("cohort rung with raised bar", cohortOnly.id, "strong", "cohort");
  check("platform rung (no followers → no cohort)", platformOnly.id, ["strong", "exceptional"], "platform");
  check("no rung at all → unknown", nothing.id, "unknown", "none", "unknown");
  {
    const r = by(fresh.id);
    record("corpus:ladder", "3-day-old piece flagged stillMoving", r.outlier.stillMoving && /Re-capture/.test(r.outlier.reason) ? "PASS" : "FAIL", `stillMoving=${r.outlier.stillMoving}`);
    const z = by(zero.id);
    record("corpus:ladder", "zero views → needsMetrics, not banded", z.needsMetrics && z.outlier.band === "unknown" ? "PASS" : "FAIL", `needsMetrics=${z.needsMetrics} band=${z.outlier.band}`);
    const n = by(noDate.id);
    record("corpus:ladder", "null publish date → no velocity, still banded", n.outlier.ageDays === null && n.outlier.viewsPerDay === null && n.outlier.band !== "unknown" ? "PASS" : "FAIL", `age=${n.outlier.ageDays} band=${n.outlier.band}`);
    const h = by(huge.id);
    record("corpus:ladder", "huge metrics do not overflow or NaN", Number.isFinite(h.outlier.multiple ?? 0) && Number.isFinite(h.outlier.engagementRate ?? 0) ? "PASS" : "FAIL", `x=${h.outlier.multiple?.toFixed(0)} er=${h.outlier.engagementRate?.toFixed(3)}`);
    // The hit is excluded from its own baseline: median of others must not include 6000.
    record("corpus:ladder", "a piece is excluded from its own baseline", (by(hit.id).outlier.multiple ?? 0) > 5 ? "PASS" : "FAIL", `hit multiple=${by(hit.id).outlier.multiple?.toFixed(1)} (would be ~4.4x if it sat in its own median)`);
  }
  // Minimums enforced exactly at the boundary.
  {
    const c = chooseBaseline([{ source: "cohort", views: Array(BASELINE_MINIMUMS.cohort - 1).fill(100) }]);
    const d = chooseBaseline([{ source: "cohort", views: Array(BASELINE_MINIMUMS.cohort).fill(100) }]);
    record("corpus:ladder", "cohort minimum is a hard boundary", c.source === "none" && d.source === "cohort" ? "PASS" : "FAIL", `${BASELINE_MINIMUMS.cohort - 1}→${c.source}, ${BASELINE_MINIMUMS.cohort}→${d.source}`);
  }
  const summary = await corpusSummary();
  record("corpus:summary", "summary counts are coherent", summary.total >= 19 && summary.commercialOutliers >= 1 && summary.needsMetrics >= 1 && summary.unrated >= 1 ? "PASS" : "FAIL", `total=${summary.total} outliers=${summary.commercialOutliers} needMetrics=${summary.needsMetrics} unrated=${summary.unrated} weak=${summary.weakBaselines}`);

  /* --------------------------- capture, dedupe, rating --------------------------- */
  section("corpus — capture, dedupe, rating");
  const add = await attempt(() => Corpus.addExampleAction(null, fd({ url: `${Q}manual-1`, platform: "LinkedIn", creatorHandle: "@qa-manual", title: "Manual add", views: 10 })));
  record("corpus:capture", "manual add", add.outcome === "ok" ? "PASS" : "FAIL", `${add.outcome}`);
  const dup = await attempt(() => Corpus.addExampleAction(null, fd({ url: `${Q}manual-1`, platform: "LinkedIn", creatorHandle: "@qa-manual", title: "Duplicate", views: 10 })));
  record("corpus:capture", "duplicate URL refused", dup.outcome === "refused" ? "PASS" : "FAIL", `${dup.outcome} ${(dup as { message?: string }).message ?? ""}`);
  // Hosts are case-insensitive; paths are not. Only the host variant must dedupe.
  const dupCase = await attempt(() => Corpus.addExampleAction(null, fd({ url: "https://QA.EXAMPLE.TEST/manual-1", platform: "LinkedIn", creatorHandle: "@qa-manual", title: "Host-case variant", views: 10 })));
  const variants = await prisma.researchExample.count({ where: { url: { contains: "manual-1" } } });
  record("corpus:capture", "host-case URL variant dedupes", dupCase.outcome === "refused" && variants === 1 ? "PASS" : "FAIL", `${dupCase.outcome} · ${variants} row(s)`, variants > 1 ? "CORPUS-DEDUPE-HOSTCASE" : undefined);
  const bulk = await attempt(() => Corpus.bulkCaptureAction(`${Q}bulk-a\n${Q}bulk-a\n${Q}bulk-b, and ${Q}manual-1`));
  const bulkData = bulk.outcome === "ok" ? (bulk.value as { data: { added: number; duplicates: number } }).data : null;
  record("corpus:capture", "bulk paste dedupes within the paste and against the corpus", bulkData?.added === 2 && bulkData.duplicates === 1 ? "PASS" : "FAIL", `${bulk.outcome} added=${bulkData?.added} duplicates=${bulkData?.duplicates}`);
  const bulkRows = await prisma.researchExample.findMany({ where: { url: { startsWith: `${Q}bulk-` } } });
  record("corpus:capture", "bulk rows land with no metrics and honest provenance", bulkRows.every((r) => r.views === 0 && r.metricsProvenance === "manual" && r.enrichedAt) ? "PASS" : "FAIL", `${bulkRows.map((r) => r.provenance).join(",")}`);
  const over = await attempt(() => Corpus.bulkCaptureAction(Array.from({ length: 51 }, (_, i) => `${Q}over-${i}`).join("\n")));
  record("corpus:capture", "bulk over the limit refused, nothing written", over.outcome === "refused" && (await prisma.researchExample.count({ where: { url: { startsWith: `${Q}over-` } } })) === 0 ? "PASS" : "FAIL", `${over.outcome}`);
  const ssrf = await attempt(() => Corpus.bulkCaptureAction("http://127.0.0.1:3000/admin\nhttp://169.254.169.254/latest/meta-data\nhttp://localhost/x"));
  const ssrfRows = await prisma.researchExample.findMany({ where: { OR: [{ url: { contains: "127.0.0.1" } }, { url: { contains: "169.254" } }, { url: { contains: "localhost" } }] } });
  record("corpus:capture", "private/loopback URLs are never fetched", ssrfRows.every((r) => r.provenance === "url_only" && !r.transcript) ? "PASS" : "FAIL", `${ssrf.outcome} rows=${ssrfRows.length} provenance=${ssrfRows.map((r) => r.provenance).join(",")} transcript=${ssrfRows.some((r) => r.transcript)}`, ssrfRows.some((r) => r.transcript) ? "CORPUS-SSRF" : undefined);
  await prisma.researchExample.deleteMany({ where: { OR: [{ url: { contains: "127.0.0.1" } }, { url: { contains: "169.254" } }, { url: { contains: "localhost" } }] } });
  const badUrl = await attempt(() => Corpus.addExampleAction(null, fd({ url: "javascript:alert(1)", platform: "LinkedIn", creatorHandle: "@x", title: "js" })));
  record("corpus:capture", "javascript: URL refused", badUrl.outcome !== "ok" ? "PASS" : "FAIL", `${badUrl.outcome}`);
  const rate = await attempt(() => Corpus.rateExampleAction({ exampleId: unrated.id, buyerRelevance: "direct", commercialIntent: "commercial" }));
  const rated = (await listExamples()).find((r) => r.id === unrated.id)!;
  record("corpus:rating", "rating flips standing unrated → commercial_outlier", rate.outcome === "ok" && rated.outlier.commercialStanding === "commercial_outlier" ? "PASS" : "FAIL", `${rate.outcome} standing=${rated.outlier.commercialStanding}`);
  const badRate = await attempt(() => Corpus.rateExampleAction({ exampleId: unrated.id, buyerRelevance: "definitely", commercialIntent: "commercial" }));
  record("corpus:rating", "unknown rating value refused", badRate.outcome === "refused" ? "PASS" : "FAIL", `${badRate.outcome}`);
  const fill = await attempt(() => Corpus.fillMetricsAction(null, fd({ exampleId: zero.id, views: 1234, likes: 50, followers: 5000, publishedAt: "2026-06-01" })));
  const filled = (await listExamples()).find((r) => r.id === zero.id)!;
  record("corpus:capture", "fill metrics clears needsMetrics and bands", fill.outcome === "ok" && !filled.needsMetrics && filled.outlier.band !== "unknown" ? "PASS" : "FAIL", `${fill.outcome} band=${filled.outlier.band}`);
  const neg = await attempt(() => Corpus.fillMetricsAction(null, fd({ exampleId: zero.id, views: -5 })));
  const dec = await attempt(() => Corpus.fillMetricsAction(null, fd({ exampleId: zero.id, views: 12.7 })));
  record("corpus:capture", "negative / decimal metrics refused", neg.outcome !== "ok" && dec.outcome !== "ok" ? "PASS" : "FAIL", `neg=${neg.outcome} dec=${dec.outcome}`);

  /* --------------------------- Judge --------------------------- */
  section("judge — verdict arithmetic, gating, immutability, demo provider");
  const flat = (n: number) => RUBRIC.map((c) => ({ key: c.key, score: n, reason: "qa" }));
  record("judge", "5s → 100 pass; 0s → 0 reject", judgeVerdict(flat(5)).overall === 100 && judgeVerdict(flat(5)).verdict === "pass" && judgeVerdict(flat(0)).overall === 0 ? "PASS" : "FAIL", "");
  const gated = judgeVerdict(flat(5).map((s) => (s.key === "evidence" ? { ...s, score: GATING_FLOOR } : s)));
  record("judge", "gating criterion at the floor rejects a 90+ total", gated.verdict === "reject" && gated.overall > PASS_AT ? "PASS" : "FAIL", `overall=${gated.overall} verdict=${gated.verdict}`);
  const boundary = judgeVerdict(flat(5).map((s) => (s.key === "evidence" ? { ...s, score: GATING_FLOOR + 1 } : s)));
  record("judge", "one above the floor is not gated", boundary.verdict !== "reject" ? "PASS" : "FAIL", `verdict=${boundary.verdict}`);
  const partial = judgeVerdict(flat(5).slice(0, 3));
  record("judge", "missing criteria are named, not silently zero", partial.concerns.some((c) => /not scored/i.test(c)) ? "PASS" : "FAIL", `${partial.concerns.length} concerns`);
  const clamp = judgeVerdict(RUBRIC.map((c) => ({ key: c.key, score: 9, reason: "" })));
  record("judge", "out-of-range score cannot exceed 100", clamp.overall <= 100 ? "PASS" : "FAIL", `overall=${clamp.overall}`, clamp.overall > 100 ? "JUDGE-CLAMP" : undefined);
  const unknownKey = judgeVerdict([...flat(5), { key: "not_a_criterion", score: 5, reason: "" }]);
  record("judge", "unknown criterion key ignored", unknownKey.overall === 100 ? "PASS" : "FAIL", `overall=${unknownKey.overall}`);
  record("judge", "every verdict is uncalibrated with disclaimer", [0, 3, 5].every((n) => judgeVerdict(flat(n)).calibrated === false && judgeVerdict(flat(n)).disclaimer.length > 20) ? "PASS" : "FAIL", "");
  record("judge", "revise band sits between thresholds", REVISE_BELOW < PASS_AT ? "PASS" : "FAIL", `${REVISE_BELOW}..${PASS_AT}`);
  // Through the action, with the demo provider (no API key).
  const j1 = await attempt(() => Corpus.judgeExampleAction(hit.id));
  const v1 = await prisma.judgeVerdict.findFirst({ where: { exampleId: hit.id }, orderBy: { createdAt: "desc" } });
  record("judge:action", "judgeExampleAction writes an uncalibrated verdict with rubric version", j1.outcome === "ok" && v1?.calibrated === false && v1.rubricVersion === RUBRIC_VERSION && v1.provider !== "anthropic" ? "PASS" : "FAIL", `${j1.outcome} provider=${v1?.provider} rubric=${v1?.rubricVersion} overall=${v1?.overall}`);
  const j2 = await attempt(() => Corpus.judgeExampleAction(hit.id));
  const all = await prisma.judgeVerdict.findMany({ where: { exampleId: hit.id }, orderBy: { createdAt: "asc" } });
  record("judge:action", "re-judging appends, never overwrites", j2.outcome === "ok" && all.length === 2 && all[0].id === v1!.id && all[0].overall === v1!.overall ? "PASS" : "FAIL", `${all.length} verdicts, first unchanged=${all[0]?.overall === v1?.overall}`);
  const an = await attempt(() => Corpus.analyseExampleAction(hit.id));
  const analysis = await prisma.exampleAnalysis.findUnique({ where: { exampleId: hit.id } });
  record("judge:action", "demo analysis is labelled and stored with provider", an.outcome === "ok" && /offline provider/.test((an.value as { message?: string })?.message ?? "") && analysis?.provider !== "anthropic" ? "PASS" : "FAIL", `${an.outcome} provider=${analysis?.provider}`);
  const missing = await attempt(() => Corpus.judgeExampleAction("does-not-exist"));
  record("judge:action", "judging a missing example refused cleanly", missing.outcome === "refused" ? "PASS" : "FAIL", `${missing.outcome}`);

  /* --------------------------- calibration --------------------------- */
  section("calibration — refuses to conclude without evidence");
  const pair = (id: string, band: "strong" | "typical" | "unknown" | "under" | "exceptional", overall: number) => ({ exampleId: id, band, overall });
  record("calibration", "zero pairs", calibrationReading([]).sufficient === false && /nothing to calibrate/i.test(calibrationReading([]).reading) ? "PASS" : "FAIL", "");
  record("calibration", "unknown-band pairs are ignored", calibrationReading([pair("a", "unknown", 90)]).pairs === 0 ? "PASS" : "FAIL", "");
  const allWin = calibrationReading(Array.from({ length: 40 }, (_, i) => pair(`w${i}`, "strong", 80)));
  record("calibration", "all winners refused (no ordinary content)", allWin.sufficient === false && /no ordinary/i.test(allWin.reading) ? "PASS" : "FAIL", allWin.reading.slice(0, 60));
  const allLose = calibrationReading(Array.from({ length: 40 }, (_, i) => pair(`l${i}`, "under", 30)));
  record("calibration", "all losers refused", allLose.sufficient === false ? "PASS" : "FAIL", allLose.reading.slice(0, 60));
  const zeroSep = calibrationReading([...Array.from({ length: 20 }, (_, i) => pair(`w${i}`, "strong", 60)), ...Array.from({ length: 20 }, (_, i) => pair(`t${i}`, "typical", 60))]);
  record("calibration", "zero separation is reported as zero", zeroSep.separation === 0 ? "PASS" : "FAIL", `sep=${zeroSep.separation} "${zeroSep.reading.slice(0, 50)}"`);
  const neg2 = calibrationReading([...Array.from({ length: 20 }, (_, i) => pair(`w${i}`, "strong", 40)), ...Array.from({ length: 20 }, (_, i) => pair(`t${i}`, "typical", 80))]);
  record("calibration", "negative separation says the Judge is wrong", (neg2.separation ?? 0) < 0 && /not measuring/i.test(neg2.reading) ? "PASS" : "FAIL", `sep=${neg2.separation}`);
  const pos = calibrationReading([pair("miss", "exceptional", 20), ...Array.from({ length: 20 }, (_, i) => pair(`w${i}`, "strong", 85)), ...Array.from({ length: 20 }, (_, i) => pair(`t${i}`, "typical", 55))]);
  record("calibration", "positive separation still NOT calibrated; worst miss first", pos.sufficient && pos.calibrated === false && pos.worstMisses[0]?.exampleId === "miss" ? "PASS" : "FAIL", `sep=${pos.separation} calibrated=${pos.calibrated} worst=${pos.worstMisses[0]?.exampleId}`);
  // Persisted: the seven illustrative rows must be excluded even though they now have verdicts nearby.
  const cur = await currentCalibration();
  record("calibration", "illustrative rows excluded from persisted calibration", cur.excludedIllustrative >= 7 ? "PASS" : "FAIL", `excluded=${cur.excludedIllustrative} pairs=${cur.pairs}`);
  const run = await attempt(() => Corpus.runCalibrationAction());
  const runRow = await prisma.judgeCalibration.findFirst({ orderBy: { runAt: "desc" } });
  record("calibration", "runCalibrationAction records a frozen run", run.outcome === "ok" && !!runRow && runRow.rubricVersion === RUBRIC_VERSION ? "PASS" : "FAIL", `${run.outcome} pairs=${runRow?.pairs} sufficient=${runRow?.sufficient}`);
  record("calibration", "no verdict was marked calibrated by the run", (await prisma.judgeVerdict.count({ where: { calibrated: true } })) === 0 ? "PASS" : "FAIL", "calibrated:true rows = 0", (await prisma.judgeVerdict.count({ where: { calibrated: true } })) > 0 ? "CAL-PROMOTE" : undefined);

  await cleanupCorpus();
  await cleanupSessions();
}

if (require.main === module) {
  runCorpusJudge().finally(() => prisma.$disconnect());
}
