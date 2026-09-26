/**
 * Run every QA suite against one fixture and print the master matrix.
 *
 *   NODE_OPTIONS="--require ./scripts/qa/preload.cjs" npx tsx --conditions=react-server scripts/qa/run-all.ts
 *
 * Exit code is non-zero when any check FAILS. PARTIAL and N/A do not fail the
 * run; they are listed so nobody mistakes them for passes.
 */
import { prisma } from "../../src/lib/db/client";
import { findings, summary, type Finding } from "./context";
import { buildFixture, teardown, runTenancy } from "./suite-tenancy";
import { runWorkflow } from "./suite-workflow";
import { runDiagnosis } from "./suite-diagnosis";
import { runCorpusJudge } from "./suite-corpus-judge";
import { runAttribution } from "./suite-attribution";
import { runHostile } from "./suite-hostile-input";
import { runOnboarding } from "./suite-onboarding";
import { runSales } from "./suite-sales-validation";
import { runReports } from "./suite-reports";
import { runCoreSpine, teardownSpine } from "./suite-core-spine";
import { runJourneys, cleanupJourneys } from "./suite-journeys";
import { runJourneysMore, cleanupJourneysMore } from "./suite-journeys-more";

type Suite = { name: string; run: () => Promise<void>; fresh?: boolean };

async function main() {
  const started = Date.now();
  let fx = await buildFixture();

  const suites: Suite[] = [
    { name: "tenancy / roles / auth", run: () => runTenancy(fx) },
    { name: "workflow gates", run: () => runWorkflow(fx), fresh: true },
    { name: "content diagnosis", run: () => runDiagnosis(fx), fresh: true },
    { name: "corpus + Judge", run: () => runCorpusJudge() },
    { name: "attribution", run: () => runAttribution(fx), fresh: true },
    { name: "hostile input / files", run: () => runHostile(fx), fresh: true },
    { name: "onboarding / Brand Brain / readiness / packaging", run: () => runOnboarding(fx), fresh: true },
    { name: "sales / validation gate / cockpit", run: () => runSales(fx), fresh: true },
    { name: "reports / periods / cadence", run: () => runReports(fx), fresh: true },
    { name: "core spine (3 engagements)", run: () => runCoreSpine() },
    { name: "acceptance journeys 1, 2 and 8", run: () => runJourneys() },
    { name: "acceptance journeys 3-7, 9 and 10", run: () => runJourneysMore() },
  ];

  const perSuite: { name: string; before: number; ms: number; error?: string }[] = [];
  for (const suite of suites) {
    if (suite.fresh) fx = await buildFixture(); // each suite mutates the fixture; start clean
    const before = findings.length;
    const t = Date.now();
    console.log(`\n${"=".repeat(78)}\n${suite.name.toUpperCase()}\n${"=".repeat(78)}`);
    try {
      await suite.run();
      perSuite.push({ name: suite.name, before, ms: Date.now() - t });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      findings.push({ area: suite.name, feature: "suite crashed", verdict: "FAIL", detail: message, bug: "SUITE-CRASH" });
      perSuite.push({ name: suite.name, before, ms: Date.now() - t, error: message });
    }
  }

  await teardown();
  await teardownSpine();
  await cleanupJourneys();
  await cleanupJourneysMore();

  /* ------------------------------ Master matrix ------------------------------ */
  const byArea = new Map<string, Finding[]>();
  for (const f of findings) byArea.set(f.area, [...(byArea.get(f.area) ?? []), f]);
  const count = (list: Finding[], v: Finding["verdict"]) => list.filter((f) => f.verdict === v).length;

  console.log(`\n${"=".repeat(78)}\nMASTER MATRIX\n${"=".repeat(78)}`);
  console.log(`${"area".padEnd(34)} pass  ext  part  fail   na   verdict`);
  for (const [area, list] of [...byArea.entries()].sort()) {
    const fail = count(list, "FAIL");
    const part = count(list, "PARTIAL");
    const verdict = fail ? "FAIL" : part ? "PARTIAL" : count(list, "PASS_EXT") ? "PASS WITH EXTERNAL GATE" : count(list, "PASS") ? "PASS" : "N/A";
    console.log(`${area.padEnd(34)} ${String(count(list, "PASS")).padStart(4)} ${String(count(list, "PASS_EXT")).padStart(4)} ${String(part).padStart(5)} ${String(fail).padStart(5)} ${String(count(list, "NA")).padStart(4)}   ${verdict}`);
  }

  const s = summary();
  console.log(`\nTOTAL  pass=${s.pass}  pass-with-external-gate=${s.ext}  partial=${s.partial}  fail=${s.fail}  n/a=${s.na}  (${findings.length} checks, ${Math.round((Date.now() - started) / 1000)}s)`);

  const fails = findings.filter((f) => f.verdict === "FAIL");
  if (fails.length) {
    console.log(`\nFAILURES`);
    for (const f of fails) console.log(`  [${f.area}] ${f.feature} — ${f.detail.slice(0, 160)}${f.bug ? `  <${f.bug}>` : ""}`);
  }
  const partials = findings.filter((f) => f.verdict === "PARTIAL");
  if (partials.length) {
    console.log(`\nPARTIAL (not passes)`);
    for (const f of partials) console.log(`  [${f.area}] ${f.feature} — ${f.detail.slice(0, 160)}`);
  }
  if (s.bugs.length) console.log(`\nBUG TAGS RAISED: ${s.bugs.join(", ")}`);
  for (const p of perSuite) if (p.error) console.log(`\nSUITE CRASH: ${p.name} — ${p.error}`);

  const left = await prisma.organization.count({ where: { OR: [{ slug: { startsWith: "qa-" } }] } });
  const leftUsers = await prisma.user.count({ where: { email: { endsWith: "@example.test" } } });
  console.log(`\ncleanup: synthetic orgs remaining=${left} synthetic users remaining=${leftUsers}`);

  await prisma.$disconnect();
  process.exitCode = fails.length || left || leftUsers ? 1 : 0;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
