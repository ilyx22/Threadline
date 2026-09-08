import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  assetAttribution,
  byDimension,
  clientAttributionSummary,
  commercialFunnel,
  journeyForInquiry,
  trackingHealth,
} from "./attribution";
import { assertNotSyntheticProof, REAL_CLIENTS_ONLY } from "@/lib/domain/synthetic";
import { WorkflowError } from "@/lib/domain/workflow";

/**
 * The end-to-end attribution scenario, against a real database.
 *
 * One anonymous browser touches two assets a fortnight apart, submits a form,
 * becomes an enquiry, books a call, becomes an opportunity and closes. The
 * three models are then asked what they think, and each has to give the answer
 * a client could check by hand.
 *
 * A second, synthetic workspace exists throughout, and the tests assert it stays
 * out of anything that could be mistaken for real client evidence.
 */

const prisma = new PrismaClient();

const SLUG = "attribution-test-org";
const SYNTH_SLUG = "attribution-test-synthetic";

let orgId = "";
let syntheticOrgId = "";
let assetA = "";
let assetB = "";
let otherOrgAssetId = "";
let visitorId = "";
let inquiryId = "";

const day = (n: number) => new Date(2026, 4, n, 12, 0, 0);

before(async () => {
  await prisma.organization.deleteMany({ where: { slug: { in: [SLUG, SYNTH_SLUG] } } });

  const org = await prisma.organization.create({
    data: { slug: SLUG, name: "Attribution Test", kind: "client", status: "active" },
  });
  orgId = org.id;

  const synthetic = await prisma.organization.create({
    data: {
      slug: SYNTH_SLUG,
      name: "Attribution Dry Run",
      kind: "client",
      status: "active",
      synthetic: true,
      periodFee: 250_000,
    },
  });
  syntheticOrgId = synthetic.id;

  const idea = await prisma.idea.create({
    data: { orgId, title: "Carve-out structures", pillar: "Frameworks", cta: "Book a diagnosis" },
  });

  const a = await prisma.contentItem.create({
    data: { orgId, ideaId: idea.id, title: "Asset A — carve-outs", platform: "linkedin" },
  });
  const b = await prisma.contentItem.create({
    data: { orgId, title: "Asset B — earn-outs", platform: "linkedin" },
  });
  assetA = a.id;
  assetB = b.id;

  // Content in the synthetic workspace, used to prove tenant isolation.
  const other = await prisma.contentItem.create({
    data: { orgId: syntheticOrgId, title: "SYNTHETIC asset", platform: "linkedin" },
  });
  otherOrgAssetId = other.id;

  const link = await prisma.trackedLink.create({
    data: {
      orgId,
      slug: `test-${Date.now()}`,
      label: "Test link",
      destinationUrl: "https://example.com/enquire",
      contentItemId: assetA,
    },
  });

  const visitor = await prisma.visitor.create({
    data: { orgId, token: `test-visitor-${Date.now()}`, firstSeenAt: day(1), lastSeenAt: day(20) },
  });
  visitorId = visitor.id;

  await prisma.touchpoint.createMany({
    data: [
      {
        orgId,
        visitorId,
        trackedLinkId: link.id,
        contentItemId: assetA,
        kind: "click",
        platform: "LinkedIn",
        source: "native",
        occurredAt: day(1),
      },
      {
        orgId,
        visitorId,
        contentItemId: assetB,
        kind: "click",
        source: "native",
        occurredAt: day(14),
      },
      // A repeat click on the same asset.
      {
        orgId,
        visitorId,
        contentItemId: assetB,
        kind: "click",
        source: "native",
        occurredAt: day(15),
      },
      { orgId, visitorId, contentItemId: assetB, kind: "form", source: "native", occurredAt: day(16) },
    ],
  });

  const inquiry = await prisma.inquiry.create({
    data: {
      orgId,
      name: "Test Buyer",
      company: "Buyer Co",
      stage: "won",
      visitorId,
      valueMinor: 1_000_000,
      attribution: "directly_tracked",
      evidenceBasis: "measured",
      occurredAt: day(16),
    },
  });
  inquiryId = inquiry.id;

  await prisma.commercialEvent.createMany({
    data: [
      {
        orgId,
        kind: "inquiry",
        occurredAt: day(16),
        visitorId,
        inquiryId,
        source: "native",
        attribution: "directly_tracked",
        evidenceBasis: "measured",
      },
      {
        orgId,
        kind: "booked_call",
        occurredAt: day(18),
        visitorId,
        inquiryId,
        source: "booking",
        attribution: "directly_tracked",
        evidenceBasis: "measured",
      },
      {
        orgId,
        kind: "won",
        occurredAt: day(20),
        visitorId,
        inquiryId,
        valueMinor: 1_000_000,
        source: "crm",
        attribution: "directly_tracked",
        evidenceBasis: "measured",
      },
    ],
  });
});

