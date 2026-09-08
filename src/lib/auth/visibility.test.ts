import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { can, capabilitiesFor } from "@/lib/auth/roles";
import { ROLES, type Role } from "@/lib/domain/enums";
import {
  INTERNAL_ONLY,
  VISIBILITY_LEVELS,
  clientScope,
  diagnosisVisibility,
  isClientVisible,
  patternVisibility,
  proofVisibility,
  reportVisibility,
  runVisibility,
  seesOperatorSurface,
  taskVisibility,
} from "@/lib/domain/visibility";
import { clientNav, operatorNav, commandTargets } from "@/lib/navigation";
import { listRuns, getRun, rankedTests } from "@/lib/data/runs";
import { currentDiagnosis, getDiagnosis } from "@/lib/data/diagnosis";
import { contentComments } from "@/lib/data/content";
import { searchWorkspace } from "@/lib/data/workspace";

/**
 * The curated client surface.
 *
 * One system, two experiences — and the second one is only real if the server
 * enforces it. These tests run against the database and assert that a client
 * role cannot reach internal records through a repository, a search box, or a
 * nav entry, whatever the URL says.
 */

const prisma = new PrismaClient();

const SLUG = "visibility-test-org";
const CLIENT_ROLES: Role[] = ["client_admin", "client_member", "editor"];
const INTERNAL_ROLES: Role[] = ["super_admin", "internal_operator"];

let orgId = "";
let publishedRunId = "";
let draftRunId = "";
let activeDiagnosisId = "";
let draftDiagnosisId = "";
let contentId = "";

before(async () => {
  await prisma.organization.deleteMany({ where: { slug: SLUG } });

  const org = await prisma.organization.create({
    data: { slug: SLUG, name: "Visibility Test", kind: "client", status: "active" },
  });
  orgId = org.id;

  const published = await prisma.intelligenceRun.create({
    data: {
      orgId,
      label: "Published brief",
      periodStart: new Date(Date.now() - 7 * 86_400_000),
      periodEnd: new Date(),
      status: "published",
      summary: "Client readable",
    },
  });
  publishedRunId = published.id;

  const draft = await prisma.intelligenceRun.create({
    data: {
      orgId,
      label: "SECRET working cycle",
      periodStart: new Date(),
      periodEnd: new Date(),
      status: "collecting",
    },
  });
  draftRunId = draft.id;

  // Raw research: collected but never promoted. The client must never see it.
  await prisma.researchItem.create({
    data: { orgId, kind: "competitor_post", title: "SECRET raw research", collectedVia: "run", runId: draft.id },
  });

  await prisma.pattern.create({
    data: { orgId, kind: "test", title: "Shared test", status: "open", visibility: "client_published" },
  });
  await prisma.pattern.create({
    data: { orgId, kind: "test", title: "SECRET internal test", status: "open" },
  });
  await prisma.pattern.create({
    data: { orgId, kind: "hypothesis", title: "SECRET hypothesis", status: "open" },
  });

  const active = await prisma.constraintDiagnosis.create({
    data: { orgId, status: "active", primaryConstraint: "positioning", commercialImpact: "Shared" },
  });
  activeDiagnosisId = active.id;

  const draftDiagnosis = await prisma.constraintDiagnosis.create({
    data: { orgId, status: "draft", primaryConstraint: "conversion", evidence: "SECRET hypothesis" },
  });
  draftDiagnosisId = draftDiagnosis.id;

  const content = await prisma.contentItem.create({
    data: { orgId, title: "A piece", stage: "in_review" },
  });
  contentId = content.id;

  await prisma.comment.create({
    data: {
      orgId,
      entityType: "content_item",
      entityId: content.id,
      body: "Shared feedback",
      internal: false,
    },
  });
  await prisma.comment.create({
    data: {
      orgId,
      entityType: "content_item",
      entityId: content.id,
      body: "SECRET operator note",
      internal: true,
    },
  });
});

after(async () => {
  await prisma.organization.deleteMany({ where: { slug: SLUG } });
  await prisma.$disconnect();
});

/* ------------------------------ The capability ----------------------------- */

