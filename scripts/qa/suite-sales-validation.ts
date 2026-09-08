/**
 * THREADLINE'S OWN OPERATIONS — prospects, calls, the validation gate, the
 * acquisition target arithmetic, delivery load and the cockpit.
 *
 * None of this is tenant data; it is operator-only and every action here is
 * first attempted as a client admin to prove that.
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section } from "./context";
import { buildFixture, teardown, ALPHA, type Fixture } from "./suite-tenancy";
import * as Acq from "../../src/lib/actions/acquisition";
import * as Val from "../../src/lib/actions/validation";
import * as Attribution from "../../src/lib/actions/attribution";
import { assertInterviewEvidence, readValidation, INTERIM_CHECKPOINT, VALIDATION_DECISION_MINIMUM, CONVERGENCE_MINIMUM } from "../../src/lib/domain/sop";
import { cockpit } from "../../src/lib/data/cockpit";
import { acquisitionPlan, invariantBreaches } from "../../src/lib/data/acquisition";

const OPERATOR = "operator@threadline.com";
const A_ADMIN = "qa.alpha.admin@example.test";
const QA = "QA-PROSPECT ";

export async function cleanupSales() {
  await prisma.prospect.deleteMany({ where: { company: { startsWith: QA } } });
  await prisma.marketWedge.deleteMany({ where: { label: { startsWith: QA } } });
  await prisma.acquisitionTarget.deleteMany({ where: { label: { startsWith: QA } } });
}

export async function runSales(fx: Fixture) {
  await cleanupSales();

  section("sales — prospect path, next-action invariant, audit");
  await actAs(A_ADMIN);
  const clientTry = await attempt(() => Acq.saveProspectAction(null, null, fd({ company: `${QA}client attempt` })));
  record("sales:access", "client admin cannot touch prospects", clientTry.outcome !== "ok" ? "PASS" : "FAIL", `${clientTry.outcome}`, clientTry.outcome === "ok" ? "SALES-XROLE" : undefined);
  await actAs(OPERATOR);
  const created = await attempt(() => Acq.saveProspectAction(null, null, fd({ company: `${QA}Forecast Co`, contactName: "Dana", tier: "a", channel: "linkedin", nextAction: "Send first message", nextActionDueAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) })));
  const pid = created.outcome === "ok" ? (created.value as { data: { id: string } }).data.id : "";
  record("sales", "create A-tier prospect with next action + date", created.outcome === "ok" ? "PASS" : "FAIL", `${created.outcome} ${(created as { message?: string }).message?.slice(0, 60) ?? ""}`);
  const noNext = await attempt(() => Acq.saveProspectAction(null, null, fd({ company: `${QA}No next action`, tier: "b" })));
  const noNextRow = await prisma.prospect.findFirst({ where: { company: `${QA}No next action` } });
  record("sales", "operating invariant: no active record without next action + date", noNext.outcome !== "ok" || (!!noNextRow?.nextAction && !!noNextRow?.nextActionDueAt) ? "PASS" : "FAIL", `${noNext.outcome} nextAction=${noNextRow?.nextAction ?? "—"} due=${noNextRow?.nextActionDueAt ? "set" : "—"}`, noNext.outcome === "ok" && !noNextRow?.nextActionDueAt ? "SALES-INVARIANT" : undefined);
  const breaches = await invariantBreaches();
  record("sales", "invariantBreaches finds nothing after the guard", breaches.length === 0 ? "PASS" : "PARTIAL", `${breaches.length} breaches`);
  const p0 = await prisma.prospect.findUnique({ where: { id: pid } });
  const jump = await attempt(() => Acq.advanceProspectAction(pid, null, fd({ to: "won" })));
  record("sales", "illegal jump (new → won) refused", jump.outcome !== "ok" && (await prisma.prospect.findUnique({ where: { id: pid } }))!.state === p0!.state ? "PASS" : "FAIL", `${jump.outcome} ${(jump as { message?: string }).message?.slice(0, 60) ?? ""}`);
  const checks = await prisma.sopCheck.findMany({ where: { prospectId: pid } });
  record("sales", "SOP checklist attached to the prospect", checks.length > 0 ? "PASS" : "PARTIAL", `${checks.length} checks`);
  const nextState = p0!.state === "new" ? "qualified_a" : "contacted";
  const fwdBlocked = await attempt(() => Acq.advanceProspectAction(pid, null, fd({ to: nextState })));
  record("sales", "forward move with required checklist outstanding refused (or none required)", fwdBlocked.outcome !== "ok" || checks.filter((c) => !c.done).length === 0 ? "PASS" : "FAIL", `${fwdBlocked.outcome} ${(fwdBlocked as { message?: string }).message?.slice(0, 70) ?? ""}`);
  const override = await attempt(() => Acq.advanceProspectAction(pid, null, fd({ to: nextState, override: "Founder asked to skip research — warm intro.", nextAction: "Message", nextActionDueAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) })));
  const p1 = await prisma.prospect.findUnique({ where: { id: pid } });
  const audit = await prisma.auditLog.findFirst({ where: { entityId: pid }, orderBy: { createdAt: "desc" } });
  record("sales", "override with a reason moves the prospect and is audited", override.outcome === "ok" && p1!.state === nextState && !!audit ? "PASS" : "FAIL", `${override.outcome} state=${p1!.state} audit=${!!audit}`);
  const blankOverride = await attempt(() => Acq.advanceProspectAction(pid, null, fd({ to: "booked", override: "   " })));
  record("sales", "whitespace override is not a reason", blankOverride.outcome !== "ok" ? "PASS" : "FAIL", `${blankOverride.outcome}`);
  const reply = await attempt(() => Acq.classifyReplyAction(pid, null, fd({ replyClass: "interested", note: "Wants to talk next week." })));
  record("sales", "reply classification", reply.outcome === "ok" ? "PASS" : "PARTIAL", `${reply.outcome} ${(reply as { message?: string }).message?.slice(0, 60) ?? ""}`);
  const book = await attempt(() => Acq.bookCallAction(pid, null, fd({ scheduledAt: new Date(Date.now() + 3 * 86_400_000).toISOString() })));
  const callId = book.outcome === "ok" ? (book.value as { data: { id: string } }).data.id : "";
  record("sales", "book call creates a SalesCall", book.outcome === "ok" && !!(await prisma.salesCall.findUnique({ where: { id: callId } })) ? "PASS" : "FAIL", `${book.outcome}`);
  const outcomeNoDiag = await attempt(() => Acq.recordCallOutcomeAction(callId, null, fd({ outcome: "proposal", attended: "true", qualified: "true", voc: "Their words", nextAction: "Send proposal", nextActionDueAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) })));
  record("sales", "outcome without the diagnosis stages covered refused", outcomeNoDiag.outcome !== "ok" ? "PASS" : "PARTIAL", `${outcomeNoDiag.outcome} ${(outcomeNoDiag as { message?: string }).message?.slice(0, 70) ?? ""}`);
  const noFit = await attempt(() => Acq.recordCallOutcomeAction(callId, null, fd({ outcome: "not_fit", attended: "true", voc: "They said: we have no sales team at all." })));
  record("sales", "honest no-fit allowed without full diagnosis", noFit.outcome === "ok" ? "PASS" : "PARTIAL", `${noFit.outcome} ${(noFit as { message?: string }).message?.slice(0, 70) ?? ""}`);
  record("sales", "discovery economics fields (deal value, margin, LTV, cycle, close rate, capacity)", "NA", "SalesCall carries valueMinor only — brief §21 fields not built");
  record("sales", "exact approved sales scripts rendered verbatim", "NA", "no canonical script resource exists in the codebase — brief §22 not built");

  section("validation gate — the count and the convergence are separate conditions");
  const conv = (n: number, converging: number) => Array.from({ length: n }, (_, i) => ({ volunteered: true, problem: `problem ${i}`, theme: i < converging ? "expertise leaves the room" : `theme-${i}` }));
  const gate = (n: number, c: number) => { try { assertInterviewEvidence(readValidation(conv(n, c)).total, readValidation(conv(n, c)).convergence); return "allowed"; } catch (e) { return (e as Error).message; } };
  record("validation", "0 interviews", /0 of/.test(gate(0, 0)) ? "PASS" : "FAIL", gate(0, 0).slice(0, 60));
  record("validation", `${INTERIM_CHECKPOINT} interviews is a checkpoint, not a gate`, /checkpoint/.test(gate(5, 5)) ? "PASS" : "FAIL", gate(5, 5).slice(0, 90));
  record("validation", "9 interviews refused on count", /9 of 10/.test(gate(9, 9)) ? "PASS" : "FAIL", gate(9, 9).slice(0, 60));
  record("validation", "10 interviews, 0 converging → refused on convergence", /converge/.test(gate(10, 0)) && !/of 10 research/.test(gate(10, 0)) ? "PASS" : "FAIL", gate(10, 0).slice(0, 80));
  record("validation", "10 interviews, exactly 5 converging → refused (needs MORE than five)", /converge/.test(gate(10, 5)) ? "PASS" : "FAIL", gate(10, 5).slice(0, 80));
  record("validation", `10 interviews, ${CONVERGENCE_MINIMUM} converging → eligible`, gate(10, 6) === "allowed" ? "PASS" : "FAIL", gate(10, 6));
  record("validation", "14 mixed (6 converging) → eligible; unthemed excluded", (() => { const r = readValidation([...conv(14, 6), { volunteered: true, problem: "same words as theme", theme: null }]); return r.convergence === 6 && r.unclassified === 1 && r.decisionEligible; })() ? "PASS" : "FAIL", "");
  // Through the real wedge action.
  const wedge = await prisma.marketWedge.create({ data: { label: `${QA}wedge`, summary: "QA hypothesis", state: "interviews", active: false, nextAction: "Interview", nextActionDueAt: new Date() } });
  for (let i = 0; i < 9; i++) await prisma.validationConversation.create({ data: { wedgeId: wedge.id, person: `P${i}`, problem: `p${i}`, volunteered: true, problemTheme: i < 6 ? "same" : null, heldAt: new Date() } as never });
  const early = await attempt(() => Val.advanceWedgeAction(wedge.id, null, fd({ to: "commercial_test", nextAction: "Test", nextActionDueAt: new Date().toISOString().slice(0, 10) })));
  record("validation", "wedge cannot enter commercial_test at 9 conversations (real action)", early.outcome !== "ok" && (await prisma.marketWedge.findUnique({ where: { id: wedge.id } }))!.state === "interviews" ? "PASS" : "FAIL", `${early.outcome} ${(early as { message?: string }).message?.slice(0, 70) ?? ""}`, early.outcome === "ok" ? "GATE-VALIDATION" : undefined);
  const forced = await attempt(() => Val.advanceWedgeAction(wedge.id, null, fd({ to: "commercial_test", override: "Founder says go.", nextAction: "Test", nextActionDueAt: new Date().toISOString().slice(0, 10) })));
  record("validation", "override cannot bypass the interview gate", forced.outcome !== "ok" && (await prisma.marketWedge.findUnique({ where: { id: wedge.id } }))!.state === "interviews" ? "PASS" : "FAIL", `${forced.outcome}`, forced.outcome === "ok" ? "GATE-VALIDATION-OVERRIDE" : undefined);
  await Val.addConversationAction(wedge.id, null, fd({ person: "P9", problem: "Tenth conversation, same expensive problem.", volunteered: "true", problemTheme: "same" }));
  // The SOP checklist is a separate gate from the interview evidence. Prove it
  // blocks on its own, then satisfy it through the real action so the evidence
  // gate is the only thing left under test.
  const checklistOnly = await attempt(() => Val.advanceWedgeAction(wedge.id, null, fd({ to: "commercial_test", nextAction: "Test", nextActionDueAt: new Date().toISOString().slice(0, 10) })));
  record("validation", "checklist gate blocks independently of the evidence gate", checklistOnly.outcome !== "ok" && /not finished/.test((checklistOnly as { message?: string }).message ?? "") ? "PASS" : "FAIL", `${(checklistOnly as { message?: string }).message?.slice(0, 60) ?? checklistOnly.outcome}`);
  const noteless = await attempt(() => Val.toggleWedgeCheckAction(wedge.id, null, fd({ key: "recurring", state: "interviews", mode: "set", done: "true" })));
  record("validation", "a finding-type check cannot be ticked without the finding", noteless.outcome !== "ok" ? "PASS" : "FAIL", `${noteless.outcome}`);
  for (const [key, note] of [["conversations", ""], ["recurring", "Expertise leaves the room when the senior person does."], ["disconfirming", "Two of ten said pricing, not expertise."]] as const) {
    const t = await attempt(() => Val.toggleWedgeCheckAction(wedge.id, null, fd({ key, state: "interviews", mode: "set", done: "true", note: note || undefined })));
    if (t.outcome !== "ok") record("validation", `tick ${key}`, "FAIL", `${t.outcome} ${(t as { message?: string }).message?.slice(0, 60) ?? ""}`);
  }
  const tenth = await attempt(() => Val.advanceWedgeAction(wedge.id, null, fd({ to: "commercial_test", nextAction: "Test", nextActionDueAt: new Date().toISOString().slice(0, 10) })));
  record("validation", "10 conversations with 6 converging → commercial_test allowed", tenth.outcome === "ok" && (await prisma.marketWedge.findUnique({ where: { id: wedge.id } }))!.state === "commercial_test" ? "PASS" : "FAIL", `${tenth.outcome} ${(tenth as { message?: string }).message?.slice(0, 70) ?? ""}`);

  section("acquisition arithmetic — refuses to project from unknowable rates");
  const target = await attempt(() => Acq.saveTargetAction(null, null, fd({ label: `${QA}target`, targetWins: 2, periodStart: new Date().toISOString().slice(0, 10), periodEnd: new Date(Date.now() + 84 * 86_400_000).toISOString().slice(0, 10) })));
  record("acquisition", "target with no assumed rates saves", target.outcome === "ok" ? "PASS" : "FAIL", `${target.outcome} ${(target as { message?: string }).message?.slice(0, 60) ?? ""}`);
  const plan = await attempt(() => acquisitionPlan());
  const planText = JSON.stringify(plan.outcome === "ok" ? plan.value : {});
  record("acquisition", "plan does not fabricate activity from zero rates", plan.outcome === "ok" && !/"required":\s*(Infinity|NaN)/.test(planText) && !/Infinity|NaN/.test(planText) ? "PASS" : "FAIL", `${plan.outcome} infinity/NaN present=${/Infinity|NaN/.test(planText)}`);
  const zeroTarget = await attempt(() => Acq.saveTargetAction(null, null, fd({ label: `${QA}zero`, targetWins: 0 })));
  record("acquisition", "target of zero wins refused", zeroTarget.outcome !== "ok" ? "PASS" : "FAIL", `${zeroTarget.outcome}`);
  const silly = await attempt(() => Acq.saveTargetAction(null, null, fd({ label: `${QA}silly`, targetWins: 5, assumedBookingRatePct: 250 })));
  record("acquisition", "rate over 100% refused", silly.outcome !== "ok" ? "PASS" : "FAIL", `${silly.outcome}`);

  section("delivery load");
  await actAs(OPERATOR);
  const task = await prisma.task.create({ data: { orgId: fx.alpha.id, title: "QA delivery task", kind: "general" } as never });
  const load = await attempt(() => Attribution.logDeliveryLoadAction(ALPHA, task.id, null, fd({ activeMinutes: 25, waitingMinutes: 1440, cost: 40, workClass: "delegatable", loadNote: "Waited a day for the founder's clip." })));
  const tRow = await prisma.task.findUnique({ where: { id: task.id } });
  record("delivery", "load logged: active vs waiting kept apart, cost in minor units", load.outcome === "ok" && tRow?.activeMinutes === 25 && tRow.waitingMinutes === 1440 && tRow.costMinor === 4000 && tRow.workClass === "delegatable" ? "PASS" : "FAIL", `${load.outcome} active=${tRow?.activeMinutes} waiting=${tRow?.waitingMinutes} cost=${tRow?.costMinor} class=${tRow?.workClass}`);
  const badClass = await attempt(() => Attribution.logDeliveryLoadAction(ALPHA, task.id, null, fd({ workClass: "magic" })));
  record("delivery", "unknown work class refused", badClass.outcome !== "ok" ? "PASS" : "FAIL", `${badClass.outcome}`);
  const negMin = await attempt(() => Attribution.logDeliveryLoadAction(ALPHA, task.id, null, fd({ activeMinutes: -10 })));
  record("delivery", "negative minutes refused", negMin.outcome !== "ok" ? "PASS" : "FAIL", `${negMin.outcome}`);
  record("delivery", "owner-only / automatable classes and period aggregation", "PARTIAL", "workClass enum exists on Task; no aggregation view by period/client found in the data layer — reported, not tested");

  section("cockpit — honest when the day is empty");
  const c = await cockpit();
  const text = JSON.stringify(c);
  record("cockpit", "cockpit renders from records", Object.keys(c).length > 3 ? "PASS" : "FAIL", `${Object.keys(c).join(",").slice(0, 100)}`);
  record("cockpit", "does not claim \"all prepared\" when there are zero calls", !/all prepared|all set|fully prepared/i.test(text) ? "PASS" : "PARTIAL", "");

  await cleanupSales();
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runSales(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
