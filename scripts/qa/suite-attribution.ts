/**
 * ATTRIBUTION, TRACKED REDIRECTS, COMMERCIAL EVIDENCE, SYNTHETIC SAFETY.
 *
 * The redirect route handler is called directly with a real NextRequest so the
 * cookie, the touchpoint and the visitor row are all produced by the real code.
 */
import { NextRequest } from "next/server";
import { prisma } from "../../src/lib/db/client";
import { actAs, attempt, fd, record, section } from "./context";
import { buildFixture, teardown, ALPHA, BETA, type Fixture } from "./suite-tenancy";
import * as Attribution from "../../src/lib/actions/attribution";
import * as Pipeline from "../../src/lib/actions/pipeline";
import * as Proof from "../../src/lib/actions/proof";
import * as Admin from "../../src/lib/actions/admin";
import { attribute, attributionCoverage, EFFICIENCY_COVERAGE_FLOOR } from "../../src/lib/domain/attribution";
import { assetAttribution, journeyForInquiry, listTrackedLinks } from "../../src/lib/data/attribution";
import { lastNDays } from "../../src/lib/data/metrics";
import { portfolioSummary } from "../../src/lib/data/admin";
import { proofView } from "../../src/lib/data/proof";
import { GET as redirectGET } from "../../src/app/t/[slug]/route";

const A_ADMIN = "qa.alpha.admin@example.test";
const OPERATOR = "operator@threadline.com";
const OPS = "ops@threadline.com";

async function follow(slug: string, cookie?: string, referer?: string) {
  const req = new NextRequest(`http://localhost:3000/t/${slug}`, {
    headers: { ...(cookie ? { cookie: `tl_v=${cookie}` } : {}), ...(referer ? { referer } : {}) },
  });
  const res = await redirectGET(req, { params: Promise.resolve({ slug }) });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const token = /tl_v=([^;]+)/.exec(setCookie)?.[1] ?? null;
  return { status: res.status, location: res.headers.get("location"), token, setCookie };
}

