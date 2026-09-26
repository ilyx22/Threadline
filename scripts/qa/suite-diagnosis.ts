/**
 * CONTENT DIAGNOSIS ENGINE — on persisted data, through the real actions.
 *
 * The unit suite proves `readGap` is right for a hand-built context. This
 * proves the data layer builds that context correctly from what is actually in
 * the database, and that the actions freeze, approve and remember correctly.
 * Cases A–G from the QA brief, then immutability, correction chronology, and
 * the four trajectories (improving, flat, declining, missing period).
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section } from "./context";
import { buildFixture, teardown, ALPHA, type Fixture } from "./suite-tenancy";
import * as Learning from "../../src/lib/actions/learning";
import { readContent, learningTrajectory, listRoots, listCorrections } from "../../src/lib/data/content-learning";
import { readGap, type ActualContext, EMPTY_METRICS } from "../../src/lib/domain/content-diagnosis";
import { readLearning, type PeriodRecord } from "../../src/lib/domain/learning-velocity";

const OPERATOR = "operator@threadline.com";

type CaseSpec = {
  name: string;
  format: string;
  views: number;
  likes: number; comments: number; shares: number; saves: number;
  retentionPct?: number;
  daysAgo: number;
  snapshots?: number;
  qualified?: number;
  expectedClass: "under" | "typical" | "strong" | "exceptional" | "unknown";
  expectOverall: number;
  want: string[];          // acceptable failure classes
  wantPreserve?: boolean;
};

async function makeCase(orgId: string, rootId: string, spec: CaseSpec) {
  const item = await prisma.contentItem.create({
    data: { orgId, rootId, title: spec.name, stage: "live", platform: spec.format === "text_post" ? "linkedin" : "linkedin", format: spec.format, liveAt: new Date(Date.now() - spec.daysAgo * 86_400_000) },
  });
  const pub = await prisma.publishRecord.create({
    data: { orgId, contentItemId: item.id, platform: "linkedin", status: "published", publishedAt: new Date(Date.now() - spec.daysAgo * 86_400_000), url: `https://www.linkedin.com/posts/qa_${item.id}` },
  });
  const n = spec.snapshots ?? 3;
  for (let i = 0; i < n; i++) {
    const f = (i + 1) / n;
    await prisma.performanceSnapshot.create({
      data: { orgId, publishRecordId: pub.id, capturedAt: new Date(Date.now() - (spec.daysAgo - (spec.daysAgo * (i / n))) * 86_400_000), views: Math.round(spec.views * f), likes: Math.round(spec.likes * f), comments: Math.round(spec.comments * f), shares: Math.round(spec.shares * f), saves: Math.round(spec.saves * f), retentionPct: spec.retentionPct ?? 0, source: "manual" },
    });
  }
  // The forecast is frozen BEFORE publication (an hour before it went live), as the product requires.
  await prisma.contentExpectation.create({
    data: { orgId, rootId, subjectType: "content", subjectId: item.id, rubricVersion: "v0.1", overall: spec.expectOverall, expectedClass: spec.expectedClass, calibrated: false, provider: "qa", model: "qa", createdAt: new Date(item.liveAt!.getTime() - 3_600_000) },
  });
  for (let i = 0; i < (spec.qualified ?? 0); i++) {
    const inq = await prisma.inquiry.create({ data: { orgId, name: `Buyer ${i}`, contentItemId: item.id, stage: "booked_call" } as never });
    await prisma.commercialEvent.create({ data: { orgId, kind: "booked_call", inquiryId: inq.id, attribution: "buyer_named", evidenceBasis: "measured", source: "manual", note: "Buyer named the post on the call." } });
  }
  return item;
}

export async function runDiagnosis(fx: Fixture) {
  const A = fx.alpha.id;
  await actAs(OPERATOR);

  // Baseline: four ordinary pieces so the client has a median to be banded against.
  const root = await prisma.contentRoot.create({ data: { orgId: A, label: "QA thesis", thesis: "Forecasts are feelings until the system changes." } });
  for (const v of [1000, 1100, 900, 1050]) {
    await makeCase(A, root.id, { name: `baseline ${v}`, format: "short_form", views: v, likes: 20, comments: 3, shares: 1, saves: 2, daysAgo: 60, expectedClass: "typical", expectOverall: 60, want: [] });
  }

  section("diagnosis — cases A–G on persisted data");
  const cases: CaseSpec[] = [
    { name: "A great idea / bad hook", format: "short_form", views: 400, likes: 40, comments: 9, shares: 5, saves: 14, daysAgo: 30, expectedClass: "strong", expectOverall: 82, want: ["hook_packaging"], wantPreserve: true },
    { name: "B bad thesis / good execution", format: "short_form", views: 350, likes: 3, comments: 0, shares: 0, saves: 0, daysAgo: 30, expectedClass: "strong", expectOverall: 84, want: ["idea_thesis"], wantPreserve: false },
    { name: "C low reach / qualified call", format: "short_form", views: 500, likes: 12, comments: 2, shares: 1, saves: 3, daysAgo: 30, qualified: 1, expectedClass: "typical", expectOverall: 70, want: ["none"], wantPreserve: true },
    { name: "E good retention / tiny distribution", format: "short_form", views: 300, likes: 30, comments: 6, shares: 4, saves: 12, retentionPct: 68, daysAgo: 30, expectedClass: "typical", expectOverall: 66, want: ["hook_packaging", "distribution"], wantPreserve: true },
    { name: "F insufficient data (4 days old)", format: "short_form", views: 5000, likes: 200, comments: 20, shares: 10, saves: 40, daysAgo: 4, expectedClass: "strong", expectOverall: 80, want: ["insufficient_data"], wantPreserve: true },
    { name: "G mixed (ordinary everything)", format: "short_form", views: 1000, likes: 15, comments: 2, shares: 0, saves: 1, daysAgo: 30, expectedClass: "typical", expectOverall: 60, want: ["mixed"], wantPreserve: true },
    { name: "H text-led LinkedIn post", format: "text_post", views: 2200, likes: 90, comments: 14, shares: 8, saves: 30, daysAgo: 30, expectedClass: "typical", expectOverall: 64, want: ["hook_packaging", "mixed", "none", "insufficient_data"], wantPreserve: true },
  ];
  const created: Record<string, string> = {};
  for (const c of cases) {
    const item = await makeCase(A, root.id, c);
    created[c.name] = item.id;
    const reading = await readContent(A, item.id);
    const gap = reading?.gap;
    const okClass = !!gap && c.want.includes(gap.failureClass);
    const okPreserve = c.wantPreserve === undefined || gap?.preserveThesis === c.wantPreserve;
    record("diagnosis", c.name, okClass && okPreserve ? "PASS" : "FAIL",
      `band=${reading?.actual?.band} class=${gap?.failureClass} preserve=${gap?.preserveThesis} conf=${gap?.confidence} rx=${reading?.prescription?.lever ?? "—"}${okClass ? "" : ` (wanted ${c.want.join("|")})`}`,
      okClass && okPreserve ? undefined : "DIAG-" + c.name[0]);
  }

  // Case D cannot be reached through persisted data: the data layer reports
  // buyerRelevanceObserved = "unknown" because no platform exposes audience
  // composition without approved analytics scopes. Verify the engine handles it
  // when it *is* known, and record the data-path gap honestly.
  {
    const ctx: ActualContext = { metrics: { ...EMPTY_METRICS, views: 100_000, likes: 4000, comments: 600, shares: 900, saves: 300, trackedClicks: 0, qualifiedActions: 0 }, band: "exceptional", maturityDays: 30, snapshotCount: 3, buyerRelevanceObserved: "off_icp" };
    const gap = readGap({ expectation: null, actual: ctx });
    record("diagnosis", "D viral wrong audience (domain, ICP known)", gap.failureClass === "commercial_relevance" && !gap.preserveThesis ? "PASS" : "FAIL", `class=${gap.failureClass} preserve=${gap.preserveThesis}`);
    const viral = await makeCase(A, root.id, { name: "D viral (persisted, ICP unknown)", format: "short_form", views: 100_000, likes: 4000, comments: 600, shares: 900, saves: 300, daysAgo: 30, expectedClass: "strong", expectOverall: 75, want: [] });
    const reading = await readContent(A, viral.id);
    const notWinner = reading?.gap?.failureClass !== "none";
    record("diagnosis", "D viral wrong audience (persisted, ICP unobservable)", notWinner ? "PASS_EXT" : "FAIL", `class=${reading?.gap?.failureClass} — not declared a commercial winner; ICP relevance unobservable without analytics scopes, so commercial_relevance cannot be reached from data yet`, notWinner ? undefined : "DIAG-D");
  }

  /* ------------------------ action path: draft → approve ------------------------ */
  section("diagnosis — actions, freezing, approval");
  const aId = created["A great idea / bad hook"];
  const d1 = await attempt(() => Learning.diagnoseContentAction(ALPHA, aId));
  const dRow = await prisma.contentDiagnosis.findFirst({ where: { contentItemId: aId }, orderBy: { createdAt: "desc" } });
  record("diagnosis", "diagnoseContentAction writes a DRAFT with frozen evidence", d1.outcome === "ok" && dRow?.approvalState === "draft" && dRow.evidence.includes('"band"') && dRow.rootId === root.id && !!dRow.expectationId ? "PASS" : "FAIL", `${d1.outcome} state=${dRow?.approvalState} class=${dRow?.failureClass} root=${dRow?.rootId === root.id} expectation=${!!dRow?.expectationId}`);
  // Evidence frozen: add a new snapshot with wildly different numbers; the diagnosis must not change.
  const pub = await prisma.publishRecord.findFirst({ where: { contentItemId: aId } });
  await prisma.performanceSnapshot.create({ data: { orgId: A, publishRecordId: pub!.id, views: 900_000, likes: 1, source: "manual" } });
  const dAfter = await prisma.contentDiagnosis.findUnique({ where: { id: dRow!.id } });
  record("diagnosis", "later snapshots do not mutate a written diagnosis", dAfter!.evidence === dRow!.evidence && dAfter!.failureClass === dRow!.failureClass ? "PASS" : "FAIL", "evidence and class unchanged after a 900k-view snapshot");
  const live = await readContent(A, aId);
  record("diagnosis", "live reading DOES move with new data", live?.gap?.failureClass !== dRow!.failureClass || live?.actual?.band !== "under" ? "PASS" : "PARTIAL", `live class=${live?.gap?.failureClass} band=${live?.actual?.band}`);
  // Approve, with a human reclassification, audited.
  const ap = await attempt(() => Learning.approveDiagnosisAction(ALPHA, null, fd({ diagnosisId: dRow!.id, failureClass: "hook_packaging", explanation: "Confirmed: the argument held once reached; the opening lost.", failedAssumption: "That a category name is a hook.", prescription: "Retest two openings.", preserveThesis: "true" })));
  const apRow = await prisma.contentDiagnosis.findUnique({ where: { id: dRow!.id } });
  const audit = await prisma.auditLog.findFirst({ where: { action: "learning.diagnosis.approve", entityId: dRow!.id } });
  record("diagnosis", "approve → approved + audited", ap.outcome === "ok" && apRow?.approvalState === "approved" && !!apRow.approvedAt && !!audit ? "PASS" : "FAIL", `${ap.outcome} state=${apRow?.approvalState} audit=${!!audit}`);
  const ap2 = await attempt(() => Learning.approveDiagnosisAction(ALPHA, null, fd({ diagnosisId: dRow!.id, failureClass: "idea_thesis", explanation: "Trying to re-approve with a different class." })));
  const apRow2 = await prisma.contentDiagnosis.findUnique({ where: { id: dRow!.id } });
  record("diagnosis", "approved diagnosis cannot be re-approved/reclassified", ap2.outcome !== "ok" && apRow2!.failureClass === "hook_packaging" ? "PASS" : "FAIL", `${ap2.outcome} class=${apRow2!.failureClass}`, ap2.outcome === "ok" ? "DIAG-REAPPROVE" : undefined);
  const bogus = await attempt(() => Learning.approveDiagnosisAction(ALPHA, null, fd({ diagnosisId: dRow!.id, failureClass: "not_a_class", explanation: "x".repeat(20) })));
  record("diagnosis", "unknown failure class rejected", bogus.outcome !== "ok" ? "PASS" : "FAIL", `${bogus.outcome}`);
  const noItem = await attempt(() => Learning.diagnoseContentAction(ALPHA, fx.rows.idea.id));
  record("diagnosis", "diagnosing a non-content id refused cleanly", noItem.outcome === "refused" ? "PASS" : "FAIL", `${noItem.outcome}`);

  /* ------------------------ expectation immutability ------------------------ */
  section("expected vs actual — immutability");
  // A live piece cannot be re-predicted: the forecast frozen before publication stands.
  const onLive = await attempt(() => Learning.recordExpectationAction(ALPHA, { subjectType: "content", subjectId: aId }));
  record("expectation", "a published piece cannot be given a new expectation after the fact", onLive.outcome !== "ok" ? "PASS" : "FAIL", `${onLive.outcome}`, onLive.outcome === "ok" ? "EXPECTATION-POSTHOC" : undefined);
  // Append-only behaviour is checked on a piece that has not gone out yet.
  const pre = await prisma.contentItem.create({ data: { orgId: A, rootId: root.id, title: "Not yet published", stage: "editing", platform: "linkedin", format: "short_form" } });
  await attempt(() => Learning.recordExpectationAction(ALPHA, { subjectType: "content", subjectId: pre.id }));
  const e1 = await prisma.contentExpectation.findFirst({ where: { subjectId: pre.id }, orderBy: { createdAt: "asc" } });
  const rec = await attempt(() => Learning.recordExpectationAction(ALPHA, { subjectType: "content", subjectId: pre.id }));
  const all = await prisma.contentExpectation.findMany({ where: { subjectId: pre.id }, orderBy: { createdAt: "asc" } });
  const e1After = all.find((e) => e.id === e1!.id);
  record("expectation", "re-recording appends a NEW row, never edits the old", rec.outcome === "ok" && all.length === 2 && e1After!.overall === e1!.overall && e1After!.rubricVersion === e1!.rubricVersion && e1After!.dimensions === e1!.dimensions ? "PASS" : "FAIL", `${rec.outcome} rows=${all.length} old overall=${e1After?.overall} (was ${e1!.overall})`);
  record("expectation", "every expectation stored calibrated:false", all.every((e) => e.calibrated === false) ? "PASS" : "FAIL", `${all.length} rows`);
  const recMsg = rec.outcome === "ok" ? ((rec.value as { message?: string }).message ?? "") : "";
  record("expectation", "demo provider is labelled, not passed off as a model", rec.outcome === "ok" && /offline provider|Uncalibrated/.test(recMsg) && all[1].provider !== "anthropic" ? "PASS" : "PARTIAL", `provider=${all[1]?.provider} msg="${recMsg.slice(0, 60)}"`);
  // Simulated rubric change: a v0.2 expectation must coexist with the v0.1 one untouched.
  await prisma.contentExpectation.create({ data: { orgId: A, rootId: root.id, subjectType: "content", subjectId: pre.id, rubricVersion: "v0.2-qa", overall: 33, expectedClass: "under" } });
  const v01 = await prisma.contentExpectation.findUnique({ where: { id: e1!.id } });
  record("expectation", "old rubric version survives a new rubric", v01!.rubricVersion === e1!.rubricVersion && v01!.overall === e1!.overall ? "PASS" : "FAIL", `${v01!.rubricVersion} overall=${v01!.overall}`);
  const latest = await (await import("../../src/lib/data/content-learning")).latestExpectation(A, "content", pre.id);
  record("expectation", "latest expectation is the newest by time, not the highest score", latest?.rubricVersion === "v0.2-qa" ? "PASS" : "FAIL", `latest=${latest?.rubricVersion}/${latest?.overall}`);

  /* ------------------------ correction memory ------------------------ */
  section("correction memory");
  const c1 = await attempt(() => Learning.recordCorrectionAction(ALPHA, null, fd({ diagnosisId: dRow!.id, believed: "That naming the category would earn attention.", actual: "Reach flat, engagement 3x norm.", failedAssumption: "Category names are not hooks.", correction: "Open on the sentence a sales leader actually says.", lever: "hook" })));
  const c1Id = c1.outcome === "ok" ? (c1.value as { data: { id: string } }).data.id : "";
  const c1Row = await prisma.correctionEntry.findUnique({ where: { id: c1Id } });
  record("correction", "record → worked is NULL (untested), root inherited from diagnosis", c1.outcome === "ok" && c1Row?.worked === null && c1Row.rootId === root.id ? "PASS" : "FAIL", `${c1.outcome} worked=${c1Row?.worked} root=${c1Row?.rootId === root.id}`);
  const c2 = await attempt(() => Learning.recordCorrectionAction(ALPHA, null, fd({ diagnosisId: dRow!.id, believed: "Soft CTA would convert.", actual: "Saves high, clicks zero.", failedAssumption: "Saving = acting.", correction: "Specific low-commitment next step.", lever: "cta" })));
  const short = await attempt(() => Learning.recordCorrectionAction(ALPHA, null, fd({ rootId: root.id, believed: "x", actual: "y", failedAssumption: "z", correction: "w" })));
  record("correction", "too-short fields rejected", short.outcome !== "ok" ? "PASS" : "FAIL", `${short.outcome}`);
  // Retest: attach a new piece as retest, then record the verdict.
  const retest = await makeCase(A, root.id, { name: "A retest (new hook)", format: "short_form", views: 3900, likes: 200, comments: 30, shares: 20, saves: 60, daysAgo: 20, expectedClass: "strong", expectOverall: 85, want: [] });
  await Learning.attachToRootAction(ALPHA, { contentItemId: retest.id, rootId: root.id, lineageRole: "retest" });
  const v = await attempt(() => Learning.recordCorrectionVerdictAction(ALPHA, null, fd({ correctionId: c1Id, worked: "yes", verdictNote: "Retest reached ~4x within the same window and held engagement.", retestContentItemId: retest.id })));
  const c1Done = await prisma.correctionEntry.findUnique({ where: { id: c1Id } });
  record("correction", "verdict closes the loop with the retest item linked", v.outcome === "ok" && c1Done?.worked === true && c1Done.retestContentItemId === retest.id && !!c1Done.verdictAt ? "PASS" : "FAIL", `${v.outcome} worked=${c1Done?.worked} retest=${c1Done?.retestContentItemId === retest.id}`);
  const list = await listCorrections(A);
  const mine = list.filter((c) => c.rootId === root.id);
  record("correction", "two corrections on one root, newest first, one pending", mine.length === 2 && mine[0].lever === "cta" && mine[0].worked === null && mine[1].worked === true ? "PASS" : "FAIL", `${mine.map((m) => `${m.lever}:${m.worked}`).join(",")}`);
  const roots = await listRoots(A);
  const mineRoot = roots.find((r) => r.id === root.id)!;
  record("lineage", "root aggregate: sources vs retests vs derivatives", mineRoot.retestCount === 1 && mineRoot.sourceCount >= 10 && mineRoot._count.corrections === 2 ? "PASS" : "FAIL", `sources=${mineRoot.sourceCount} retests=${mineRoot.retestCount} derivatives=${mineRoot.derivativeCount} corrections=${mineRoot._count.corrections}`);
  // Delete the retest content: lineage must not orphan the correction into a crash.
  await prisma.contentItem.delete({ where: { id: retest.id } });
  const afterDel = await prisma.correctionEntry.findUnique({ where: { id: c1Id } });
  const rootsAfter = await attempt(() => listRoots(A));
  record("lineage", "deleting the retest item leaves the correction readable", !!afterDel && rootsAfter.outcome === "ok" ? "PASS" : "FAIL", `correction exists=${!!afterDel} retestContentItemId=${afterDel?.retestContentItemId} roots readable=${rootsAfter.outcome}`);
  void c2;

  /* ------------------------ learning velocity ------------------------ */
  section("visible learning velocity — persisted trajectory");
  const traj = await learningTrajectory(A, fx.alpha.startedAt!);
  record("velocity", "trajectory computed from persisted expectations", traj.periods.length >= 2 ? "PASS" : "FAIL", `${traj.periods.length} periods · ${traj.reading.direction} · "${traj.reading.headline}"`);
  const p = (n: number, over: Partial<PeriodRecord>): PeriodRecord => ({ period: n, start: new Date(), end: new Date(), meanScore: 4, published: 10, diagnosed: 2, corrections: 1, correctionsWorked: 0, correctionsFailed: 0, qualifiedActions: 0, ...over });
  const improving = readLearning([p(1, { meanScore: 2.1 }), p(2, { meanScore: 2.65 }), p(3, { meanScore: 3.2 })]);
  record("velocity", "improving 4.2→5.3→6.4 (on the 0–5 scale: 2.1→2.65→3.2)", improving.direction === "improving" ? "PASS" : "FAIL", improving.headline);
  const flat = readLearning([p(1, { meanScore: 2.6 }), p(2, { meanScore: 2.6 }), p(3, { meanScore: 2.65 })]);
  record("velocity", "flat 5.2→5.2→5.3 is not called improvement", flat.direction === "flat" ? "PASS" : "FAIL", flat.headline);
  const declining = readLearning([p(1, { meanScore: 2.5 }), p(2, { meanScore: 2.35 }), p(3, { meanScore: 2.05 })]);
  record("velocity", "declining 5.0→4.7→4.1 reported as declining", declining.direction === "declining" && /going down/.test(declining.headline) ? "PASS" : "FAIL", declining.headline);
  const missing = readLearning([p(1, { meanScore: 2.5 }), p(2, { meanScore: null, published: 0 }), p(3, { meanScore: 2.9 })]);
  record("velocity", "missing period is skipped, not read as zero", missing.direction === "improving" && missing.scoreDelta === 0.4 ? "PASS" : "FAIL", `${missing.direction} delta=${missing.scoreDelta} "${missing.headline}"`);
  const worked = readLearning([p(1, { meanScore: 2.5, corrections: 3, correctionsWorked: 1, correctionsFailed: 1 }), p(2, { meanScore: 2.9 })]);
  record("velocity", "hit rate counts only corrections with a verdict", worked.correctionHitRate === 0.5 && worked.correctionsPending === 2 ? "PASS" : "FAIL", `hit=${worked.correctionHitRate} pending=${worked.correctionsPending}`);
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runDiagnosis(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