describe("surface split", () => {
  it("puts only Threadline staff on the operator surface", () => {
    for (const role of INTERNAL_ROLES) {
      assert.equal(seesOperatorSurface(role), true, `${role} should see the operator surface`);
    }
    for (const role of CLIENT_ROLES) {
      assert.equal(seesOperatorSurface(role), false, `${role} must not see the operator surface`);
    }
  });

  it("DENIES every client role the internal-only capabilities", () => {
    const internalOnly = [
      "research.view",
      "research.edit",
      "signals.view",
      "signals.edit",
      "runs.manage",
      "readiness.assess",
      "longform.manage",
    ] as const;

    for (const role of CLIENT_ROLES) {
      for (const capability of internalOnly) {
        assert.equal(
          can(role, capability),
          false,
          `${role} must not hold ${capability} — hidden nav is not the control`,
        );
      }
    }
    for (const capability of internalOnly) {
      assert.equal(can("internal_operator", capability), true, `operator needs ${capability}`);
    }
  });

  it("keeps the client able to do their own job", () => {
    for (const capability of ["workspace.view", "recording.view", "production.view"] as const) {
      assert.equal(can("client_admin", capability), true);
      assert.equal(can("client_member", capability), true);
    }
    assert.equal(can("client_admin", "scripts.approve"), true);
    assert.equal(can("client_admin", "install.signoff"), true);
    assert.equal(can("client_admin", "diagnosis.view"), true);
    assert.equal(can("client_admin", "proof.view"), true);
  });

  it("still gives an operator a superset of a client admin", () => {
    const operator = new Set(capabilitiesFor("internal_operator"));
    for (const capability of capabilitiesFor("client_admin")) {
      assert.ok(operator.has(capability), `operator is missing ${capability}`);
    }
  });
});

describe("navigation", () => {
  it("never routes a client to an operator-only surface", () => {
    const clientHrefs = clientNav("acme").flatMap((item) => [
      item.href,
      ...(item.children?.map((c) => c.href) ?? []),
    ]);
    for (const href of clientHrefs) {
      assert.doesNotMatch(href, /\/intelligence\/radar/, `client nav exposes ${href}`);
      assert.doesNotMatch(href, /\/intelligence\/signals/, `client nav exposes ${href}`);
    }
  });

  it("keeps the full loop on the operator surface", () => {
    const operatorHrefs = operatorNav("acme").flatMap((item) => [
      item.href,
      ...(item.children?.map((c) => c.href) ?? []),
    ]);
    assert.ok(operatorHrefs.some((h) => h.includes("/intelligence/radar")));
    assert.ok(operatorHrefs.some((h) => h.includes("/intelligence/signals")));
  });

  it("keeps the client command menu inside the client surface", () => {
    for (const target of commandTargets("acme", "client")) {
      assert.doesNotMatch(target.href, /\/intelligence\/(radar|signals)/, target.label);
    }
  });

  it("declares every client nav item with a capability a client actually holds", () => {
    for (const item of clientNav("acme")) {
      assert.ok(
        can("client_admin", item.capability),
        `client_admin cannot reach its own nav item "${item.label}"`,
      );
    }
  });
});

/* ------------------------------- Derivation -------------------------------- */

describe("visibility derivation", () => {
  it("treats internal as the safe default", () => {
    assert.equal(isClientVisible("internal"), false);
    assert.equal(patternVisibility("anything-unknown"), "internal");
    assert.equal(patternVisibility(""), "internal");
  });

  it("derives from the state that already exists", () => {
    assert.equal(runVisibility("published"), "client_published");
    assert.equal(runVisibility("review"), "internal");
    assert.equal(diagnosisVisibility("active"), "client_published");
    assert.equal(diagnosisVisibility("draft"), "internal");
    assert.equal(reportVisibility("final"), "client_published");
    assert.equal(reportVisibility("draft"), "internal");
    assert.equal(taskVisibility("client"), "client_action_required");
    assert.equal(taskVisibility("internal"), "internal");
    assert.equal(proofVisibility(new Date()), "client_published");
    assert.equal(proofVisibility(null), "client_draft");
  });

  it("gives every level a meaning", () => {
    for (const level of VISIBILITY_LEVELS) {
      assert.equal(typeof isClientVisible(level), "boolean");
    }
    assert.ok(INTERNAL_ONLY.length > 0);
  });

  it("produces an empty filter for operators and a narrowing one for clients", () => {
    for (const role of INTERNAL_ROLES) {
      assert.deepEqual(clientScope.patterns(role), {});
      assert.deepEqual(clientScope.runs(role), {});
      assert.deepEqual(clientScope.comments(role), {});
    }
    for (const role of CLIENT_ROLES) {
      assert.deepEqual(clientScope.patterns(role), { visibility: "client_published" });
      assert.deepEqual(clientScope.runs(role), { status: "published" });
      assert.deepEqual(clientScope.comments(role), { internal: false });
    }
  });
});

