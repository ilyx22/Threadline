/**
 * Acceptance journeys 1, 2 and 8 of the backend brief (VER-01, VER-02, VER-08),
 * driven through the real server actions as the real actors, on isolated
 * synthetic records (slug prefix `qa-journey-`), with no seed shortcuts and no
 * manual database edits except moving the clock where time must pass (as the
 * core-spine suite does). Email goes to the capture provider; the CRM and
 * Stripe are never called (production-only, test-mode-only).
 *
 *   node scripts/qa/run.cjs suite-journeys
 */
import { prisma } from "../../src/lib/db/client";
import { actAs, anonymous, attempt, fd, record, section, summary } from "./context";
import * as Application from "../../src/lib/actions/application";
import * as Admin from "../../src/lib/actions/admin";
import * as Team from "../../src/lib/actions/team";
import * as Onboarding from "../../src/lib/actions/onboarding";
import * as Engagement from "../../src/lib/actions/engagement";
import * as Billing from "../../src/lib/actions/billing";
import * as Workspace from "../../src/lib/actions/workspace";
import * as Content from "../../src/lib/actions/content";
import * as Ideas from "../../src/lib/actions/ideas";
import * as Proof from "../../src/lib/actions/proof-permission";
import * as Offboarding from "../../src/lib/actions/offboarding";
import { requireOrgAccess } from "../../src/lib/auth/guard";
import { openDueRenewals } from "../../src/lib/commercial/renewals";
import { __resetRateLimits } from "../../src/lib/security/rate-limit";

const OPERATOR = "operator@threadline.com";
const SUPER = "ops@threadline.com";
const stamp = Date.now().toString(36);
const slug = `qa-journey-${stamp}`;
const founderEmail = `qa.journey.founder.${stamp}@example.test`;
const colleagueEmail = `qa.journey.colleague.${stamp}@example.test`;
const delegateEmail = `qa.journey.delegate.${stamp}@example.test`;
const viewerEmail = `qa.journey.viewer.${stamp}@example.test`;
const PASSWORD = "Qa-Journey-Passphrase-2026";

const ok = (b: boolean) => (b ? "PASS" : "FAIL");
const data = <T>(r: Awaited<ReturnType<typeof attempt<unknown>>>) => (r.outcome === "ok" ? ((r.value as { data?: T }).data ?? null) : null);
const tokenOf = (link: string | null | undefined) => (link ? new URL(link).searchParams.get("token") ?? "" : "");
const redirected = (r: Awaited<ReturnType<typeof attempt<unknown>>>) => r.outcome === "refused" && r.via === "redirect";

async function acceptAsNew(token: string) {
  anonymous();
  __resetRateLimits();
  return attempt(() => Team.acceptInvitationAction(null, fd({ token, password: PASSWORD, confirm: PASSWORD })));
}

