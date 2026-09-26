/**
 * MASTER CORE-SPINE — three complete synthetic engagements, through the real
 * server actions only. Nothing is written to the database directly except to
 * READ it back for verification and to remove the synthetic tenants afterwards.
 *
 *   §62 happy path      Meridian Forecasting Ltd   — strong result, thesis holds
 *   §63 bad outcome     Halden Compliance Ltd      — under-performs, diagnosed,
 *                                                    corrected, retested, verdict
 *   §64 text-led        Orrin Legal Ltd            — no camera, LinkedIn text only
 *
 * Each engagement: operator creates the client → founder logs in → onboarding →
 * (recording readiness) → research run → signal → idea → script (fact-check
 * gate) → Judge expectation frozen → recording queue → recorded → editing →
 * review → founder approval → publish record → live → tracked link click →
 * inquiry + buyer-named event → performance snapshots → diagnosis → approval →
 * (correction → retest → verdict) → weekly report → finalised → trajectory.
 *
 * CLOCK. The diagnosis engine refuses to read a piece younger than
 * MATURITY_DAYS (14) — correctly. A harness cannot wait a fortnight, so the
 * ONLY direct writes here are `backdate()` calls that move an engagement's
 * start and a piece's publish timestamps into the past. No workflow, guard or
 * gate is bypassed by them; they simulate the calendar, nothing else.
 */
import { NextRequest } from "next/server";
import { prisma } from "../../src/lib/db/client";
import { actAs, anonymous, attempt, fd, record, section, cleanupSessions } from "./context";
import * as Team from "../../src/lib/actions/team";
import * as Admin from "../../src/lib/actions/admin";
import * as Auth from "../../src/lib/actions/auth";
import * as Onboarding from "../../src/lib/actions/onboarding";
import * as Readiness from "../../src/lib/actions/readiness";
import * as Runs from "../../src/lib/actions/runs";
import * as Intelligence from "../../src/lib/actions/intelligence";
import * as Ideas from "../../src/lib/actions/ideas";
import * as Scripts from "../../src/lib/actions/scripts";
import * as Learning from "../../src/lib/actions/learning";
import * as Content from "../../src/lib/actions/content";
import * as Distribution from "../../src/lib/actions/distribution";
import * as Attribution from "../../src/lib/actions/attribution";
import * as Pipeline from "../../src/lib/actions/pipeline";
import * as Performance from "../../src/lib/actions/performance";
import * as Reports from "../../src/lib/actions/reports";
import { GET as redirectGET } from "../../src/app/t/[slug]/route";
import { ONBOARDING_STEPS } from "../../src/lib/domain/onboarding";
import { READINESS_CHECKS } from "../../src/lib/domain/readiness";
import { learningTrajectory, listRoots, readContent } from "../../src/lib/data/content-learning";
import { getReport } from "../../src/lib/data/reports";
import { __resetRateLimits } from "../../src/lib/security/rate-limit";

const OPERATOR = "operator@threadline.com";

type Mode = "happy" | "bad" | "text";

type Engagement = {
  mode: Mode;
  slug: string;
  name: string;
  founderEmail: string;
  founderName: string;
  password: string;
  area: string;
};

export const ENGAGEMENTS: Engagement[] = [
  { mode: "happy", slug: "qa-spine-meridian", name: "Meridian Forecasting Ltd", founderEmail: "qa.spine.meridian@example.test", founderName: "Kate O'Brien", password: "Qa-Spine-Meridian-2026!", area: "spine:happy" },
  { mode: "bad", slug: "qa-spine-halden", name: "Halden Compliance Ltd", founderEmail: "qa.spine.halden@example.test", founderName: "Tom Halden", password: "Qa-Spine-Halden-2026!", area: "spine:bad" },
  { mode: "text", slug: "qa-spine-orrin", name: "Orrin Legal Ltd", founderEmail: "qa.spine.orrin@example.test", founderName: "Priya Orrin", password: "Qa-Spine-Orrin-2026!", area: "spine:text" },
];

const data = <T,>(r: Awaited<ReturnType<typeof attempt<unknown>>>): T | null =>
  r.outcome === "ok" ? ((r.value as { data?: T }).data ?? null) : null;
const msg = (r: Awaited<ReturnType<typeof attempt<unknown>>>) => `${r.outcome}${"message" in r && r.message ? ` · ${r.message.slice(0, 90)}` : ""}`;

async function follow(slug: string, cookie?: string, referer?: string) {
  const req = new NextRequest(`http://localhost:3000/t/${slug}`, {
    headers: { ...(cookie ? { cookie: `tl_v=${cookie}` } : {}), ...(referer ? { referer } : {}) },
  });
  const res = await redirectGET(req, { params: Promise.resolve({ slug }) });
  const token = /tl_v=([^;]+)/.exec(res.headers.get("set-cookie") ?? "")?.[1] ?? null;
  return { status: res.status, location: res.headers.get("location"), token };
}

/** Simulate the calendar: the piece went live `days` ago. See CLOCK in the header. */
async function backdate(contentItemId: string, recordId: string, days: number) {
  const at = new Date(Date.now() - days * 86_400_000);
  await prisma.publishRecord.update({ where: { id: recordId }, data: { publishedAt: at } });
  await prisma.contentItem.update({ where: { id: contentItemId }, data: { liveAt: at } });
}