/* --------------------------- Enforcement, for real -------------------------- */

describe("client-scoped reads", () => {
  it("HIDES an unpublished cycle from every client role", async () => {
    for (const role of CLIENT_ROLES) {
      const runs = await listRuns(orgId, role);
      assert.equal(runs.length, 1, `${role} saw ${runs.length} runs`);
      assert.equal(runs[0]?.status, "published");
      assert.equal(
        runs.some((r) => r.label.includes("SECRET")),
        false,
        `${role} saw working state`,
      );
    }
  });

  it("returns nothing when a client fetches an unpublished cycle by id", async () => {
    for (const role of CLIENT_ROLES) {
      assert.equal(await getRun(orgId, draftRunId, role), null, `${role} reached a draft cycle`);
      assert.notEqual(await getRun(orgId, publishedRunId, role), null);
    }
  });

  it("shows an operator both", async () => {
    const runs = await listRuns(orgId, "internal_operator");
    assert.equal(runs.length, 2);
    assert.notEqual(await getRun(orgId, draftRunId, "internal_operator"), null);
  });

  it("hides internal signals and shows shared ones", async () => {
    for (const role of CLIENT_ROLES) {
      const tests = await rankedTests(orgId, role);
      assert.equal(tests.length, 1, `${role} saw ${tests.length} tests`);
      assert.equal(tests[0]?.title, "Shared test");
    }
    const all = await rankedTests(orgId, "internal_operator");
    assert.equal(all.length, 2);
  });

  it("hides a draft diagnosis from a client", async () => {
    for (const role of CLIENT_ROLES) {
      const current = await currentDiagnosis(orgId, role);
      assert.equal(current?.status, "active", `${role} saw a draft diagnosis`);
      assert.equal(
        await getDiagnosis(orgId, draftDiagnosisId, role),
        null,
        `${role} fetched a draft diagnosis by id`,
      );
      assert.notEqual(await getDiagnosis(orgId, activeDiagnosisId, role), null);
    }
    assert.notEqual(await getDiagnosis(orgId, draftDiagnosisId, "internal_operator"), null);
  });

  it("NEVER returns an operator-private comment to a client", async () => {
    for (const role of CLIENT_ROLES) {
      const comments = await contentComments(orgId, contentId, role);
      assert.equal(comments.length, 1, `${role} saw ${comments.length} comments`);
      assert.equal(comments[0]?.body, "Shared feedback");
      assert.equal(
        comments.some((c) => c.body.includes("SECRET")),
        false,
      );
    }
    const all = await contentComments(orgId, contentId, "internal_operator");
    assert.equal(all.length, 2);
  });

  it("NEVER leaks raw research or internal signals through search", async () => {
    for (const role of CLIENT_ROLES) {
      const results = await searchWorkspace(orgId, SLUG, "SECRET", role);
      assert.equal(
        results.length,
        0,
        `${role} found ${JSON.stringify(results.map((r) => r.title))} via search`,
      );
    }
  });

  it("does surface internal records to an operator through search", async () => {
    const results = await searchWorkspace(orgId, SLUG, "SECRET", "internal_operator");
    assert.ok(results.length > 0, "operator search returned nothing");
    assert.ok(results.some((r) => r.type === "Research"));
  });

  it("lets a client find its own shared records", async () => {
    const results = await searchWorkspace(orgId, SLUG, "Shared", "client_admin");
    assert.ok(results.length > 0, "client search returned nothing for a shared record");
  });
});

describe("role coverage", () => {
  it("classifies every declared role as exactly one surface", () => {
    for (const role of ROLES) {
      const operator = seesOperatorSurface(role);
      assert.equal(typeof operator, "boolean");
      assert.equal(
        operator,
        INTERNAL_ROLES.includes(role),
        `${role} is on the wrong surface — a new role defaults to the client surface, which is the safe direction, but must be decided deliberately`,
      );
    }
  });
});
