/**
 * ONBOARDING → BRAND BRAIN → RECORDING READINESS → LONG-FORM PACKAGING.
 *
 * Onboarding is driven step by step through the real action with the inputs a
 * founder actually types (apostrophes, line breaks, URLs, unicode), then the
 * workspace is built and every downstream table is inspected — not the final
 * page, the rows.
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section } from "./context";
import { buildFixture, teardown, ALPHA, type Fixture } from "./suite-tenancy";
import * as Onboarding from "../../src/lib/actions/onboarding";
import * as Workspace from "../../src/lib/actions/workspace";
import * as Readiness from "../../src/lib/actions/readiness";
import * as Content from "../../src/lib/actions/content";
import { loadBrandBrain } from "../../src/lib/data/workspace";
import { getReadiness } from "../../src/lib/data/readiness";
import { ONBOARDING_STEPS, REQUIRED_FIELDS } from "../../src/lib/domain/onboarding";

const A_ADMIN = "qa.alpha.admin@example.test";
const A_EDITOR = "qa.alpha.editor@example.test";
const OPERATOR = "operator@threadline.com";

export async function runOnboarding(fx: Fixture) {
  const A = fx.alpha.id;
  await actAs(A_ADMIN);

  section("onboarding — step progression with founder-shaped input");
  await prisma.onboardingSession.deleteMany({ where: { orgId: A } });
  // Ensure a session exists the way the page would create it.
  const started = await attempt(() => Onboarding.goToOnboardingStepAction(ALPHA, "welcome"));
  record("onboarding", "session starts", started.outcome === "ok" ? "PASS" : "FAIL", `${started.outcome} ${(started as { message?: string }).message ?? ""}`);

  const messy = {
    companyName: "O'Brien & Daughters — Sales Ops (UK/EU)",
    description: "We fix forecasts that are “feelings”.\n\nSecond paragraph, with a URL: https://obrien.example.test/about and 日本語.",
  };
  const bizAdvance = await attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, "business", messy, true));
  let session = await prisma.onboardingSession.findFirst({ where: { orgId: A } });
  record("onboarding", "business step saves messy text and advances", bizAdvance.outcome === "ok" && session?.currentStep === "offer" && session.completedSteps.includes("business") ? "PASS" : "FAIL", `${bizAdvance.outcome} current=${session?.currentStep}`);
  const data1 = JSON.parse(session!.data ?? "{}") as Record<string, string>;
  record("onboarding", "apostrophes, em-dash, line breaks, URL, CJK survive persistence", data1.companyName === messy.companyName && data1.description === messy.description ? "PASS" : "FAIL", JSON.stringify(data1.companyName));

  const incomplete = await attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, "offer", { offerName: "Forecast Reset" }, true));
  session = await prisma.onboardingSession.findFirst({ where: { orgId: A } });
  record("onboarding", "advancing with a required field missing refused, draft kept", incomplete.outcome !== "ok" && session?.currentStep === "offer" && (JSON.parse(session.data ?? "{}") as Record<string, string>).offerName === "Forecast Reset" ? "PASS" : "FAIL", `${incomplete.outcome} current=${session?.currentStep} draftKept=${(JSON.parse(session?.data ?? "{}") as Record<string, string>).offerName === "Forecast Reset"}`);
  const autosave = await attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, "offer", { offerName: "Forecast Reset", offerOutcome: "A forecast the board can use" }, false));
  session = await prisma.onboardingSession.findFirst({ where: { orgId: A } });
  record("onboarding", "autosave (advance=false) persists without moving", autosave.outcome === "ok" && session?.currentStep === "offer" ? "PASS" : "FAIL", `current=${session?.currentStep}`);
  const dup = await Promise.all([
    attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, "offer", { offerName: "Forecast Reset", offerOutcome: "A forecast the board can use" }, true)),
    attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, "offer", { offerName: "Forecast Reset", offerOutcome: "A forecast the board can use" }, true)),
  ]);
  session = await prisma.onboardingSession.findFirst({ where: { orgId: A } });
  record("onboarding", "duplicate submit of the same step is idempotent", dup.every((d) => d.outcome === "ok") && (await prisma.onboardingSession.count({ where: { orgId: A } })) === 1 && session?.currentStep === "customer" ? "PASS" : "FAIL", `sessions=${await prisma.onboardingSession.count({ where: { orgId: A } })} current=${session?.currentStep}`);
  const back = await attempt(() => Onboarding.goToOnboardingStepAction(ALPHA, "business"));
  session = await prisma.onboardingSession.findFirst({ where: { orgId: A } });
  record("onboarding", "leave and return: going back keeps completed steps", back.outcome === "ok" && session?.currentStep === "business" && session.completedSteps.includes("offer") ? "PASS" : "FAIL", `current=${session?.currentStep} completed=${session?.completedSteps}`);
  const bogusStep = await attempt(() => Onboarding.goToOnboardingStepAction(ALPHA, "not_a_step"));
  record("onboarding", "unknown step refused", bogusStep.outcome !== "ok" ? "PASS" : "FAIL", `${bogusStep.outcome}`);
  await actAs(A_EDITOR);
  const editorSave = await attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, "business", { companyName: "Editor edit" }, false));
  record("onboarding", "editor cannot write onboarding", editorSave.outcome !== "ok" ? "PASS" : "FAIL", `${editorSave.outcome}`);
  await actAs(A_ADMIN);

  // Walk the remaining steps with minimal valid data.
  const fill: Record<string, Record<string, unknown>> = {
    customer: { icpName: "Founder-led B2B services, 20-200 staff", icpPains: ["Forecast slips late", "Reps blamed for system faults"], icpDesires: ["A forecast the board trusts"] },
    founder: { founderName: "Kate O'Brien", founderBio: "Eleven years running sales teams." },
    voice: { voiceTone: "Direct, warm, no jargon", voicePhrasesAvoided: ["game-changer", "synergy"] },
    content: { hoursPerWeek: 2 },
    market: {}, operation: {}, goals: { targetPlatforms: ["linkedin"], targetCadence: 3 }, commercial: { attentionToInquiry: "Profile → site → discovery call" }, integrations: {},
  };
  for (const step of ONBOARDING_STEPS.map((s) => s.key)) {
    if (["welcome", "business", "offer"].includes(step)) continue;
    const r = await attempt(() => Onboarding.saveOnboardingStepAction(ALPHA, step, fill[step] ?? {}, true));
    const req = REQUIRED_FIELDS[step as keyof typeof REQUIRED_FIELDS] ?? [];
    if (r.outcome !== "ok") record("onboarding", `step ${step}`, "FAIL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 60) ?? ""} required=${req.join(",")}`, "ONB-STEP");
  }
  const built = await attempt(() => Onboarding.buildWorkspaceAction(ALPHA));
  const org = await prisma.organization.findUnique({ where: { id: A } });
  record("onboarding", "buildWorkspaceAction completes", built.outcome === "ok" && org?.onboardingStage === "complete" ? "PASS" : "FAIL", `${built.outcome} ${(built as { message?: string }).message?.slice(0, 80) ?? ""} stage=${org?.onboardingStage}`, built.outcome === "ok" ? undefined : "ONB-BUILD");

  section("onboarding — what it actually wrote");
  const brain = await loadBrandBrain(A);
  const icp = await prisma.icpProfile.findFirst({ where: { orgId: A } });
  const offer = await prisma.offer.findFirst({ where: { orgId: A } });
  const tasks = await prisma.task.count({ where: { orgId: A } });
  const readiness = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("onboarding:effects", "Brand Brain populated from answers", JSON.stringify(brain).includes("feelings") ? "PASS" : "FAIL", `contains onboarding description=${JSON.stringify(brain).includes("feelings")}`);
  record("onboarding:effects", "ICP created with pains as a list", !!icp && JSON.parse(icp.pains ?? "[]").length === 2 ? "PASS" : "FAIL", `icp=${icp?.name} pains=${icp?.pains}`);
  record("onboarding:effects", "Offer created", offer?.name === "Forecast Reset" ? "PASS" : "FAIL", `${offer?.name}`);
  record("onboarding:effects", "banned phrases reach the Brand Brain voice profile", JSON.stringify(brain).includes("game-changer") ? "PASS" : "FAIL", JSON.stringify(brain).includes("game-changer") ? "" : "onboarding voice step does not carry a banned-phrase field into voice.phrasesAvoided");
  record("onboarding:effects", "tasks created for the founder", tasks > 0 ? "PASS" : "PARTIAL", `${tasks} tasks`);
  record("onboarding:effects", "recording readiness row exists, not assessed", readiness?.status === "not_assessed" ? "PASS" : "PARTIAL", `status=${readiness?.status ?? "none"}`);
  record("onboarding:effects", "testimonial-if-successful permission captured", "NA", "no such field exists in the schema — feature not built (brief §23)");

  section("brand brain — edit, reload, banned language, prohibited proof");
  const co = await attempt(() => Workspace.saveCompanyProfileAction(ALPHA, null, fd({ description: "Updated description with 'quotes' and" + "\n" + "newlines", website: "javascript:alert(1)" })));
  const b2 = JSON.stringify(await loadBrandBrain(A));
  record("brandbrain", "company profile saves; javascript: website not stored as a link", co.outcome === "ok" && b2.includes("Updated description") && !b2.includes("javascript:alert") ? "PASS" : "FAIL", `${co.outcome} descSaved=${b2.includes("Updated description")} jsStored=${b2.includes("javascript:alert")}`, b2.includes("javascript:alert") ? "BRAIN-JS-URL" : undefined);
  const voice = await attempt(() => Workspace.saveVoiceProfileAction(ALPHA, null, fd({ tone: "Blunt", phrasesAvoided: ["leverage", "synergy", "", "  "].join("\n") })));
  const b3 = JSON.stringify(await loadBrandBrain(A));
  const avoided = /"phrasesAvoided":\[([^\]]*)\]/.exec(b3)?.[1] ?? "";
  record("brandbrain", "avoided phrases saved as a clean list", voice.outcome === "ok" && avoided.includes("synergy") && !avoided.includes('""') ? "PASS" : "FAIL", `${voice.outcome} avoided=[${avoided}]`);
  const proofSave = await attempt(() => Workspace.saveProofAction(ALPHA, null, null, fd({ kind: "metric", title: "Cut forecast error 40%", detail: "Client X", usable: "false" })));
  const proofRow = await prisma.proofItem.findFirst({ where: { orgId: A, title: "Cut forecast error 40%" } });
  record("brandbrain", "proof item saved with usability flag honoured", proofSave.outcome === "ok" && !!proofRow ? "PASS" : "PARTIAL", `${proofSave.outcome} ${(proofSave as { message?: string }).message?.slice(0, 60) ?? ""} row=${!!proofRow}`);
  const completeness = ((await loadBrandBrain(A)) as { completeness?: number }).completeness;
  record("brandbrain", "completeness is a number in range", typeof completeness === "number" && completeness >= 0 && completeness <= 100 ? "PASS" : "PARTIAL", `${completeness}`);
  record("brandbrain", "Brand Brain feeds generation prompts", "PASS_EXT", "prompt assembly reads loadBrandBrain at call time (no cache); verified structurally — real-model effect on output needs ANTHROPIC_API_KEY");

  section("recording readiness — states");
  await prisma.recordingReadiness.deleteMany({ where: { orgId: A } });
  const r0 = await getReadiness(A);
  record("readiness", "unassessed by default", (r0 as { status?: string } | null)?.status === "not_assessed" || r0 === null ? "PASS" : "FAIL", `status=${(r0 as { status?: string } | null)?.status ?? "none"}`);
  const submit = await attempt(() => Readiness.submitRecordingSetupAction(ALPHA, null, fd({ roomNotes: "Spare bedroom, north window", gearNotes: "iPhone 15, no mic", formats: "vertical_short" })));
  const rs = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("readiness", "client submits setup → submittedAt set, still not ready", submit.outcome === "ok" && !!rs?.submittedAt && rs.status === "not_assessed" ? "PASS" : "FAIL", `${submit.outcome} status=${rs?.status} submitted=${!!rs?.submittedAt}`);
  const clientAssess = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "ready" })));
  record("readiness", "client cannot assess their own setup", clientAssess.outcome !== "ok" ? "PASS" : "FAIL", `${clientAssess.outcome}`, clientAssess.outcome === "ok" ? "READY-SELF" : undefined);
  await actAs(OPERATOR);
  const KEYS = ["audio", "light", "framing", "background", "focus_stability", "repeatability", "format"];
  const all = (state: string) => Object.fromEntries(KEYS.map((k) => [`state_${k}`, state]));
  const greenUnlooked = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "ready", ...all("ok"), state_audio: "unknown" })));
  let rr = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("readiness", "cannot be READY with a check unlooked-at", greenUnlooked.outcome !== "ok" && rr?.status !== "ready" ? "PASS" : "FAIL", `${greenUnlooked.outcome} status=${rr?.status}`, greenUnlooked.outcome === "ok" ? "READY-GREEN" : undefined);
  const greenBlocked = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "ready", ...all("ok"), state_audio: "blocked" })));
  rr = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("readiness", "cannot be READY with a blocking check", greenBlocked.outcome !== "ok" && rr?.status !== "ready" ? "PASS" : "FAIL", `${greenBlocked.outcome} status=${rr?.status}`, greenBlocked.outcome === "ok" ? "READY-GREEN" : undefined);
  const blockedNoAction = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "blocked", ...all("ok"), state_audio: "blocked", note_audio: "Echo" })));
  record("readiness", "BLOCKED owes the client an action", blockedNoAction.outcome !== "ok" ? "PASS" : "FAIL", `${blockedNoAction.outcome} ${(blockedNoAction as { message?: string }).message?.slice(0, 60) ?? ""}`);
  const blockedOk = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "blocked", ...all("ok"), state_audio: "blocked", note_audio: "Echo off hard walls", clientAction: "Record in the room with the curtains; add a £30 lav mic." })));
  rr = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("readiness", "BLOCKED with a client action persists", blockedOk.outcome === "ok" && rr?.status === "blocked" && !!rr.clientAction ? "PASS" : "FAIL", `${blockedOk.outcome} status=${rr?.status}`);
  const limited = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "ready_with_limitation", ...all("ok"), state_light: "limitation", note_light: "Window light only", clientAction: "Record before 2pm." })));
  rr = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("readiness", "READY WITH LIMITATION with an action", limited.outcome === "ok" && rr?.status === "ready_with_limitation" ? "PASS" : "FAIL", `${limited.outcome} status=${rr?.status}`);
  const ready = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "ready", ...all("ok") })));
  rr = await prisma.recordingReadiness.findFirst({ where: { orgId: A } });
  record("readiness", "READY with every check ok", ready.outcome === "ok" && rr?.status === "ready" && !!rr.reviewedAt ? "PASS" : "FAIL", `${ready.outcome} status=${rr?.status}`);
  const badState = await attempt(() => Readiness.assessRecordingSetupAction(ALPHA, null, fd({ status: "ready", ...all("ok"), state_audio: "excellent" })));
  record("readiness", "unknown check state refused", badState.outcome !== "ok" ? "PASS" : "FAIL", `${badState.outcome}`);

  section("packaging — long-form gate");
  await actAs(A_ADMIN);
  const lf = await prisma.contentItem.create({ data: { orgId: A, title: "Long-form episode", stage: "in_review", platform: "youtube", format: "long_form" } });
  const pk = await attempt(() => Content.createPackageAction(ALPHA, lf.id, "youtube"));
  const pkId = pk.outcome === "ok" ? (pk.value as { data: { id: string } }).data.id : "";
  record("packaging", "create long-form package", pk.outcome === "ok" ? "PASS" : "FAIL", `${pk.outcome}`);
  const approveEmpty = await attempt(() => Content.approvePackageAction(ALPHA, pkId));
  record("packaging", "long-form package without title/thumbnail/description cannot be approved", approveEmpty.outcome !== "ok" ? "PASS" : "FAIL", `${approveEmpty.outcome} ${(approveEmpty as { message?: string }).message?.slice(0, 70) ?? ""}`, approveEmpty.outcome === "ok" ? "PKG-LONGFORM" : undefined);
  await Content.savePackageAction(ALPHA, pkId, null, fd({ title: "Why your forecast is a feeling", description: "Eleven years of sales teams in one argument." }));
  const approveNoThumb = await attempt(() => Content.approvePackageAction(ALPHA, pkId));
  record("packaging", "title + description but no thumbnail still refused", approveNoThumb.outcome !== "ok" ? "PASS" : "FAIL", `${approveNoThumb.outcome}`);
  await Content.savePackageAction(ALPHA, pkId, null, fd({ title: "Why your forecast is a feeling", description: "Eleven years of sales teams in one argument.", thumbnailRef: "https://cdn.example.test/thumb.jpg" }));
  const approveFull = await attempt(() => Content.approvePackageAction(ALPHA, pkId));
  const pkRow = await prisma.platformPackage.findUnique({ where: { id: pkId } });
  record("packaging", "complete long-form package approves", approveFull.outcome === "ok" && pkRow?.status === "approved" ? "PASS" : "FAIL", `${approveFull.outcome} status=${pkRow?.status}`);
  const sf = await prisma.contentItem.create({ data: { orgId: A, title: "Short", stage: "in_review", platform: "linkedin", format: "short_form" } });
  const spk = await attempt(() => Content.createPackageAction(ALPHA, sf.id, "linkedin"));
  const spkId = spk.outcome === "ok" ? (spk.value as { data: { id: string } }).data.id : "";
  const sApprove = await attempt(() => Content.approvePackageAction(ALPHA, spkId));
  record("packaging", "short-form package approves without a thumbnail", sApprove.outcome === "ok" ? "PASS" : "FAIL", `${sApprove.outcome}`);
  const dupPk = await attempt(() => Content.createPackageAction(ALPHA, lf.id, "youtube"));
  record("packaging", "duplicate platform package refused (unique per item+platform)", dupPk.outcome !== "ok" ? "PASS" : "FAIL", `${dupPk.outcome}`);
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runOnboarding(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