/** One published piece: idea → script → content → live. Returns ids or throws a recorded FAIL. */
async function producePiece(e: Engagement, opts: { ideaId: string; rootId: string; lineageRole: "source" | "retest"; derivedFromId?: string; label: string; liveDaysAgo: number }) {
  const { area, slug, mode } = e;
  const L = opts.label;
  const isText = mode === "text";

  await actAs(e.founderEmail);
  const st = await attempt(() => Ideas.setIdeaStatusAction(slug, [opts.ideaId], "approved"));
  record(area, `${L}: idea approved by founder`, st.outcome === "ok" ? "PASS" : "FAIL", msg(st));

  __resetRateLimits();
  const sc = await attempt(() => Scripts.createScriptFromIdeaAction(slug, null, fd({ ideaId: opts.ideaId, scriptType: isText ? "list" : "short_form", targetSeconds: isText ? 30 : 60, generate: "true" })));
  const scriptId = data<{ id: string; isDemo: boolean }>(sc)?.id ?? "";
  const scriptRow = scriptId ? await prisma.script.findUnique({ where: { id: scriptId }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } }) : null;
  record(area, `${L}: script generated from idea (demo provider, labelled)`, sc.outcome === "ok" && data<{ isDemo: boolean }>(sc)?.isDemo === true && ["ai_draft", "needs_fact_check"].includes(scriptRow?.qaState ?? "") && (scriptRow?.versions[0]?.body.length ?? 0) > 20 ? "PASS" : "FAIL", `${msg(sc)} qa=${scriptRow?.qaState} body=${scriptRow?.versions[0]?.body.length ?? 0}ch`);
  if (!scriptId) throw new Error(`${L}: no script`);

  // Fact-check gate: add a claim, try to bypass, verify, proceed.
  await Scripts.addClaimAction(slug, scriptId, null, fd({ text: `${e.name} cut forecast error by 40% for a client in 2025.` }));
  const bypass = await attempt(() => Scripts.setScriptStateAction(slug, scriptId, "ready_to_record"));
  record(area, `${L}: unverified claim blocks ready_to_record`, bypass.outcome !== "ok" ? "PASS" : "FAIL", msg(bypass), bypass.outcome === "ok" ? "SPINE-FACTCHECK" : undefined);
  const ver = await prisma.scriptVersion.findFirst({ where: { scriptId }, orderBy: { version: "desc" } });
  const claims = JSON.parse(ver!.claims) as { id: string; status: string }[];
  for (const c of claims.filter((c) => c.status === "unverified")) await Scripts.setClaimStatusAction(slug, scriptId, c.id, "verified");
  const rtr = await attempt(() => Scripts.setScriptStateAction(slug, scriptId, "ready_to_record"));
  const apr = await attempt(() => Scripts.setScriptStateAction(slug, scriptId, "approved"));
  record(area, `${L}: claims verified → ready_to_record → approved (founder is client_admin)`, rtr.outcome === "ok" && apr.outcome === "ok" ? "PASS" : "FAIL", `${msg(rtr)} / ${msg(apr)}`);

  // Judge freezes the expectation on the script BEFORE anything goes out.
  await actAs(OPERATOR);
  __resetRateLimits();
  const ex = await attempt(() => Learning.recordExpectationAction(slug, { subjectType: "script", subjectId: scriptId, rootId: opts.rootId }));
  record(area, `${L}: Judge expectation recorded on the script (uncalibrated, demo)`, ex.outcome === "ok" ? "PASS" : "FAIL", msg(ex));

  // Recording queue.
  const send = await attempt(() => Scripts.sendToRecordingAction(slug, scriptId));
  const contentItemId = data<{ contentItemId: string }>(send)?.contentItemId ?? "";
  const task = contentItemId ? await prisma.task.findFirst({ where: { entityId: contentItemId, kind: "record" } }) : null;
  const created = contentItemId ? await prisma.contentItem.findUnique({ where: { id: contentItemId } }) : null;
  if (isText) {
    record(area, `${L}: text piece goes straight to editing — no recording stage, no record task`, send.outcome === "ok" && created?.stage === "editing" && !task ? "PASS" : "FAIL", `${msg(send)} stage=${created?.stage} task=${task?.title ?? "none"}`, task ? "SPINE-TEXT-RECORD-TASK" : undefined);
  } else {
    record(area, `${L}: sent to recording → content item raw + founder task`, send.outcome === "ok" && created?.stage === "raw" && !!task && task.audience === "client" ? "PASS" : "FAIL", `${msg(send)} stage=${created?.stage} task=${task?.title ?? "none"}`);
  }
  if (!contentItemId) throw new Error(`${L}: no content item`);

  const att = await attempt(() => Learning.attachToRootAction(slug, { contentItemId, rootId: opts.rootId, lineageRole: opts.lineageRole, derivedFromId: opts.derivedFromId }));
  const exC = await attempt(() => Learning.recordExpectationAction(slug, { subjectType: "content", subjectId: contentItemId, rootId: opts.rootId }));
  const expRow = await prisma.contentExpectation.findFirst({ where: { subjectType: "content", subjectId: contentItemId }, orderBy: { createdAt: "desc" } });
  record(area, `${L}: attached to ROOT (${opts.lineageRole}) + content expectation frozen`, att.outcome === "ok" && exC.outcome === "ok" && expRow?.calibrated === false && expRow.rootId === opts.rootId ? "PASS" : "FAIL", `${msg(att)} / ${msg(exC)} overall=${expRow?.overall} class=${expRow?.expectedClass} calibrated=${expRow?.calibrated}`);
  const frozen = JSON.stringify(expRow);

  // Founder records (video) — a text piece is already in editing and refuses the recording step.
  await actAs(e.founderEmail);
  if (isText) {
    const rec = await attempt(() => Content.markRecordedAction(slug, contentItemId));
    record(area, `${L}: text piece cannot be "recorded"`, rec.outcome !== "ok" ? "PASS" : "FAIL", msg(rec));
  } else {
    const rec = await attempt(() => Content.markRecordedAction(slug, contentItemId));
    const recAgain = await attempt(() => Content.markRecordedAction(slug, contentItemId));
    const taskAfter = await prisma.task.findFirst({ where: { entityId: contentItemId, kind: "record" } });
    record(area, `${L}: founder marks recorded → editing, task closed, second click refused`, rec.outcome === "ok" && recAgain.outcome !== "ok" && taskAfter?.status === "done" ? "PASS" : "FAIL", `${msg(rec)} / again=${recAgain.outcome} task=${taskAfter?.status}`);
  }
  const founderPublishEarly = await attempt(() => Distribution.createPublishRecordAction(slug, null, fd({ contentItemId, platform: "linkedin" })));
  record(area, `${L}: cannot create a publish record before approval`, founderPublishEarly.outcome !== "ok" ? "PASS" : "FAIL", msg(founderPublishEarly), founderPublishEarly.outcome === "ok" ? "SPINE-PUBLISH-UNAPPROVED" : undefined);

  await actAs(OPERATOR);
  const toReview = await attempt(() => Content.moveContentAction(slug, contentItemId, "in_review", "First cut ready."));
  await actAs(e.founderEmail);
  const changes = await attempt(() => Content.moveContentAction(slug, contentItemId, "changes_requested", "Trim the opening line."));
  await actAs(OPERATOR);
  const back = await attempt(() => Content.moveContentAction(slug, contentItemId, "editing"));
  const review2 = await attempt(() => Content.moveContentAction(slug, contentItemId, "in_review", "Opening trimmed."));
  await actAs(e.founderEmail);
  const approve = await attempt(() => Content.moveContentAction(slug, contentItemId, "approved"));
  const stageRow = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  const events = await prisma.contentEvent.count({ where: { contentItemId } });
  record(area, `${L}: editing → review → changes → editing → review → approved (founder)`, [toReview, changes, back, review2, approve].every((r) => r.outcome === "ok") && stageRow?.stage === "approved" && events >= 6 ? "PASS" : "FAIL", `stage=${stageRow?.stage} events=${events} ${[toReview, changes, back, review2, approve].map((r) => r.outcome).join(",")}`);

  // Publish.
  const pr = await attempt(() => Distribution.createPublishRecordAction(slug, null, fd({ contentItemId, platform: "linkedin" })));
  const recordId = data<{ id: string }>(pr)?.id ?? "";
  const ready = await attempt(() => Distribution.updatePublishRecordAction(slug, recordId, null, fd({ status: "ready" })));
  const noUrl = await attempt(() => Distribution.updatePublishRecordAction(slug, recordId, null, fd({ status: "published" })));
  const pub = await attempt(() => Distribution.updatePublishRecordAction(slug, recordId, null, fd({ status: "published", url: `https://www.linkedin.com/posts/${slug}_${contentItemId.slice(-6)}` })));
  const live = await prisma.contentItem.findUnique({ where: { id: contentItemId } });
  record(area, `${L}: publish draft → ready → published (URL required) → content live`, pr.outcome === "ok" && ready.outcome === "ok" && noUrl.outcome !== "ok" && pub.outcome === "ok" && live?.stage === "live" && !!live.liveAt ? "PASS" : "FAIL", `${msg(pr)} ready=${ready.outcome} noUrl=${noUrl.outcome} pub=${pub.outcome} stage=${live?.stage} liveAt=${!!live?.liveAt}`);

  await backdate(contentItemId, recordId, opts.liveDaysAgo);
  return { scriptId, contentItemId, recordId, frozen };
}

