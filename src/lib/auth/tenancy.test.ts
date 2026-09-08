import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { listIdeas } from "@/lib/data/ideas";
import { listScripts } from "@/lib/data/scripts";
import { listContent, getContentItem } from "@/lib/data/content";
import { listResearch } from "@/lib/data/research";
import { listPatterns } from "@/lib/data/patterns";
import { listInquiries } from "@/lib/data/pipeline";
import { listAssets, searchWorkspace } from "@/lib/data/workspace";
import { contentLineage } from "@/lib/data/lineage";
import { publishedAssets } from "@/lib/data/metrics";
import { getRun, listRuns, runEvidence, runGateCounts, rankedTests } from "@/lib/data/runs";
import { currentDiagnosis, diagnosisSummary, getDiagnosis } from "@/lib/data/diagnosis";
import { listProofPeriods, getProofPeriod, proofView } from "@/lib/data/proof";
import { installationView } from "@/lib/data/installation";
import { orgIdFromStoragePath } from "@/lib/storage";

/**
 * Tenant isolation.
 *
 * The single most important invariant in the product: repository functions are
 * scoped by the orgId they are given, and there is no code path that returns
 * another organisation's rows.
 *
 * This runs against the real database, creating two throwaway organisations and
 * removing them afterwards. It fails loudly if a repository ever forgets its
 * `where: { orgId }`.
 */

const prisma = new PrismaClient();

const ALPHA = "tenancy-test-alpha";
const BETA = "tenancy-test-beta";

let alphaId = "";
let betaId = "";
let alphaContentId = "";
let alphaRunId = "";
let alphaDiagnosisId = "";

async function seedOrg(slug: string, marker: string) {
  const org = await prisma.organization.create({
    data: { slug, name: `Tenancy ${marker}`, kind: "client", status: "active" },
  });

  const idea = await prisma.idea.create({
    data: {
      orgId: org.id,
      title: `${marker} idea`,
      status: "approved",
      priorityScore: 70,
      source: "manual",
    },
  });

  const script = await prisma.script.create({
    data: { orgId: org.id, ideaId: idea.id, title: `${marker} script`, qaState: "approved" },
  });

  await prisma.scriptVersion.create({
    data: {
      scriptId: script.id,
      version: 1,
      hook: `${marker} hook`,
      body: `${marker} body`,
    },
  });

  const content = await prisma.contentItem.create({
    data: {
      orgId: org.id,
      ideaId: idea.id,
      scriptId: script.id,
      title: `${marker} content`,
      stage: "live",
      liveAt: new Date(),
    },
  });

  const publishRecord = await prisma.publishRecord.create({
    data: {
      orgId: org.id,
      contentItemId: content.id,
      platform: "linkedin",
      status: "published",
      publishedAt: new Date(),
      url: `https://example.com/${slug}`,
    },
  });

  await prisma.performanceSnapshot.create({
    data: { orgId: org.id, publishRecordId: publishRecord.id, views: 1234 },
  });

  await prisma.researchItem.create({
    data: { orgId: org.id, kind: "question", title: `${marker} research` },
  });

  await prisma.pattern.create({
    data: { orgId: org.id, kind: "pattern", title: `${marker} signal` },
  });

  await prisma.inquiry.create({
    data: { orgId: org.id, name: `${marker} person`, company: `${marker} company` },
  });

  await prisma.asset.create({
    data: { orgId: org.id, category: "research_doc", title: `${marker} asset` },
  });

  /* --- The post-v1 surfaces: runs, diagnosis, milestones, proof ----------- */

  const run = await prisma.intelligenceRun.create({
    data: {
      orgId: org.id,
      label: `${marker} cycle`,
      periodStart: new Date(Date.now() - 7 * 86_400_000),
      periodEnd: new Date(),
      status: "review",
      summary: `${marker} brief summary`,
    },
  });

  await prisma.runSource.create({
    data: {
      orgId: org.id,
      runId: run.id,
      kind: "note",
      label: `${marker} source`,
      status: "collected",
      itemsCollected: 1,
    },
  });

  const evidence = await prisma.researchItem.create({
    data: {
      orgId: org.id,
      runId: run.id,
      kind: "customer_language",
      title: `${marker} evidence`,
      collectedVia: "run",
    },
  });

  const candidate = await prisma.candidateSignal.create({
    data: {
      orgId: org.id,
      runId: run.id,
      kind: "pain",
      title: `${marker} candidate`,
      decision: "pending",
    },
  });

  await prisma.candidateEvidence.create({
    data: { candidateSignalId: candidate.id, researchItemId: evidence.id },
  });

  await prisma.pattern.create({
    data: {
      orgId: org.id,
      runId: run.id,
      kind: "test",
      title: `${marker} test`,
      status: "open",
      successMetric: `${marker} measure`,
    },
  });

  const diagnosis = await prisma.constraintDiagnosis.create({
    data: {
      orgId: org.id,
      status: "active",
      primaryConstraint: "positioning",
      severity: "high",
      commercialImpact: `${marker} impact`,
    },
  });

  await prisma.constraintAssessment.create({
    data: { diagnosisId: diagnosis.id, dimension: "positioning", rating: 2, note: `${marker} note` },
  });

  await prisma.installationMilestone.create({
    data: { orgId: org.id, key: "strategy_approved", note: `${marker} milestone` },
  });

  await prisma.proofPeriod.create({
    data: {
      orgId: org.id,
      kind: "baseline",
      label: `${marker} baseline`,
      periodStart: new Date(Date.now() - 90 * 86_400_000),
      periodEnd: new Date(Date.now() - 60 * 86_400_000),
      reportedFounderHours: 9,
    },
  });

  return {
    orgId: org.id,
    contentId: content.id,
    runId: run.id,
    diagnosisId: diagnosis.id,
  };
}