export async function runJourneys() {
  /* ------------------------------ Journey 1 ------------------------------ */
  section("journey 1: application to first delivery (VER-01)");
  anonymous();
  __resetRateLimits();
  const applied = await attempt(() =>
    Application.submitApplicationAction(null, fd({ name: "Jo Journey", email: founderEmail, company: "Journey Advisory", website: "https://journey-advisory.example.test", whatYouSell: "Fractional finance leadership for founders.", revenueRange: "£1m – £5m", contentProcess: "Nothing regular; occasional LinkedIn posts.", peopleInvolved: "Just me", publishCadence: "Rarely", biggestBottleneck: "No time to write.", founderHours: "2 – 5 hours", successLooksLike: "Two qualified calls a month from content.", urgency: "This quarter" })),
  );
  const app = await prisma.application.findFirst({ where: { email: founderEmail } });
  const confirmation = app ? await prisma.job.count({ where: { idempotencyKey: `application:${app.id}:confirmation` } }) : 0;
  record("journey1", "application stored and one confirmation queued", ok(applied.outcome === "ok" && !!app && confirmation === 1), `${applied.outcome} confirmations=${confirmation}`);

  const op = await actAs(OPERATOR);
  const q = await attempt(() => Admin.qualifyApplicationAction(app!.id, null, fd({ ownerId: op.userId, nextAction: "Fit call", nextActionDue: "2026-10-01", outcome: "open" })));
  const qualified = await prisma.application.findUnique({ where: { id: app!.id } });
  record("journey1", "operator qualifies: owner, next action, due date", ok(q.outcome === "ok" && qualified?.ownerId === op.userId && qualified.nextAction === "Fit call"), q.outcome);

  const conv = await attempt(() => Admin.convertApplicationAction(null, fd({ applicationId: app!.id, slug, name: "Journey Advisory" })));
  const converted = data<{ slug: string; inviteLink: string | null }>(conv);
  const org = await prisma.organization.findUnique({ where: { slug }, include: { engagements: true } });
  const outbox = org ? await prisma.crmOutbox.count({ where: { OR: [{ entityId: org.id }, { entityId: app!.id }, { entityId: org.engagements[0]?.id ?? "-" }] } }) : 0;
  record("journey1", "single conversion: workspace, draft engagement, founder invited, CRM rows queued", ok(conv.outcome === "ok" && !!org && org.engagements.length === 1 && !!converted?.inviteLink && outbox === 3), `${conv.outcome} crm=${outbox}`);
  const again = await attempt(() => Admin.convertApplicationAction(null, fd({ applicationId: app!.id, slug: `${slug}-dup`, name: "Journey Advisory" })));
  record("journey1", "converting again returns the same workspace, never a second", ok(again.outcome === "ok" && (await prisma.organization.count({ where: { slug: { startsWith: slug } } })) === 1), again.outcome);

  const accepted = await acceptAsNew(tokenOf(converted?.inviteLink));
  const founderMember = org ? await prisma.membership.findFirst({ where: { orgId: org.id, user: { email: founderEmail } } }) : null;
  record("journey1", "founder accepts the invitation with their own password and becomes owner", ok(redirected(accepted) && founderMember?.role === "client_admin" && founderMember.isOwner), accepted.outcome);

  await actAs(founderEmail);
  const onboard = await attempt(() => Onboarding.goToOnboardingStepAction(slug, "welcome"));
  record("journey1", "founder resumes onboarding in their workspace", ok(onboard.outcome === "ok" || redirected(onboard)), onboard.outcome);

  await actAs(OPERATOR);
  const act = await attempt(() => Engagement.activateEngagementAction(org!.engagements[0].id, null, fd({ startDate: "2026-09-28" })));
  const periods = await prisma.servicePeriod.count({ where: { engagementId: org!.engagements[0].id } });
  const draft = await attempt(() => Billing.draftInvoicesAction(org!.engagements[0].id));
  const invoices = await prisma.invoice.findMany({ where: { orgId: org!.id } });
  record("journey1", "installation: engagement active with three periods; setup and first period invoices drafted, not issued", ok(act.outcome === "ok" && periods >= 3 && draft.outcome === "ok" && invoices.length >= 1 && invoices.every((i) => i.status === "draft")), `periods=${periods} invoices=${invoices.length}`);

  /* ------------------------------ Journey 2 ------------------------------ */
  section("journey 2: the founder's team (VER-02)");
  const existing = await prisma.user.create({ data: { email: colleagueEmail, name: "Casey Colleague", passwordHash: "x" } });
  await actAs(founderEmail);
  const inv1 = data<{ link: string | null }>(await attempt(() => Team.inviteAction(slug, null, fd({ name: "Casey Colleague", email: colleagueEmail, role: "client_member", profiles: "contributor", isExpert: "false" }))));
  const inv2 = data<{ link: string | null }>(await attempt(() => Team.inviteAction(slug, null, (() => { const f = fd({ name: "Dana Delegate", email: delegateEmail, role: "client_member", isExpert: "false" }); f.append("profiles", "approver"); f.append("profiles", "commercial"); return f; })())));
  const inv3 = data<{ link: string | null }>(await attempt(() => Team.inviteAction(slug, null, fd({ name: "Vic Viewer", email: viewerEmail, role: "client_member", profiles: "viewer", isExpert: "false" }))));
  record("journey2", "founder invites an existing user, a new delegate and a viewer", ok(!!inv1?.link && !!inv2?.link && !!inv3?.link), "");

  anonymous();
  const signInFirst = await attempt(() => Team.acceptInvitationAction(null, fd({ token: tokenOf(inv1?.link), password: PASSWORD, confirm: PASSWORD })));
  await actAs(colleagueEmail);
  const colleagueAccept = await attempt(() => Team.acceptInvitationAction(null, fd({ token: tokenOf(inv1?.link) })));
  record("journey2", "existing user must sign in first, then accepts without any password being set by the link", ok(signInFirst.outcome !== "ok" && !redirected(signInFirst) && redirected(colleagueAccept) && (await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).passwordHash === "x"), `${signInFirst.outcome}/${colleagueAccept.outcome}`);
  const delegateAccept = await acceptAsNew(tokenOf(inv2?.link));
  const viewerAccept = await acceptAsNew(tokenOf(inv3?.link));
  record("journey2", "new delegate and viewer accept with their own passwords", ok(redirected(delegateAccept) && redirected(viewerAccept)), `${delegateAccept.outcome}/${viewerAccept.outcome}`);

  await actAs(colleagueEmail);
  const upload = new FormData();
  upload.set("file", new File([new TextEncoder().encode("Notes from the client call about pricing objections.")], "call-notes.txt", { type: "text/plain" }));
  upload.set("category", "research_doc");
  upload.set("title", "Call notes");
  const up = await attempt(() => Workspace.uploadLibraryAssetAction(slug, null, upload));
  record("journey2", "contributor uploads source material", ok(up.outcome === "ok"), up.outcome);

  const piece = await prisma.contentItem.create({ data: { orgId: org!.id, title: "Journey piece", stage: "in_review", platform: "linkedin", format: "short_form" } });
  await actAs(delegateEmail);
  const decided = await attempt(() => Content.moveContentAction(slug, piece.id, "approved"));
  const approval = await prisma.approval.findFirst({ where: { orgId: org!.id, entityId: piece.id, decision: "approved" } });
  record("journey2", "designated approver approves the exact version", ok(decided.outcome === "ok" && approval?.authority === "designated_approver" && !!approval.contentHash), `${decided.outcome} authority=${approval?.authority}`);

  await actAs(OPERATOR);
  const setup = invoices.find((i) => i.kind === "setup");
  if (setup) await attempt(() => Billing.issueInvoiceAction(setup.id));
  await actAs(delegateEmail);
  const commercialSees = await attempt(() => requireOrgAccess(slug, "billing.view"));
  await actAs(viewerEmail);
  const viewerBilling = await attempt(() => requireOrgAccess(slug, "billing.view"));
  const viewerWrite = await attempt(() => Ideas.createIdeaAction(slug, null, fd({ title: "Viewer idea attempt", platform: "linkedin", format: "short_form" })));
  record("journey2", "commercial contact can see billing; the viewer cannot, and cannot write", ok(commercialSees.outcome === "ok" && viewerBilling.outcome !== "ok" && viewerWrite.outcome !== "ok"), `${commercialSees.outcome}/${viewerBilling.outcome}/${viewerWrite.outcome}`);

  const delegate = await prisma.user.findUniqueOrThrow({ where: { email: delegateEmail } });
  await prisma.task.create({ data: { orgId: org!.id, title: "Journey task", kind: "general", assigneeId: delegate.id } as never });
  await actAs(founderEmail);
  const removed = await attempt(() => Team.removeMemberAction(slug, delegate.id));
  await actAs(delegateEmail);
  const afterRemoval = await attempt(() => requireOrgAccess(slug, "workspace.view"));
  const stranded = await prisma.task.count({ where: { orgId: org!.id, assigneeId: delegate.id, status: "open" } });
  record("journey2", "removing the delegate ends their access at once and returns their open work", ok(removed.outcome === "ok" && afterRemoval.outcome !== "ok" && stranded === 0), `${removed.outcome}/${afterRemoval.outcome} stranded=${stranded}`);

  /* ------------------------------ Journey 8 ------------------------------ */
  section("journey 8: money, renewal, proof and a clean exit (VER-08)");
  await actAs(OPERATOR);
  const pay = setup ? await attempt(() => Billing.recordPaymentAction(setup.id, null, fd({ amount: 2500, kind: "payment", method: "bank_transfer", receivedAt: "2026-10-05", reference: "JOURNEY-1" }))) : null;
  record("journey8", "manual payment settles the setup invoice", ok(!!setup && pay?.outcome === "ok" && (await prisma.invoice.findUniqueOrThrow({ where: { id: setup.id } })).status === "paid"), pay?.outcome ?? "no setup invoice");

  const eng = await prisma.engagement.findFirstOrThrow({ where: { orgId: org!.id }, include: { periods: { orderBy: { number: "asc" } } } });
  const termEnd = eng.periods.find((p) => p.number === eng.initialPeriods)!.endDate;
  const opened = (await openDueRenewals(new Date(termEnd.getTime() - 10 * 86_400_000))).filter((r) => r.orgId === org!.id);
  const renew = opened[0] ? await attempt(() => Engagement.decideRenewalAction(opened[0].id, "renewed", null, fd({ note: "Renewed for three more periods." }))) : null;
  record("journey8", "renewal review opens before the term ends and is decided by a person", ok(opened.length === 1 && renew?.outcome === "ok"), renew?.outcome ?? "not opened");

  await actAs(founderEmail);
  await attempt(() => Proof.grantProofPermissionsAction(slug, null, fd({ allowPublicTestimonial: "on" })));
  await actAs(OPERATOR);
  const placed = await attempt(() => Proof.recordPlacementAction(slug, null, fd({ permission: "allowPublicTestimonial", content: "Our pipeline doubled.", location: "/who-its-for" })));
  await actAs(founderEmail);
  await attempt(() => Proof.grantProofPermissionsAction(slug, null, fd({})));
  const flagged = await prisma.proofPlacement.count({ where: { orgId: org!.id, flaggedAt: { not: null } } });
  record("journey8", "proof used with permission; withdrawing it flags the use for removal", ok(placed.outcome === "ok" && flagged === 1), `${placed.outcome} flagged=${flagged}`);

  await actAs(OPERATOR);
  await prisma.credential.create({ data: { orgId: org!.id, provider: "linkedin", purpose: "oauth_access", sealed: "{}", keyId: "k1" } });
  const off = await attempt(() => Offboarding.startOffboardingAction(org!.id, null, fd({ reason: "Journey test exit", exportDays: 7, retentionDays: 0 })));
  const rec = await prisma.offboardingRecord.findUnique({ where: { orgId: org!.id } });
  const creds = await prisma.credential.count({ where: { orgId: org!.id } });
  const queued = await prisma.job.count({ where: { orgId: org!.id, status: "queued" } });
  record("journey8", "offboarding writes the export, removes credentials and stops queued jobs", ok(off.outcome === "ok" && !!rec?.exportAssetId && creds === 0 && queued === 0), `${off.outcome} creds=${creds} queued=${queued}`);

  await attempt(() => Offboarding.setLegalHoldAction(org!.id, true));
  await prisma.organization.update({ where: { id: org!.id }, data: { retentionUntil: new Date(Date.now() - 86_400_000), accessEndsAt: new Date(Date.now() - 86_400_000) } }); // CLOCK: retention has passed
  await actAs(SUPER);
  const held = await attempt(() => Offboarding.deleteTenantAction(org!.id, null, fd({ confirm: slug })));
  await actAs(OPERATOR);
  await attempt(() => Offboarding.setLegalHoldAction(org!.id, false));
  await actAs(SUPER);
  const wrong = await attempt(() => Offboarding.deleteTenantAction(org!.id, null, fd({ confirm: "not-the-slug" })));
  const deleted = await attempt(() => Offboarding.deleteTenantAction(org!.id, null, fd({ confirm: slug })));
  const evidence = await prisma.offboardingRecord.findUnique({ where: { orgId: org!.id } });
  record("journey8", "deletion refused under legal hold and without the typed address; then done, with the evidence kept", ok(held.outcome !== "ok" && wrong.outcome !== "ok" && deleted.outcome === "ok" && (await prisma.organization.count({ where: { id: org!.id } })) === 0 && !!evidence?.deletedAt), `${held.outcome}/${wrong.outcome}/${deleted.outcome}`);
}

export async function cleanupJourneys() {
  const users = await prisma.user.findMany({ where: { email: { contains: `.${stamp}@example.test` } }, select: { id: true } });
  await prisma.organization.deleteMany({ where: { slug: { startsWith: `qa-journey-${stamp}` } } });
  await prisma.invoice.deleteMany({ where: { lines: { some: { description: { startsWith: "Journey Advisory" } } } } }).catch(() => {});
  await prisma.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await prisma.application.deleteMany({ where: { email: founderEmail } });
}

if (require.main === module) {
  (async () => {
    try {
      await runJourneys();
    } catch (e) {
      console.error("journeys crashed:", e);
      process.exitCode = 1;
    } finally {
      await cleanupJourneys();
      const s = summary();
      console.log(`\njourneys: pass=${s.pass} partial=${s.partial} fail=${s.fail}`);
      if (s.fail) process.exitCode = 1;
      await prisma.$disconnect();
    }
  })();
}