async function snapshots(e: Engagement, recordId: string, contentItemId: string, strong: boolean, label: string) {
  await actAs(e.founderEmail);
  const isText = e.mode === "text";
  const base = strong ? { views: 9800, likes: 410, comments: 96, shares: 58, saves: 140, leads: 4 } : { views: 140, likes: 3, comments: 0, shares: 0, saves: 1, leads: 0 };
  const results = [];
  for (const f of [0.4, 1]) {
    const r = await attempt(() => Performance.addPerformanceSnapshotAction(e.slug, null, fd({
      publishRecordId: recordId,
      views: Math.round(base.views * f), likes: Math.round(base.likes * f), comments: Math.round(base.comments * f), shares: Math.round(base.shares * f), saves: Math.round(base.saves * f), leads: Math.round(base.leads * f),
      ...(isText ? {} : { retentionPct: strong ? 62 : 18, avgViewSec: strong ? 41 : 9, watchTimeSec: Math.round(base.views * f * (strong ? 41 : 9)) }),
    })));
    results.push(r);
  }
  const count = await prisma.performanceSnapshot.count({ where: { publishRecordId: recordId } });
  const reading = await readContent((await prisma.organization.findUniqueOrThrow({ where: { slug: e.slug } })).id, contentItemId);
  record(e.area, `${label}: two snapshots recorded, actual reads as ${strong ? "strong/exceptional" : "under"}`, results.every((r) => r.outcome === "ok") && count === 2 && !!reading?.gap ? "PASS" : "FAIL", `${results.map(msg).join(" / ")} snapshots=${count} class=${reading?.actual?.band ?? "?"} gap=${reading?.gap?.failureClass ?? "?"} sufficient=${reading?.gap?.sufficiency.sufficient} ${reading?.gap?.sufficiency.reasons.join(" ").slice(0, 80) ?? ""}`);
  return reading;
}

