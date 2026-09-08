import type { PrismaClient } from "@prisma/client";

/**
 * Demo data for attribution and for the synthetic dry run.
 *
 * Two things are seeded here, and the second one matters more than it looks.
 *
 * 1. **A complete attribution chain in the real demo workspace**, so the
 *    operator surface has something to show: tracked links, clicks from the same
 *    browser across two assets, a form, an enquiry, a booking, an opportunity
 *    and a win — with the evidence classes a real journey would actually carry
 *    rather than all of them marked "directly tracked".
 *
 * 2. **A synthetic workspace**, marked with `synthetic: true`, which exercises
 *    the real fulfilment path while being excluded from every portfolio total
 *    and refused wherever proof is used.
 *
 * The evidence spread is deliberately unflattering. Most real commercial
 * signals are influence or correlation; seeding everything as directly tracked
 * would make the demo look like the tracking works better than tracking ever
 * works, and would train whoever reads it to expect the wrong thing.
 */

type SeedContext = {
  prisma: PrismaClient;
  orgId: string;
  operatorId: string;
  /** Content items in the workspace, in seeded order. */
  contentIds: string[];
  inquiryIds: string[];
  daysAgo: (days: number, hour?: number) => Date;
};

export async function seedAttribution(ctx: SeedContext) {
  const { prisma, orgId, operatorId, contentIds, inquiryIds, daysAgo } = ctx;
  if (contentIds.length < 3) return;

  const [assetA, assetB, assetC] = contentIds;

  /* ------------------------------ Tracked links ----------------------------- */

  const links = await Promise.all([
    prisma.trackedLink.create({
      data: {
        orgId,
        slug: "nb7k2x9a",
        label: "Carve-out teardown — LinkedIn caption",
        destinationUrl: "https://example.com/diagnostic",
        contentItemId: assetA,
        platform: "LinkedIn",
        campaign: "Q3 authority",
        createdById: operatorId,
        createdAt: daysAgo(40),
      },
    }),
    prisma.trackedLink.create({
      data: {
        orgId,
        slug: "m4v8qp2r",
        label: "Earn-out explainer — profile bio",
        destinationUrl: "https://example.com/enquire",
        contentItemId: assetB,
        platform: "LinkedIn",
        createdById: operatorId,
        createdAt: daysAgo(32),
      },
    }),
    prisma.trackedLink.create({
      data: {
        orgId,
        slug: "z3h6tw1c",
        label: "Retired — old landing page",
        destinationUrl: "https://example.com/old",
        contentItemId: assetC,
        active: false,
        createdById: operatorId,
        createdAt: daysAgo(60),
      },
    }),
  ]);

  /* ------------------------------- The journey ------------------------------ */

  // One browser, two assets, a fortnight apart. This is the shape the three
  // attribution models actually disagree about, which is the point of seeding it.
  const buyer = await prisma.visitor.create({
    data: {
      orgId,
      token: "seed-visitor-buyer-0001",
      firstSeenAt: daysAgo(38),
      lastSeenAt: daysAgo(12),
    },
  });

  await prisma.touchpoint.createMany({
    data: [
      {
        orgId,
        visitorId: buyer.id,
        trackedLinkId: links[0].id,
        contentItemId: assetA,
        kind: "click",
        platform: "LinkedIn",
        campaign: "Q3 authority",
        referrerHost: "www.linkedin.com",
        source: "native",
        occurredAt: daysAgo(38),
      },
      {
        orgId,
        visitorId: buyer.id,
        trackedLinkId: links[1].id,
        contentItemId: assetB,
        kind: "click",
        platform: "LinkedIn",
        referrerHost: "www.linkedin.com",
        source: "native",
        occurredAt: daysAgo(24),
      },
      // A repeat visit to the same asset. Linear credit must not double-count it.
      {
        orgId,
        visitorId: buyer.id,
        trackedLinkId: links[1].id,
        contentItemId: assetB,
        kind: "click",
        platform: "LinkedIn",
        source: "native",
        occurredAt: daysAgo(22),
      },
      {
        orgId,
        visitorId: buyer.id,
        contentItemId: assetB,
        kind: "form",
        source: "native",
        occurredAt: daysAgo(21),
        note: "Submitted the enquiry form on the diagnostic page.",
      },
    ],
  });

  // A second person who was never tracked, but told us what they had seen.
  // Weaker evidence, recorded as such rather than upgraded to look tidy.
  const named = await prisma.visitor.create({
    data: { orgId, token: "seed-visitor-named-0002", firstSeenAt: daysAgo(19), lastSeenAt: daysAgo(19) },
  });

  await prisma.touchpoint.create({
    data: {
      orgId,
      visitorId: named.id,
      contentItemId: assetA,
      kind: "reported",
      source: "client_reported",
      occurredAt: daysAgo(19),
      note: "Said on the call that the carve-out post was what made them get in touch.",
    },
  });

  /* ---------------------------- Commercial events --------------------------- */

  const primaryInquiry = inquiryIds[0] ?? null;
  const secondInquiry = inquiryIds[1] ?? null;

  if (primaryInquiry) {
    await prisma.inquiry.update({
      where: { id: primaryInquiry },
      data: { visitorId: buyer.id, attribution: "directly_tracked", evidenceBasis: "measured" },
    });
  }
  if (secondInquiry) {
    await prisma.inquiry.update({
      where: { id: secondInquiry },
      data: { visitorId: named.id, attribution: "buyer_named", evidenceBasis: "client_reported" },
    });
  }

  await prisma.commercialEvent.createMany({
    data: [
      {
        orgId,
        kind: "inquiry",
        occurredAt: daysAgo(21),
        visitorId: buyer.id,
        inquiryId: primaryInquiry,
        source: "native",
        evidenceBasis: "measured",
        attribution: "directly_tracked",
        note: "Form submission on the tracked destination.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "booked_call",
        occurredAt: daysAgo(18),
        visitorId: buyer.id,
        inquiryId: primaryInquiry,
        source: "booking",
        evidenceBasis: "measured",
        attribution: "directly_tracked",
        note: "Booking form recorded the tracked link as the source.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "showed",
        occurredAt: daysAgo(15),
        visitorId: buyer.id,
        inquiryId: primaryInquiry,
        source: "manual",
        evidenceBasis: "measured",
        attribution: "directly_tracked",
        note: "Attended.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "opportunity",
        occurredAt: daysAgo(14),
        visitorId: buyer.id,
        inquiryId: primaryInquiry,
        valueMinor: 1_800_000,
        source: "crm",
        externalProvider: "Attio",
        externalRecordId: "opp_seed_0001",
        evidenceBasis: "measured",
        attribution: "directly_tracked",
        note: "Mapped from the CRM opportunity record.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "won",
        occurredAt: daysAgo(6),
        visitorId: buyer.id,
        inquiryId: primaryInquiry,
        valueMinor: 1_800_000,
        source: "crm",
        externalProvider: "Attio",
        externalRecordId: "opp_seed_0001",
        evidenceBasis: "measured",
        attribution: "directly_tracked",
        note: "Closed. Tracked link to booking to CRM record is unbroken.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "inquiry",
        occurredAt: daysAgo(19),
        visitorId: named.id,
        inquiryId: secondInquiry,
        source: "client_reported",
        evidenceBasis: "client_reported",
        attribution: "buyer_named",
        note: "They named the post themselves on the call. No tracked path.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "opportunity",
        occurredAt: daysAgo(11),
        inquiryId: secondInquiry,
        valueMinor: 900_000,
        source: "client_reported",
        evidenceBasis: "client_reported",
        attribution: "multi_touch",
        note: "Content was one of several touches; a referral was also involved.",
        recordedById: operatorId,
      },
      {
        orgId,
        kind: "inquiry",
        occurredAt: daysAgo(9),
        source: "client_reported",
        evidenceBasis: "client_reported",
        attribution: "associated",
        note: "Arrived during the period. No path to content of any kind.",
        recordedById: operatorId,
      },
    ],
  });
}