after(async () => {
  await prisma.organization.deleteMany({ where: { slug: { in: [SLUG, SYNTH_SLUG] } } });
  await prisma.$disconnect();
});

const range = { start: day(1), end: day(28) };

describe("the journey", () => {
  it("reconstructs the whole chain in order", async () => {
    const journey = await journeyForInquiry(orgId, inquiryId);
    assert.ok(journey);
    const kinds = journey!.steps.map((s) => (s.type === "touch" ? `touch:${s.kind}` : `event:${s.kind}`));
    assert.deepEqual(kinds, [
      "touch:click",
      "touch:click",
      "touch:click",
      "touch:form",
      "event:inquiry",
      "event:booked_call",
      "event:won",
    ]);
  });

  it("gives each model an answer a person could check by hand", async () => {
    const journey = await journeyForInquiry(orgId, inquiryId);
    const byModel = new Map(journey!.models.map((m) => [m.model, m]));
    assert.equal(byModel.get("first_touch")?.title, "Asset A — carve-outs");
    assert.equal(byModel.get("last_touch")?.title, "Asset B — earn-outs");
    // Linear credits both; the journey view names the largest share first.
    assert.ok(byModel.get("linear")?.contentItemId);
  });

  it("carries the evidence class from the event rather than deriving it", async () => {
    const journey = await journeyForInquiry(orgId, inquiryId);
    assert.equal(journey!.evidence, "directly_tracked");
  });

  it("cannot be read from another tenant", async () => {
    assert.equal(await journeyForInquiry(syntheticOrgId, inquiryId), null);
  });
});

describe("asset attribution", () => {
  it("splits the win across the two assets touched", async () => {
    const result = await assetAttribution(orgId, range, "linear");
    assert.equal(result.assets.length, 2);
    assert.equal(
      result.assets.reduce((sum, a) => sum + a.valueMinor, 0),
      1_000_000,
    );
  });

  it("gives the whole win to the first asset under first touch", async () => {
    const result = await assetAttribution(orgId, range, "first_touch");
    assert.equal(result.assets.length, 1);
    assert.equal(result.assets[0].contentItemId, assetA);
    assert.equal(result.assets[0].valueMinor, 1_000_000);
  });

  it("gives it to the last asset under last touch", async () => {
    const result = await assetAttribution(orgId, range, "last_touch");
    assert.equal(result.assets[0].contentItemId, assetB);
  });

  it("carries the strategy metadata the credit is only useful with", async () => {
    const result = await assetAttribution(orgId, range, "first_touch");
    assert.equal(result.assets[0].pillar, "Frameworks");
    assert.equal(result.assets[0].cta, "Book a diagnosis");
  });

  it("never returns another tenant's assets", async () => {
    const result = await assetAttribution(orgId, range, "linear");
    assert.equal(
      result.assets.some((a) => a.contentItemId === otherOrgAssetId),
      false,
    );
  });

  it("allows money because every event here is traceable", async () => {
    const result = await assetAttribution(orgId, range, "linear");
    assert.equal(result.coverage.monetaryAllowed, true);
  });
});

describe("dimensions", () => {
  it("groups assets with no pillar rather than dropping them", async () => {
    const result = await assetAttribution(orgId, range, "linear");
    const rows = byDimension(result.assets, (a) => a.pillar);
    // Asset B has no idea behind it, so it has no pillar — and must still be
    // visible, or the breakdown looks complete while omitting half the output.
    assert.equal(
      rows.reduce((sum, r) => sum + r.assets, 0),
      result.assets.length,
    );
    assert.ok(rows.some((r) => r.label === "Not recorded"));
  });
});