async function runEngagement(e: Engagement) {
  const { area, slug, mode } = e;
  const isText = mode === "text";
  section(`core spine — ${e.name} (${mode})`);

  /* ----- 1. Operator creates the client. ----- */
  await actAs(OPERATOR);
  const created = await attempt(() => Admin.createClientAction(null, fd({ name: e.name, slug, website: `https://${slug}.example.test`, industry: isText ? "Legal services" : "B2B services", geography: "UK", packageTier: "install", currency: "GBP", setupFee: 2500, periodFee: 2500, cadencePerWeek: isText ? 4 : 3, platforms: "linkedin", founderName: e.founderName, founderEmail: e.founderEmail, founderPassword: e.password })));
  const org = await prisma.organization.findUnique({ where: { slug }, include: { memberships: true, brandBrain: true, onboardingSession: true, invitations: true, engagements: true } });
  const inviteLink = created.outcome === "ok" ? ((created.value as { data?: { inviteLink?: string | null } }).data?.inviteLink ?? null) : null;
  record(area, "operator creates the client workspace (org, Brand Brain shell, onboarding session, draft engagement, founder invited as client_admin; no account yet)", created.outcome === "ok" && !!org && !!org.brandBrain && !!org.onboardingSession && org.engagements.length === 1 && org.invitations.some((i) => i.role === "client_admin" && i.state === "pending") && org.memberships.length === 0 && !!inviteLink ? "PASS" : "FAIL", msg(created));
  if (!org) throw new Error("no org");
  await prisma.organization.update({ where: { id: org.id }, data: { startedAt: new Date(Date.now() - 30 * 86_400_000) } }); // CLOCK: engagement began 30 days ago
  const dup = await attempt(() => Admin.createClientAction(null, fd({ name: e.name, slug, founderName: e.founderName, founderEmail: e.founderEmail, founderPassword: e.password })));
  record(area, "duplicate slug refused", dup.outcome !== "ok" ? "PASS" : "FAIL", msg(dup));

  /* ----- 2. Founder accepts the invitation, choosing their password, then signs in. ----- */
  anonymous();
  const token = inviteLink ? new URL(inviteLink).searchParams.get("token") ?? "" : "";
  const accepted = await attempt(() => Team.acceptInvitationAction(null, fd({ token, password: e.password, confirm: e.password })));
  const founderMembership = await prisma.membership.findFirst({ where: { orgId: org.id, user: { email: e.founderEmail } } });
  record(area, "founder accepts the invitation with their own password → owner and client_admin", accepted.outcome === "refused" && accepted.via === "redirect" && founderMembership?.role === "client_admin" && founderMembership.isOwner ? "PASS" : "FAIL", msg(accepted));
  anonymous(); // a stranger replaying the used link, not the founder
  const replay = await attempt(() => Team.acceptInvitationAction(null, fd({ token, password: "another-password-9", confirm: "another-password-9" })));
  record(area, "the invitation link works once (a signed-out replay is refused)", replay.outcome !== "ok" && !(replay.outcome === "refused" && replay.via === "redirect") ? "PASS" : "FAIL", msg(replay));
  __resetRateLimits();
  const login = await attempt(() => Auth.loginAction(null, fd({ email: e.founderEmail, password: e.password })));
  const target = login.outcome === "refused" && login.via === "redirect" ? login.message.split(";")[2] ?? "" : "";
  record(area, "founder signs in with the password they chose → redirected into the workspace", login.outcome === "refused" && login.via === "redirect" && target.includes(`/app/${slug}`) ? "PASS" : "FAIL", `${msg(login)} → ${target}`);
  const wrong = await attempt(() => Auth.loginAction(null, fd({ email: e.founderEmail, password: "not-the-password" })));
  record(area, "wrong password refused", wrong.outcome === "refused" && wrong.via !== "redirect" ? "PASS" : "FAIL", msg(wrong));

  /* ----- 3. Onboarding, as the founder. ----- */
  await actAs(e.founderEmail);
  const fill: Record<string, Record<string, unknown>> = {
    business: { companyName: e.name, description: isText ? "Employment law for founders who cannot afford a mistake." : "Sales forecasting for founder-led B2B firms." },
    offer: { offerName: isText ? "Contract Shield" : "Forecast Reset", offerOutcome: isText ? "Contracts that survive a dispute" : "A forecast the board can use" },
    customer: { icpName: isText ? "Founders, 10-80 staff, first legal hire not yet made" : "Founder-led B2B services, 20-200 staff", icpPains: ["Forecast slips late"], icpDesires: ["A number the board trusts"] },
    founder: { founderName: e.founderName, founderBio: isText ? "Twelve years of employment law, no camera, ever." : "Eleven years running sales teams." },
    voice: { voiceTone: "Direct, warm, no jargon", voicePhrasesAvoided: ["game-changer"] },
    content: { hoursPerWeek: isText ? 1 : 2 },
    operation: { hoursPerWeek: isText ? 1 : 2 },
    goals: { targetPlatforms: ["linkedin"], targetCadence: isText ? 4 : 3 },
    commercial: { attentionToInquiry: "Profile → site → discovery call" },
  };
  const start = await attempt(() => Onboarding.goToOnboardingStepAction(slug, "welcome"));
  const stepResults: string[] = [];
  for (const step of ONBOARDING_STEPS.map((s) => s.key)) {
    if (step === "welcome") continue;
    const r = await attempt(() => Onboarding.saveOnboardingStepAction(slug, step, fill[step] ?? {}, true));
    if (r.outcome !== "ok") stepResults.push(`${step}:${msg(r)}`);
  }
  const built = await attempt(() => Onboarding.buildWorkspaceAction(slug));
  const orgAfter = await prisma.organization.findUnique({ where: { slug }, include: { brandBrain: true } });
  const brain = orgAfter?.brandBrain;
  const brainText = JSON.stringify(brain ?? {});
  const offerRow = await prisma.offer.findFirst({ where: { orgId: org.id, name: fill.offer.offerName as string } });
  record(area, "founder completes onboarding → workspace built, offer + Brand Brain populated, stage complete", start.outcome === "ok" && stepResults.length === 0 && built.outcome === "ok" && orgAfter?.onboardingStage === "complete" && !!offerRow && brainText.includes("game-changer") && brainText.includes(fill.business.description as string) ? "PASS" : "FAIL", `${stepResults.join(" | ") || "all steps ok"} build=${msg(built)} stage=${orgAfter?.onboardingStage} offer=${!!offerRow} brainHasBanned=${brainText.includes("game-changer")} brainHasDescription=${brainText.includes(fill.business.description as string)}`);

  /* ----- 4. Recording readiness (video engagements only). ----- */
  if (!isText) {
    const submit = await attempt(() => Readiness.submitRecordingSetupAction(slug, null, fd({ roomNotes: "Spare bedroom, north window", gearNotes: "iPhone 15, lav mic", formats: "vertical_short" })));
    await actAs(OPERATOR);
    const ok = Object.fromEntries(READINESS_CHECKS.map((k) => [`state_${k}`, "ok"]));
    const assess = await attempt(() => Readiness.assessRecordingSetupAction(slug, null, fd({ status: "ready", recommendation: "Good to go.", ...ok })));
    const readiness = await prisma.recordingReadiness.findFirst({ where: { orgId: org.id } }).catch(() => null);
    record(area, "founder submits setup → operator assesses ready", submit.outcome === "ok" && assess.outcome === "ok" ? "PASS" : "FAIL", `${msg(submit)} / ${msg(assess)} status=${(readiness as { status?: string } | null)?.status ?? "n/a"}`);
  } else {
    const readiness = await prisma.recordingReadiness.findFirst({ where: { orgId: org.id } }).catch(() => null);
    record(area, "text-led: no recording setup submitted, nothing downstream demands one", !readiness ? "PASS" : "FAIL", `readiness rows=${readiness ? 1 : 0}`);
  }

  /* ----- 5. Research run → signal → idea. ----- */
  await actAs(OPERATOR);
  __resetRateLimits();
  const run = await attempt(() => Runs.createRunAction(slug, null, fd({ label: `${e.name} — cycle 1`, focus: "What buyers say when the forecast is wrong" })));
  const runId = data<{ id: string }>(run)?.id ?? "";
  const quote = isText ? "I signed because they sounded sure" : "The forecast is a feeling";
  const notes = isText ? `"${quote}" — said by three founders on discovery calls this month. Two later lost money over a clause they never read.` : `"${quote}" — said by three founders on discovery calls this month. Two said the board stopped asking for the number.`;
  const src = await attempt(() => Runs.addRunSourceAction(slug, runId, null, fd({ kind: "customer_language", label: quote, content: notes })));
  const srcId = data<{ id: string }>(src)?.id ?? "";
  const toCollecting = await attempt(() => Runs.advanceRunAction(slug, runId, "collecting"));
  const col = await attempt(() => Runs.collectSourceAction(slug, srcId, null, fd({ content: notes })));
  const toSynth = await attempt(() => Runs.advanceRunAction(slug, runId, "synthesis"));
  const syn = await attempt(() => Runs.synthesiseRunAction(slug, runId));
  await Runs.advanceRunAction(slug, runId, "review");
  const cands = await prisma.candidateSignal.findMany({ where: { runId } });
  let patternId = "";
  for (const [i, c] of cands.entries()) {
    const d = await attempt(() => Runs.decideCandidateAction(slug, c.id, i === 0 ? "approved" : "rejected", i === 0 ? undefined : "Not distinct from the first candidate."));
    if (i === 0) patternId = data<{ patternId: string | null }>(d)?.patternId ?? "";
  }
  await Runs.updateRunAction(slug, runId, null, fd({ label: `${e.name} — cycle 1`, summary: "One signal approved from discovery notes; the rest were restatements." }));
  const published = await attempt(() => Runs.advanceRunAction(slug, runId, "published"));
  record(area, "research run: create → collect → synthesise (demo) → review → one signal approved → published", run.outcome === "ok" && src.outcome === "ok" && syn.outcome === "ok" && cands.length > 0 && !!patternId && published.outcome === "ok" ? "PASS" : "FAIL", `${msg(run)} src=${src.outcome} collecting=${toCollecting.outcome} col=${col.outcome} synthState=${toSynth.outcome} syn=${msg(syn)} cands=${cands.length} pattern=${!!patternId} publish=${msg(published)}`);
  if (!patternId) throw new Error("no pattern");

  const promoted = await attempt(() => Intelligence.promotePatternToIdeaAction(slug, patternId));
  const ideaId = data<{ ideaId: string }>(promoted)?.ideaId ?? "";
  const idea = ideaId ? await prisma.idea.findUnique({ where: { id: ideaId } }) : null;
  record(area, "signal promoted to an idea with lineage back to the pattern", promoted.outcome === "ok" && !!idea && idea.orgId === org.id ? "PASS" : "FAIL", `${msg(promoted)} idea=${idea?.title?.slice(0, 50)}`);
  if (!ideaId) throw new Error("no idea");
  if (isText) {
    await actAs(e.founderEmail);
    const upd = await attempt(() => Ideas.updateIdeaAction(slug, ideaId, null, fd({ title: idea!.title, concept: idea!.concept ?? "", platform: "linkedin", format: "text_post", commercialIntent: "medium" })));
    const after = await prisma.idea.findUnique({ where: { id: ideaId } });
    record(area, "text-led: idea format set to text_post", upd.outcome === "ok" && after?.format === "text_post" ? "PASS" : "FAIL", `${msg(upd)} format=${after?.format}`);
    await actAs(OPERATOR);
  }

  /* ----- 6. ROOT (thesis) ----- */
  const root = await attempt(() => Learning.createRootAction(slug, null, fd({ label: isText ? "Confidence beats reading" : "The forecast is a feeling", thesis: isText ? "Founders sign contracts on the other side's confidence, not the clause; naming that earns the first reply." : "Founders will engage when the forecast is named as a feeling rather than a spreadsheet." })));
  const rootId = data<{ id: string }>(root)?.id ?? "";
  record(area, "ROOT thesis created", root.outcome === "ok" && !!rootId ? "PASS" : "FAIL", msg(root));
  if (!rootId) throw new Error("no root");

  /* ----- 7. Produce and publish the first piece. ----- */
  const piece = await producePiece(e, { ideaId, rootId, lineageRole: "source", label: "piece 1", liveDaysAgo: 21 });

  /* ----- 8. Attribution: click, inquiry, buyer-named event. ----- */
  await actAs(OPERATOR);
  const link = await attempt(() => Attribution.createTrackedLinkAction(slug, null, fd({ label: "Book a call", destinationUrl: `https://${slug}.example.test/book`, contentItemId: piece.contentItemId })));
  const linkSlug = data<{ slug: string }>(link)?.slug ?? "";
  const click = await follow(linkSlug, undefined, "https://www.linkedin.com/feed/");
  const tp = await prisma.touchpoint.findFirst({ where: { orgId: org.id, kind: "click" } });
  record(area, "tracked link created for the piece; a click redirects and records a touchpoint", link.outcome === "ok" && click.status === 302 && !!click.token && tp?.contentItemId === piece.contentItemId ? "PASS" : "FAIL", `${msg(link)} status=${click.status} tp=${!!tp}`);
  await actAs(e.founderEmail);
  if (mode === "bad") {
    record(area, "bad outcome: no inquiry followed the piece (nothing to attribute)", "PASS", "no commercial event logged for piece 1");
  } else {
  const inq = await attempt(() => Pipeline.saveInquiryAction(slug, null, null, fd({ name: "Synthetic Buyer (QA)", company: "Example Buyer Ltd", stage: "inquiry", source: "content", contentItemId: piece.contentItemId })));
  const inqId = data<{ id: string }>(inq)?.id ?? "";
  const founderEv = await attempt(() => Attribution.recordCommercialEventAction(slug, null, fd({ kind: "booked_call", source: "manual", attribution: "buyer_named", inquiryId: inqId, note: "Founder declaring attribution themselves." })));
  record(area, "founder logs the inquiry; founder cannot self-declare an attribution class (operator-only)", inq.outcome === "ok" && founderEv.outcome === "refused" ? "PASS" : "FAIL", `${msg(inq)} / ${msg(founderEv)}`);
  await actAs(OPERATOR);
  const ev = await attempt(() => Attribution.recordCommercialEventAction(slug, null, fd({ kind: "booked_call", source: "manual", attribution: "buyer_named", inquiryId: inqId, note: "Buyer said on the call: 'I saw the forecast-is-a-feeling post.'" })));
  const evRow = await prisma.commercialEvent.findFirst({ where: { orgId: org.id } });
  record(area, "operator records the buyer-named booked call (note required, class buyer_named)", ev.outcome === "ok" && evRow?.attribution === "buyer_named" ? "PASS" : "FAIL", `${msg(ev)} attribution=${evRow?.attribution}`);
  }

  /* ----- 9. Performance → diagnosis. ----- */
  const strong = mode !== "bad";
  const reading = await snapshots(e, piece.recordId, piece.contentItemId, strong, "piece 1");
  await actAs(OPERATOR);
  const diag = await attempt(() => Learning.diagnoseContentAction(slug, piece.contentItemId));
  const diagId = data<{ id: string }>(diag)?.id ?? "";
  const diagClass = data<{ failureClass: string }>(diag)?.failureClass ?? "";
  const diagRow = diagId ? await prisma.contentDiagnosis.findUnique({ where: { id: diagId } }) : null;
  if (strong) {
    record(area, "piece 1 diagnosed: strong result → failure class none / thesis preserved", diag.outcome === "ok" && diagClass === "none" && diagRow?.approvalState === "draft" ? "PASS" : "FAIL", `${msg(diag)} class=${diagClass} state=${diagRow?.approvalState}`);
  } else {
    record(area, "piece 1 diagnosed: under-performance names a cause (not insufficient_data / none)", diag.outcome === "ok" && !["none", "insufficient_data", ""].includes(diagClass) && diagRow?.approvalState === "draft" ? "PASS" : "FAIL", `${msg(diag)} class=${diagClass} state=${diagRow?.approvalState}`, diag.outcome === "ok" && ["none", "insufficient_data"].includes(diagClass) ? "SPINE-DIAG-UNDER" : undefined);
  }
  if (isText) {
    record(area, "text-led: no retention data → diagnosis must not blame retention_structure", diag.outcome === "ok" && diagClass !== "retention_structure" ? "PASS" : "FAIL", `class=${diagClass} actualClass=${reading?.actual?.band}`, diagClass === "retention_structure" ? "SPINE-TEXT-RETENTION" : undefined);
  }
  const approveD = await attempt(() => Learning.approveDiagnosisAction(slug, null, fd({ diagnosisId: diagId, failureClass: strong ? "none" : (["none", "insufficient_data", ""].includes(diagClass) ? "hook_packaging" : diagClass), explanation: strong ? "Reached ~4x the corpus median and produced a buyer-named call. Thesis stands." : "Views stalled at ~140 with near-zero engagement; the opening line named the category rather than the buyer's moment.", preserveThesis: "true", ...(strong ? {} : { failedAssumption: "That naming the category would earn attention.", prescription: "Rewrite the opening around the buyer's moment; retest on the same thesis." }) })));
  const approvedRow = await prisma.contentDiagnosis.findUnique({ where: { id: diagId } });
  const expNow = JSON.stringify(await prisma.contentExpectation.findFirst({ where: { subjectType: "content", subjectId: piece.contentItemId }, orderBy: { createdAt: "desc" } }));
  record(area, "operator approves the diagnosis; the frozen expectation is byte-identical afterwards", approveD.outcome === "ok" && approvedRow?.approvalState === "approved" && expNow === piece.frozen ? "PASS" : "FAIL", `${msg(approveD)} state=${approvedRow?.approvalState} expectationUnchanged=${expNow === piece.frozen}`, expNow !== piece.frozen ? "SPINE-EXPECTATION-MUTATED" : undefined);

  /* ----- 10. Bad outcome: correction → retest → verdict. ----- */
  if (mode === "bad") {
    const corr = await attempt(() => Learning.recordCorrectionAction(slug, null, fd({ diagnosisId: diagId, rootId, believed: "That naming the category in the first line would earn attention.", actual: "Views stalled at ~140; the post was scrolled past.", failedAssumption: "Category language reads as generic to founders.", correction: "Open on the buyer's moment (the board meeting where the number was wrong).", lever: "hook" })));
    const corrId = data<{ id: string }>(corr)?.id ?? "";
    const corrRow = corrId ? await prisma.correctionEntry.findUnique({ where: { id: corrId } }) : null;
    record(area, "correction recorded (believed → actual → failed assumption → correction), verdict open", corr.outcome === "ok" && corrRow?.worked === null ? "PASS" : "FAIL", `${msg(corr)} worked=${String(corrRow?.worked)}`);

    await actAs(e.founderEmail);
    const idea2 = await attempt(() => Ideas.createIdeaAction(slug, null, fd({ title: "The board meeting where the number was wrong", concept: "Retest of the thesis with the corrected opening.", platform: "linkedin", format: "short_form", commercialIntent: "high" })));
    const idea2Id = data<{ id: string }>(idea2)?.id ?? "";
    record(area, "retest idea created by the founder", idea2.outcome === "ok" ? "PASS" : "FAIL", msg(idea2));
    const piece2 = await producePiece(e, { ideaId: idea2Id, rootId, lineageRole: "retest", derivedFromId: piece.contentItemId, label: "retest", liveDaysAgo: 15 });
    await snapshots(e, piece2.recordId, piece2.contentItemId, true, "retest");
    const inq2 = await attempt(() => Pipeline.saveInquiryAction(slug, null, null, fd({ name: "Second Synthetic Buyer (QA)", stage: "inquiry", source: "content", contentItemId: piece2.contentItemId })));
    await actAs(OPERATOR);
    await Attribution.recordCommercialEventAction(slug, null, fd({ kind: "booked_call", source: "manual", attribution: "buyer_named", inquiryId: data<{ id: string }>(inq2)?.id ?? "", note: "Buyer quoted the board-meeting line on the call." }));
    const diag2 = await attempt(() => Learning.diagnoseContentAction(slug, piece2.contentItemId));
    record(area, "retest diagnosed: strong → none", diag2.outcome === "ok" && data<{ failureClass: string }>(diag2)?.failureClass === "none" ? "PASS" : "FAIL", `${msg(diag2)} class=${data<{ failureClass: string }>(diag2)?.failureClass}`);
    const verdict = await attempt(() => Learning.recordCorrectionVerdictAction(slug, null, fd({ correctionId: corrId, worked: "yes", verdictNote: "Retest reached ~9,800 views against ~140; same thesis, new opening.", retestContentItemId: piece2.contentItemId })));
    const corrAfter = await prisma.correctionEntry.findUnique({ where: { id: corrId } });
    const verdictAgain = await attempt(() => Learning.recordCorrectionVerdictAction(slug, null, fd({ correctionId: corrId, worked: "no", verdictNote: "Trying to flip the verdict afterwards." })));
    const corrFinal = await prisma.correctionEntry.findUnique({ where: { id: corrId } });
    record(area, "verdict recorded: correction worked; a second verdict cannot flip it", verdict.outcome === "ok" && corrAfter?.worked === true && corrFinal?.worked === true ? "PASS" : "FAIL", `${msg(verdict)} worked=${corrAfter?.worked} again=${verdictAgain.outcome} final=${corrFinal?.worked}`, corrFinal?.worked === false ? "SPINE-VERDICT-FLIP" : undefined);
    const rootRow = await prisma.contentRoot.findUnique({ where: { id: rootId } });
    const lineage = await prisma.contentItem.findMany({ where: { rootId }, select: { lineageRole: true, derivedFromId: true } });
    record(area, "ROOT lineage: source + retest, thesis preserved (status open)", lineage.some((l) => l.lineageRole === "source") && lineage.some((l) => l.lineageRole === "retest" && l.derivedFromId === piece.contentItemId) && rootRow?.status === "open" ? "PASS" : "FAIL", `roles=${lineage.map((l) => l.lineageRole).join(",")} root=${rootRow?.status}`);
  }

  /* ----- 11. Weekly report. ----- */
  await actAs(OPERATOR); // REP-01: Threadline drafts and finalises; the founder reads
  const rep = await attempt(() => Reports.generateWeeklyReportAction(slug, -3));
  const repId = data<{ id: string }>(rep)?.id ?? "";
  const repView = repId ? await getReport(org.id, repId, "internal_operator") : null;
  const payload = (repView as { payload?: Record<string, unknown> } | null)?.payload ?? {};
  const payloadText = JSON.stringify(payload);
  const shipped = (payload as { shipped?: { count: number; titles?: string[] } }).shipped;
  const repRow = repId ? await prisma.weeklyReport.findUnique({ where: { id: repId } }) : null;
  const wantShipped = repRow ? await prisma.contentItem.count({ where: { orgId: org.id, liveAt: { gte: repRow.periodStart, lte: repRow.periodEnd } } }) : -1;
  record(area, "operator generates the weekly report for the week the piece went live: shipped matches, no overclaim", rep.outcome === "ok" && wantShipped >= 1 && shipped?.count === wantShipped && !/guarantee|will generate|ROI of/i.test(payloadText) ? "PASS" : "FAIL", `${msg(rep)} shipped=${shipped?.count} expected=${wantShipped} views=${(payload as { performance?: { views?: number } }).performance?.views}`);
  if (mode === "bad") {
    record(area, "bad outcome: report carries the miss and the learning, not just the retest win", ((payload as { misses?: unknown[] }).misses?.length ?? 0) > 0 && ((payload as { learnings?: unknown[] }).learnings?.length ?? 0) > 0 ? "PASS" : "PARTIAL", `misses=${(payload as { misses?: unknown[] }).misses?.length ?? 0} learnings=${(payload as { learnings?: unknown[] }).learnings?.length ?? 0}`);
  }
  const fin = await attempt(() => Reports.finaliseReportAction(slug, repId));
  const finRow = await prisma.weeklyReport.findUnique({ where: { id: repId } });
  record(area, "report finalised and frozen", fin.outcome === "ok" && finRow?.status === "final" ? "PASS" : "FAIL", `${msg(fin)} status=${finRow?.status}`);

  /* ----- 12. Learning trajectory. ----- */
  const traj = await learningTrajectory(org.id, orgAfter?.startedAt ?? org.createdAt);
  const sum = (k: "published" | "diagnosed" | "corrections" | "correctionsWorked") => traj.periods.reduce((a, p) => a + p[k], 0);
  const wantPublished = mode === "bad" ? 2 : 1;
  record(area, "learning trajectory: periods show published / diagnosed / corrections / worked as they happened", traj.periods.length === 2 && sum("published") === wantPublished && sum("diagnosed") === (mode === "bad" ? 2 : 1) && sum("corrections") === (mode === "bad" ? 1 : 0) && sum("correctionsWorked") === (mode === "bad" ? 1 : 0) ? "PASS" : "FAIL", `periods=${traj.periods.length} published=${sum("published")} diagnosed=${sum("diagnosed")} corrections=${sum("corrections")} worked=${sum("correctionsWorked")} reading=${traj.reading.direction} "${traj.reading.headline.slice(0, 70)}"`);
  const roots = await listRoots(org.id);
  record(area, "ROOT view lists the thesis with its pieces", roots.some((r) => r.id === rootId) ? "PASS" : "FAIL", `${roots.length} roots`);

  return { orgId: org.id, contentItemId: piece.contentItemId, rootId, repId };
}

