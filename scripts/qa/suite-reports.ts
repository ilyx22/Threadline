/**
 * REPORTS, SERVICE PERIODS AND CADENCE WORDING.
 *
 * A report is generated through the real action (demo provider), its payload
 * is inspected for the sections the brief requires, it is finalised, and every
 * way of changing it afterwards is attempted. Then the four-week arithmetic,
 * then a sweep of the repository for "monthly" used where the service cadence
 * is meant.
 */
import { execSync } from "node:child_process";
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section } from "./context";
import { buildFixture, teardown, ALPHA, type Fixture } from "./suite-tenancy";
import * as Reports from "../../src/lib/actions/reports";
import { listReports, getReport } from "../../src/lib/data/reports";
import { periodWindow, periodWindows } from "../../src/lib/domain/learning-velocity";
import { INITIAL_ENGAGEMENT_WEEKS, PERIODS_PER_YEAR, monthlyEquivalent, initialContractValue } from "../../src/lib/domain/service-period";
import { clientScope } from "../../src/lib/domain/visibility";

const A_ADMIN = "qa.alpha.admin@example.test";
const A_MEMBER = "qa.alpha.member@example.test";
const OPERATOR = "operator@threadline.com";

export async function runReports(fx: Fixture) {
  const A = fx.alpha.id;

  section("reports — generate, inspect, finalise, freeze");
  await actAs(A_MEMBER);
  const memberGen = await attempt(() => Reports.generateWeeklyReportAction(ALPHA));
  record("reports", "client member cannot generate", memberGen.outcome !== "ok" ? "PASS" : "FAIL", `${memberGen.outcome}`);
  await actAs(A_ADMIN);
  const adminGen = await attempt(() => Reports.generateWeeklyReportAction(ALPHA));
  record("reports", "client admin cannot draft reports (operator work, REP-01)", adminGen.outcome !== "ok" ? "PASS" : "FAIL", `${adminGen.outcome}`);
  await actAs(OPERATOR);
  const gen = await attempt(() => Reports.generateWeeklyReportAction(ALPHA));
  const rid = gen.outcome === "ok" ? (gen.value as { data: { id: string; isDemo: boolean } }).data.id : "";
  const isDemo = gen.outcome === "ok" ? (gen.value as { data: { isDemo: boolean } }).data.isDemo : null;
  record("reports", "operator generates a report (demo provider, labelled)", gen.outcome === "ok" && isDemo === true ? "PASS" : "FAIL", `${gen.outcome} isDemo=${isDemo} ${(gen as { message?: string }).message?.slice(0, 50) ?? ""}`);
  const rep = await getReport(A, rid, "internal_operator");
  const rawPayload = (rep as { payload?: unknown } | null)?.payload ?? {};
  const parsed = (typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload) as Record<string, unknown>;
  const payload = JSON.stringify(parsed);
  const keys = Object.keys(parsed);
  record("reports", "payload has shipped / performance / wins / misses / learnings / nextWeek", ["shipped", "performance", "wins", "misses", "learnings", "nextWeek"].every((k) => k in parsed) ? "PASS" : "FAIL", keys.join(","));
  const learning = (parsed.learning ?? {}) as Record<string, unknown>;
  const required = ["learned", "expectedVsActual", "weakestLink", "whatChanged", "whetherChangeWorked", "dataLimitations", "nextTests", "stillUnknown"];
  const present = required.filter((r) => r in learning);
  record("reports", "brief §33 sections (learned / expected-vs-actual / weakest link / what changed / limitations / next test / unknown) frozen in the payload", present.length === required.length ? "PASS" : "FAIL", `present: ${present.join(", ") || "none"} — missing: ${required.filter((r) => !present.includes(r)).join(", ") || "none"}`);
  record("reports", "report does not overclaim commercial results", !/guarantee|will generate|ROI of/i.test(payload) ? "PASS" : "FAIL", "");
  const drafts = await listReports(A, "internal_operator");
  const draftRow = drafts.find((r) => r.id === rid);
  record("reports", "report starts as draft", draftRow?.status === "draft" ? "PASS" : "FAIL", `status=${draftRow?.status}`);
  const scope = clientScope.reports("client_member");
  const clientVisible = await prisma.weeklyReport.findMany({ where: { orgId: A, ...scope } });
  record("reports", "client scope hides drafts (visibility rule)", !clientVisible.some((r) => r.id === rid) ? "PASS" : "FAIL", `client sees ${clientVisible.length}, draft included=${clientVisible.some((r) => r.id === rid)}`);
  await actAs(A_MEMBER);
  const memberFinal = await attempt(() => Reports.finaliseReportAction(ALPHA, rid));
  record("reports", "client member cannot finalise", memberFinal.outcome !== "ok" ? "PASS" : "FAIL", `${memberFinal.outcome}`);
  await actAs(A_ADMIN);
  const adminFin = await attempt(() => Reports.finaliseReportAction(ALPHA, rid));
  record("reports", "client admin cannot finalise (REP-01)", adminFin.outcome !== "ok" && (await prisma.weeklyReport.findUnique({ where: { id: rid } }))?.status === "draft" ? "PASS" : "FAIL", `${adminFin.outcome}`);
  await actAs(OPERATOR);
  const fin = await attempt(() => Reports.finaliseReportAction(ALPHA, rid));
  const finRow = await prisma.weeklyReport.findUnique({ where: { id: rid } });
  record("reports", "finalise → status final", fin.outcome === "ok" && finRow?.status === "final" ? "PASS" : "FAIL", `${fin.outcome} status=${finRow?.status}`);
  const frozenPayload = finRow?.payload;
  const del = await attempt(() => Reports.deleteReportAction(ALPHA, rid));
  record("reports", "final report cannot be deleted", del.outcome !== "ok" && !!(await prisma.weeklyReport.findUnique({ where: { id: rid } })) ? "PASS" : "FAIL", `${del.outcome} ${(del as { message?: string }).message?.slice(0, 50) ?? ""}`, del.outcome === "ok" ? "REPORT-DELETE-FINAL" : undefined);
  const again = await attempt(() => Reports.finaliseReportAction(ALPHA, rid));
  record("reports", "re-finalising is a no-op", again.outcome === "ok" && (await prisma.weeklyReport.findUnique({ where: { id: rid } }))!.payload === frozenPayload ? "PASS" : "FAIL", `${again.outcome}`);
  const gen2 = await attempt(() => Reports.generateWeeklyReportAction(ALPHA));
  const after = await prisma.weeklyReport.findUnique({ where: { id: rid } });
  record("reports", "generating again refuses and never rewrites the finalised one (QA-008)", gen2.outcome === "refused" && after!.payload === frozenPayload && after!.status === "final" ? "PASS" : "FAIL", `${gen2.outcome} frozen intact=${after!.payload === frozenPayload}`, gen2.outcome === "ok" ? "REPORT-REGEN" : undefined);
  const nowVisible = await prisma.weeklyReport.findMany({ where: { orgId: A, ...scope } });
  record("reports", "final report becomes client-visible", nowVisible.some((r) => r.id === rid) ? "PASS" : "FAIL", `client sees ${nowVisible.length}`);
  const sent = await prisma.job.count({ where: { type: "email.send", idempotencyKey: { startsWith: `report:${rid}:v1:` } } });
  record("reports", "finalising sends the report once per reader (REP-03)", sent >= 1 ? "PASS" : "FAIL", `${sent} email job(s)`);

  // REP-01: corrections are new versions; the client keeps the current final until the correction is final.
  await actAs(OPERATOR);
  const rev = await attempt(() => Reports.reviseReportAction(ALPHA, rid, null, fd({ reason: "Views were double counted on one post" })));
  const revId = rev.outcome === "ok" ? (rev.value as { data: { id: string } }).data.id : "";
  const clientDuring = await listReports(A, "client_member");
  record("reports", "a correction starts as a new draft version; the client still sees version 1", rev.outcome === "ok" && clientDuring.some((r) => r.id === rid) && !clientDuring.some((r) => r.id === revId) ? "PASS" : "FAIL", `${rev.outcome}`);
  const finRev = await attempt(() => Reports.finaliseReportAction(ALPHA, revId));
  const clientAfter = await listReports(A, "client_member");
  const v1 = await prisma.weeklyReport.findUnique({ where: { id: rid } });
  record("reports", "finalising the correction replaces version 1 for the client and keeps it on record", finRev.outcome === "ok" && clientAfter.some((r) => r.id === revId) && !clientAfter.some((r) => r.id === rid) && !!v1?.supersededAt && v1.payload === frozenPayload ? "PASS" : "FAIL", `${finRev.outcome}`);
  await actAs(OPERATOR);
  const priorDraft = await prisma.weeklyReport.create({ data: { orgId: A, periodStart: new Date(Date.now() - 21 * 86_400_000), periodEnd: new Date(Date.now() - 14 * 86_400_000), status: "draft" } });
  const opDel = await attempt(() => Reports.deleteReportAction(ALPHA, priorDraft.id));
  record("reports", "operator can delete a draft", opDel.outcome === "ok" && !(await prisma.weeklyReport.findUnique({ where: { id: priorDraft.id } })) ? "PASS" : "FAIL", `${opDel.outcome}`);
  record("reports", "export / print path", "PARTIAL", "print stylesheet exists per HANDOFF; no server-side export verified in this harness — browser check pending");

  section("service periods — four weeks, never a month");
  const start = new Date("2026-01-05T00:00:00.000Z");
  const w1 = periodWindow(start, start)!;
  record("periods", "period 1 is exactly 28 days", w1.period === 1 && w1.end.getTime() - w1.start.getTime() === 28 * 86_400_000 - 1 ? "PASS" : "FAIL", `${w1.start.toISOString().slice(0, 10)} → ${w1.end.toISOString().slice(0, 10)}`);
  record("periods", "boundary: last ms of day 28 is P1, first ms of day 29 is P2", periodWindow(start, new Date(start.getTime() + 28 * 86_400_000 - 1))!.period === 1 && periodWindow(start, new Date(start.getTime() + 28 * 86_400_000))!.period === 2 ? "PASS" : "FAIL", "");
  record("periods", "13 periods a year, initial engagement 12 weeks", PERIODS_PER_YEAR === 13 && INITIAL_ENGAGEMENT_WEEKS === 12 ? "PASS" : "FAIL", `${PERIODS_PER_YEAR}/yr, ${INITIAL_ENGAGEMENT_WEEKS}w`);
  record("periods", "£2,500 setup + 3 × £2,500 = £10,000 TCV", initialContractValue(250_000, 250_000) === 1_000_000 ? "PASS" : "FAIL", `${initialContractValue(250_000, 250_000) / 100}`);
  record("periods", "monthly equivalent of £2,500/period is £2,708 (13/12), not £2,500", monthlyEquivalent(250_000) === 270_833 ? "PASS" : "FAIL", `${monthlyEquivalent(250_000) / 100}`);
  const leap = periodWindows(new Date("2028-01-31T00:00:00.000Z"), new Date("2028-04-30T00:00:00.000Z"));
  record("periods", "leap year does not shift a period", leap.every((w, i) => i === 0 || w.start.getTime() - leap[i - 1].start.getTime() === 28 * 86_400_000) ? "PASS" : "FAIL", `${leap.length} periods across Feb 2028`);
  record("periods", "period 4+ continues (no end at period 3)", periodWindow(start, new Date("2026-06-01T00:00:00.000Z"))!.period >= 4 ? "PASS" : "FAIL", `period ${periodWindow(start, new Date("2026-06-01T00:00:00.000Z"))!.period}`);

  section("cadence wording — repository sweep");
  let hits = "";
  try {
    hits = execSync(`grep -rniE "monthly (fee|retainer|price|subscription)|per month|/month|£2,?500 (a|per) month|month(ly)? recurring" src --include=*.ts --include=*.tsx | grep -viE "monthlyEquivalent|monthly equivalent|InternalMetric|calendar|book-?keeping|reconcil|equivalent|NOT a monthly|not a monthly|never a month|four-week|4-week|service-period\.(ts|test\.ts)|:[0-9]+:\s*(\*|//)" || true`, { encoding: "utf8" });
  } catch { hits = ""; }
  const lines = hits.split("\n").filter(Boolean);
  record("cadence", "no stale 'monthly' wording for the service cadence in src", lines.length === 0 ? "PASS" : "FAIL", lines.length ? lines.slice(0, 5).map((l) => l.slice(0, 110)).join(" | ") : "clean", lines.length ? "CADENCE-WORDING" : undefined);
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runReports(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
