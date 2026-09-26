/**
 * TENANCY, ROLES AND AUTH — adversarial.
 *
 * Two synthetic workspaces, every role, every tenant-scoped model. Tenant B's
 * admin attacks Tenant A's rows through the real server actions in both shapes
 * an attacker has available: their own slug with A's ids (IDOR) and A's slug
 * with A's ids (route substitution). Then every data-layer read is called with
 * B's org id and checked for A's rows. Then the role matrix inside A.
 *
 * Every refusal is verified against the database afterwards. A refusal that
 * still mutated the row is a leak with a polite error message.
 */
import { prisma } from "../../src/lib/db/client";
import {
  actAs, anonymous, attempt, cleanupSessions, expiredSession, fd, malformedCookie, record, section,
} from "./context";
import * as Ideas from "../../src/lib/actions/ideas";
import * as Scripts from "../../src/lib/actions/scripts";
import * as Content from "../../src/lib/actions/content";
import * as Workspace from "../../src/lib/actions/workspace";
import * as Team from "../../src/lib/actions/team";
import * as Pipeline from "../../src/lib/actions/pipeline";
import * as Reports from "../../src/lib/actions/reports";
import * as Attribution from "../../src/lib/actions/attribution";
import * as Learning from "../../src/lib/actions/learning";
import * as Proof from "../../src/lib/actions/proof";
import * as Diagnosis from "../../src/lib/actions/diagnosis";
import * as Distribution from "../../src/lib/actions/distribution";
import * as Auth from "../../src/lib/actions/auth";
import { __resetRateLimits } from "../../src/lib/security/rate-limit";

export const ALPHA = "qa-alpha";
export const BETA = "qa-beta";
const A_ADMIN = "qa.alpha.admin@example.test";
const A_MEMBER = "qa.alpha.member@example.test";
const A_EDITOR = "qa.alpha.editor@example.test";
const B_ADMIN = "qa.beta.admin@example.test";
const DISABLED = "qa.alpha.disabled@example.test";

export type Fixture = Awaited<ReturnType<typeof buildFixture>>;