export async function runAttribution(fx: Fixture) {
  const A = fx.alpha.id;

  section("tracked links — creation and destination validation");
  await actAs(OPERATOR);
  const mk = (url: string) => attempt(() => Attribution.createTrackedLinkAction(ALPHA, null, fd({ label: "QA link", destinationUrl: url, contentItemId: fx.rows.content.id })));
  const good = await mk("https://example.test/landing?utm=qa");
  const slug = good.outcome === "ok" ? (good.value as { data: { slug: string } }).data.slug : "";
  record("attribution:links", "valid https destination", good.outcome === "ok" && slug.length >= 6 ? "PASS" : "FAIL", `${good.outcome} slug=${slug}`);
  for (const [label, url, mustRefuse] of [
    ["javascript: scheme", "javascript:alert(1)", true],
    ["data: scheme", "data:text/html,hi", true],
    ["credentials in URL", "https://user:pw@example.test/x", true],
    ["Threadline login route", "http://localhost:3000/login", true],
    ["Threadline admin route", "http://localhost:3000/admin/clients", true],
    ["bare domain (scheme added)", "example.test/page", false],
  ] as const) {
    const r = await mk(url);
    record("attribution:links", label, (r.outcome !== "ok") === mustRefuse ? "PASS" : "FAIL", `${r.outcome} ${(r as { message?: string }).message?.slice(0, 60) ?? ""}`, (r.outcome !== "ok") === mustRefuse ? undefined : "LINK-DEST");
  }
  const betaContent = await prisma.contentItem.create({ data: { orgId: fx.beta.id, title: "beta content" } });
  const foreign = await attempt(() => Attribution.createTrackedLinkAction(ALPHA, null, fd({ label: "x", destinationUrl: "https://example.test", contentItemId: betaContent.id })));
  record("attribution:links", "cannot attribute a link to another tenant's content", foreign.outcome !== "ok" ? "PASS" : "FAIL", `${foreign.outcome}`, foreign.outcome === "ok" ? "LINK-XTENANT" : undefined);

  section("tracked redirect — the public route");
  const unknown = await follow("definitely-not-a-slug");
  record("attribution:redirect", "unknown slug → 404, no cookie", unknown.status === 404 && !unknown.token ? "PASS" : "FAIL", `${unknown.status}`);
  const first = await follow(slug, undefined, "https://www.linkedin.com/feed/?trk=abc&secret=1");
  record("attribution:redirect", "valid slug → 302 to stored destination, sets tl_v", first.status === 302 && first.location === "https://example.test/landing?utm=qa" && !!first.token && /httponly/i.test(first.setCookie) ? "PASS" : "FAIL", `${first.status} → ${first.location} cookie=${!!first.token} httpOnly=${/httponly/i.test(first.setCookie)}`);
  const tp1 = await prisma.touchpoint.findFirst({ where: { orgId: A, kind: "click" }, orderBy: { createdAt: "desc" }, include: { visitor: true } });
  record("attribution:redirect", "click recorded with content, host-only referrer, native source", !!tp1 && tp1.contentItemId === fx.rows.content.id && tp1.referrerHost === "www.linkedin.com" && tp1.source === "native" ? "PASS" : "FAIL", `content=${tp1?.contentItemId === fx.rows.content.id} referrer=${tp1?.referrerHost} source=${tp1?.source}`, tp1?.referrerHost?.includes("secret") ? "REDIRECT-REFERRER-LEAK" : undefined);
  const second = await follow(slug, first.token!);
  const visitors = await prisma.visitor.count({ where: { orgId: A, token: first.token! } });
  const clicks = await prisma.touchpoint.count({ where: { orgId: A, kind: "click", visitor: { token: first.token! } } });
  record("attribution:redirect", "repeat visit reuses the visitor, adds a touchpoint", second.token === first.token && visitors === 1 && clicks === 2 ? "PASS" : "FAIL", `sameToken=${second.token === first.token} visitors=${visitors} clicks=${clicks}`);
  const forged = await follow(slug, "<script>alert(1)</script>");
  record("attribution:redirect", "implausible cookie token replaced, not trusted", !!forged.token && forged.token !== "<script>alert(1)</script>" ? "PASS" : "FAIL", `issued=${forged.token?.slice(0, 8)}…`);
  // Cross-org: the same browser token against Beta's link must produce a Beta-scoped visitor.
  // Tracked links are operator work (attribution.manage); a client admin cannot create one.
  const bLink = await attempt(() => Attribution.createTrackedLinkAction(BETA, null, fd({ label: "beta", destinationUrl: "https://example.test/beta" })));
  const bSlug = bLink.outcome === "ok" ? (bLink.value as { data: { slug: string } }).data.slug : "";
  await follow(bSlug, first.token!);
  const aVis = await prisma.visitor.findFirst({ where: { orgId: A, token: first.token! } });
  const bVis = await prisma.visitor.findFirst({ where: { orgId: fx.beta.id, token: first.token! } });
  record("attribution:redirect", "visitor identity is scoped per org", !!aVis && !!bVis && aVis.id !== bVis.id ? "PASS" : "FAIL", `alpha visitor=${!!aVis} beta visitor=${!!bVis} distinct=${aVis?.id !== bVis?.id}`, aVis && bVis && aVis.id === bVis.id ? "VISITOR-XORG" : undefined);
  await actAs(OPERATOR);
  await Attribution.setTrackedLinkActiveAction(ALPHA, (await prisma.trackedLink.findUnique({ where: { slug } }))!.id, false);
  const retired = await follow(slug);
  record("attribution:redirect", "retired slug → 404 and records nothing", retired.status === 404 && (await prisma.touchpoint.count({ where: { orgId: A, kind: "click" } })) === 3 ? "PASS" : "FAIL", `${retired.status}`);
  const links = await listTrackedLinks(A);
  record("attribution:redirect", "listTrackedLinks reports clicks", links.some((l) => l.slug === slug && (l as { _count?: { touchpoints: number } })._count?.touchpoints === 3) ? "PASS" : "PARTIAL", `${links.map((l) => `${l.slug}:${(l as { _count?: { touchpoints: number } })._count?.touchpoints}`).join(",")}`);

  section("attribution — models and evidence");
  const now = new Date();
  const touches = (ids: (string | null)[]) => ids.map((contentItemId, i) => ({ contentItemId, occurredAt: new Date(now.getTime() - (ids.length - i) * 3600_000), kind: "click" as const, source: "native" as const }));
  const outcome = { id: "o", kind: "booked_call", occurredAt: now, valueMinor: 100_000, evidence: "directly_tracked" as const, inquiryId: "i", visitorId: "v" };
  const three = touches(["c1", "c2", "c3", "c2"]);
  const ft = attribute("first_touch", three as never, outcome as never);
  const lt = attribute("last_touch", three as never, outcome as never);
  const lin = attribute("linear", three as never, outcome as never);
  record("attribution:model", "first touch → c1, last touch → c2", ft.credits[0]?.contentItemId === "c1" && lt.credits[0]?.contentItemId === "c2" ? "PASS" : "FAIL", `first=${ft.credits[0]?.contentItemId} last=${lt.credits[0]?.contentItemId}`);
  const shares = lin.credits.map((c) => c.share);
  record("attribution:model", "linear splits across DISTINCT assets, repeat visit does not double-credit", lin.credits.length === 3 && Math.abs(shares.reduce((a, b) => a + b, 0) - 1) < 1e-9 && lin.credits.reduce((a, c) => a + c.valueMinor, 0) === 100_000 ? "PASS" : "FAIL", `assets=${lin.credits.length} shares=${shares.map((s) => s.toFixed(2)).join("/")} value=${lin.credits.reduce((a, c) => a + c.valueMinor, 0)}`);
  const bio = attribute("linear", touches([null, null]) as never, outcome as never);
  record("attribution:model", "generic bio-link touches (no content) earn NO asset credit", bio.credits.length === 0 ? "PASS" : "FAIL", `credits=${bio.credits.length} reason=${bio.reason ?? ""}`, bio.credits.length > 0 ? "ATTR-BIO" : undefined);
  const mixed = attribute("linear", touches([null, "c9"]) as never, outcome as never);
  record("attribution:model", "bio touch alongside a real one credits only the real one", mixed.credits.length === 1 && mixed.credits[0].contentItemId === "c9" && mixed.credits[0].share === 1 ? "PASS" : "FAIL", `credits=${mixed.credits.map((c) => c.contentItemId).join(",")}`);
  const cov = attributionCoverage([{ evidence: "qualitative_only" }, { evidence: "associated" }, { evidence: "associated" }, { evidence: "buyer_named" }]);
  record("attribution:coverage", `money-per-asset withheld below ${EFFICIENCY_COVERAGE_FLOOR * 100}% defensible`, cov.monetaryAllowed === false && cov.share === 0.25 ? "PASS" : "FAIL", `share=${cov.share} allowed=${cov.monetaryAllowed}`);
  const cov2 = attributionCoverage([{ evidence: "directly_tracked" }, { evidence: "buyer_named" }, { evidence: "associated" }]);
  record("attribution:coverage", "money-per-asset allowed at 2/3 defensible", cov2.monetaryAllowed === true ? "PASS" : "FAIL", `share=${cov2.share?.toFixed(2)}`);

  section("commercial events — evidence cannot be declared into existence");
  const inq = await attempt(() => Pipeline.saveInquiryAction(ALPHA, null, null, fd({ name: "QA Buyer", stage: "inquiry", contentItemId: fx.rows.content.id })));
  const inqId = inq.outcome === "ok" ? (inq.value as { data: { id: string } }).data.id : "";
  record("attribution:events", "inquiry linked to content", inq.outcome === "ok" ? "PASS" : "FAIL", `${inq.outcome}`);
  const noNote = await attempt(() => Attribution.recordCommercialEventAction(ALPHA, null, fd({ kind: "won", value: 12000, source: "manual", inquiryId: inqId })));
  record("attribution:events", "manual monetary figure without a source note refused", noNote.outcome !== "ok" ? "PASS" : "FAIL", `${noNote.outcome}`);
  const declared = await attempt(() => Attribution.recordCommercialEventAction(ALPHA, null, fd({ kind: "booked_call", source: "manual", attribution: "directly_tracked", note: "I just know it was the post." })));
  const declaredRow = declared.outcome === "ok" ? await prisma.commercialEvent.findUnique({ where: { id: (declared.value as { data: { id: string } }).data.id } }) : null;
  record("attribution:events", "directly_tracked cannot be declared with no visitor and no inquiry", !declaredRow || declaredRow.attribution !== "directly_tracked" ? "PASS" : "FAIL", `${declared.outcome} stored=${declaredRow?.attribution ?? "—"}`, declaredRow?.attribution === "directly_tracked" ? "ATTR-DECLARE" : undefined);
  const named = await attempt(() => Attribution.recordCommercialEventAction(ALPHA, null, fd({ kind: "booked_call", source: "manual", attribution: "buyer_named", inquiryId: inqId, note: "Buyer mentioned the post by name." })));
  record("attribution:events", "buyer_named with an inquiry and a note accepted", named.outcome === "ok" ? "PASS" : "FAIL", `${named.outcome}`);
  const dupe = await attempt(() => Attribution.recordCommercialEventAction(ALPHA, null, fd({ kind: "booked_call", source: "manual", attribution: "buyer_named", inquiryId: inqId, note: "Same call, entered twice." })));
  const range = lastNDays(30);
  const aa = await assetAttribution(A, range, "linear");
  record("attribution:events", "duplicate booked_call on one deal counts once in attribution", dupe.outcome === "ok" && aa.outcomes === 1 ? "PASS" : aa.outcomes > 1 ? "FAIL" : "PARTIAL", `events stored=${await prisma.commercialEvent.count({ where: { orgId: A, inquiryId: inqId } })} outcomes considered=${aa.outcomes}`, aa.outcomes > 1 ? "ATTR-DUP" : undefined);
  const journey = await journeyForInquiry(A, inqId);
  record("attribution:journey", "journey assembles touches + outcome for the inquiry", !!journey ? "PASS" : "FAIL", journey ? `touches=${(journey as { touches?: unknown[] }).touches?.length ?? "?"} evidence=${(journey as { outcome?: { evidence?: string } }).outcome?.evidence ?? "?"}` : "null");
  const badKind = await attempt(() => Attribution.recordCommercialEventAction(ALPHA, null, fd({ kind: "jackpot", note: "x" })));
  const negVal = await attempt(() => Attribution.recordCommercialEventAction(ALPHA, null, fd({ kind: "won", value: -50, note: "x" })));
  record("attribution:events", "unknown kind / negative value refused", badKind.outcome !== "ok" && negVal.outcome !== "ok" ? "PASS" : "FAIL", `${badKind.outcome}/${negVal.outcome}`);
  const reported = await attempt(() => Attribution.recordTouchpointAction(ALPHA, null, fd({ kind: "reported", contentItemId: fx.rows.content.id, inquiryId: inqId, note: "" })));
  record("attribution:events", "reported touch without the words refused", reported.outcome !== "ok" ? "PASS" : "FAIL", `${reported.outcome}`);
  const reportedOk = await attempt(() => Attribution.recordTouchpointAction(ALPHA, null, fd({ kind: "reported", contentItemId: fx.rows.content.id, inquiryId: inqId, note: "They said they saw the carve-out post." })));
  const repRow = await prisma.touchpoint.findFirst({ where: { orgId: A, kind: "reported" } });
  record("attribution:events", "reported touch stored as client_reported, never native", reportedOk.outcome === "ok" && repRow?.source === "client_reported" ? "PASS" : "FAIL", `source=${repRow?.source}`);

  section("synthetic data safety");
  await actAs(OPS);
  const before = await portfolioSummary();
  const flip = await attempt(() => Admin.setSyntheticAction(A, true));
  const after = await portfolioSummary();
  record("synthetic", "flagging a workspace synthetic removes it from portfolio totals", flip.outcome === "ok" && after.activeClients === before.activeClients - 1 && after.syntheticWorkspaces === before.syntheticWorkspaces + 1 ? "PASS" : "FAIL", `${flip.outcome} active ${before.activeClients}→${after.activeClients} synthetic ${before.syntheticWorkspaces}→${after.syntheticWorkspaces}`, flip.outcome === "ok" && after.activeClients !== before.activeClients - 1 ? "SYNTH-PORTFOLIO" : undefined);
  await actAs(A_ADMIN);
  const lock = await attempt(() => Proof.lockProofPeriodAction(ALPHA, fx.rows.proof.id));
  const lockedRow = await prisma.proofPeriod.findUnique({ where: { id: fx.rows.proof.id } });
  record("synthetic", "synthetic workspace cannot lock a proof period as final", lock.outcome !== "ok" && !lockedRow?.lockedAt ? "PASS" : "FAIL", `${lock.outcome} ${(lock as { message?: string }).message?.slice(0, 70) ?? ""} lockedAt=${!!lockedRow?.lockedAt}`, lock.outcome === "ok" ? "SYNTH-LOCK" : undefined);
  const pv = await attempt(() => proofView(A));
  record("synthetic", "proof view still readable inside the synthetic workspace", pv.outcome === "ok" ? "PASS" : "FAIL", "the workspace banner (layout) carries the synthetic label; data is not hidden from its own operator");
  await actAs(OPS);
  await Admin.setSyntheticAction(A, false);
}

if (require.main === module) {
  (async () => {
    const fx = await buildFixture();
    try { await runAttribution(fx); } finally { await teardown(); await prisma.$disconnect(); }
  })();
}
