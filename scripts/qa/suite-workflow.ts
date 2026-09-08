/**
 * WORKFLOW GATES — the rules that keep AI output and unfinished work out of the
 * wrong stage. Every gate is attacked through the real server action with a
 * real session, and the database is checked afterwards.
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section } from "./context";
import { buildFixture, teardown, ALPHA, type Fixture } from "./suite-tenancy";
import * as Scripts from "../../src/lib/actions/scripts";
import * as Content from "../../src/lib/actions/content";
import * as Ideas from "../../src/lib/actions/ideas";
import * as Distribution from "../../src/lib/actions/distribution";
import * as Runs from "../../src/lib/actions/runs";
import { CONTENT_TRANSITIONS } from "../../src/lib/domain/workflow";

const A_ADMIN = "qa.alpha.admin@example.test";
const A_MEMBER = "qa.alpha.member@example.test";
const OPERATOR = "operator@threadline.com";

export async function runWorkflow(fx: Fixture) {
  const A = fx.alpha.id;

  /* --------------------------- fact-check gate --------------------------- */
  section("scripts — fact-check gate");
  await actAs(A_ADMIN);
  const sid = fx.rows.script.id; // ai_draft, one unverified claim
  let r: Awaited<ReturnType<typeof attempt<unknown>>> = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "ready_to_record"));
  let row = await prisma.script.findUnique({ where: { id: sid } });
  record("gate:factcheck", "unverified claim blocks ready_to_record", r.outcome !== "ok" && row!.qaState === "ai_draft" ? "PASS" : "FAIL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 70) ?? ""} · state=${row!.qaState}`, r.outcome === "ok" ? "GATE-CLAIMS" : undefined);
  r = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "approved"));
  row = await prisma.script.findUnique({ where: { id: sid } });
  record("gate:factcheck", "unverified claim blocks approved (also illegal jump)", r.outcome !== "ok" && row!.qaState === "ai_draft" ? "PASS" : "FAIL", `${r.outcome} · state=${row!.qaState}`);
  r = await attempt(() => Scripts.sendToRecordingAction(ALPHA, sid));
  const items = await prisma.contentItem.count({ where: { scriptId: sid } });
  record("gate:factcheck", "unapproved script cannot enter recording queue", r.outcome !== "ok" && items === 1 ? "PASS" : "FAIL", `${r.outcome} · content items for script=${items} (fixture had 1)`);
  // Add a second claim, verify one, still blocked; verify both, allowed.
  await Scripts.addClaimAction(ALPHA, sid, null, fd({ text: "Second factual claim about revenue" }));
  let ver = await prisma.scriptVersion.findFirst({ where: { scriptId: sid }, orderBy: { version: "desc" } });
  let claims = JSON.parse(ver!.claims) as { id: string; status: string }[];
  record("gate:factcheck", "adding a claim persists as unverified", claims.length === 2 && claims.every((c) => c.status === "unverified") ? "PASS" : "FAIL", `${claims.length} claims`);
  await Scripts.setClaimStatusAction(ALPHA, sid, claims[0].id, "verified");
  r = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "needs_fact_check"));
  r = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "ready_to_record"));
  row = await prisma.script.findUnique({ where: { id: sid } });
  record("gate:factcheck", "one of two claims verified still blocks", r.outcome !== "ok" && row!.qaState !== "ready_to_record" ? "PASS" : "FAIL", `${r.outcome} · state=${row!.qaState}`);
  await Scripts.setClaimStatusAction(ALPHA, sid, claims[1].id, "removed");
  r = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "ready_to_record"));
  row = await prisma.script.findUnique({ where: { id: sid } });
  record("gate:factcheck", "all claims resolved → ready_to_record", r.outcome === "ok" && row!.qaState === "ready_to_record" && row!.claimsVerified ? "PASS" : "FAIL", `${r.outcome} · state=${row!.qaState} claimsVerified=${row!.claimsVerified}`);
  // Approval capability.
  await actAs(A_MEMBER);
  r = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "approved"));
  record("gate:approval", "member cannot approve script", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  await actAs(A_ADMIN);
  r = await attempt(() => Scripts.setScriptStateAction(ALPHA, sid, "approved"));
  row = await prisma.script.findUnique({ where: { id: sid } });
  record("gate:approval", "admin approves script", r.outcome === "ok" && row!.qaState === "approved" && row!.approvedAt ? "PASS" : "FAIL", `${r.outcome} · approvedAt=${!!row!.approvedAt}`);
  // Direct DB bypass attempt through the action: pass a claim id that doesn't exist.
  r = await attempt(() => Scripts.setClaimStatusAction(ALPHA, sid, "does-not-exist", "verified"));
  record("gate:factcheck", "bogus claim id is a no-op, not a crash", r.outcome !== "threw" ? "PASS" : "FAIL", `${r.outcome}`);
  // Re-adding a claim to an approved script must drop claimsVerified.
  await Scripts.addClaimAction(ALPHA, sid, null, fd({ text: "Late claim added after approval" }));
  row = await prisma.script.findUnique({ where: { id: sid } });
  ver = await prisma.scriptVersion.findFirst({ where: { scriptId: sid }, orderBy: { version: "desc" } });
  claims = JSON.parse(ver!.claims);
  const lateUnverified = claims.some((c) => c.status === "unverified");
  record("gate:factcheck", "claim added after approval is tracked", lateUnverified ? "PASS" : "FAIL", `unverified present=${lateUnverified} · claimsVerified=${row!.claimsVerified} · qaState=${row!.qaState}`, lateUnverified && row!.claimsVerified ? "GATE-LATE-CLAIM" : undefined);
  r = await attempt(() => Scripts.sendToRecordingAction(ALPHA, sid));
  record("gate:factcheck", "approved script with a NEW unverified claim → recording", r.outcome !== "ok" ? "PASS" : "PARTIAL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 80) ?? ""}`, r.outcome === "ok" ? "GATE-LATE-CLAIM" : undefined);

  /* --------------------------- content stage matrix --------------------------- */
  section("production — stage transitions");
  const stages = Object.keys(CONTENT_TRANSITIONS) as (keyof typeof CONTENT_TRANSITIONS)[];
  let legalOk = 0, legalTotal = 0, illegalRefused = 0, illegalTotal = 0;
  const bad: string[] = [];
  for (const from of stages) {
    for (const to of stages) {
      if (from === to) continue;
      const item = await prisma.contentItem.create({ data: { orgId: A, title: `matrix ${from}→${to}`, stage: from, platform: "linkedin", format: "short_form" } });
      const legal = CONTENT_TRANSITIONS[from].includes(to);
      const note = to === "changes_requested" ? "Needs a tighter opening." : undefined;
      const res = await attempt(() => Content.moveContentAction(ALPHA, item.id, to, note));
      const after = (await prisma.contentItem.findUnique({ where: { id: item.id } }))!.stage;
      if (legal) { legalTotal++; if (res.outcome === "ok" && after === to) legalOk++; else bad.push(`${from}→${to} legal but ${res.outcome}/${after}`); }
      else { illegalTotal++; if (res.outcome !== "ok" && after === from) illegalRefused++; else bad.push(`${from}→${to} ILLEGAL but ${res.outcome}/${after}`); }
    }
  }
  record("gate:stages", `legal transitions succeed (${legalOk}/${legalTotal})`, legalOk === legalTotal ? "PASS" : "FAIL", bad.filter((b) => b.includes("legal but")).join("; ") || "all legal moves applied");
  record("gate:stages", `illegal transitions refused (${illegalRefused}/${illegalTotal})`, illegalRefused === illegalTotal ? "PASS" : "FAIL", bad.filter((b) => b.includes("ILLEGAL")).join("; ") || "no illegal move applied", illegalRefused === illegalTotal ? undefined : "GATE-STAGE");
  // changes_requested requires a note
  const cr = await prisma.contentItem.create({ data: { orgId: A, title: "cr-no-note", stage: "in_review", platform: "linkedin", format: "short_form" } });
  r = await attempt(() => Content.moveContentAction(ALPHA, cr.id, "changes_requested"));
  let st = (await prisma.contentItem.findUnique({ where: { id: cr.id } }))!.stage;
  record("gate:stages", "changes_requested without a note refused", r.outcome !== "ok" && st === "in_review" ? "PASS" : "FAIL", `${r.outcome} · stage=${st}`, r.outcome === "ok" ? "GATE-NOTE" : undefined);
  r = await attempt(() => Content.moveContentAction(ALPHA, cr.id, "changes_requested", "   "));
  st = (await prisma.contentItem.findUnique({ where: { id: cr.id } }))!.stage;
  record("gate:stages", "whitespace note is not a note", r.outcome !== "ok" && st === "in_review" ? "PASS" : "FAIL", `${r.outcome} · stage=${st}`, r.outcome === "ok" ? "GATE-NOTE" : undefined);
  r = await attempt(() => Content.moveContentAction(ALPHA, cr.id, "changes_requested", "Tighten the first ten seconds."));
  const ev = await prisma.contentEvent.findFirst({ where: { contentItemId: cr.id, toStage: "changes_requested" } as never });
  const revs = (await prisma.contentItem.findUnique({ where: { id: cr.id } }))!.revisionCount;
  record("gate:stages", "changes_requested with note → event logged + revision counted", r.outcome === "ok" && !!ev && revs === 1 ? "PASS" : "FAIL", `${r.outcome} · event=${!!ev} · revisionCount=${revs}`);
  // approval capability on content
  const ap = await prisma.contentItem.create({ data: { orgId: A, title: "approve-me", stage: "in_review", platform: "linkedin", format: "short_form" } });
  await actAs(A_MEMBER);
  r = await attempt(() => Content.moveContentAction(ALPHA, ap.id, "approved"));
  record("gate:approval", "member cannot approve content", r.outcome !== "ok" && (await prisma.contentItem.findUnique({ where: { id: ap.id } }))!.stage === "in_review" ? "PASS" : "FAIL", `${r.outcome}`);
  await actAs(A_ADMIN);
  r = await attempt(() => Content.moveContentAction(ALPHA, ap.id, "approved"));
  const apRow = await prisma.contentItem.findUnique({ where: { id: ap.id } });
  record("gate:approval", "admin approves content → approvedAt/approvedBy set", r.outcome === "ok" && apRow!.stage === "approved" && !!apRow!.approvedAt && apRow!.approvedById === fx.users.aAdmin.id ? "PASS" : "FAIL", `stage=${apRow!.stage} approvedBy=${apRow!.approvedById === fx.users.aAdmin.id}`);
  // Concurrency: two simultaneous approvals must not double-log.
  const cc = await prisma.contentItem.create({ data: { orgId: A, title: "double-click", stage: "in_review", platform: "linkedin", format: "short_form" } });
  await Promise.all([attempt(() => Content.moveContentAction(ALPHA, cc.id, "approved")), attempt(() => Content.moveContentAction(ALPHA, cc.id, "approved"))]);
  const events = await prisma.contentEvent.count({ where: { contentItemId: cc.id, toStage: "approved" } as never });
  record("concurrency", "double-click approve logs one event", events === 1 ? "PASS" : events === 2 ? "PARTIAL" : "FAIL", `${events} approval events`, events > 1 ? "CONC-APPROVE" : undefined);

  /* --------------------------- publish transitions --------------------------- */
  section("distribution — publish record rules");
  const live = await prisma.contentItem.create({ data: { orgId: A, title: "publish-me", stage: "approved", platform: "linkedin", format: "short_form" } });
  const cre = await attempt(() => Distribution.createPublishRecordAction(ALPHA, null, fd({ contentItemId: live.id, platform: "linkedin" })));
  const pid = cre.outcome === "ok" ? (cre.value as { data: { id: string } }).data.id : "";
  record("gate:publish", "create publish record for approved content", cre.outcome === "ok" ? "PASS" : "FAIL", `${cre.outcome}`);
  r = await attempt(() => Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "published" })));
  let pr = await prisma.publishRecord.findUnique({ where: { id: pid } });
  record("gate:publish", "published without a URL refused", r.outcome !== "ok" && pr!.status !== "published" ? "PASS" : "FAIL", `${r.outcome} · status=${pr!.status}`, r.outcome === "ok" ? "GATE-PUBLISH-URL" : undefined);
  r = await attempt(() => Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "scheduled" })));
  pr = await prisma.publishRecord.findUnique({ where: { id: pid } });
  record("gate:publish", "scheduled without a date refused", r.outcome !== "ok" && pr!.status !== "scheduled" ? "PASS" : "FAIL", `${r.outcome} · status=${pr!.status}`, r.outcome === "ok" ? "GATE-PUBLISH-DATE" : undefined);
  r = await attempt(() => Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "published", url: "javascript:alert(1)" })));
  pr = await prisma.publishRecord.findUnique({ where: { id: pid } });
  record("gate:publish", "javascript: live URL", pr!.url?.startsWith("javascript:") ? "FAIL" : "PASS", `${r.outcome} · stored url=${pr!.url}`, pr!.url?.startsWith("javascript:") ? "PUBLISH-JS-URL" : undefined);
  r = await attempt(() => Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "published", url: "https://www.linkedin.com/posts/qa-alpha_activity-1" })));
  pr = await prisma.publishRecord.findUnique({ where: { id: pid } });
  record("gate:publish", "draft → published directly refused (must pass ready)", r.outcome !== "ok" && pr!.status === "draft" ? "PASS" : "FAIL", `${r.outcome} · status=${pr!.status}`);
  await Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "ready" }));
  r = await attempt(() => Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "published", url: "https://www.linkedin.com/posts/qa-alpha_activity-1" })));
  pr = await prisma.publishRecord.findUnique({ where: { id: pid } });
  const liveItem = await prisma.contentItem.findUnique({ where: { id: live.id } });
  record("gate:publish", "publishing takes the content item live", liveItem!.stage === "live" && !!liveItem!.liveAt ? "PASS" : "FAIL", `stage=${liveItem!.stage}`);
  record("gate:publish", "published with URL succeeds and stamps publishedAt", r.outcome === "ok" && pr!.status === "published" && !!pr!.publishedAt ? "PASS" : "FAIL", `${r.outcome} · status=${pr!.status} publishedAt=${!!pr!.publishedAt}`);
  r = await attempt(() => Distribution.updatePublishRecordAction(ALPHA, pid, null, fd({ status: "draft" })));
  pr = await prisma.publishRecord.findUnique({ where: { id: pid } });
  record("gate:publish", "published → draft refused (illegal)", r.outcome !== "ok" && pr!.status === "published" ? "PASS" : "FAIL", `${r.outcome} · status=${pr!.status}`);
  const unapproved = await prisma.contentItem.create({ data: { orgId: A, title: "not-approved", stage: "editing", platform: "linkedin", format: "short_form" } });
  r = await attempt(() => Distribution.createPublishRecordAction(ALPHA, null, fd({ contentItemId: unapproved.id, platform: "linkedin" })));
  record("gate:publish", "unapproved content cannot get a publish record", r.outcome !== "ok" ? "PASS" : "PARTIAL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 70) ?? ""}`, r.outcome === "ok" ? "GATE-PUBLISH-UNAPPROVED" : undefined);

  /* --------------------------- idea transitions --------------------------- */
  section("ideas — transitions");
  const scripted = await prisma.idea.create({ data: { orgId: A, title: "scripted idea", status: "scripted" } });
  r = await attempt(() => Ideas.setIdeaStatusAction(ALPHA, [scripted.id], "backlog"));
  record("gate:ideas", "scripted → backlog refused (would orphan lineage)", r.outcome !== "ok" && (await prisma.idea.findUnique({ where: { id: scripted.id } }))!.status === "scripted" ? "PASS" : "FAIL", `${r.outcome}`);
  r = await attempt(() => Ideas.setIdeaStatusAction(ALPHA, [scripted.id], "archived"));
  record("gate:ideas", "scripted → archived allowed", r.outcome === "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  r = await attempt(() => Ideas.setIdeaStatusAction(ALPHA, [scripted.id], "not-a-status"));
  record("gate:ideas", "unknown status rejected by schema", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  r = await attempt(() => Ideas.setIdeaStatusAction(ALPHA, [], "approved"));
  record("gate:ideas", "empty bulk selection rejected", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);

  /* --------------------------- intelligence run --------------------------- */
  section("intelligence run — publish gate and frozen brief");
  await actAs(OPERATOR);
  const run = await attempt(() => Runs.createRunAction(ALPHA, null, fd({ label: "QA run" })));
  const runId = run.outcome === "ok" ? (run.value as { data: { id: string } }).data.id : "";
  record("gate:run", "operator creates run", run.outcome === "ok" ? "PASS" : "FAIL", `${run.outcome}`);
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "collecting"));
  record("gate:run", "cannot collect with zero sources", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  const src = await attempt(() => Runs.addRunSourceAction(ALPHA, runId, null, fd({ kind: "note", label: "Pasted notes", content: "The buyer said the forecast is a feeling. Repeated by three founders this month." })));
  const srcId = src.outcome === "ok" ? (src.value as { data: { id: string } }).data.id : "";
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "collecting"));
  record("gate:run", "advance to collecting with a source", r.outcome === "ok" ? "PASS" : "FAIL", `${r.outcome} ${(src as { message?: string }).message ?? ""}`);
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "synthesis"));
  record("gate:run", "cannot synthesise before source is resolved", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  const col = await attempt(() => Runs.collectSourceAction(ALPHA, srcId, null, fd({ content: "The buyer said the forecast is a feeling. Repeated by three founders this month." })));
  record("gate:run", "collect pasted source → evidence", col.outcome === "ok" ? "PASS" : "FAIL", `${col.outcome} ${(col as { message?: string }).message ?? ""}`);
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "synthesis"));
  record("gate:run", "advance to synthesis with evidence", r.outcome === "ok" ? "PASS" : "FAIL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 80) ?? ""}`);
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "review"));
  record("gate:run", "cannot review with zero candidates", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  const syn = await attempt(() => Runs.synthesiseRunAction(ALPHA, runId));
  const cands = await prisma.candidateSignal.findMany({ where: { runId } });
  record("gate:run", "synthesis proposes candidates (demo provider)", syn.outcome === "ok" && cands.length > 0 ? "PASS" : "FAIL", `${syn.outcome} · ${cands.length} candidates · all pending=${cands.every((c) => c.decision === "pending")}`);
  await attempt(() => Runs.advanceRunAction(ALPHA, runId, "review"));
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "published"));
  let runRow = await prisma.intelligenceRun.findUnique({ where: { id: runId } });
  record("gate:run", "pending candidate blocks publish", r.outcome !== "ok" && runRow!.status !== "published" ? "PASS" : "FAIL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 80) ?? ""}`, r.outcome === "ok" ? "GATE-RUN-PENDING" : undefined);
  for (const c of cands) await Runs.decideCandidateAction(ALPHA, c.id, c === cands[0] ? "approved" : "rejected");
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "published"));
  record("gate:run", "decided candidates but no summary blocks publish", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 60) ?? ""}`);
  await Runs.updateRunAction(ALPHA, runId, null, fd({ label: "QA run", summary: "Three founders described the forecast as a feeling; one approved signal." }));
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "published"));
  runRow = await prisma.intelligenceRun.findUnique({ where: { id: runId } });
  record("gate:run", "publish with decided candidates + summary", r.outcome === "ok" && runRow!.status === "published" && !!runRow!.brief ? "PASS" : "FAIL", `${r.outcome} · status=${runRow!.status} brief frozen=${!!runRow!.brief}`);
  const briefBefore = runRow!.brief;
  r = await attempt(() => Runs.updateRunAction(ALPHA, runId, null, fd({ label: "MUTATED", summary: "changed after publish" })));
  runRow = await prisma.intelligenceRun.findUnique({ where: { id: runId } });
  record("gate:run", "published brief cannot be edited", r.outcome !== "ok" && runRow!.label === "QA run" && runRow!.brief === briefBefore ? "PASS" : "FAIL", `${r.outcome} · label=${runRow!.label}`, r.outcome === "ok" ? "GATE-RUN-FROZEN" : undefined);
  r = await attempt(() => Runs.decideCandidateAction(ALPHA, cands[0].id, "rejected"));
  const cAfter = await prisma.candidateSignal.findUnique({ where: { id: cands[0].id } });
  record("gate:run", "candidate decision frozen after publish", r.outcome !== "ok" && cAfter!.decision === "approved" ? "PASS" : "FAIL", `${r.outcome} · decision=${cAfter!.decision}`, r.outcome === "ok" ? "GATE-RUN-FROZEN" : undefined);
  r = await attempt(() => Runs.deleteRunAction(ALPHA, runId));
  record("gate:run", "published brief cannot be deleted", r.outcome !== "ok" && !!(await prisma.intelligenceRun.findUnique({ where: { id: runId } })) ? "PASS" : "FAIL", `${r.outcome}`);
  r = await attempt(() => Runs.advanceRunAction(ALPHA, runId, "review"));
  record("gate:run", "published → review refused", r.outcome !== "ok" ? "PASS" : "FAIL", `${r.outcome}`);
  // client visibility: a client_member must only see published runs
  const RunsData = await import("../../src/lib/data/runs");
  const draft = await prisma.intelligenceRun.create({ data: { orgId: A, label: "draft run", status: "scoping", periodStart: new Date(Date.now() - 14 * 86_400_000), periodEnd: new Date() } as never });
  const seenByClient = await RunsData.listRuns(A, "client_member" as never);
  const seenByOp = await RunsData.listRuns(A, "internal_operator" as never);
  const clientSeesDraft = (seenByClient as { id: string }[]).some((x) => x.id === draft.id);
  record("visibility", "client sees only published runs", !clientSeesDraft && (seenByOp as { id: string }[]).some((x) => x.id === draft.id) ? "PASS" : "FAIL", `client=${(seenByClient as unknown[]).length} operator=${(seenByOp as unknown[]).length} draft visible to client=${clientSeesDraft}`, clientSeesDraft ? "VIS-RUN" : undefined);
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runWorkflow(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