describe("the funnel", () => {
  it("shows only the stages with recorded events", async () => {
    const funnel = await commercialFunnel(orgId, range);
    assert.deepEqual(
      funnel.stages.map((s) => s.kind),
      ["inquiry", "booked_call", "won"],
    );
    assert.equal(funnel.complete, false);
    assert.equal(funnel.clicks, 3);
  });
});

describe("tracking health", () => {
  it("reports the gaps rather than a single pass or fail", async () => {
    const health = await trackingHealth(orgId);
    const byKey = new Map(health.checks.map((c) => [c.key, c]));
    assert.equal(byKey.get("links")?.ok, true);
    assert.equal(byKey.get("events")?.ok, true);
    // No baseline was captured for this workspace.
    assert.equal(byKey.get("baseline")?.ok, false);
    assert.ok(health.score > 0 && health.score < 100);
  });

  it("says missing tracking is missing data, not zero value", async () => {
    const health = await trackingHealth(orgId);
    assert.match(health.summary, /missing data, not as zero commercial value/i);
  });
});

describe("the client summary", () => {
  it("groups by evidence class rather than summing into one figure", async () => {
    const summary = await clientAttributionSummary(orgId, range, (m) => `£${m / 100}`);
    assert.equal(summary.claims.length, 1);
    assert.equal(summary.claims[0].evidence, "directly_tracked");
    assert.match(summary.claims[0].sentence, /directly tracked/i);
  });
});

describe("the synthetic boundary", () => {
  it("refuses a synthetic workspace as proof", () => {
    assert.throws(
      () => assertNotSyntheticProof({ synthetic: true, name: "Attribution Dry Run" }, "a case study"),
      (error: unknown) => {
        assert.ok(error instanceof WorkflowError);
        assert.match(error.message, /synthetic dry run/i);
        assert.match(error.message, /false claim/i);
        return true;
      },
    );
  });

  it("allows a real client through the same gate", () => {
    assert.doesNotThrow(() => assertNotSyntheticProof({ synthetic: false, name: "Real Co" }));
  });

  it("excludes synthetic workspaces from a real-client filter", async () => {
    const real = await prisma.organization.findMany({
      where: { ...REAL_CLIENTS_ONLY, slug: { in: [SLUG, SYNTH_SLUG] } },
      select: { slug: true },
    });
    assert.deepEqual(
      real.map((o) => o.slug),
      [SLUG],
    );
  });

  it("keeps a synthetic fee out of portfolio revenue", async () => {
    const total = await prisma.organization.aggregate({
      where: { ...REAL_CLIENTS_ONLY, slug: { in: [SLUG, SYNTH_SLUG] } },
      _sum: { periodFee: true },
    });
    // The synthetic workspace carries a 250,000 minor-unit fee and must not
    // appear here — a dry run is not revenue.
    assert.equal(total._sum.periodFee ?? 0, 0);
  });
});

describe("one deal, one credited outcome", () => {
  it("does not count an opportunity and its win as two", async () => {
    // The same deal produces a valued opportunity and then a valued win.
    // Crediting both would add pipeline to revenue and describe neither.
    const before = await assetAttribution(orgId, range, "first_touch");

    await prisma.commercialEvent.create({
      data: {
        orgId,
        kind: "opportunity",
        occurredAt: day(19),
        visitorId,
        inquiryId,
        valueMinor: 1_000_000,
        source: "crm",
        attribution: "directly_tracked",
        evidenceBasis: "measured",
      },
    });

    const after = await assetAttribution(orgId, range, "first_touch");
    assert.equal(
      after.assets[0].valueMinor,
      before.assets[0].valueMinor,
      "the same deal must not be credited twice",
    );
    // The furthest-down-funnel event is the one kept.
    assert.equal(after.assets[0].valueMinor, 1_000_000);
  });

  it("keeps events that belong to no lead separate", async () => {
    // Nothing says two unattached events are the same deal, and guessing would
    // be worse than the double count it was avoiding.
    const before = await assetAttribution(orgId, range, "first_touch");
    await prisma.commercialEvent.create({
      data: {
        orgId,
        kind: "opportunity",
        occurredAt: day(19),
        visitorId,
        valueMinor: 200_000,
        source: "manual",
        attribution: "directly_tracked",
        evidenceBasis: "client_reported",
      },
    });
    const after = await assetAttribution(orgId, range, "first_touch");
    assert.equal(after.assets[0].valueMinor, before.assets[0].valueMinor + 200_000);
  });
});
