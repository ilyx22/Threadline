/**
 * Threadline OS — database seed.
 *
 * Produces:
 *   - the internal Threadline organisation, with staff accounts and the SOP library
 *   - Northbeam Advisory: a complete, coherent demo workspace
 *   - Lumenpath Studio: a second tenant, which exists so tenant isolation can be
 *     demonstrated and tested rather than asserted
 *   - inbound applications and Threadline's own business metrics
 *
 * Idempotent: safe to run repeatedly. Existing demo organisations are removed
 * and rebuilt so the demo is always in a known state.
 *
 * Run with: npm run seed
 */

import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { ideaPriority, patternScore } from "../src/lib/domain/scoring";
import { computeWeeklyReport, weekRangeFor } from "../src/lib/reports/weekly";
import { INTEGRATIONS } from "../src/lib/integrations/registry";
import { SOP_TEMPLATES } from "../src/lib/templates/master";
import {
  COMPANY,
  COMPETITORS,
  CONTENT_RULES,
  FOUNDER,
  ICP,
  IDEAS,
  OFFER,
  PATTERNS,
  PROOF,
  RESEARCH,
  VOICE,
} from "./seed/northbeam";
import { seedIntelligence } from "./seed/intelligence";
import { seedAcquisition } from "./seed/acquisition";
import { seedAttribution, seedSyntheticWorkspace } from "./seed/attribution";
import { seedCorpus } from "./seed/corpus";
import { seedLearning } from "./seed/learning";
import { SCRIPTS } from "./seed/scripts";
import { RECORDING_QUEUE_SCRIPTS } from "./seed/recording-queue";

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "threadline-demo-2026";

const DAY = 86_400_000;
const now = new Date();

function daysAgo(days: number, hour = 10) {
  const d = new Date(now.getTime() - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysAhead(days: number, hour = 10) {
  return daysAgo(-days, hour);
}

/** Deterministic pseudo-random so reseeding produces the same demo. */
let seedState = 20260902;
function rand() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)] as T;
}