/* --------------------------- The synthetic dry run -------------------------- */

/**
 * The dry-run workspace.
 *
 * Runs through the real fulfilment path on purpose — that is the whole point of
 * a dry run — and carries the marker that keeps its output out of anything
 * outward-facing.
 */
export async function seedSyntheticWorkspace(
  prisma: PrismaClient,
  operatorId: string,
  daysAgo: (days: number, hour?: number) => Date,
) {
  const org = await prisma.organization.create({
    data: {
      slug: "dryrun",
      name: "Meridian Advisory (dry run)",
      kind: "client",
      status: "onboarding",
      synthetic: true,
      industry: "Corporate finance",
      website: "https://example.com",
      packageTier: "install",
      setupFee: 250_000,
      periodFee: 250_000,
      onboardingStage: "in_progress",
      modulesEnabled: JSON.stringify(["intelligence", "create", "production", "distribution"]),
      supportNotes:
        "Synthetic dry run. A real company used as a public-information reference, treated as an imaginary client to find out what delivery is actually missing before a paying client finds out for us.",
      startedAt: daysAgo(9),
      lastActivityAt: daysAgo(1),
    },
  });

  await prisma.membership.create({
    data: { userId: operatorId, orgId: org.id, role: "internal_operator" },
  });

  // Delivery Load on the work the dry run has actually produced so far. The
  // friction is deliberate: a perfect laboratory case would teach us nothing.
  await prisma.task.createMany({
    data: [
      {
        orgId: org.id,
        title: "Build the Brand Brain from public sources",
        description: "Website, founder content, published deals, three competitor sites.",
        kind: "review",
        audience: "internal",
        status: "done",
        priority: "high",
        activeMinutes: 165,
        waitingMinutes: 0,
        costMinor: 0,
        workClass: "becomes_sop",
        loadNote:
          "Longer than expected. Most of the time went on deciding what was actually load-bearing, which is exactly the part an SOP should decide in advance.",
        completedAt: daysAgo(7),
        createdAt: daysAgo(8),
      },
      {
        orgId: org.id,
        title: "Draft the first six scripts",
        kind: "review",
        audience: "internal",
        status: "done",
        priority: "high",
        activeMinutes: 210,
        waitingMinutes: 0,
        costMinor: 0,
        workClass: "ai_assisted",
        loadNote:
          "Machine drafted, operator rewrote roughly half. The rewriting is the judgement; the drafting is not.",
        completedAt: daysAgo(5),
        createdAt: daysAgo(7),
      },
      {
        orgId: org.id,
        title: "Chase the missing brand assets",
        kind: "ops",
        audience: "internal",
        status: "open",
        priority: "medium",
        activeMinutes: 20,
        waitingMinutes: 2880,
        costMinor: 0,
        workClass: "delegatable",
        loadNote:
          "Twenty minutes of work spread across two days of waiting. This is the friction a real client will produce constantly, and it is not fixed by working faster.",
        createdAt: daysAgo(4),
      },
      {
        orgId: org.id,
        title: "Re-record: first take was unusable",
        description:
          "Audio picked up building work throughout. Caught at QA rather than at the recording readiness check, which is the gap worth fixing.",
        kind: "record",
        audience: "internal",
        status: "open",
        priority: "high",
        activeMinutes: 45,
        waitingMinutes: 0,
        costMinor: 0,
        workClass: "founder_only",
        loadNote:
          "The readiness check passed the room and the recording still failed. The check is testing the wrong thing.",
        createdAt: daysAgo(2),
      },
    ],
  });

  return org;
}