before(async () => {
  // Remove any residue from an interrupted previous run.
  await prisma.organization.deleteMany({ where: { slug: { in: [ALPHA, BETA] } } });

  const alpha = await seedOrg(ALPHA, "Alpha");
  const beta = await seedOrg(BETA, "Beta");
  alphaId = alpha.orgId;
  betaId = beta.orgId;
  alphaContentId = alpha.contentId;
  alphaRunId = alpha.runId;
  alphaDiagnosisId = alpha.diagnosisId;
});

after(async () => {
  await prisma.organization.deleteMany({ where: { slug: { in: [ALPHA, BETA] } } });
  await prisma.$disconnect();
});

describe("tenant isolation", () => {
  it("scopes ideas to one organisation", async () => {
    const alpha = await listIdeas(alphaId);
    const beta = await listIdeas(betaId);
    assert.ok(alpha.every((i) => i.orgId === alphaId));
    assert.ok(beta.every((i) => i.orgId === betaId));
    assert.equal(alpha.some((i) => i.title.includes("Beta")), false);
  });

  it("scopes scripts", async () => {
    const alpha = await listScripts(alphaId);
    assert.ok(alpha.every((s) => s.orgId === alphaId));
    assert.equal(alpha.some((s) => s.title.includes("Beta")), false);
  });

  it("scopes content", async () => {
    const alpha = await listContent(alphaId);
    assert.ok(alpha.every((c) => c.orgId === alphaId));
    assert.equal(alpha.some((c) => c.title.includes("Beta")), false);
  });

  it("scopes research", async () => {
    const alpha = await listResearch(alphaId);
    assert.ok(alpha.every((r) => r.orgId === alphaId));
  });

  it("scopes signals", async () => {
    const alpha = await listPatterns(alphaId);
    assert.ok(alpha.every((p) => p.orgId === alphaId));
  });

  it("scopes pipeline records", async () => {
    const alpha = await listInquiries(alphaId);
    assert.ok(alpha.every((i) => i.orgId === alphaId));
  });

  it("scopes library assets", async () => {
    const alpha = await listAssets(alphaId);
    assert.ok(alpha.every((a) => a.orgId === alphaId));
  });

  it("scopes published performance", async () => {
    const alpha = await publishedAssets(alphaId);
    assert.equal(alpha.length, 1);
    assert.equal(alpha[0]?.title, "Alpha content");
  });

  it("returns nothing when reading another tenant's record by id", async () => {
    const crossTenant = await getContentItem(betaId, alphaContentId);
    assert.equal(crossTenant, null, "a content item leaked across organisations");
  });

  it("returns no lineage for another tenant's record", async () => {
    const lineage = await contentLineage(betaId, alphaContentId, BETA);
    assert.equal(lineage, null, "lineage leaked across organisations");
  });

  it("never surfaces another tenant in search", async () => {
    const results = await searchWorkspace(alphaId, ALPHA, "Beta", "internal_operator");
    assert.equal(results.length, 0, `search leaked: ${JSON.stringify(results)}`);
  });

  it("finds its own records in search", async () => {
    const results = await searchWorkspace(alphaId, ALPHA, "Alpha", "internal_operator");
    assert.ok(results.length > 0, "search returned nothing for its own organisation");
    assert.ok(results.every((r) => !r.title.includes("Beta")));
  });

  it("scopes intelligence runs", async () => {
    const alpha = await listRuns(alphaId, "internal_operator");
    assert.ok(alpha.every((r) => r.orgId === alphaId));
    assert.equal(alpha.some((r) => r.label.includes("Beta")), false);
  });

  it("returns nothing when reading another tenant's run by id", async () => {
    assert.equal(await getRun(betaId, alphaRunId, "internal_operator"), null, "an intelligence run leaked");
  });

  it("scopes run evidence, so one tenant cannot read another's sources", async () => {
    const crossTenant = await runEvidence(betaId, alphaRunId);
    assert.equal(crossTenant.length, 0, "run evidence leaked across organisations");

    const own = await runEvidence(alphaId, alphaRunId);
    assert.equal(own.length, 1);
    assert.match(own[0]?.title ?? "", /Alpha/);
  });

  it("scopes the run gate counts a publish decision depends on", async () => {
    const crossTenant = await runGateCounts(betaId, alphaRunId);
    assert.equal(crossTenant.candidateCount, 0);
    assert.equal(crossTenant.evidenceCount, 0);
    assert.equal(crossTenant.totalSources, 0);

    const own = await runGateCounts(alphaId, alphaRunId);
    assert.equal(own.candidateCount, 1);
    assert.equal(own.pendingCandidates, 1);
  });

  it("scopes ranked tests", async () => {
    const alpha = await rankedTests(alphaId, "internal_operator");
    assert.ok(alpha.every((t) => t.orgId === alphaId));
    assert.equal(alpha.some((t) => t.title.includes("Beta")), false);
  });

  it("scopes the constraint diagnosis", async () => {
    const alpha = await currentDiagnosis(alphaId, "internal_operator");
    assert.equal(alpha?.orgId, alphaId);
    assert.match(alpha?.commercialImpact ?? "", /Alpha/);

    const summary = await diagnosisSummary(betaId, "internal_operator");
    assert.notEqual(summary?.id, alpha?.id);
    assert.equal(await getDiagnosis(betaId, alphaDiagnosisId, "internal_operator"), null, "a diagnosis leaked");
  });

  it("scopes proof periods", async () => {
    const alpha = await listProofPeriods(alphaId);
    assert.ok(alpha.every((p) => p.orgId === alphaId));
    assert.equal(alpha.some((p) => p.label.includes("Beta")), false);

    const alphaBaseline = alpha[0];
    assert.ok(alphaBaseline);
    assert.equal(
      await getProofPeriod(betaId, alphaBaseline.id),
      null,
      "a proof period leaked across organisations",
    );
  });

  it("builds the proof comparison from one tenant only", async () => {
    const view = await proofView(alphaId);
    assert.equal(view.baseline?.record.orgId, alphaId);
    assert.match(view.baseline?.record.label ?? "", /Alpha/);
  });

  it("scopes installation milestones", async () => {
    const view = await installationView(alphaId);
    const signOff = view.milestones.find((m) => m.key === "strategy_approved");
    assert.match(signOff?.note ?? "", /Alpha/);
    assert.doesNotMatch(signOff?.note ?? "", /Beta/);
  });

  it("derives the owning organisation from a storage path", () => {
    assert.equal(orgIdFromStoragePath(`${alphaId}/content/abc/file.mp4`), alphaId);
    assert.notEqual(orgIdFromStoragePath(`${betaId}/content/abc/file.mp4`), alphaId);
  });
});