export async function runCoreSpine() {
  await teardownSpine();
  const results: Record<Mode, Awaited<ReturnType<typeof runEngagement>> | null> = { happy: null, bad: null, text: null };
  for (const e of ENGAGEMENTS) {
    try {
      results[e.mode] = await runEngagement(e);
    } catch (error) {
      record(e.area, "engagement aborted", "FAIL", error instanceof Error ? error.message : String(error), "SPINE-ABORT");
    }
  }

  section("core spine — isolation between the three tenants");
  const happy = results.happy;
  const bad = results.bad;
  if (happy && bad) {
    await actAs(ENGAGEMENTS[0].founderEmail);
    const cross = await attempt(() => Learning.diagnoseContentAction(ENGAGEMENTS[1].slug, bad.contentItemId));
    const crossRead = await attempt(() => Content.moveContentAction(ENGAGEMENTS[0].slug, bad.contentItemId, "scheduled"));
    const crossReport = await attempt(() => Reports.finaliseReportAction(ENGAGEMENTS[0].slug, bad.repId));
    record("spine:isolation", "Meridian's founder cannot touch Halden's content, diagnosis or report", cross.outcome !== "ok" && crossRead.outcome !== "ok" && crossReport.outcome !== "ok" ? "PASS" : "FAIL", `${cross.outcome}/${crossRead.outcome}/${crossReport.outcome}`, [cross, crossRead, crossReport].some((r) => r.outcome === "ok") ? "SPINE-XTENANT" : undefined);
    const rootsHappy = await listRoots(happy.orgId);
    record("spine:isolation", "ROOT listings are per tenant", !rootsHappy.some((r) => r.id === bad.rootId) ? "PASS" : "FAIL", `${rootsHappy.length} roots`);
  }
}

export async function teardownSpine() {
  await cleanupSessions();
  await prisma.organization.deleteMany({ where: { slug: { in: ENGAGEMENTS.map((e) => e.slug) } } });
  await prisma.user.deleteMany({ where: { email: { in: ENGAGEMENTS.map((e) => e.founderEmail) } } });
}

if (require.main === module) {
  (async () => {
    try {
      await runCoreSpine();
    } finally {
      const keep = process.argv.includes("--keep");
      if (!keep) await teardownSpine();
      const left = await prisma.organization.count({ where: { slug: { startsWith: "qa-spine-" } } });
      console.log(`\ncleanup: ${keep ? "kept (--keep)" : `synthetic tenants removed, remaining=${left}`}`);
      await prisma.$disconnect();
    }
  })();
}