async function main() {
  console.log("Seeding Threadline OS…\n");

  await reset();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  /* ------------------------------ Internal org ----------------------------- */

  const threadline = await prisma.organization.create({
    data: {
      slug: "threadline",
      name: "Threadline",
      kind: "internal",
      status: "active",
      currency: "GBP",
      industry: "Founder content operating systems",
      startedAt: daysAgo(400),
      lastActivityAt: now,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: "ops@threadline.com",
      name: "Sam Ellery",
      title: "Founder, Threadline",
      passwordHash,
      avatarHue: 42,
      isSuperAdmin: true,
      lastSeenAt: daysAgo(0, 9),
    },
  });

  const operator = await prisma.user.create({
    data: {
      email: "operator@threadline.com",
      name: "Nadia Whitfield",
      title: "Client operator",
      passwordHash,
      avatarHue: 268,
      lastSeenAt: daysAgo(0, 8),
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: superAdmin.id, orgId: threadline.id, role: "super_admin", isPrimary: true },
      { userId: operator.id, orgId: threadline.id, role: "internal_operator", isPrimary: true },
    ],
  });

  console.log("· Internal organisation and staff accounts");

  /* --------------------------------- SOPs ---------------------------------- */

  for (const sop of SOP_TEMPLATES) {
    await prisma.sopDocument.create({
      data: {
        key: sop.key,
        title: sop.title,
        category: sop.category,
        summary: sop.summary,
        body: sop.body,
        version: 1,
        updatedById: superAdmin.id,
      },
    });
  }
  console.log(`· ${SOP_TEMPLATES.length} SOP documents`);

  /* ------------------------------- Northbeam ------------------------------- */

  const org = await prisma.organization.create({
    data: {
      slug: COMPANY.slug,
      name: COMPANY.name,
      kind: "client",
      status: "active",
      packageTier: "operate",
      onboardingStage: "complete",
      industry: COMPANY.industry,
      website: COMPANY.website,
      geography: COMPANY.geography,
      currency: COMPANY.currency,
      timezone: COMPANY.timezone,
      // Threadline's launch offer: GBP 2,500 implementation, GBP 2,500 a month,
      // 12-week initial engagement = three four-week service periods. One offer, no tiers.
      setupFee: 250_000,
      periodFee: 250_000,
      healthScore: 86,
      modulesEnabled: JSON.stringify([
        "intelligence",
        "create",
        "production",
        "distribution",
        "performance",
        "pipeline",
        "library",
        "reports",
      ]),
      supportNotes:
        "Alex prefers async over calls. Records in batches on Monday mornings. Do not schedule anything before 10am UK.",
      startedAt: daysAgo(118),
      lastActivityAt: daysAgo(0, 9),
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: FOUNDER.email,
      name: FOUNDER.name,
      title: FOUNDER.title,
      passwordHash,
      avatarHue: 205,
      lastSeenAt: daysAgo(0, 9),
    },
  });

  const strategist = await prisma.user.create({
    data: {
      email: "jordan@northbeamadvisory.com",
      name: "Jordan Blake",
      title: "Consultant",
      passwordHash,
      avatarHue: 158,
      lastSeenAt: daysAgo(1),
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: "editor@threadline.com",
      name: "Mira Kovač",
      title: "Editor",
      passwordHash,
      avatarHue: 22,
      lastSeenAt: daysAgo(0, 11),
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: alex.id, orgId: org.id, role: "client_admin", isPrimary: true },
      { userId: strategist.id, orgId: org.id, role: "client_member" },
      { userId: editor.id, orgId: org.id, role: "editor" },
      { userId: operator.id, orgId: org.id, role: "internal_operator" },
    ],
  });

  console.log("· Northbeam Advisory workspace and members");

  /* ------------------------------ Brand Brain ------------------------------ */

  await prisma.brandBrain.create({
    data: {
      orgId: org.id,
      company: JSON.stringify({
        description: COMPANY.description,
        website: COMPANY.website,
        category: COMPANY.industry,
        geography: COMPANY.geography,
        products: [
          "The Sales Operating System — twelve-week installation",
          "Forecast diagnostic — two-week standalone audit",
          "Quarterly operating review — for past clients",
        ],
        teamSize: COMPANY.teamSize,
        revenueRange: COMPANY.revenueRange,
      }),
      founder: JSON.stringify({
        name: FOUNDER.name,
        title: FOUNDER.title,
        bio: FOUNDER.bio,
        experience: FOUNDER.experience,
        beliefs: FOUNDER.beliefs,
        opinions: FOUNDER.opinions,
        stories: FOUNDER.stories,
        credentials: FOUNDER.credentials,
        approvedAnecdotes: FOUNDER.stories,
      }),
      voice: JSON.stringify({
        tone: VOICE.tone,
        vocabulary: VOICE.vocabulary,
        sentenceStructure: VOICE.sentenceStructure,
        humour: VOICE.humour,
        phrasesUsed: VOICE.phrasesUsed,
        phrasesAvoided: VOICE.phrasesAvoided,
        soundsLikeMe: VOICE.soundsLikeMe,
        notMe: VOICE.notMe,
      }),
      contentRules: JSON.stringify(CONTENT_RULES),
      completeness: 92,
    },
  });

  await prisma.offer.create({
    data: {
      orgId: org.id,
      name: OFFER.name,
      isPrimary: true,
      priceMinor: OFFER.price * 100,
      currency: COMPANY.currency,
      priceModel: OFFER.priceModel,
      mechanism: OFFER.mechanism,
      outcome: OFFER.outcome,
      differentiators: JSON.stringify(OFFER.differentiators),
      guarantees: OFFER.guarantee,
      ctas: JSON.stringify(OFFER.ctas),
      exclusions: OFFER.exclusions,
    },
  });

  await prisma.offer.create({
    data: {
      orgId: org.id,
      name: "Forecast diagnostic",
      priceMinor: 250_000,
      currency: COMPANY.currency,
      priceModel: "one_off",
      mechanism:
        "A two-week audit. Call recordings, closed-lost analysis and a written finding on the structural cause of forecast variance. No implementation.",
      outcome: "A specific, evidenced answer to why the forecast is wrong.",
      differentiators: JSON.stringify([
        "Fixed two weeks",
        "Written finding, not a workshop",
        "Fee credited against a full engagement",
      ]),
      ctas: JSON.stringify(["The diagnostic is the place to start if you are not sure yet."]),
    },
  });

  await prisma.icpProfile.create({
    data: {
      orgId: org.id,
      name: ICP.name,
      isPrimary: true,
      description: ICP.description,
      firmographics: ICP.firmographics,
      pains: JSON.stringify(ICP.pains),
      desires: JSON.stringify(ICP.desires),
      objections: JSON.stringify(ICP.objections),
      triggers: JSON.stringify(ICP.triggers),
      sophistication: ICP.sophistication,
    },
  });

  await prisma.icpProfile.create({
    data: {
      orgId: org.id,
      name: "Secondary: PE-backed B2B services, £5m–£15m",
      description:
        "Occasionally taken on. Larger, slower, and the founder is usually not the seller. Lower fit but higher deal value.",
      firmographics: "£5m–£15m revenue, private-equity backed, existing sales leadership in place.",
      pains: JSON.stringify([
        "Sales leadership and board disagree on forecast methodology",
        "Reporting is manual and contested",
      ]),
      desires: JSON.stringify(["A forecast the board accepts without argument"]),
      objections: JSON.stringify(["We already have a CRO", "Procurement will take three months"]),
      triggers: JSON.stringify(["New CFO", "Board pressure on forecast accuracy"]),
      sophistication: "high",
    },
  });

  for (const proof of PROOF) {
    await prisma.proofItem.create({
      data: {
        orgId: org.id,
        kind: proof.kind,
        title: proof.title,
        body: proof.body ?? null,
        source: proof.source ?? null,
        metricLabel: proof.metricLabel ?? null,
        metricValue: proof.metricValue ?? null,
        claimStatus: proof.claimStatus,
      },
    });
  }

  console.log("· Brand Brain, offers, audiences and proof");

  /* ------------------------------ Market Radar ----------------------------- */

  const competitorIds = new Map<string, string>();
  for (const competitor of COMPETITORS) {
    const record = await prisma.competitor.create({
      data: {
        orgId: org.id,
        name: competitor.name,
        url: competitor.url ?? null,
        platforms: JSON.stringify(competitor.platforms),
        positioning: competitor.positioning,
        notes: competitor.notes,
        threatLevel: competitor.threatLevel,
      },
    });
    competitorIds.set(competitor.name, record.id);
  }

  const tagIds = new Map<string, string>();
  async function tagId(name: string) {
    const key = name.trim().toLowerCase();
    if (tagIds.has(key)) return tagIds.get(key) as string;
    const tag = await prisma.tag.create({
      data: { orgId: org.id, name: key, kind: key.replace(/-/g, "_") },
    });
    tagIds.set(key, tag.id);
    return tag.id;
  }

  const researchIds: string[] = [];
  const researchByTitle = new Map<string, string>();

  for (const [index, item] of RESEARCH.entries()) {
    const record = await prisma.researchItem.create({
      data: {
        orgId: org.id,
        kind: item.kind,
        title: item.title,
        body: item.body ?? null,
        sourceName: item.sourceName ?? null,
        platform: item.platform ?? null,
        competitorId: item.competitor ? (competitorIds.get(item.competitor) ?? null) : null,
        metrics: JSON.stringify(item.metrics ?? {}),
        capturedAt: daysAgo(90 - index * 3),
        collectedVia: "seed",
      },
    });
    researchIds.push(record.id);
    researchByTitle.set(item.title, record.id);

    for (const tag of item.tags) {
      await prisma.researchItemTag.create({
        data: { researchItemId: record.id, tagId: await tagId(tag) },
      });
    }
  }

  console.log(`· ${RESEARCH.length} research items, ${COMPETITORS.length} competitors, ${tagIds.size} tags`);

  /* -------------------------------- Signals -------------------------------- */

  const patternIds = new Map<string, string>();
  for (const [index, pattern] of PATTERNS.entries()) {
    const record = await prisma.pattern.create({
      data: {
        orgId: org.id,
        kind: pattern.kind,
        title: pattern.title,
        description: pattern.description,
        status: pattern.status,
        confidence: pattern.confidence,
        impact: pattern.impact,
        effort: pattern.effort,
        score: patternScore(pattern),
        nextExperiment: pattern.nextExperiment,
        detectedBy: pattern.detectedBy,
        createdAt: daysAgo(60 - index * 5),
        updatedAt: daysAgo(Math.max(1, 20 - index * 2)),
      },
    });
    patternIds.set(pattern.title, record.id);

    // Attach real research as evidence.
    const evidence = researchIds.slice(index * 2, index * 2 + 2);
    for (const researchItemId of evidence) {
      await prisma.patternEvidence.create({
        data: { patternId: record.id, researchItemId, note: "Supporting research" },
      });
    }
  }

  console.log(`· ${PATTERNS.length} signals with evidence`);

  /* --------------------------- Recording readiness ------------------------- */

  const readiness = await prisma.recordingReadiness.create({
    data: {
      orgId: org.id,
      status: "ready_with_limitation",
      formats: JSON.stringify(["vertical_short"]),
      roomNotes:
        "Home office, second bedroom. Window on the left, white wall behind the desk. Boiler cuts in every twenty minutes or so and is audible on quiet takes.",
      gearNotes:
        "iPhone 14 Pro on a small desk tripod, wired lavalier, one desk lamp. No dedicated key light.",
      recommendation:
        "Everything else is good enough to publish from. The boiler is the only real constraint: it is intermittent, so it does not block recording, but it does mean takes occasionally have to be redone. Batching before 10am avoids it entirely.",
      clientAction:
        "Record before 10am where you can. If the boiler starts mid-take, stop and restart the sentence rather than pushing through — it is much cheaper than fixing it in the edit.",
      submittedAt: daysAgo(114),
      reviewedAt: daysAgo(113),
      reviewedById: operator.id,
      createdAt: daysAgo(114),
    },
  });

  await prisma.readinessCheck.createMany({
    data: [
      {
        readinessId: readiness.id,
        key: "audio",
        state: "limitation",
        note: "Lavalier is clean and close. Intermittent boiler noise in the background on about one take in six.",
      },
      {
        readinessId: readiness.id,
        key: "light",
        state: "ok",
        note: "Window light from the front-left, single desk lamp filling the other side. Even, no colour cast.",
      },
      {
        readinessId: readiness.id,
        key: "framing",
        state: "ok",
        note: "Phone on a tripod at eye level, framed for vertical with correct headroom.",
      },
      {
        readinessId: readiness.id,
        key: "background",
        state: "ok",
        note: "Plain wall, nothing distracting or dated in shot.",
      },
      {
        readinessId: readiness.id,
        key: "focus_stability",
        state: "ok",
        note: "Focus locked before each take, tripod is stable. No drift across a two-minute take.",
      },
      {
        readinessId: readiness.id,
        key: "repeatability",
        state: "ok",
        note: "Alex sets this up alone in about four minutes. Marked positions on the desk for the tripod.",
      },
      {
        readinessId: readiness.id,
        key: "format",
        state: "ok",
        note: "Vertical short-form only, which matches the platforms in scope. No long-form need.",
      },
    ],
  });

  await prisma.asset.createMany({
    data: [
      {
        orgId: org.id,
        category: "setup_photo",
        title: "Room, wide",
        description: "Desk against the window wall, tripod position marked.",
        externalUrl: "https://files.example.com/northbeam/setup-wide.jpg",
        uploadedById: alex.id,
        createdAt: daysAgo(114),
      },
      {
        orgId: org.id,
        category: "test_clip",
        title: "Thirty second test take",
        description: "Alex talking normally, no script, boiler audible from about 0:18.",
        externalUrl: "https://files.example.com/northbeam/test-take.mp4",
        uploadedById: alex.id,
        createdAt: daysAgo(114),
      },
    ],
  });

  console.log("· Recording setup assessed (ready with one named limitation)");


  /* ---------------- Intelligence cycles, diagnosis, proof ------------------ */

  const intel = await seedIntelligence({
    prisma,
    orgId: org.id,
    operatorId: operator.id,
    founderId: alex.id,
    researchIds,
    daysAgo,
  });

  console.log(
    `· ${intel.runs} intelligence cycles (${intel.evidence} evidence items, ${intel.candidates} candidates, ${intel.approved} approved, ${intel.tests} tests)`,
  );
  console.log("· Constraint diagnosis with all nine dimensions rated");
  console.log(`· ${intel.proofPeriods} proof periods (baseline plus months)`);

  /* --------------------------------- Ideas --------------------------------- */

  const ideaIds = new Map<string, string>();
  for (const [index, idea] of IDEAS.entries()) {
    const scores = {
      noveltyScore: idea.scores.novelty,
      relevanceScore: idea.scores.relevance,
      proofStrength: idea.scores.proof,
      formatFit: idea.scores.fit,
      commercialIntent: idea.commercialIntent,
    };

    const record = await prisma.idea.create({
      data: {
        orgId: org.id,
        title: idea.title,
        concept: idea.concept,
        audience: ICP.name,
        painDesire: pickOne(ICP.pains),
        pillar: idea.pillar,
        platform: idea.platform,
        format: idea.format,
        angle: idea.angle,
        hookConcept: idea.hookConcept,
        objective: idea.objective,
        cta: idea.cta,
        commercialIntent: idea.commercialIntent,
        noveltyScore: scores.noveltyScore,
        relevanceScore: scores.relevanceScore,
        proofStrength: scores.proofStrength,
        formatFit: scores.formatFit,
        priorityScore: ideaPriority(scores),
        status: idea.status,
        rationale: idea.rationale,
        source: index % 3 === 0 ? "ai" : index % 5 === 0 ? "learning" : "manual",
        patternId:
          index < 4
            ? (patternIds.get(PATTERNS[index % PATTERNS.length]!.title) ?? null)
            : null,
        createdById: index % 4 === 0 ? alex.id : strategist.id,
        createdAt: daysAgo(85 - index * 2),
      },
    });
    ideaIds.set(idea.title, record.id);

    // Evidence links, so lineage resolves for the demo.
    const evidence = [researchIds[index % researchIds.length], researchIds[(index + 7) % researchIds.length]];
    for (const researchItemId of new Set(evidence)) {
      if (!researchItemId) continue;
      await prisma.ideaEvidence.create({
        data: { ideaId: record.id, researchItemId, note: "Source evidence" },
      });
    }
  }

  console.log(`· ${IDEAS.length} ideas with evidence links`);

  /* -------------------------------- Scripts -------------------------------- */

  const scriptIds = new Map<string, string>();
  const allScripts = [...SCRIPTS, ...RECORDING_QUEUE_SCRIPTS];
  for (const [index, script] of allScripts.entries()) {
    const record = await prisma.script.create({
      data: {
        orgId: org.id,
        ideaId: ideaIds.get(script.ideaTitle) ?? null,
        title: script.title,
        scriptType: script.scriptType,
        platform: script.platform,
        qaState: script.qaState,
        estimatedSeconds: script.estimatedSeconds,
        claimsVerified: script.claims.every((c) => c.status !== "unverified"),
        approvedAt: script.qaState === "approved" ? daysAgo(30 - index * 3) : null,
        createdAt: daysAgo(40 - index * 3),
        updatedAt: daysAgo(Math.max(1, 28 - index * 3)),
      },
    });
    scriptIds.set(script.title, record.id);

    let version = 0;
    for (const past of script.history ?? []) {
      version += 1;
      await prisma.scriptVersion.create({
        data: {
          scriptId: record.id,
          version,
          hook: past.hook,
          altHooks: JSON.stringify([]),
          body: past.body,
          cta: script.cta,
          filmingNotes: null,
          claims: JSON.stringify([]),
          contextUsed: JSON.stringify(["CLIENT_CONTEXT", "FOUNDER_VOICE", "OFFER_CONTEXT"]),
          changeSummary: past.changeSummary,
          generatedBy: past.generatedBy,
          createdById: strategist.id,
          createdAt: daysAgo(40 - index * 3 - (2 - version)),
        },
      });
    }

    version += 1;
    await prisma.scriptVersion.create({
      data: {
        scriptId: record.id,
        version,
        hook: script.hook,
        altHooks: JSON.stringify(script.altHooks),
        body: script.body,
        cta: script.cta,
        filmingNotes: script.filmingNotes,
        claims: JSON.stringify(
          script.claims.map((c) => ({
            id: randomUUID(),
            text: c.text,
            status: c.status,
            note: c.note,
          })),
        ),
        contextUsed: JSON.stringify([
          "CLIENT_CONTEXT",
          "FOUNDER_VOICE",
          "OFFER_CONTEXT",
          "ICP_CONTEXT",
          "MARKET_CONTEXT",
          "PERFORMANCE_CONTEXT",
        ]),
        changeSummary: script.history?.length ? "Final review pass" : "Generated from idea",
        generatedBy: script.history?.length ? "human" : "ai",
        createdById: index % 2 === 0 ? alex.id : strategist.id,
        createdAt: daysAgo(Math.max(1, 28 - index * 3)),
      },
    });

    await prisma.script.update({
      where: { id: record.id },
      data: { currentVersion: version },
    });
  }

  console.log(
    `· ${allScripts.length} scripts with version history (${RECORDING_QUEUE_SCRIPTS.length} awaiting recording)`,
  );

  /* ---------------------- Content items across all stages ------------------- */

  const publishedTitles = [
    "The £480k forecast that closed at £120k",
    "You do not have a lead problem",
    "The hidden cost of hiring an SDR too early",
    "Why your closed-lost data is useless",
  ];

  type ContentPlan = {
    title: string;
    stage: string;
    scriptTitle?: string;
    ideaTitle?: string;
    platform: string;
    format: string;
    daysAgoCreated: number;
    priority?: string;
    dueInDays?: number;
    published?: { daysAgo: number; views: number; retention: number; leads: number; calls: number };
  };

  const plan: ContentPlan[] = [
    // Live, with performance
    {
      title: "The £480k forecast that closed at £120k",
      stage: "live",
      scriptTitle: "The £480k forecast that closed at £120k",
      ideaTitle: "The £480k forecast that closed at £120k",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 34,
      published: { daysAgo: 22, views: 187_000, retention: 61, leads: 5, calls: 2 },
    },
    {
      title: "You do not have a lead problem",
      stage: "live",
      scriptTitle: "You do not have a lead problem",
      ideaTitle: "You do not have a lead problem",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 28,
      published: { daysAgo: 15, views: 96_400, retention: 58, leads: 4, calls: 2 },
    },
    {
      title: "The hidden cost of hiring an SDR too early",
      stage: "live",
      scriptTitle: "The hidden cost of hiring an SDR too early",
      ideaTitle: "The hidden cost of hiring an SDR too early",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 21,
      published: { daysAgo: 9, views: 124_800, retention: 55, leads: 3, calls: 1 },
    },
    {
      title: "Why your closed-lost data is useless",
      stage: "live",
      scriptTitle: "Why your closed-lost data is useless",
      ideaTitle: "Why every closed-lost reason in your CRM is wrong",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 26,
      published: { daysAgo: 12, views: 64_000, retention: 49, leads: 4, calls: 2 },
    },
    {
      title: "Five questions to qualify a deal",
      stage: "live",
      platform: "linkedin",
      format: "text_post",
      daysAgoCreated: 48,
      published: { daysAgo: 38, views: 9_400, retention: 0, leads: 0, calls: 0 },
    },
    {
      title: "What a good discovery call actually ends with",
      stage: "live",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 44,
      published: { daysAgo: 31, views: 41_300, retention: 52, leads: 1, calls: 0 },
    },
    {
      title: "The forecast question your board will ask next",
      stage: "live",
      platform: "linkedin",
      format: "text_post",
      daysAgoCreated: 40,
      published: { daysAgo: 27, views: 22_700, retention: 0, leads: 1, calls: 1 },
    },
    {
      title: "Why your best rep leaving breaks the forecast",
      stage: "live",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 37,
      published: { daysAgo: 19, views: 58_200, retention: 47, leads: 0, calls: 0 },
    },
    {
      title: "Three quarters of misses is not bad luck",
      stage: "live",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 33,
      published: { daysAgo: 5, views: 33_900, retention: 54, leads: 2, calls: 1 },
    },
    {
      title: "What I look for in the first ten minutes of a call recording",
      stage: "live",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 14,
      published: { daysAgo: 2, views: 28_400, retention: 51, leads: 0, calls: 0 },
    },
    {
      title: "Nobody agrees what qualified means",
      stage: "live",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 12,
      published: { daysAgo: 1, views: 19_600, retention: 56, leads: 1, calls: 0 },
    },
    // Prior-period history, so the 30-day comparison has a real baseline.
    {
      title: "The forecast is a list of deals you feel good about",
      stage: "live",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 62,
      published: { daysAgo: 52, views: 71_200, retention: 53, leads: 2, calls: 1 },
    },
    {
      title: "Stop asking your reps to be disciplined",
      stage: "live",
      platform: "linkedin",
      format: "text_post",
      daysAgoCreated: 58,
      published: { daysAgo: 47, views: 34_800, retention: 0, leads: 1, calls: 0 },
    },
    {
      title: "The two-week diagnostic, explained",
      stage: "live",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 55,
      published: { daysAgo: 44, views: 46_100, retention: 48, leads: 2, calls: 1 },
    },
    {
      title: "Why single-threaded deals die late",
      stage: "live",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 52,
      published: { daysAgo: 41, views: 58_900, retention: 57, leads: 1, calls: 0 },
    },
    {
      title: "Your CRM is not the problem",
      stage: "live",
      platform: "linkedin",
      format: "text_post",
      daysAgoCreated: 74,
      published: { daysAgo: 66, views: 27_300, retention: 0, leads: 0, calls: 0 },
    },
    {
      title: "Eleven years of running sales teams, in four rules",
      stage: "live",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 80,
      published: { daysAgo: 72, views: 88_400, retention: 59, leads: 3, calls: 1 },
    },
    // Scheduled
    {
      title: "Your pipeline stages are named after the wrong thing",
      stage: "scheduled",
      scriptTitle: "Your pipeline stages are named after the wrong thing",
      ideaTitle: "Your sales stages describe your activity, not their commitment",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 12,
      dueInDays: 2,
      priority: "high",
    },
    {
      title: "What happens when your fractional CRO leaves",
      stage: "scheduled",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 14,
      dueInDays: 4,
    },
    {
      title: "The two SDRs I told a client to let go",
      stage: "scheduled",
      ideaTitle: "The two SDRs I told a client to let go",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 16,
      dueInDays: 6,
      priority: "high",
    },
    // Approved
    {
      title: "The founder should be last in the deal",
      stage: "approved",
      scriptTitle: "The founder should be last in the deal",
      ideaTitle: "The founder should be last in the deal, not first",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 10,
      dueInDays: 3,
    },
    {
      title: "\"We tried a consultant and got a slide deck\"",
      stage: "approved",
      ideaTitle: "\"We tried a consultant and got a slide deck\"",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 9,
      dueInDays: 5,
    },
    // In review — these are what the founder sees on Home
    {
      title: "A forecast wrong in a predictable direction",
      stage: "in_review",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 8,
      dueInDays: 1,
      priority: "high",
    },
    {
      title: "When should you hire your first AE?",
      stage: "in_review",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 7,
      dueInDays: 1,
    },
    {
      title: "The deal I lost at 90%",
      stage: "in_review",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 7,
      dueInDays: 2,
      priority: "high",
    },
    {
      title: "Pipeline hygiene is not a discipline problem",
      stage: "in_review",
      platform: "linkedin",
      format: "text_post",
      daysAgoCreated: 6,
      dueInDays: 2,
    },
    {
      title: "Single-threaded deals are expensive",
      stage: "in_review",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 6,
      dueInDays: 3,
    },
    {
      title: "What 'qualified' means when nobody has defined it",
      stage: "in_review",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 5,
      dueInDays: 3,
    },
    // Changes requested
    {
      title: "How long should a sales cycle be?",
      stage: "changes_requested",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 11,
      dueInDays: 1,
      priority: "high",
    },
    // Editing
    {
      title: "The first thing I look at in a call recording",
      stage: "editing",
      platform: "youtube_shorts",
      format: "short_form",
      daysAgoCreated: 5,
      dueInDays: 4,
    },
    {
      title: "The eighteen months of reports that said everything was fine",
      stage: "editing",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 4,
      dueInDays: 5,
    },
    {
      title: "Founders returning from holiday to a stalled pipeline",
      stage: "editing",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 4,
      dueInDays: 6,
    },
    // Raw — recorded, awaiting edit
    {
      title: "Your best AE leaving should not collapse the forecast",
      stage: "raw",
      platform: "linkedin",
      format: "talking_head",
      daysAgoCreated: 2,
      dueInDays: 7,
    },
    {
      title: "The twelve-week handover nobody offers",
      stage: "raw",
      platform: "linkedin",
      format: "text_post",
      daysAgoCreated: 2,
      dueInDays: 8,
    },
  ];

  const contentIds = new Map<string, string>();
  const publishRecordIds = new Map<string, string>();

  for (const item of plan) {
    const createdAt = daysAgo(item.daysAgoCreated);
    const isLive = item.stage === "live";
    const publishedAt = item.published ? daysAgo(item.published.daysAgo) : null;

    const content = await prisma.contentItem.create({
      data: {
        orgId: org.id,
        ideaId: item.ideaTitle ? (ideaIds.get(item.ideaTitle) ?? null) : null,
        scriptId: item.scriptTitle ? (scriptIds.get(item.scriptTitle) ?? null) : null,
        title: item.title,
        selectedHook: item.scriptTitle
          ? (allScripts.find((s) => s.title === item.scriptTitle)?.hook ?? null)
          : null,
        stage: item.stage,
        platform: item.platform,
        format: item.format,
        priority: item.priority ?? "medium",
        dueDate: item.dueInDays != null ? daysAhead(item.dueInDays) : null,
        editorId: ["raw"].includes(item.stage) ? null : editor.id,
        founderId: alex.id,
        revisionCount: item.stage === "changes_requested" ? 1 : rand() > 0.7 ? 1 : 0,
        recordedAt: item.stage === "raw" ? daysAgo(item.daysAgoCreated - 1) : createdAt,
        approvedAt: ["approved", "scheduled", "live"].includes(item.stage)
          ? daysAgo(Math.max(1, item.daysAgoCreated - 3))
          : null,
        approvedById: ["approved", "scheduled", "live"].includes(item.stage) ? alex.id : null,
        liveAt: publishedAt,
        createdAt,
        updatedAt: daysAgo(Math.max(0, item.daysAgoCreated - 4)),
      },
    });
    contentIds.set(item.title, content.id);

    // Event timeline
    const stageOrder = ["raw", "editing", "in_review", "approved", "scheduled", "live"];
    const targetIndex = stageOrder.indexOf(item.stage === "changes_requested" ? "in_review" : item.stage);
    let eventDay = item.daysAgoCreated;

    for (let i = 0; i <= Math.max(0, targetIndex); i++) {
      const stage = stageOrder[i] as string;
      await prisma.contentEvent.create({
        data: {
          orgId: org.id,
          contentItemId: content.id,
          type: i === 0 ? "stage_change" : "stage_change",
          fromStage: i === 0 ? null : (stageOrder[i - 1] as string),
          toStage: stage,
          note: i === 0 ? "Sent to recording from the script engine" : null,
          actorId: stage === "approved" ? alex.id : stage === "editing" ? editor.id : alex.id,
          createdAt: daysAgo(Math.max(0, eventDay)),
        },
      });
      eventDay = Math.max(0, eventDay - 2);
    }

    if (item.stage === "changes_requested") {
      await prisma.contentEvent.create({
        data: {
          orgId: org.id,
          contentItemId: content.id,
          type: "revision_requested",
          fromStage: "in_review",
          toStage: "changes_requested",
          note: "The hook takes too long to arrive. Cut the first eight seconds and open on the variance line.",
          actorId: alex.id,
          createdAt: daysAgo(2),
        },
      });
      await prisma.comment.create({
        data: {
          orgId: org.id,
          entityType: "content_item",
          entityId: content.id,
          body: "The hook takes too long to arrive. Cut the first eight seconds and open on the variance line. Everything after 00:20 is fine.",
          kind: "revision_request",
          authorId: alex.id,
          createdAt: daysAgo(2),
        },
      });
    }

    // A couple of realistic comments on in-review work.
    if (item.stage === "in_review" && rand() > 0.5) {
      await prisma.comment.create({
        data: {
          orgId: org.id,
          entityType: "content_item",
          entityId: content.id,
          body: "Captions are in and the audio is levelled. One thing to check — the number at 00:34 should be 19%, not 15%.",
          kind: "comment",
          authorId: editor.id,
          createdAt: daysAgo(1),
        },
      });
    }

    // Assets
    if (item.stage !== "raw") {
      await prisma.asset.create({
        data: {
          orgId: org.id,
          contentItemId: content.id,
          category: "edited_media",
          title: `${item.title} — edit v${rand() > 0.6 ? 2 : 1}`,
          fileName: `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}-edit.mp4`,
          mimeType: "video/mp4",
          sizeBytes: randInt(48, 320) * 1024 * 1024,
          externalUrl: null,
          version: rand() > 0.6 ? 2 : 1,
          uploadedById: editor.id,
          createdAt: daysAgo(Math.max(1, item.daysAgoCreated - 3)),
        },
      });
    }
    await prisma.asset.create({
      data: {
        orgId: org.id,
        contentItemId: content.id,
        category: "raw_media",
        title: `${item.title} — raw footage`,
        fileName: `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}-raw.mov`,
        mimeType: "video/quicktime",
        sizeBytes: randInt(400, 1800) * 1024 * 1024,
        version: 1,
        uploadedById: alex.id,
        createdAt: daysAgo(item.daysAgoCreated),
      },
    });

    /* Packaging, publish records and performance */

    if (["approved", "scheduled", "live"].includes(item.stage)) {
      const pkg = await prisma.platformPackage.create({
        data: {
          orgId: org.id,
          contentItemId: content.id,
          platform: item.platform,
          title: item.title,
          caption: buildCaption(item.title, item.platform),
          description:
            item.platform === "youtube" || item.platform === "youtube_shorts"
              ? `${item.title} — for B2B SaaS founders between £500k and £5m who are still in every deal that closes.`
              : "",
          hashtags: JSON.stringify(
            item.platform === "youtube_shorts" ? ["#shorts"] : [],
          ),
          overlays: JSON.stringify([
            "Hook line, first 2 seconds, upper third",
            "Key number held on screen for 3 seconds",
            "Closing line during the CTA",
          ]),
          thumbnailConcepts: JSON.stringify(
            item.platform.startsWith("youtube")
              ? [
                  "Alex mid-sentence, four words maximum on screen",
                  "Split frame: forecast number left, actual number right",
                ]
              : [],
          ),
          ctaOptions: JSON.stringify(OFFER.ctas),
          clipOpportunities: JSON.stringify([
            {
              label: "Hook plus the reframe",
              startSec: 0,
              endSec: 18,
              rationale: "Strongest standalone moment; works without the rest.",
            },
            {
              label: "The three facts section",
              startSec: 28,
              endSec: 54,
              rationale: "Reads well silently with captions.",
            },
          ]),
          repurposing:
            item.platform === "linkedin"
              ? "Cut the middle section into a 40-second short for YouTube Shorts next week."
              : "Expand the argument into a LinkedIn text post with the numbers spelled out.",
          status: "ready",
          generatedBy: "ai",
          createdAt: daysAgo(Math.max(1, item.daysAgoCreated - 4)),
        },
      });

      const status = isLive ? "published" : item.stage === "scheduled" ? "scheduled" : "ready";

      const record = await prisma.publishRecord.create({
        data: {
          orgId: org.id,
          contentItemId: content.id,
          packageId: pkg.id,
          platform: item.platform,
          status,
          method: "manual",
          scheduledFor: item.dueInDays != null ? daysAhead(item.dueInDays) : publishedAt,
          publishedAt,
          url: publishedAt
            ? `https://www.linkedin.com/posts/alexmorgan-${slugify(item.title)}`
            : null,
          createdAt: daysAgo(Math.max(1, item.daysAgoCreated - 4)),
        },
      });
      publishRecordIds.set(item.title, record.id);

      // Performance time series: three readings after publication.
      if (item.published) {
        const { views, retention, leads, calls, daysAgo: pubDays } = item.published;
        const readings = [
          { at: Math.max(1, pubDays - 1), factor: 0.42 },
          { at: Math.max(1, Math.floor(pubDays / 2)), factor: 0.78 },
          { at: 1, factor: 1 },
        ];

        for (const [i, reading] of readings.entries()) {
          const isFinal = i === readings.length - 1;
          const scaledViews = Math.round(views * reading.factor);
          await prisma.performanceSnapshot.create({
            data: {
              orgId: org.id,
              publishRecordId: record.id,
              capturedAt: daysAgo(reading.at),
              views: scaledViews,
              impressions: Math.round(scaledViews * 1.18),
              reach: Math.round(scaledViews * 0.92),
              likes: Math.round(scaledViews * 0.016),
              comments: Math.round(scaledViews * 0.0013),
              shares: Math.round(scaledViews * 0.0009),
              saves: Math.round(scaledViews * 0.0021),
              watchTimeSec: retention > 0 ? Math.round(scaledViews * 0.34 * 60) : 0,
              avgViewSec: retention > 0 ? Math.round(retention * 0.62) : 0,
              retentionPct: retention,
              ctrPct: Number((1.8 + rand() * 2.4).toFixed(1)),
              leads: isFinal ? leads : Math.floor(leads * reading.factor),
              bookedCalls: isFinal ? calls : Math.floor(calls * reading.factor),
              revenueMinor: 0,
              source: "seed",
            },
          });
        }

        await prisma.contentEvent.create({
          data: {
            orgId: org.id,
            contentItemId: content.id,
            type: "published",
            fromStage: "scheduled",
            toStage: "live",
            note: `Published to ${item.platform.replace(/_/g, " ")}`,
            actorId: alex.id,
            createdAt: publishedAt as Date,
          },
        });
      }
    }
  }

  // An operator-private note. Never returned by a client-scoped read — it is
  // what the visibility test asserts against.
  const noteTarget = await prisma.contentItem.findFirst({
    where: { orgId: org.id, stage: "in_review" },
    select: { id: true, title: true },
  });
  if (noteTarget) {
    await prisma.comment.create({
      data: {
        orgId: org.id,
        entityType: "content_item",
        entityId: noteTarget.id,
        body: "Editor overran on this one — third revision. Worth a conversation about brief clarity before the next batch, but not with the client in the room.",
        kind: "comment",
        internal: true,
        authorId: operator.id,
        createdAt: daysAgo(4),
      },
    });
  }

  console.log(`· ${plan.length} content items across every stage, with assets, events and packaging`);

  /* ------------------------------ Social accounts --------------------------- */

  await prisma.socialAccount.createMany({
    data: [
      { orgId: org.id, platform: "linkedin", handle: "alex-morgan-northbeam", displayName: "Alex Morgan" },
      { orgId: org.id, platform: "youtube_shorts", handle: "@northbeamadvisory", displayName: "Northbeam Advisory" },
      { orgId: org.id, platform: "youtube", handle: "@northbeamadvisory", displayName: "Northbeam Advisory" },
    ],
  });

  for (const integration of INTEGRATIONS) {
    await prisma.integration.create({
      data: {
        orgId: org.id,
        provider: integration.provider,
        status: integration.provider === "booking" ? "configured" : "not_configured",
        // How access genuinely works today. LinkedIn is the one Threadline
        // operates on this client's behalf, from inside LinkedIn's own tools,
        // by hand — which is native_delegated, not an API connection.
        accessMethod:
          integration.provider === "booking"
            ? "api"
            : integration.provider === "linkedin"
              ? "native_delegated"
              : "manual",
        config:
          integration.provider === "booking"
            ? JSON.stringify({ url: "https://cal.example.com/northbeam/diagnostic" })
            : "{}",
        connectedAt: integration.provider === "booking" ? daysAgo(100) : null,
      },
    });
  }

  /* --------------------------------- Pipeline -------------------------------- */

  const pipeline: {
    name: string;
    company: string;
    stage: string;
    contentTitle?: string;
    daysAgo: number;
    value?: number;
    notes: string;
  }[] = [
    {
      name: "Priya Raman",
      company: "Fieldnote (workflow SaaS)",
      stage: "won",
      contentTitle: "The £480k forecast that closed at £120k",
      daysAgo: 20,
      value: 8000,
      notes: "Came in via the forecast post. Third quarter of misses, board asking questions. Closed on the second call.",
    },
    {
      name: "Tomas Lindqvist",
      company: "Arbormetric",
      stage: "call_booked",
      contentTitle: "You do not have a lead problem",
      daysAgo: 11,
      notes: "Messaged saying the post described their exact situation. Two AEs, no defined qualification. Diagnostic call booked.",
    },
    {
      name: "Deborah Achebe",
      company: "Sightline Compliance",
      stage: "call_booked",
      contentTitle: "Why your closed-lost data is useless",
      daysAgo: 8,
      notes: "Runs closed-lost reviews already but says they produce nothing useful. Strong fit.",
    },
    {
      name: "Marcus Reid",
      company: "Cobalt Systems",
      stage: "qualified",
      contentTitle: "The hidden cost of hiring an SDR too early",
      daysAgo: 6,
      notes: "Six months into a first SDR hire that is not producing. Deciding whether it is the hire or the process.",
    },
    {
      name: "Yusuf Karim",
      company: "Northgate Data",
      stage: "qualified",
      contentTitle: "You do not have a lead problem",
      daysAgo: 13,
      notes: "£1.8m ARR, founder in every deal. Wants to move but timing is next quarter.",
    },
    {
      name: "Helen Voss",
      company: "Trellis HR",
      stage: "qualified",
      contentTitle: "Why your closed-lost data is useless",
      daysAgo: 9,
      notes: "Asked directly about the twelve-week structure. Good sign.",
    },
    {
      name: "Ade Fowokan",
      company: "Kestrel Logistics Software",
      stage: "inquiry",
      contentTitle: "The £480k forecast that closed at £120k",
      daysAgo: 4,
      notes: "Commented then DMed. Early stage, may be below the size threshold.",
    },
    {
      name: "Clara Mendes",
      company: "Vantage Ops",
      stage: "inquiry",
      contentTitle: "Three quarters of misses is not bad luck",
      daysAgo: 3,
      notes: "Exactly the trigger the post describes — three consecutive misses.",
    },
    {
      name: "Ivan Petrov",
      company: "Bramble Analytics",
      stage: "inquiry",
      contentTitle: "The hidden cost of hiring an SDR too early",
      daysAgo: 5,
      notes: "About to hire a second SDR. Asked whether they should wait.",
    },
    {
      name: "Sofia Marchetti",
      company: "Lumen Grid",
      stage: "inquiry",
      contentTitle: "The forecast question your board will ask next",
      daysAgo: 14,
      notes: "New CFO asking for forecast methodology. Board meeting in six weeks.",
    },
    {
      name: "Rachel Okonkwo",
      company: "Sightpath",
      stage: "lost",
      contentTitle: "The £480k forecast that closed at £120k",
      daysAgo: 26,
      notes: "Wanted someone to run outbound for them. Not what we do. Declined on the call.",
    },
    {
      name: "Daniel Byrne",
      company: "Foldable",
      stage: "won",
      contentTitle: "Why your closed-lost data is useless",
      daysAgo: 30,
      value: 8000,
      notes: "Second referral from a past client, but the closed-lost post is what prompted the timing.",
    },
  ];

  const inquiryIds: string[] = [];

  for (const [index, entry] of pipeline.entries()) {
    // Attribution strength, spread realistically rather than flatteringly. Most
    // organic signals are influence or correlation; only the ones that came
    // through a traceable path are directly tracked, and the demo must not
    // imply otherwise.
    const attribution = !entry.contentTitle
      ? "qualitative_only"
      : index % 4 === 0
        ? "directly_tracked"
        : index % 4 === 1
          ? "buyer_named"
          : index % 4 === 2
            ? "multi_touch"
            : "associated";

    const created = await prisma.inquiry.create({
      data: {
        orgId: org.id,
        attribution,
        evidenceBasis: attribution === "directly_tracked" ? "measured" : "client_reported",
        evidenceSource:
          attribution === "directly_tracked"
            ? "Tracked link on the post, matched to the booking form"
            : attribution === "buyer_named"
              ? "Named the post on the call"
              : null,
        name: entry.name,
        company: entry.company,
        email: `${entry.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        stage: entry.stage,
        source: "content",
        contentItemId: entry.contentTitle ? (contentIds.get(entry.contentTitle) ?? null) : null,
        publishRecordId: entry.contentTitle ? (publishRecordIds.get(entry.contentTitle) ?? null) : null,
        cta: entry.contentTitle ? pickOne(OFFER.ctas) : null,
        valueMinor: (entry.value ?? 0) * 100,
        currency: COMPANY.currency,
        occurredAt: daysAgo(entry.daysAgo),
        closedAt: ["won", "lost"].includes(entry.stage) ? daysAgo(entry.daysAgo - 2) : null,
        notes: entry.notes,
      },
    });
    inquiryIds.push(created.id);
  }

  console.log(`· ${pipeline.length} pipeline records attributed to content`);

  /* --------------------------- Attribution chain ---------------------------- */

  // A complete content-to-revenue journey, with the evidence spread a real one
  // would have rather than everything marked directly tracked.
  await seedAttribution({
    prisma,
    orgId: org.id,
    operatorId: operator.id,
    contentIds: [...contentIds.values()],
    inquiryIds,
    daysAgo,
  });

  /* ---------------------------- Operating metrics --------------------------- */

  for (let week = 0; week < 16; week++) {
    const weekStart = weekRangeFor(daysAgo(week * 7)).start;
    await prisma.operatingMetric.upsert({
      where: { orgId_weekStart: { orgId: org.id, weekStart } },
      create: {
        orgId: org.id,
        weekStart,
        // Founder time trends down as the system takes over coordination.
        founderHours: Number((2.4 + week * 0.14 + rand() * 0.5).toFixed(1)),
        hoursSaved: Number((9.4 - week * 0.22 + rand() * 0.6).toFixed(1)),
        cycleTimeHours: Number((96 + week * 3.2 + rand() * 12).toFixed(1)),
        approvalHours: Number((6.2 + week * 0.4 + rand() * 2).toFixed(1)),
        piecesShipped: randInt(2, 5),
        contractorCostMinor: 140_000,
      },
      update: {},
    });
  }

  /* --------------------------------- Tasks ---------------------------------- */

  await prisma.task.createMany({
    data: [
      {
        orgId: org.id,
        title: "Record 4 approved scripts",
        description: "Batch recording session. Estimated 36 minutes including setup and retakes.",
        kind: "record",
        audience: "client",
        priority: "high",
        dueDate: daysAhead(1),
        assigneeId: alex.id,
        estimateMin: 36,
      },
      {
        orgId: org.id,
        title: "Approve 6 edits waiting in review",
        description: "All six have passed production QA. Estimated 8 minutes.",
        kind: "approve",
        audience: "client",
        priority: "high",
        dueDate: daysAhead(1),
        assigneeId: alex.id,
        estimateMin: 8,
      },
      {
        orgId: org.id,
        title: "Decide: run the three-part SDR series or hold it",
        description:
          "The series test is two pieces in. Reach is above median but inbound has not moved yet. Decide whether to publish part three this week or wait for the second reading.",
        kind: "decide",
        audience: "client",
        priority: "high",
        dueDate: daysAhead(2),
        assigneeId: alex.id,
        estimateMin: 10,
      },
      {
        orgId: org.id,
        title: "Upload the Fieldnote engagement summary",
        description:
          "Anonymised outcome summary for use as proof. Needed before the case-study script can cite it.",
        kind: "upload",
        audience: "client",
        priority: "medium",
        dueDate: daysAhead(5),
        assigneeId: alex.id,
        estimateMin: 15,
      },
      {
        orgId: org.id,
        title: "Confirm the updated diagnostic price",
        description: "The forecast diagnostic is listed at £2,500. Confirm this is still current.",
        kind: "decide",
        audience: "client",
        priority: "low",
        dueDate: daysAhead(9),
        assigneeId: alex.id,
        estimateMin: 3,
      },
      {
        orgId: org.id,
        title: "Fortnightly research pass",
        description: "Target 12 new research items, focused on hiring-correction commentary.",
        kind: "ops",
        audience: "internal",
        priority: "medium",
        dueDate: daysAhead(3),
        assigneeId: operator.id,
        estimateMin: 120,
      },
      {
        orgId: org.id,
        title: "Shorten CTAs on the next three short-form pieces",
        description: "Testing the retention drop identified in the signal engine.",
        kind: "ops",
        audience: "internal",
        priority: "high",
        dueDate: daysAhead(2),
        assigneeId: operator.id,
        estimateMin: 30,
      },
      {
        orgId: org.id,
        title: "Weekly report and next recording queue",
        kind: "ops",
        audience: "internal",
        priority: "medium",
        dueDate: daysAhead(4),
        assigneeId: operator.id,
        estimateMin: 45,
      },
    ],
  });

  /* ------------------------------ Notifications ------------------------------ */

  await prisma.notification.createMany({
    data: [
      {
        orgId: org.id,
        userId: alex.id,
        kind: "approval",
        title: "6 edits are waiting for your approval",
        body: "All six passed production QA this morning.",
        href: `/app/${org.slug}/production?stage=in_review`,
        severity: "warning",
        createdAt: daysAgo(0, 8),
      },
      {
        orgId: org.id,
        userId: alex.id,
        kind: "recording",
        title: "4 scripts are ready to record",
        body: "Estimated 36 minutes including setup.",
        href: `/app/${org.slug}/production/recording`,
        severity: "info",
        createdAt: daysAgo(0, 7),
      },
      {
        orgId: org.id,
        kind: "pipeline",
        title: "Two calls booked from content this week",
        body: "Both attributed to the closed-lost and lead-problem pieces.",
        href: `/app/${org.slug}/pipeline`,
        severity: "success",
        readAt: daysAgo(1),
        createdAt: daysAgo(2),
      },
      {
        orgId: org.id,
        kind: "report",
        title: "Last week's report is ready",
        href: `/app/${org.slug}/reports`,
        severity: "info",
        readAt: daysAgo(3),
        createdAt: daysAgo(4),
      },
      {
        orgId: org.id,
        kind: "alert",
        title: "A script is waiting on fact-checking",
        body: "\"Why your closed-lost data is useless\" has 2 unverified claims.",
        href: `/app/${org.slug}/create/scripts`,
        severity: "warning",
        createdAt: daysAgo(1, 14),
      },
    ],
  });

  /* --------------------------------- Library --------------------------------- */

  await prisma.asset.createMany({
    data: [
      {
        orgId: org.id,
        category: "transcript",
        title: "Brand Brain interview — full transcript",
        description: "Sixty-two minute interview covering beliefs, stories, voice and objections.",
        fileName: "brand-brain-interview-transcript.md",
        mimeType: "text/markdown",
        sizeBytes: 84_320,
        tags: JSON.stringify(["voice", "founder", "onboarding"]),
        uploadedById: operator.id,
        createdAt: daysAgo(112),
      },
      {
        orgId: org.id,
        category: "case_study",
        title: "Compliance SaaS engagement — anonymised summary",
        description: "Founder selling hours reduced from ~14 to ~4 per week over twelve weeks.",
        fileName: "engagement-summary-compliance-saas.pdf",
        mimeType: "application/pdf",
        sizeBytes: 412_000,
        tags: JSON.stringify(["proof", "case-study"]),
        uploadedById: alex.id,
        createdAt: daysAgo(96),
      },
      {
        orgId: org.id,
        category: "offer_doc",
        title: "The Sales Operating System — engagement outline",
        fileName: "sales-operating-system-outline.pdf",
        mimeType: "application/pdf",
        sizeBytes: 268_000,
        tags: JSON.stringify(["offer"]),
        uploadedById: alex.id,
        createdAt: daysAgo(110),
      },
      {
        orgId: org.id,
        category: "brand_asset",
        title: "Northbeam wordmark and colour reference",
        fileName: "northbeam-brand.zip",
        mimeType: "application/zip",
        sizeBytes: 1_840_000,
        tags: JSON.stringify(["brand"]),
        uploadedById: operator.id,
        createdAt: daysAgo(108),
      },
      {
        orgId: org.id,
        category: "research_doc",
        title: "Closed-lost analysis template",
        description: "The template we hand to clients in week three.",
        fileName: "closed-lost-analysis-template.csv",
        mimeType: "text/csv",
        sizeBytes: 12_400,
        tags: JSON.stringify(["research", "method"]),
        uploadedById: alex.id,
        createdAt: daysAgo(74),
      },
      {
        orgId: org.id,
        category: "testimonial",
        title: "Founder testimonial — B2B SaaS, £3m ARR",
        description: "Written testimonial, full attribution available on request.",
        fileName: "testimonial-3m-saas.txt",
        mimeType: "text/plain",
        sizeBytes: 2_100,
        tags: JSON.stringify(["proof", "testimonial"]),
        uploadedById: alex.id,
        createdAt: daysAgo(60),
      },
    ],
  });

  /* --------------------------------- Reports --------------------------------- */

  for (let weekOffset = 1; weekOffset <= 3; weekOffset++) {
    const range = weekRangeFor(daysAgo(weekOffset * 7));
    const payload = await computeWeeklyReport(org.id, range);

    await prisma.weeklyReport.upsert({
      where: { orgId_periodStart: { orgId: org.id, periodStart: range.start } },
      create: {
        orgId: org.id,
        periodStart: range.start,
        periodEnd: range.end,
        status: weekOffset === 1 ? "final" : "final",
        payload: JSON.stringify(payload),
        narrative: buildNarrative(payload, weekOffset),
        generatedById: operator.id,
        generatedAt: daysAgo(weekOffset * 7 - 1),
      },
      update: {},
    });
  }

  console.log("· 3 weekly reports generated from the seeded data");

  /* ---------------------------- Second tenant ------------------------------- */

  const lumen = await prisma.organization.create({
    data: {
      slug: "lumenpath",
      name: "Lumenpath Studio",
      kind: "client",
      status: "active",
      packageTier: "install",
      onboardingStage: "complete",
      industry: "Design education",
      website: "https://lumenpath.example.com",
      geography: "United Kingdom",
      currency: "GBP",
      setupFee: 250_000,
      periodFee: 250_000,
      healthScore: 71,
      startedAt: daysAgo(48),
      lastActivityAt: daysAgo(2),
    },
  });

  const priya = await prisma.user.create({
    data: {
      email: "priya@lumenpath.example.com",
      name: "Priya Raman",
      title: "Founder",
      passwordHash,
      avatarHue: 318,
      lastSeenAt: daysAgo(2),
    },
  });

  await prisma.membership.createMany({
    data: [
      { userId: priya.id, orgId: lumen.id, role: "client_admin", isPrimary: true },
      { userId: operator.id, orgId: lumen.id, role: "internal_operator" },
    ],
  });

  await prisma.brandBrain.create({
    data: {
      orgId: lumen.id,
      company: JSON.stringify({
        description:
          "Lumenpath Studio teaches senior product designers how to lead design in organisations that do not yet value it. A twelve-week cohort programme, run three times a year.",
        website: "https://lumenpath.example.com",
        category: "Design education",
        geography: "United Kingdom",
        products: ["Design Leadership cohort — £3,400"],
        teamSize: "2",
        revenueRange: "£420k",
      }),
      founder: JSON.stringify({
        name: "Priya Raman",
        title: "Founder",
        bio: "Fifteen years in product design, the last six leading design teams inside companies where design reported into engineering.",
        experience: "Head of Design at two Series B companies. Independent since 2023.",
        beliefs: ["Design authority is earned through business fluency, not craft"],
        opinions: ["Most design leadership advice assumes a company that already respects design"],
        stories: ["The reorg that put design under engineering and what I learned"],
        credentials: ["Fifteen years in product design", "Four cohorts delivered"],
        approvedAnecdotes: [],
      }),
      voice: JSON.stringify({
        tone: "Warm, precise, quietly opinionated.",
        vocabulary: "Craft language mixed with business language, deliberately.",
        sentenceStructure: "Longer sentences than Alex. More qualification, less bluntness.",
        humour: "Wry, occasional.",
        phrasesUsed: ["The version nobody tells you", "In practice, what happens is"],
        phrasesAvoided: ["Design thinking", "Delight the user"],
        soundsLikeMe: [],
        notMe: [],
      }),
      contentRules: JSON.stringify({
        platforms: ["linkedin", "instagram"],
        formats: ["carousel", "text_post"],
        preferredCtas: ["The next cohort opens in March."],
        cadencePerWeek: 2,
        pillars: ["Design leadership", "Career", "Case studies"],
        topics: [],
        bannedTopics: [],
        complianceNotes: "",
      }),
      completeness: 58,
    },
  });

  // A small amount of Lumenpath data, so an isolation test has something to fail against.
  await prisma.idea.createMany({
    data: [
      {
        orgId: lumen.id,
        title: "The reorg that put design under engineering",
        pillar: "Design leadership",
        platform: "linkedin",
        format: "text_post",
        status: "backlog",
        relevanceScore: 80,
        noveltyScore: 70,
        proofStrength: 60,
        formatFit: 75,
        priorityScore: 72.5,
        source: "manual",
      },
      {
        orgId: lumen.id,
        title: "Why your design critique is not working",
        pillar: "Design leadership",
        platform: "linkedin",
        format: "carousel",
        status: "shortlisted",
        relevanceScore: 74,
        noveltyScore: 66,
        proofStrength: 52,
        formatFit: 70,
        priorityScore: 66.3,
        source: "manual",
      },
    ],
  });

  await prisma.task.create({
    data: {
      orgId: lumen.id,
      title: "Confirm March cohort dates",
      kind: "decide",
      audience: "client",
      priority: "medium",
      dueDate: daysAhead(6),
      assigneeId: priya.id,
    },
  });

  console.log("· Second tenant (Lumenpath Studio) for isolation testing");

  /* -------------------------------- Applications ----------------------------- */

  await prisma.application.createMany({
    data: [
      {
        name: "Erin Caldwell",
        email: "erin@example.com",
        company: "Waypoint Analytics",
        website: "https://waypoint.example.com",
        whatYouSell:
          "Analytics tooling for logistics operators. Annual contracts between £14k and £60k, sold to operations directors.",
        revenueRange: "£1m – £5m",
        contentProcess:
          "I write posts in the Notes app when I have a strong opinion, then a contractor turns them into carousels. There is no plan and it stops entirely whenever I get busy.",
        peopleInvolved: "2 – 3",
        publishCadence: "A few times a month",
        biggestBottleneck:
          "Me. Everything waits on me writing something, and I only write when I am annoyed about something.",
        founderHours: "2 – 5 hours",
        platforms: JSON.stringify(["LinkedIn", "YouTube"]),
        successLooksLike:
          "Publishing consistently without me being the bottleneck, and knowing which posts actually produce conversations.",
        urgency: "Yes — this is a priority now",
        status: "new",
        createdAt: daysAgo(1),
      },
      {
        name: "Nathan Obi",
        email: "nathan@example.com",
        company: "Ledgerline",
        website: "https://ledgerline.example.com",
        whatYouSell: "Bookkeeping automation for accountancy practices. £8k–£25k annual.",
        revenueRange: "£250k – £1m",
        contentProcess: "A freelancer writes everything. It does not sound like me and I keep rewriting it.",
        peopleInvolved: "2 – 3",
        publishCadence: "Weekly",
        biggestBottleneck: "The content does not sound like me, so I rewrite it, so it takes longer than doing it myself.",
        founderHours: "5 – 10 hours",
        platforms: JSON.stringify(["LinkedIn"]),
        successLooksLike: "Content that sounds like me without me writing it.",
        urgency: "Yes — this is a priority now",
        status: "reviewing",
        reviewNotes: "Strong fit. Voice problem is exactly what the Brand Brain solves. Book the call.",
        createdAt: daysAgo(4),
      },
      {
        name: "Camille Roussel",
        email: "camille@example.com",
        company: "Atelier Growth",
        whatYouSell: "Growth consulting for DTC brands.",
        revenueRange: "£250k – £1m",
        contentProcess: "Posting daily on LinkedIn myself. It works but it is consuming my week.",
        peopleInvolved: "Just me",
        publishCadence: "Daily",
        biggestBottleneck: "Volume. I cannot sustain daily and also deliver client work.",
        founderHours: "Over 10 hours",
        platforms: JSON.stringify(["LinkedIn", "Instagram"]),
        successLooksLike: "Same output, half the hours.",
        urgency: "Within the next quarter",
        status: "call_booked",
        createdAt: daysAgo(9),
      },
      {
        name: "Owen Pritchard",
        email: "owen@example.com",
        company: "Sparkline Media",
        whatYouSell: "Video production services.",
        revenueRange: "Under £250k",
        contentProcess: "We post client work.",
        peopleInvolved: "4 – 6",
        publishCadence: "2 – 3 times a week",
        biggestBottleneck: "Getting more views.",
        founderHours: "Under 2 hours",
        platforms: JSON.stringify(["Instagram", "TikTok"]),
        successLooksLike: "Going viral consistently.",
        urgency: "Exploring, no timeline",
        status: "declined",
        reviewNotes:
          "Declined. Wants reach rather than pipeline, and is a creative production business — explicitly outside the ICP. Replied with a recommendation.",
        createdAt: daysAgo(16),
      },
    ],
  });

  /* ----------------------------- Support issues ------------------------------ */

  await prisma.supportIssue.createMany({
    data: [
      {
        orgId: org.id,
        title: "Retention figures not available for LinkedIn video",
        description:
          "LinkedIn does not expose per-video retention in the native analytics view the client has access to. Currently recording view-through as a proxy, which is not equivalent.",
        severity: "medium",
        status: "investigating",
        ownerId: operator.id,
        becomesSop: true,
        createdAt: daysAgo(12),
      },
      {
        orgId: org.id,
        title: "Editor cannot see the script alongside the edit",
        description:
          "Mira has to open the script in a separate tab while editing. Requested the script body on the content detail page.",
        severity: "low",
        status: "resolved",
        ownerId: superAdmin.id,
        resolution: "Script body and filming notes now render on the content detail page.",
        becomesFix: true,
        resolvedAt: daysAgo(5),
        createdAt: daysAgo(18),
      },
      {
        orgId: lumen.id,
        title: "Brand Brain voice section is thin",
        description:
          "Priya's onboarding was completed quickly and the voice section has no 'sounds like me' examples. Generated drafts are landing generic.",
        severity: "high",
        status: "open",
        ownerId: operator.id,
        becomesSop: true,
        createdAt: daysAgo(6),
      },
    ],
  });

  /* ---------------------------- Internal metrics ----------------------------- */

  for (let month = 0; month < 6; month++) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
    await prisma.internalMetric.upsert({
      where: { periodStart },
      create: {
        periodStart,
        leadsBySource: JSON.stringify({
          linkedin: randInt(6, 18),
          referral: randInt(1, 5),
          podcast: randInt(0, 3),
        }),
        salesCalls: randInt(4, 12),
        showRatePct: Number((72 + rand() * 20).toFixed(1)),
        closeRatePct: Number((22 + rand() * 18).toFixed(1)),
        cashCollectedMinor: randInt(12, 34) * 100_000,
        setupFeesMinor: randInt(1, 3) * 250_000,
        mrrMinor: (800_000 + month * 60_000) | 0,
        implementationHours: Number((38 + rand() * 24).toFixed(1)),
        supportHours: Number((6 + rand() * 8).toFixed(1)),
      },
      update: {},
    });
  }

  /* --------------------------- Synthetic dry run ----------------------------- */

  // Runs through the real fulfilment path on purpose, carrying the marker that
  // keeps its output out of portfolio totals and out of proof.
  await seedSyntheticWorkspace(prisma, operator.id, daysAgo);

  /* ---------------------- Threadline's own acquisition ----------------------- */

  // Not tenant data: this is Threadline running Threadline. Seeded in the state
  // a real launch is actually in — an unfrozen wedge, a thin funnel, and a
  // qualification rate that is measured only because two calls have happened.
  const acquisition = await seedAcquisition({
    prisma,
    operatorId: operator.id,
    superAdminId: superAdmin.id,
    daysAgo,
    daysFromNow: daysAhead,
  });

  /* ---------------------------- Research corpus ------------------------------ */

  // Illustrative rows only. They make the machinery visible and are excluded
  // from calibration, because a rubric checked against invented outcomes is
  // worse than one that has not been checked at all.
  await seedCorpus(prisma, operator.id, acquisition.wedgeId, daysAgo);

  /* ------------------------- The content learning loop ------------------------ */

  // One thesis, three attempts, a closed correction and an open one. This is the
  // shape that makes SCORE -> EXPLAIN -> DIAGNOSE -> PRESCRIBE -> RETEST legible
  // without inventing a client outcome.
  await seedLearning(prisma, org.id, operator.id, alex.id, contentIds, daysAgo);

  /* --------------------------------- Summary --------------------------------- */

  console.log("\nDemo accounts (password for all: " + DEMO_PASSWORD + ")\n");
  console.log("  Founder (client_admin)     alex@northbeamadvisory.com     -> /app/northbeam");
  console.log("  Team member (client_member) jordan@northbeamadvisory.com  -> /app/northbeam");
  console.log("  Editor (editor)            editor@threadline.com          -> /app/northbeam");
  console.log("  Operator (internal)        operator@threadline.com        -> /admin");
  console.log("  Super admin                ops@threadline.com             -> /admin");
  console.log("  Second tenant founder      priya@lumenpath.example.com    -> /app/lumenpath");
  console.log("\nSeed complete.\n");
}

/** Remove demo data so the seed is repeatable. Cascades handle the rest. */
async function reset() {
  // Threadline's own records have no orgId, so the organisation cascade does
  // not reach them. Order matters: children before parents.
  // Attribution rows cascade from Organization, so they need no explicit
  // delete here — unlike Threadline’s own internal records below, which have no
  // organisation to cascade from.
  await prisma.judgeCalibration.deleteMany();
  await prisma.judgeVerdict.deleteMany();
  await prisma.researchExample.deleteMany();
  await prisma.sopCheck.deleteMany();
  await prisma.salesCall.deleteMany();
  await prisma.validationConversation.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.marketWedge.deleteMany();
  await prisma.acquisitionTarget.deleteMany();
  await prisma.funnelReview.deleteMany();
  await prisma.internalMetric.deleteMany();
  await prisma.application.deleteMany();
  await prisma.sopDocument.deleteMany();
  await prisma.supportIssue.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function buildCaption(title: string, platform: string) {
  if (platform === "youtube_shorts") return `${title} #shorts`;
  return `${title}\n\nMost founders at this stage are told the answer is more pipeline.\n\nIt usually is not.\n\nFull breakdown in the video.`;
}

function buildNarrative(
  payload: { shipped: { count: number }; performance: { views: number }; commercial: { inquiries: number; callsBooked: number }; operating: { bottleneck: string | null } },
  weekOffset: number,
) {
  const parts = [
    `${payload.shipped.count} ${payload.shipped.count === 1 ? "piece" : "pieces"} shipped, reaching ${payload.performance.views.toLocaleString("en-GB")} views.`,
  ];
  if (payload.commercial.inquiries > 0) {
    parts.push(
      `${payload.commercial.inquiries} inbound ${payload.commercial.inquiries === 1 ? "inquiry" : "inquiries"} were attributed to published content${payload.commercial.callsBooked > 0 ? `, of which ${payload.commercial.callsBooked} converted to a booked call` : ""}.`,
    );
  } else {
    parts.push("No inbound inquiries were attributed to content this week.");
  }
  if (payload.operating.bottleneck) {
    parts.push(
      `The constraint sat at ${payload.operating.bottleneck} — that is where the next intervention should land.`,
    );
  }
  parts.push(
    weekOffset === 1
      ? "The first-person opening structure continues to outperform. Weighting more of next week's queue toward it."
      : "Output held against target. No structural change recommended this week.",
  );
  return parts.join(" ");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:\n", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