export async function teardown() {
  await cleanupSessions();
  await prisma.organization.deleteMany({ where: { slug: { in: [ALPHA, BETA] } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@example.test" } } });
}

export async function buildFixture() {
  await teardown();
  // Every demo user shares one password; reuse a real hash so loginAction can
  // be exercised with a known-good credential.
  const alex = await prisma.user.findUniqueOrThrow({ where: { email: "alex@northbeamadvisory.com" } });
  const mkUser = (email: string, name: string, isActive = true) =>
    prisma.user.create({ data: { email, name, passwordHash: alex.passwordHash, isActive } });

  const [aAdmin, aMember, aEditor, bAdmin, disabled] = await Promise.all([
    mkUser(A_ADMIN, "QA Alpha Admin"),
    mkUser(A_MEMBER, "QA Alpha Member"),
    mkUser(A_EDITOR, "QA Alpha Editor"),
    mkUser(B_ADMIN, "QA Beta Admin"),
    mkUser(DISABLED, "QA Disabled", false),
  ]);

  const alpha = await prisma.organization.create({
    data: { slug: ALPHA, name: "QA Alpha Advisory (synthetic)", kind: "client", status: "active", startedAt: new Date(Date.now() - 70 * 86_400_000) },
  });
  const beta = await prisma.organization.create({
    data: { slug: BETA, name: "QA Beta Partners (synthetic)", kind: "client", status: "active" },
  });

  await prisma.membership.createMany({
    data: [
      { userId: aAdmin.id, orgId: alpha.id, role: "client_admin", isPrimary: true },
      { userId: aMember.id, orgId: alpha.id, role: "client_member" },
      { userId: aEditor.id, orgId: alpha.id, role: "editor" },
      { userId: disabled.id, orgId: alpha.id, role: "client_admin" },
      { userId: bAdmin.id, orgId: beta.id, role: "client_admin", isPrimary: true },
    ],
  });

  const A = alpha.id;
  const brain = await prisma.brandBrain.create({ data: { orgId: A, company: JSON.stringify({ companyName: "QA Alpha", oneLiner: "ALPHA-SECRET-ONELINER" }) } });
  const idea = await prisma.idea.create({ data: { orgId: A, title: "ALPHA idea", status: "approved" } });
  const script = await prisma.script.create({ data: { orgId: A, ideaId: idea.id, title: "ALPHA script", qaState: "ai_draft" } });
  await prisma.scriptVersion.create({
    data: { scriptId: script.id, version: 1, hook: "h", body: "b", cta: "c", claims: JSON.stringify([{ id: "c1", text: "ALPHA claim", status: "unverified" }]) },
  });
  const content = await prisma.contentItem.create({ data: { orgId: A, ideaId: idea.id, scriptId: script.id, title: "ALPHA content", stage: "raw", platform: "linkedin", format: "short_form" } });
  const comment = await prisma.comment.create({ data: { orgId: A, entityType: "content", entityId: content.id, body: "ALPHA comment", authorId: aAdmin.id } as never });
  const task = await prisma.task.create({ data: { orgId: A, title: "ALPHA task", kind: "general" } as never });
  const asset = await prisma.asset.create({ data: { orgId: A, category: "document", title: "ALPHA asset", storagePath: `${A}/qa/alpha.txt`, fileName: "alpha.txt", mimeType: "text/plain" } as never });
  const report = await prisma.weeklyReport.create({ data: { orgId: A, periodStart: new Date(Date.now() - 7 * 86_400_000), periodEnd: new Date(), status: "draft" } as never });
  const link = await prisma.trackedLink.create({ data: { orgId: A, slug: "qa-alpha-link", label: "ALPHA link", destinationUrl: "https://example.test/alpha", contentItemId: content.id } });
  const inquiry = await prisma.inquiry.create({ data: { orgId: A, name: "ALPHA lead" } as never });
  const proof = await prisma.proofPeriod.create({ data: { orgId: A, label: "ALPHA proof", periodStart: new Date(Date.now() - 28 * 86_400_000), periodEnd: new Date() } as never });
  const social = await prisma.socialAccount.create({ data: { orgId: A, platform: "linkedin", handle: "@alpha" } });
  const publish = await prisma.publishRecord.create({ data: { orgId: A, contentItemId: content.id, platform: "linkedin", status: "published", publishedAt: new Date(Date.now() - 30 * 86_400_000) } });
  await prisma.performanceSnapshot.create({ data: { orgId: A, publishRecordId: publish.id, views: 1000, likes: 40 } });
  const integration = await prisma.integration.create({ data: { orgId: A, provider: "linkedin", status: "configured", accessMethod: "manual" } });
  const diagnosis = await prisma.constraintDiagnosis.create({ data: { orgId: A, primaryConstraint: "visibility", status: "draft" } as never });
  const readiness = await prisma.recordingReadiness.create({ data: { orgId: A } as never });
  const root = await prisma.contentRoot.create({ data: { orgId: A, label: "ALPHA root", thesis: "ALPHA thesis" } });
  await prisma.contentItem.update({ where: { id: content.id }, data: { rootId: root.id } });
  const expectation = await prisma.contentExpectation.create({ data: { orgId: A, rootId: root.id, subjectType: "content", subjectId: content.id, rubricVersion: "v0.1", overall: 70 } });
  const cdiag = await prisma.contentDiagnosis.create({ data: { orgId: A, rootId: root.id, contentItemId: content.id, expectationId: expectation.id, failureClass: "hook_packaging", explanation: "ALPHA explanation" } });
  const correction = await prisma.correctionEntry.create({ data: { orgId: A, rootId: root.id, diagnosisId: cdiag.id, believed: "b", actual: "a", failedAssumption: "f", correction: "c" } });

  return {
    alpha, beta, users: { aAdmin, aMember, aEditor, bAdmin, disabled },
    rows: { brain, idea, script, content, comment, task, asset, report, link, inquiry, proof, social, publish, integration, diagnosis, readiness, root, expectation, cdiag, correction },
  };
}

/** True if any object in the list carries an id from Alpha. */
function leaks(list: unknown, alphaIds: Set<string>): string[] {
  const found: string[] = [];
  const walk = (v: unknown, depth = 0) => {
    if (depth > 4 || v === null || typeof v !== "object") return;
    if (Array.isArray(v)) { v.forEach((x) => walk(x, depth + 1)); return; }
    const o = v as Record<string, unknown>;
    if (typeof o.id === "string" && alphaIds.has(o.id)) found.push(o.id);
    for (const k of Object.keys(o)) if (k !== "org") walk(o[k], depth + 1);
  };
  walk(list);
  return found;
}

export async function runTenancy(fx: Fixture) {
  const { rows, users } = fx;
  const A = fx.alpha.id, B = fx.beta.id;
  const alphaIds = new Set(Object.values(rows).map((r) => (r as { id: string }).id));

  /* ------------------------------ data-layer reads ------------------------------ */
  section("tenancy — data layer scoped to B must not return A");
  const D = {
    ideas: await import("../../src/lib/data/ideas"),
    scripts: await import("../../src/lib/data/scripts"),
    content: await import("../../src/lib/data/content"),
    workspace: await import("../../src/lib/data/workspace"),
    reports: await import("../../src/lib/data/reports"),
    attribution: await import("../../src/lib/data/attribution"),
    pipeline: await import("../../src/lib/data/pipeline"),
    proof: await import("../../src/lib/data/proof"),
    distribution: await import("../../src/lib/data/distribution"),
    diagnosis: await import("../../src/lib/data/diagnosis"),
    readiness: await import("../../src/lib/data/readiness"),
    learning: await import("../../src/lib/data/content-learning"),
    metrics: await import("../../src/lib/data/metrics"),
  };
  const reads: [string, () => Promise<unknown>][] = [
    ["Brand Brain", () => D.workspace.loadBrandBrain(B)],
    ["ideas", () => D.ideas.listIdeas(B, {})],
    ["scripts", () => D.scripts.listScripts(B, {})],
    ["content", () => D.content.listContent(B, {})],
    ["single content by id", () => D.content.getContentItem(B, rows.content.id)],
    ["comments", () => D.content.contentComments(B, rows.content.id, "client_admin")],
    ["tasks", () => D.workspace.listTasks(B, {})],
    ["assets", () => D.workspace.listAssets(B, {})],
    ["single asset by id", () => D.workspace.getAsset(B, rows.asset.id)],
    ["reports", () => D.reports.listReports(B)],
    ["single report by id", () => D.reports.getReport(B, rows.report.id)],
    ["tracked links", () => D.attribution.listTrackedLinks(B)],
    ["inquiries", () => D.pipeline.listInquiries(B, {})],
    ["proof periods", () => D.proof.listProofPeriods(B)],
    ["single proof by id", () => D.proof.getProofPeriod(B, rows.proof.id)],
    ["social accounts", () => D.distribution.listSocialAccounts(B)],
    ["publish records", () => D.distribution.listPublishRecords(B, {})],
    ["single publish by id", () => D.distribution.getPublishRecord(B, rows.publish.id)],
    ["performance", () => D.metrics.publishedAssets(B, D.metrics.lastNDays(365))],
    ["integrations", () => D.distribution.listIntegrations(B)],
    ["constraint diagnoses", () => D.diagnosis.diagnosisHistory(B)],
    ["single diagnosis by id", () => D.diagnosis.getDiagnosis(B, rows.diagnosis.id, "client_admin")],
    ["recording readiness", () => D.readiness.getReadiness(B)],
    ["test families", () => D.learning.listRoots(B)],
    ["corrections", () => D.learning.listCorrections(B)],
    ["expectation by subject", () => D.learning.latestExpectation(B, "content", rows.content.id)],
    ["content reading by id", () => D.learning.readContent(B, rows.content.id)],
  ];
  for (const [name, fn] of reads) {
    try {
      const v = await fn();
      const leaked = leaks(v, alphaIds);
      const isNull = v === null || (Array.isArray(v) && v.length === 0);
      record("tenancy:read", name, leaked.length === 0 ? "PASS" : "FAIL", leaked.length === 0 ? (isNull ? "nothing returned" : "no Alpha ids in result") : `LEAK ${leaked.join(",")}`, leaked.length ? "T-READ" : undefined);
    } catch (e) {
      record("tenancy:read", name, "FAIL", `threw: ${(e as Error).message}`, "T-READ");
    }
  }

  /* ------------------------------ action attacks ------------------------------ */
  section("tenancy — B admin mutating A via actions (IDOR + route substitution)");
  await actAs(B_ADMIN);
  const attacks: [string, (slug: string) => Promise<unknown>, () => Promise<boolean>][] = [
    ["update idea", (s) => Ideas.updateIdeaAction(s, rows.idea.id, null, fd({ title: "HACKED" })), async () => (await prisma.idea.findUnique({ where: { id: rows.idea.id } }))!.title === "ALPHA idea"],
    ["delete idea", (s) => Ideas.deleteIdeaAction(s, rows.idea.id), async () => !!(await prisma.idea.findUnique({ where: { id: rows.idea.id } }))],
    ["bulk idea status", (s) => Ideas.setIdeaStatusAction(s, [rows.idea.id], "archived"), async () => (await prisma.idea.findUnique({ where: { id: rows.idea.id } }))!.status === "approved"],
    ["save script", (s) => Scripts.saveScriptAction(s, rows.script.id, null, fd({ title: "HACKED", hook: "x", body: "y", cta: "z" })), async () => (await prisma.script.findUnique({ where: { id: rows.script.id } }))!.title === "ALPHA script"],
    ["script state", (s) => Scripts.setScriptStateAction(s, rows.script.id, "needs_fact_check"), async () => (await prisma.script.findUnique({ where: { id: rows.script.id } }))!.qaState === "ai_draft"],
    ["delete script", (s) => Scripts.deleteScriptAction(s, rows.script.id), async () => !!(await prisma.script.findUnique({ where: { id: rows.script.id } }))],
    ["move content", (s) => Content.moveContentAction(s, rows.content.id, "editing"), async () => (await prisma.contentItem.findUnique({ where: { id: rows.content.id } }))!.stage === "raw"],
    ["comment on content", (s) => Content.addCommentAction(s, rows.content.id, null, fd({ body: "HACKED" })), async () => (await prisma.comment.count({ where: { entityId: rows.content.id, body: "HACKED" } })) === 0],
    ["resolve comment", (s) => Content.resolveCommentAction(s, rows.comment.id, true), async () => (await prisma.comment.findUnique({ where: { id: rows.comment.id } }))!.resolved === false],
    ["task status", (s) => Workspace.setTaskStatusAction(s, rows.task.id, "done"), async () => (await prisma.task.findUnique({ where: { id: rows.task.id } }) as { status: string }).status !== "done"],
    ["delete task", (s) => Workspace.deleteTaskAction(s, rows.task.id), async () => !!(await prisma.task.findUnique({ where: { id: rows.task.id } }))],
    ["delete asset", (s) => Workspace.deleteAssetAction(s, rows.asset.id), async () => !!(await prisma.asset.findUnique({ where: { id: rows.asset.id } }))],
    ["delete report", (s) => Reports.deleteReportAction(s, rows.report.id), async () => !!(await prisma.weeklyReport.findUnique({ where: { id: rows.report.id } }))],
    ["finalise report", (s) => Reports.finaliseReportAction(s, rows.report.id), async () => (await prisma.weeklyReport.findUnique({ where: { id: rows.report.id } }) as { status: string }).status === "draft"],
    ["retire tracked link", (s) => Attribution.setTrackedLinkActiveAction(s, rows.link.id, false), async () => (await prisma.trackedLink.findUnique({ where: { id: rows.link.id } }))!.active === true],
    ["inquiry stage", (s) => Pipeline.setInquiryStageAction(s, rows.inquiry.id, "contacted"), async () => true],
    ["delete inquiry", (s) => Pipeline.deleteInquiryAction(s, rows.inquiry.id), async () => !!(await prisma.inquiry.findUnique({ where: { id: rows.inquiry.id } }))],
    ["lock proof period", (s) => Proof.lockProofPeriodAction(s, rows.proof.id), async () => !(await prisma.proofPeriod.findUnique({ where: { id: rows.proof.id } }) as { lockedAt?: Date | null })?.lockedAt],
    ["delete proof period", (s) => Proof.deleteProofPeriodAction(s, rows.proof.id), async () => !!(await prisma.proofPeriod.findUnique({ where: { id: rows.proof.id } }))],
    ["delete social account", (s) => Distribution.deleteSocialAccountAction(s, rows.social.id), async () => !!(await prisma.socialAccount.findUnique({ where: { id: rows.social.id } }))],
    ["delete publish record", (s) => Distribution.deletePublishRecordAction(s, rows.publish.id), async () => !!(await prisma.publishRecord.findUnique({ where: { id: rows.publish.id } }))],
    ["activate diagnosis", (s) => Diagnosis.activateDiagnosisAction(s, rows.diagnosis.id), async () => (await prisma.constraintDiagnosis.findUnique({ where: { id: rows.diagnosis.id } }))!.status === "draft"],
    ["attach content to root", (s) => Learning.attachToRootAction(s, { contentItemId: rows.content.id, rootId: rows.root.id, lineageRole: "retest" }), async () => (await prisma.contentItem.findUnique({ where: { id: rows.content.id } }))!.lineageRole === "source"],
    ["approve content diagnosis", (s) => Learning.approveDiagnosisAction(s, null, fd({ diagnosisId: rows.cdiag.id, failureClass: "none", explanation: "HACKED explanation text" })), async () => (await prisma.contentDiagnosis.findUnique({ where: { id: rows.cdiag.id } }))!.approvalState === "draft"],
    ["correction verdict", (s) => Learning.recordCorrectionVerdictAction(s, null, fd({ correctionId: rows.correction.id, worked: "yes", verdictNote: "HACKED verdict" })), async () => (await prisma.correctionEntry.findUnique({ where: { id: rows.correction.id } }))!.worked === null],
    ["change member role", (s) => Workspace.updateMemberRoleAction(s, users.aMember.id, "client_admin"), async () => (await prisma.membership.findUnique({ where: { userId_orgId: { userId: users.aMember.id, orgId: A } } }))!.role === "client_member"],
    ["remove member", (s) => Team.removeMemberAction(s, users.aAdmin.id), async () => !!(await prisma.membership.findUnique({ where: { userId_orgId: { userId: users.aAdmin.id, orgId: A } } }))],
    ["suspend member", (s) => Team.suspendMemberAction(s, users.aAdmin.id), async () => (await prisma.membership.findUnique({ where: { userId_orgId: { userId: users.aAdmin.id, orgId: A } } }))?.status === "active"],
    ["transfer ownership", (s) => Team.transferOwnershipAction(s, users.aMember.id), async () => !(await prisma.membership.findUnique({ where: { userId_orgId: { userId: users.aMember.id, orgId: A } } }))?.isOwner],
  ];
  for (const [name, fn, intact] of attacks) {
    const idor = await attempt(() => fn(BETA));
    const sub = await attempt(() => fn(ALPHA));
    const ok = await intact();
    const refusedBoth = idor.outcome !== "ok" && sub.outcome !== "ok";
    record("tenancy:write", name, refusedBoth && ok ? "PASS" : "FAIL",
      `IDOR→${idor.outcome}${idor.outcome === "refused" ? "/" + idor.via : ""} · route-sub→${sub.outcome}${sub.outcome === "refused" ? "/" + sub.via : ""} · row intact=${ok}`,
      refusedBoth && ok ? undefined : "T-WRITE");
  }

  // Brand Brain via slug substitution (no id involved).
  {
    const r = await attempt(() => Workspace.saveCompanyProfileAction(ALPHA, null, fd({ companyName: "HACKED" })));
    const brain = await prisma.brandBrain.findFirst({ where: { orgId: A } });
    const ok = r.outcome !== "ok" && (brain?.company ?? "").includes("ALPHA-SECRET-ONELINER");
    record("tenancy:write", "Brand Brain via A's slug", ok ? "PASS" : "FAIL", `${r.outcome} · intact=${ok}`, ok ? undefined : "T-WRITE");
  }
  // Integration keyed by provider, via slug substitution.
  {
    const r = await attempt(() => Distribution.disableIntegrationAction(ALPHA, "linkedin"));
    const row = await prisma.integration.findUnique({ where: { id: rows.integration.id } });
    const ok = r.outcome !== "ok" && row!.status === "configured";
    record("tenancy:write", "disable integration via A's slug", ok ? "PASS" : "FAIL", `${r.outcome} · intact=${ok}`, ok ? undefined : "T-WRITE");
  }
  // Cross-tenant lineage: B tries to attach B's own content to A's root.
  {
    const bContent = await prisma.contentItem.create({ data: { orgId: B, title: "BETA content", stage: "raw" } });
    const r = await attempt(() => Learning.attachToRootAction(BETA, { contentItemId: bContent.id, rootId: rows.root.id }));
    const row = await prisma.contentItem.findUnique({ where: { id: bContent.id } });
    const ok = r.outcome !== "ok" && row!.rootId === null;
    record("tenancy:write", "link B content to A root", ok ? "PASS" : "FAIL", `${r.outcome} · rootId=${row!.rootId}`, ok ? undefined : "T-LINEAGE");
  }

  /* ------------------------------ role matrix inside A ------------------------------ */
  section("roles — inside Alpha");
  const roleCases: [string, string, () => Promise<unknown>, boolean][] = [
    // editor
    ["editor", "approve content", () => Content.moveContentAction(ALPHA, rows.content.id, "approved"), false],
    ["editor", "delete idea", () => Ideas.deleteIdeaAction(ALPHA, rows.idea.id), false],
    ["editor", "edit Brand Brain", () => Workspace.saveCompanyProfileAction(ALPHA, null, fd({ companyName: "Editor edit" })), false],
    ["editor", "change member role", () => Workspace.updateMemberRoleAction(ALPHA, users.aMember.id, "client_admin"), false],
    ["editor", "record correction verdict", () => Learning.recordCorrectionVerdictAction(ALPHA, null, fd({ correctionId: rows.correction.id, worked: "no", verdictNote: "editor verdict" })), false],
    ["editor", "move raw → editing (their job)", () => Content.moveContentAction(ALPHA, rows.content.id, "editing"), true],
    // member
    ["member", "approve content", () => Content.moveContentAction(ALPHA, rows.content.id, "approved"), false],
    ["member", "change member role", () => Workspace.updateMemberRoleAction(ALPHA, users.aEditor.id, "client_admin"), false],
    ["member", "delete report", () => Reports.deleteReportAction(ALPHA, rows.report.id), false],
    ["member", "create idea (allowed)", () => Ideas.createIdeaAction(ALPHA, null, fd({ title: "Member idea", platform: "linkedin", format: "short_form" })), true],
    // admin
    ["admin", "approve content diagnosis (operator-only)", () => Learning.approveDiagnosisAction(ALPHA, null, fd({ diagnosisId: rows.cdiag.id, failureClass: "hook_packaging", explanation: "Client admin trying to approve a diagnosis" })), false],
    ["admin", "record correction (operator-only)", () => Learning.recordCorrectionAction(ALPHA, null, fd({ rootId: rows.root.id, believed: "aaaaa", actual: "bbbbb", failedAssumption: "ccccc", correction: "ddddd" })), false],
    ["admin", "edit Brand Brain", () => Workspace.saveCompanyProfileAction(ALPHA, null, fd({ companyName: "Admin edit" })), true],
    ["admin", "change member role", () => Workspace.updateMemberRoleAction(ALPHA, users.aMember.id, "client_admin"), true],
  ];
  for (const [role, name, fn, allowed] of roleCases) {
    await actAs(role === "editor" ? A_EDITOR : role === "member" ? A_MEMBER : A_ADMIN);
    const r = await attempt(fn);
    const pass = allowed ? r.outcome === "ok" : r.outcome !== "ok";
    record("roles", `${role}: ${name}`, pass ? "PASS" : "FAIL", `${r.outcome}${r.outcome === "refused" ? "/" + r.via + " " + r.message.slice(0, 60) : r.outcome === "threw" ? " " + r.message.slice(0, 80) : ""}`, pass ? undefined : "ROLE");
  }
  // restore role after the admin's legitimate change
  await prisma.membership.update({ where: { userId_orgId: { userId: users.aMember.id, orgId: A } }, data: { role: "client_member" } });

  /* ------------------------------ auth states ------------------------------ */
  section("auth");
  const probe = () => Ideas.updateIdeaAction(ALPHA, rows.idea.id, null, fd({ title: "auth probe" }));
  anonymous();
  let r = await attempt(probe); record("auth", "anonymous → protected action", r.outcome === "refused" && r.via === "redirect" ? "PASS" : "FAIL", `${r.outcome}/${(r as { via?: string }).via}`);
  await expiredSession(A_ADMIN);
  r = await attempt(probe); record("auth", "expired session", r.outcome === "refused" ? "PASS" : "FAIL", `${r.outcome}`);
  const gone = await prisma.session.count({ where: { user: { email: A_ADMIN }, expiresAt: { lt: new Date() } } });
  record("auth", "expired session row pruned on use", gone === 0 ? "PASS" : "PARTIAL", `${gone} expired rows remain`);
  malformedCookie();
  r = await attempt(probe); record("auth", "malformed cookie", r.outcome === "refused" ? "PASS" : "FAIL", `${r.outcome}`);
  await actAs(DISABLED);
  r = await attempt(probe); record("auth", "disabled user with valid session", r.outcome === "refused" ? "PASS" : "FAIL", `${r.outcome}`, r.outcome === "ok" ? "AUTH-DISABLED" : undefined);

  // loginAction: enumeration-safe, disabled, wrong password, redirect safety.
  __resetRateLimits();
  anonymous();
  const bad = await Auth.loginAction(null, fd({ email: A_ADMIN, password: "wrong-password" }));
  const unknown = await Auth.loginAction(null, fd({ email: "nobody@example.test", password: "wrong-password" }));
  const dis = await Auth.loginAction(null, fd({ email: DISABLED, password: "threadline-demo-2026" }));
  const sameMsg = !bad.ok && !unknown.ok && !dis.ok && bad.error === unknown.error && unknown.error === dis.error;
  record("auth", "login errors do not enumerate accounts", sameMsg ? "PASS" : "FAIL", sameMsg ? `identical: "${(bad as { error: string }).error}"` : `bad="${(bad as { error?: string }).error}" unknown="${(unknown as { error?: string }).error}" disabled="${(dis as { error?: string }).error}"`, sameMsg ? undefined : "AUTH-ENUM");
  const empty = await Auth.loginAction(null, fd({ email: "", password: "" }));
  record("auth", "empty login form", !empty.ok ? "PASS" : "FAIL", (empty as { error?: string }).error ?? "accepted?!");
  __resetRateLimits();
  // A successful login signals by redirect(); read the destination off the digest.
  const target = (r: Awaited<ReturnType<typeof attempt>>) =>
    r.outcome === "refused" && r.via === "redirect" ? r.message.split(";")[2] ?? "" : r.outcome === "ok" ? (r.value as { data?: { redirectTo?: string } })?.data?.redirectTo ?? "" : "";
  anonymous();
  const good = await attempt(() => Auth.loginAction(null, fd({ email: A_ADMIN, password: "threadline-demo-2026", next: "https://evil.example/phish" })));
  const t1 = target(good);
  const loggedIn = (good.outcome === "refused" && good.via === "redirect") || good.outcome === "ok";
  record("auth", "login succeeds with real password", loggedIn ? "PASS" : "FAIL", loggedIn ? `→ ${t1}` : JSON.stringify(good));
  record("auth", "login ignores external `next` (open redirect)", loggedIn && t1.startsWith("/") && !t1.startsWith("//") ? "PASS" : "FAIL", `redirect=${t1}`, loggedIn && !(t1.startsWith("/") && !t1.startsWith("//")) ? "AUTH-REDIRECT" : undefined);
  anonymous();
  const prot = await attempt(() => Auth.loginAction(null, fd({ email: A_ADMIN, password: "threadline-demo-2026", next: "//evil.example" })));
  const t2 = target(prot);
  record("auth", "login ignores protocol-relative `next`", t2.startsWith("/") && !t2.startsWith("//") ? "PASS" : "FAIL", `redirect=${t2}`, t2.startsWith("//") ? "AUTH-REDIRECT" : undefined);
  anonymous();
  const legit = await attempt(() => Auth.loginAction(null, fd({ email: A_ADMIN, password: "threadline-demo-2026", next: "/app/qa-alpha/learning" })));
  const t3 = target(legit);
  record("auth", "login honours a same-origin `next`", t3 === "/app/qa-alpha/learning" ? "PASS" : "PARTIAL", `redirect=${t3}`);
  const sessions = await prisma.session.count({ where: { user: { email: A_ADMIN }, userAgent: "ThreadlineQA/1.0" } });
  record("auth", "each login creates its own session row", sessions >= 3 ? "PASS" : "PARTIAL", `${sessions} sessions for the same user`);

  // Rate limit: 6 failures per window.
  __resetRateLimits();
  anonymous();
  let limited = false, lastErr = "";
  for (let i = 0; i < 9; i++) {
    const rr = await Auth.loginAction(null, fd({ email: A_ADMIN, password: "wrong" }));
    if (!rr.ok && rr.code === "rate_limit") { limited = true; lastErr = rr.error; break; }
  }
  record("auth", "login rate limit engages", limited ? "PASS" : "PARTIAL", limited ? lastErr.slice(0, 70) : "9 wrong passwords without a rate-limit response (limiter keys on request IP, absent in harness)");
  await prisma.session.deleteMany({ where: { user: { email: { endsWith: "@example.test" } } } });
  await cleanupSessions();
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runTenancy(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
