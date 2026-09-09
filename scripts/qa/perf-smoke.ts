/**
 * PERFORMANCE SMOKE — 20 synthetic clients through the real create action
 * (with the master template seeded so each workspace carries content), then
 * the heaviest reads timed against a budget. Removes everything afterwards.
 *
 *   node scripts/qa/run.cjs perf-smoke
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section, summary, cleanupSessions } from "./context";
import * as Admin from "../../src/lib/actions/admin";
import { listClients, portfolioSummary } from "../../src/lib/data/admin";
import { cockpit } from "../../src/lib/data/cockpit";
import { loadDashboard } from "../../src/lib/data/dashboard";
import { contentBoard } from "../../src/lib/data/content";
import { installationView } from "../../src/lib/data/installation";
import { workingOn } from "../../src/lib/data/client-surface";
import { learningTrajectory } from "../../src/lib/data/content-learning";

const OPERATOR = "operator@threadline.com";
const N = Number(process.argv.find((a) => a.startsWith("--n="))?.slice(4) ?? 20);
const BUDGET_MS = { create: 4000, read: 1500 };

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const t = performance.now();
  const value = await fn();
  return { ms: Math.round(performance.now() - t), value };
}

export async function teardownPerf() {
  await cleanupSessions();
  await prisma.organization.deleteMany({ where: { slug: { startsWith: "qa-perf-" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "qa.perf." } } });
}

export async function runPerf() {
  await teardownPerf();
  await actAs(OPERATOR);
  section(`performance smoke — ${N} clients`);

  const createTimes: number[] = [];
  for (let i = 0; i < N; i++) {
    const slug = `qa-perf-${String(i).padStart(2, "0")}`;
    const { ms, value } = await timed(() => attempt(() => Admin.createClientAction(null, fd({ name: `Perf Client ${i}`, slug, founderName: `Perf Founder ${i}`, founderEmail: `qa.perf.${i}@example.test`, founderPassword: `Qa-Perf-${i}-2026!`, platforms: "linkedin", seedTemplate: "on" }))));
    if (value.outcome !== "ok") record("perf", `create client ${i}`, "FAIL", `${value.outcome} ${"message" in value ? value.message : ""}`, "PERF-CREATE");
    createTimes.push(ms);
  }
  const orgs = await prisma.organization.findMany({ where: { slug: { startsWith: "qa-perf-" } }, select: { id: true, slug: true } });

  // Realistic rows in five workspaces: 60 published pieces each with publish
  // records, three snapshots and a handful of inquiries — the shape of a
  // client three periods in. Bulk inserts, labelled by slug, removed on exit.
  const { ms: seedMs } = await timed(async () => {
    for (const o of orgs.slice(0, 5)) {
      const items = await Promise.all(
        Array.from({ length: 60 }, (_, i) =>
          prisma.contentItem.create({
            data: { orgId: o.id, title: `Perf piece ${i}`, stage: "live", platform: i % 3 === 0 ? "youtube" : "linkedin", format: i % 3 === 0 ? "long_form" : "short_form", liveAt: new Date(Date.now() - i * 86_400_000) },
            select: { id: true, platform: true, liveAt: true },
          }),
        ),
      );
      for (const item of items) {
        const pub = await prisma.publishRecord.create({ data: { orgId: o.id, contentItemId: item.id, platform: item.platform, status: "published", publishedAt: item.liveAt, url: `https://example.test/${o.slug}/${item.id}` }, select: { id: true } });
        await prisma.performanceSnapshot.createMany({ data: [1, 2, 3].map((n) => ({ orgId: o.id, publishRecordId: pub.id, capturedAt: new Date((item.liveAt ?? new Date()).getTime() + n * 3 * 86_400_000), views: 400 * n + Math.floor(Math.random() * 300), likes: 12 * n, comments: 3 * n, shares: 2 * n, saves: 4 * n, retentionPct: 35 + n })) });
      }
      await prisma.inquiry.createMany({ data: items.slice(0, 8).map((item, i) => ({ orgId: o.id, name: `Perf buyer ${i}`, stage: i % 4 === 0 ? "call_booked" : "inquiry", contentItemId: item.id })) });
    }
  });
  const seededRows = await prisma.performanceSnapshot.count({ where: { orgId: { in: orgs.slice(0, 5).map((o) => o.id) } } });
  record("perf", "five workspaces populated with realistic rows (60 pieces, 3 snapshots each, inquiries)", seededRows >= 5 * 60 * 3 ? "PASS" : "FAIL", `${seededRows} snapshots in ${seedMs}ms`);
  const content = await prisma.contentItem.count({ where: { orgId: { in: orgs.map((o) => o.id) } } });
  const maxCreate = Math.max(...createTimes);
  record("perf", `${N} clients created through createClientAction (template seeded)`, orgs.length === N && maxCreate <= BUDGET_MS.create ? "PASS" : orgs.length === N ? "PARTIAL" : "FAIL", `orgs=${orgs.length} content rows=${content} create p50=${createTimes.sort((a, b) => a - b)[Math.floor(N / 2)]}ms max=${maxCreate}ms`);

  const total = await prisma.organization.count();
  const reads: [string, () => Promise<unknown>][] = [
    ["admin listClients", () => listClients()],
    ["admin portfolioSummary", () => portfolioSummary()],
    ["admin cockpit", () => cockpit()],
  ];
  for (const [label, fn] of reads) {
    const { ms } = await timed(fn);
    record("perf", `${label} across ${total} orgs`, ms <= BUDGET_MS.read ? "PASS" : "PARTIAL", `${ms}ms (budget ${BUDGET_MS.read}ms)`);
  }
  // Per-client pages: sample first, middle and last workspace.
  const sample = [orgs[0], orgs[Math.floor(orgs.length / 2)], orgs[orgs.length - 1]].filter(Boolean);
  for (const o of sample) {
    const perOrg: [string, () => Promise<unknown>][] = [
      ["dashboard", () => loadDashboard(o.id, o.slug)],
      ["production board", () => contentBoard(o.id)],
      ["installation", () => installationView(o.id)],
      ["working-on", () => workingOn(o.id, o.slug)],
      ["learning trajectory", () => learningTrajectory(o.id, new Date(Date.now() - 90 * 86_400_000))],
    ];
    const times: string[] = [];
    let worst = 0;
    for (const [label, fn] of perOrg) {
      const { ms } = await timed(fn);
      times.push(`${label}=${ms}ms`);
      worst = Math.max(worst, ms);
    }
    record("perf", `client reads for ${o.slug}`, worst <= BUDGET_MS.read ? "PASS" : "PARTIAL", times.join(" "));
  }

  // Ten concurrent dashboard loads — the shape of ten clients opening the app at once.
  const { ms: concurrentMs } = await timed(() => Promise.all(orgs.slice(0, 10).map((o) => loadDashboard(o.id, o.slug))));
  record("perf", "10 concurrent dashboard loads", concurrentMs <= BUDGET_MS.read * 2 ? "PASS" : "PARTIAL", `${concurrentMs}ms total`);
}

if (require.main === module) {
  (async () => {
    try {
      await runPerf();
    } finally {
      await teardownPerf();
      const left = await prisma.organization.count({ where: { slug: { startsWith: "qa-perf-" } } });
      const s = summary();
      console.log(`\nperf: pass=${s.pass} partial=${s.partial} fail=${s.fail} · cleanup remaining=${left}`);
      await prisma.$disconnect();
      process.exitCode = s.fail || left ? 1 : 0;
    }
  })();
}
