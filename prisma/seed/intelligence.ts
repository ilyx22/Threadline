import type { PrismaClient } from "@prisma/client";
import { patternScore } from "../../src/lib/domain/scoring";
import { testRankScore, evidenceFingerprint } from "../../src/lib/domain/intelligence";

/**
 * Demo data for the intelligence cycle, constraint diagnosis, installation and
 * proof capture.
 *
 * Everything here is internally consistent with the rest of the Northbeam demo:
 * the signals cite research items that genuinely exist in the workspace, the
 * diagnosis names a constraint the seeded content actually reflects, and the
 * proof figures line up with the seeded publishing and pipeline records.
 *
 * Northbeam is fictional. No real business, person or result is represented.
 */

type SeedContext = {
  prisma: PrismaClient;
  orgId: string;
  operatorId: string;
  founderId: string;
  /** Research item ids already created for this workspace, in seeded order. */
  researchIds: string[];
  daysAgo: (days: number, hour?: number) => Date;
};

/* --------------------------------- Sources -------------------------------- */

const SOURCES = [
  {
    kind: "sales_call",
    label: "Five discovery calls, weeks 1-2",
    collectionMode: "manual",
    status: "collected",
    itemsCollected: 5,
    statusNote: null,
    content:
      "Notes and transcript excerpts supplied by Alex after each call. Verbatim quotes preserved.",
  },
  {
    kind: "customer_language",
    label: "SaaS founder communities and review threads",
    collectionMode: "manual",
    status: "collected",
    itemsCollected: 4,
    statusNote: null,
    content: "Quotes pasted from public founder communities, with the thread URL against each one.",
  },
  {
    kind: "competitor",
    label: "Category posts from the three named competitors",
    collectionMode: "url",
    status: "collected",
    itemsCollected: 6,
    statusNote: null,
    content: null,
  },
  {
    kind: "performance",
    label: "Own performance, last 30 days",
    collectionMode: "adapter",
    status: "collected",
    itemsCollected: 1,
    statusNote: null,
    content: null,
  },
  {
    kind: "pipeline",
    label: "Own pipeline, last 30 days",
    collectionMode: "adapter",
    status: "collected",
    itemsCollected: 1,
    statusNote: null,
    content: null,
  },
  {
    kind: "creator",
    label: "LinkedIn posts from two operators Alex follows",
    collectionMode: "url",
    status: "unavailable",
    itemsCollected: 0,
    statusNote:
      "linkedin.com serves a login wall to automated requests and Threadline holds no credentials for it. Two of the posts were pasted in by hand under the competitor source; the rest were not read this cycle.",
    content: null,
  },
];

/* ---------------------------- Evidence collected --------------------------- */

const EVIDENCE = [
  {
    kind: "customer_language",
    title: "Discovery call, Series A founder: leads are not the problem",
    body: "We are not short of leads. We are short of leads that turn into anything. My AE team is busy every day and the forecast still misses. I do not think another demand-gen agency fixes that.",
    sourceName: "Discovery call notes",
    author: "Prospect, Series A SaaS",
  },
  {
    kind: "customer_language",
    title: "Discovery call, bootstrapped founder: the forecast is fiction",
    body: "Every Monday we go through the pipeline and every Monday the numbers move for reasons nobody can explain. I have stopped trusting the forecast, which means I have stopped being able to plan hiring.",
    sourceName: "Discovery call notes",
    author: "Prospect, bootstrapped SaaS",
  },
  {
    kind: "customer_language",
    title: "Discovery call: they think this is a training problem",
    body: "We keep being sold sales training. The reps are fine. The problem is that nobody agrees what qualified means, so half the pipeline should never have been in there.",
    sourceName: "Discovery call notes",
    author: "Prospect, Series A SaaS",
  },
  {
    kind: "customer_language",
    title: "Community thread: what to do in the first 30 days",
    body: "Genuine question for people who have fixed sales ops before. What do you actually do in the first month? Every post I read is about hiring a VP of Sales or buying another tool. I want to know what someone competent does in the first thirty days.",
    sourceName: "Founder community thread",
    author: "Community member",
  },
  {
    kind: "customer_language",
    title: "Community thread: pricing objection to fractional help",
    body: "Eight grand for someone to look at our sales process feels steep until you realise a bad quarter costs a lot more. The bit I cannot judge is whether it works or whether it is a very expensive spreadsheet.",
    sourceName: "Founder community thread",
    author: "Community member",
  },
  {
    kind: "objection",
    title: "Recurring objection: how is this different from a fractional sales director",
    body: "Raised in three of the five calls, always before pricing came up. Prospects cannot tell the difference between an installed operating system and a part-time hire, and default to comparing on day rate.",
    sourceName: "Discovery call notes",
    author: null,
  },
  {
    kind: "competitor_post",
    title: "Competitor post: predictable revenue, again",
    body: "Third competitor this month leading with predictable revenue as the promise. The claim is now identical across the category, which means it no longer distinguishes anyone using it.",
    sourceName: "Competitor content sweep",
    author: null,
  },
  {
    kind: "competitor_post",
    title: "Competitor post: outcome claim with no mechanism",
    body: "Long post promising a repeatable revenue engine. Nothing in it describes how. The comments are people asking what the actual process is.",
    sourceName: "Competitor content sweep",
    author: null,
  },
  {
    kind: "question",
    title: "Repeated question: what does the first month look like",
    body: "The same question appears in the community thread, in two discovery calls and in the comments under a competitor post. Nobody in the category answers it concretely.",
    sourceName: "Cross-source observation",
    author: null,
  },
  {
    kind: "content_example",
    title: "Own content: first-person opening outperformed the framework opening",
    body: "The two strongest pieces this period both open with a first-person statement about a specific client situation. Pieces opening by naming the framework sit below the median.",
    sourceName: "Own published content",
    author: null,
  },
];

/* ------------------------------ Candidate signals -------------------------- */

const CANDIDATES = [
  {
    kind: "customer_language",
    title: "Buyers describe a conversion problem, not a lead problem",
    rationale:
      "Three of the five discovery calls this cycle state, unprompted, that lead volume is not the constraint. The current messaging answers a volume problem, which means the first thing a qualified buyer reads is an answer to a question they do not have.",
    soWhat:
      "Leading with conversion rather than pipeline volume puts the offer in front of the problem buyers say they have, which shortens the distance between recognition and enquiry.",
    confidence: 64,
    decision: "approved",
    evidenceIndexes: [0, 1, 2],
    test: {
      title: "Publish three pieces leading with the conversion framing rather than pipeline volume",
      successMetric: "Qualified inquiries per published piece, over three weeks",
      impact: 5,
      effort: 2,
      status: "testing",
      feedback: null,
    },
  },
  {
    kind: "objection",
    title: "Buyers cannot distinguish this from hiring a fractional sales director",
    rationale:
      "Raised in three of five calls, and in every case before pricing was discussed. An objection that arrives before price is a positioning problem, not a closing problem.",
    soWhat:
      "Answering the comparison in content removes it from the call, and moves the conversation from day rate to what is actually being installed.",
    confidence: 58,
    decision: "approved",
    evidenceIndexes: [5, 4],
    test: {
      title: "One teardown contrasting an installed operating system with a fractional hire",
      successMetric: "Whether the comparison is still raised unprompted on discovery calls",
      impact: 4,
      effort: 2,
      status: "open",
      feedback: null,
    },
  },
  {
    kind: "content_gap",
    title: "Nobody in the category answers what the first 30 days actually look like",
    rationale:
      "The same question appears in a founder community thread, in two discovery calls, and in the comments under a competitor post. Every published answer in the category is about hiring or tooling rather than about the work.",
    soWhat:
      "A question asked repeatedly and answered badly is the cheapest gap to own, and it attracts people already in the problem rather than people browsing.",
    confidence: 52,
    decision: "approved",
    evidenceIndexes: [3, 8, 7],
    test: {
      title: "A concrete week-by-week breakdown of the first thirty days of an installation",
      successMetric: "Saves and inbound inquiries citing the piece, over four weeks",
      impact: 4,
      effort: 3,
      status: "testing",
      feedback: {
        outcome: "supported",
        note: "Published in week two. Two of the four qualified inquiries this month named it on the discovery call, which is the measure this test was set on. Views were unremarkable, which is the point: the piece reached fewer people and better ones.",
      },
    },
  },
  {
    kind: "competitor_theme",
    title: "Competitors have converged on the same outcome claim",
    rationale:
      "Two of the competitor posts collected this cycle lead with a near-identical predictable revenue promise, and neither describes a mechanism. Where everyone claims the same outcome, the claim stops carrying information.",
    soWhat:
      "There is room to own the mechanism rather than the outcome. A mechanism is harder to copy and far easier to prove.",
    confidence: 47,
    decision: "approved",
    evidenceIndexes: [6, 7],
    test: null,
  },
  {
    kind: "content_outlier",
    title: "First-person openings sit above the median",
    rationale:
      "Both of the strongest pieces this period open with a first-person statement about a specific client situation. This is one period of evidence from one account, so it is an observation rather than a settled pattern.",
    soWhat:
      "Cheap to test against the current framing, with a readable result inside one publishing cycle.",
    confidence: 34,
    decision: "pending",
    evidenceIndexes: [9],
    test: null,
  },
  {
    kind: "desire",
    title: "Buyers want to stop being surprised by the forecast",
    rationale:
      "Two calls describe distrust of the forecast as the thing that actually hurts, because it blocks hiring decisions. Only two items support this, so confidence is capped accordingly.",
    soWhat:
      "Framing the outcome as a forecast you can plan against, rather than as more revenue, speaks to what was actually described.",
    confidence: 38,
    decision: "rejected",
    decisionNote:
      "Both citations are from the same segment and one is the same person as signal one. Not independent enough to act on this cycle. Worth revisiting if it recurs.",
    evidenceIndexes: [1, 0],
    test: null,
  },
];

const BRIEF_SUMMARY = `The clearest thing in your market this cycle was that buyers do not describe a lead problem. Three of the five discovery calls said, unprompted, that volume is not the constraint - what hurts is that pipeline does not convert and the forecast cannot be trusted. Your current messaging answers a volume question.

That matters because the comparison to hiring a fractional sales director came up in three of those same five calls, always before pricing. An objection that arrives before price is a positioning problem: buyers cannot yet tell what is different about what you install, so they fall back on comparing day rates.

Three tests are queued because of it, starting with three pieces led by the conversion framing rather than pipeline volume. The first-30-days piece has already run and two of this month's four qualified inquiries named it on the call. Nothing is being rewritten wholesale until the other two have a read.`;

/* ------------------------------- Diagnosis --------------------------------- */

const DIAGNOSIS = {
  primaryConstraint: "positioning",
  severity: "high",
  confidence: 72,
  commercialImpact:
    "Roughly half of the qualified conversations stall before pricing, and the comparison buyers reach for is a fractional hire at a day rate. At an 8,000 GBP engagement, two stalled conversations a month is more than the cost of the entire content operation.",
  recommendedAction:
    "Own the mechanism rather than the outcome. Every piece for the next 30 days should make the installed system legible enough that the fractional-hire comparison stops being the obvious one.",
  experiment:
    "Publish the first-30-days breakdown and the fractional-hire teardown, then count how often the comparison is raised unprompted on discovery calls over the following six weeks.",
  evidence: `Nine dimensions rated against the website, the last twenty published pieces, five discovery call transcripts and the pipeline records for the last quarter.

The work itself is strong and the audience is right. What is missing is that nothing published so far makes the mechanism legible, so buyers default to the nearest category they recognise - a fractional sales hire - and compare on price.`,
  ratings: [
    {
      dimension: "positioning",
      rating: 2,
      note: "The offer is described by its outcome, which is the same outcome three competitors claim. Nothing published makes the mechanism legible.",
    },
    {
      dimension: "audience",
      rating: 4,
      note: "B2B SaaS founders at 500k-5m are the right buyers, reachable, and already describing the problem in their own words.",
    },
    {
      dimension: "offer_alignment",
      rating: 4,
      note: "The offer states both a mechanism and an outcome, and the price is one buyers accept once they understand what is installed.",
    },
    {
      dimension: "content_market_fit",
      rating: 4,
      note: "The topics match what the market is trying to solve. The recurring first-30-days question is direct evidence.",
    },
    {
      dimension: "differentiation",
      rating: 2,
      note: "If a competitor published the same piece, most readers could not tell. The point of view is real but not yet on the page.",
    },
    {
      dimension: "creative_quality",
      rating: 4,
      note: "Hooks and structure hold. The strongest pieces open first-person on a specific client situation.",
    },
    {
      dimension: "distribution",
      rating: 3,
      note: "Reach is adequate for the segment. Not the binding constraint, and increasing it would amplify the positioning problem.",
    },
    {
      dimension: "conversion",
      rating: 3,
      note: "Booking link and a described path exist. The friction is upstream: people arrive unsure what they would be buying.",
    },
    {
      dimension: "operations",
      rating: 3,
      note: "Founder time is down to a recording batch and an approval pass. Output survives a busy delivery week.",
    },
  ],
};

/* ------------------------------ Proof periods ------------------------------ */

const PROOF_PERIODS = [
  {
    kind: "baseline",
    label: "Before Threadline",
    startDaysAgo: 210,
    endDaysAgo: 120,
    reportedFounderHours: 9.5,
    reportedContentOutput: 11,
    reportedCycleTimeDays: 12,
    reportedApprovalDays: 4.5,
    reportedAudienceSize: 4820,
    reportedEngagementRate: 2.1,
    reportedQualifiedInquiries: 3,
    reportedCallsBooked: 2,
    reportedAttributableValueMinor: null,
    attributionNote: null,
    qualitativeNotes:
      "Reported by Alex during installation. Nothing before the engagement is observable from inside the product, so these are the figures as described, not as measured. Attribution was never tracked before Threadline, which is why that field is blank rather than zero.",
  },
  {
    kind: "month",
    label: "Month 1",
    startDaysAgo: 118,
    endDaysAgo: 88,
    reportedFounderHours: 4.5,
    reportedAudienceSize: 5140,
    attributionNote:
      "One inquiry named a specific piece on the discovery call and was recorded against it. The other two arrived through referral and are not attributed to content.",
    qualitativeNotes:
      "First full cycle. Output was deliberately low while the context layer was being filled in.",
  },
  {
    kind: "month",
    label: "Month 2",
    startDaysAgo: 88,
    endDaysAgo: 58,
    reportedFounderHours: 3.5,
    reportedAudienceSize: 5680,
    attributionNote:
      "Two closed engagements named a specific post on the discovery call and were recorded against those pieces in the pipeline.",
    qualitativeNotes:
      "A competitor changed their homepage headline three weeks after the mechanism piece went out. Interesting, and not something we can claim caused anything.",
  },
  {
    kind: "month",
    label: "Month 3",
    startDaysAgo: 58,
    endDaysAgo: 28,
    reportedFounderHours: 3,
    reportedAudienceSize: 6310,
    attributionNote:
      "Attribution is single-touch and self-declared: it reflects what buyers said brought them in, recorded at the point of the call.",
    qualitativeNotes:
      "Alex was invited onto a founder podcast off the back of the first-30-days piece. No revenue attached to it yet.",
  },
];

/* -------------------------------- The seeder ------------------------------- */

export async function seedIntelligence(ctx: SeedContext) {
  const { prisma, orgId, operatorId, founderId, researchIds, daysAgo } = ctx;

  /* --- The published cycle ------------------------------------------------- */

  const periodEnd = daysAgo(3);
  const periodStart = daysAgo(17);

  const run = await prisma.intelligenceRun.create({
    data: {
      orgId,
      label: "Market read, weeks 1-2 of the quarter",
      focus:
        "Why do qualified conversations stall before the pricing discussion, and what are buyers actually comparing us to?",
      periodStart,
      periodEnd,
      status: "published",
      summary: BRIEF_SUMMARY,
      publishedAt: daysAgo(2),
      createdById: operatorId,
      createdAt: daysAgo(18),
      updatedAt: daysAgo(2),
    },
  });

  for (const [index, source] of SOURCES.entries()) {
    await prisma.runSource.create({
      data: {
        orgId,
        runId: run.id,
        kind: source.kind,
        label: source.label,
        collectionMode: source.collectionMode,
        status: source.status,
        statusNote: source.statusNote,
        content: source.content,
        itemsCollected: source.itemsCollected,
        collectedAt: source.status === "collected" ? daysAgo(15 - index) : daysAgo(15 - index),
        createdAt: daysAgo(18),
      },
    });
  }

  // Evidence collected by the run, each with its provenance preserved.
  const evidenceIds: string[] = [];
  for (const [index, item] of EVIDENCE.entries()) {
    const record = await prisma.researchItem.create({
      data: {
        orgId,
        runId: run.id,
        kind: item.kind,
        title: item.title,
        body: item.body,
        sourceName: item.sourceName,
        author: item.author,
        capturedAt: daysAgo(16 - index * 0.5),
        collectedVia: "run",
        sourceMeta: JSON.stringify({
          sourceType: item.kind,
          collectionMode: item.sourceName?.includes("Competitor") ? "url" : "manual",
          suppliedBy: "human",
          cycle: run.label,
        }),
        dedupeKey: evidenceFingerprint({ title: item.title, body: item.body }),
      },
    });
    evidenceIds.push(record.id);
  }

  await prisma.intelligenceRun.update({
    where: { id: run.id },
    data: { evidenceCount: evidenceIds.length },
  });

  let approvedCount = 0;
  let testCount = 0;

  for (const [index, candidate] of CANDIDATES.entries()) {
    let patternId: string | null = null;

    if (candidate.decision === "approved") {
      const impact = candidate.test?.impact ?? 3;
      const effort = candidate.test?.effort ?? 3;

      const signal = await prisma.pattern.create({
        data: {
          orgId,
          runId: run.id,
          kind: "pattern",
          title: candidate.title,
          description: `${candidate.rationale}\n\nSo what: ${candidate.soWhat}`,
          status: "open",
          confidence: candidate.confidence,
          impact: 3,
          effort: 3,
          score: patternScore({ confidence: candidate.confidence, impact: 3, effort: 3 }),
          detectedBy: "intelligence_run",
          // Approving a candidate is the decision that makes a signal part of
          // the client's strategy, so it becomes client-visible at that moment.
          visibility: "client_published",
          createdAt: daysAgo(6),
          updatedAt: daysAgo(4),
        },
      });
      patternId = signal.id;
      approvedCount += 1;

      for (const evidenceIndex of candidate.evidenceIndexes) {
        const researchItemId = evidenceIds[evidenceIndex];
        if (!researchItemId) continue;
        await prisma.patternEvidence.create({
          data: {
            patternId: signal.id,
            researchItemId,
            note: "Cited when this signal was approved.",
          },
        });
      }

      if (candidate.test) {
        testCount += 1;
        const test = await prisma.pattern.create({
          data: {
            orgId,
            runId: run.id,
            derivedFromId: signal.id,
            kind: "test",
            title: candidate.test.title,
            description: candidate.soWhat,
            status: candidate.test.status,
            confidence: candidate.confidence,
            impact,
            effort,
            score: testRankScore({
              confidence: candidate.confidence,
              impact,
              effort,
              evidenceCount: candidate.evidenceIndexes.length,
            }),
            rank: testCount,
            successMetric: candidate.test.successMetric,
            nextExperiment: candidate.test.title,
            detectedBy: "intelligence_run",
            visibility: "client_published",
            feedbackNote: candidate.test.feedback?.note ?? null,
            lastFeedbackAt: candidate.test.feedback ? daysAgo(1) : null,
            createdAt: daysAgo(4),
            updatedAt: daysAgo(1),
          },
        });

        for (const evidenceIndex of candidate.evidenceIndexes) {
          const researchItemId = evidenceIds[evidenceIndex];
          if (!researchItemId) continue;
          await prisma.patternEvidence.create({
            data: {
              patternId: test.id,
              researchItemId,
              note: "Inherited from the signal this test came from.",
            },
          });
        }
      }
    }

    const record = await prisma.candidateSignal.create({
      data: {
        orgId,
        runId: run.id,
        kind: candidate.kind,
        title: candidate.title,
        rationale: candidate.rationale,
        soWhat: candidate.soWhat,
        confidence: candidate.confidence,
        decision: candidate.decision,
        decisionNote: candidate.decisionNote ?? null,
        decidedById: candidate.decision === "pending" ? null : founderId,
        decidedAt: candidate.decision === "pending" ? null : daysAgo(5),
        patternId,
        generatedBy: "ai",
        createdAt: daysAgo(7),
        updatedAt: daysAgo(5),
      },
    });

    for (const evidenceIndex of candidate.evidenceIndexes) {
      const researchItemId = evidenceIds[evidenceIndex];
      if (!researchItemId) continue;
      await prisma.candidateEvidence.create({
        data: { candidateSignalId: record.id, researchItemId },
      });
    }
    void index;
  }

  // Freeze the brief exactly as the publish action would have written it.
  const approvedSignals = await prisma.candidateSignal.findMany({
    where: { orgId, runId: run.id, decision: "approved" },
    orderBy: { confidence: "desc" },
    include: {
      evidence: {
        include: {
          researchItem: {
            select: { id: true, title: true, url: true, sourceName: true, kind: true, capturedAt: true },
          },
        },
      },
    },
  });
  const tests = await prisma.pattern.findMany({
    where: { orgId, runId: run.id, kind: "test" },
    orderBy: [{ rank: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      successMetric: true,
      score: true,
      rank: true,
      confidence: true,
    },
  });
  const sources = await prisma.runSource.findMany({
    where: { orgId, runId: run.id },
    select: { kind: true, label: true, status: true, statusNote: true, itemsCollected: true },
  });

  await prisma.intelligenceRun.update({
    where: { id: run.id },
    data: {
      signalCount: CANDIDATES.length,
      approvedCount,
      testCount,
      brief: JSON.stringify({
        version: 1,
        frozenAt: daysAgo(2).toISOString(),
        label: run.label,
        focus: run.focus,
        summary: BRIEF_SUMMARY,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        sources,
        signals: approvedSignals.map((c) => ({
          id: c.id,
          kind: c.kind,
          title: c.title,
          rationale: c.rationale,
          soWhat: c.soWhat,
          confidence: c.confidence,
          editedByHuman: c.editedByHuman,
          evidence: c.evidence.map((e) => ({
            id: e.researchItem.id,
            title: e.researchItem.title,
            url: e.researchItem.url,
            sourceName: e.researchItem.sourceName,
            kind: e.researchItem.kind,
            capturedAt: e.researchItem.capturedAt.toISOString(),
          })),
        })),
        tests,
      }),
    },
  });

  /* --- A second cycle, currently open ------------------------------------- */

  const openRun = await prisma.intelligenceRun.create({
    data: {
      orgId,
      label: "Market read, weeks 3-4 of the quarter",
      focus: "Has the fractional-hire comparison stopped coming up unprompted?",
      periodStart: daysAgo(3),
      periodEnd: daysAgo(0),
      status: "collecting",
      createdById: operatorId,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(0),
    },
  });

  await prisma.runSource.createMany({
    data: [
      {
        orgId,
        runId: openRun.id,
        kind: "sales_call",
        label: "Discovery calls, weeks 3-4",
        collectionMode: "manual",
        status: "pending",
        createdAt: daysAgo(3),
      },
      {
        orgId,
        runId: openRun.id,
        kind: "performance",
        label: "Own performance since the last cycle",
        collectionMode: "adapter",
        status: "pending",
        createdAt: daysAgo(3),
      },
    ],
  });

  /* --- Constraint diagnosis ------------------------------------------------ */

  const diagnosis = await prisma.constraintDiagnosis.create({
    data: {
      orgId,
      status: "active",
      primaryConstraint: DIAGNOSIS.primaryConstraint,
      severity: DIAGNOSIS.severity,
      confidence: DIAGNOSIS.confidence,
      evidence: DIAGNOSIS.evidence,
      commercialImpact: DIAGNOSIS.commercialImpact,
      recommendedAction: DIAGNOSIS.recommendedAction,
      experiment: DIAGNOSIS.experiment,
      reviewDate: daysAgo(-9),
      reviewedAt: daysAgo(21),
      createdById: operatorId,
      createdAt: daysAgo(112),
      updatedAt: daysAgo(21),
    },
  });

  await prisma.constraintAssessment.createMany({
    data: DIAGNOSIS.ratings.map((rating) => ({
      diagnosisId: diagnosis.id,
      dimension: rating.dimension,
      rating: rating.rating,
      note: rating.note,
    })),
  });

  /* --- Installation -------------------------------------------------------- */

  // Northbeam finished installing months ago. Only the strategy sign-off is
  // stored: every other milestone is derived from records that genuinely exist.
  await prisma.installationMilestone.create({
    data: {
      orgId,
      key: "strategy_approved",
      signedOffAt: daysAgo(110),
      signedOffById: founderId,
      note: "Signed off on the call after the first brief.",
      createdAt: daysAgo(110),
    },
  });

  /* --- Proof capture ------------------------------------------------------- */

  for (const period of PROOF_PERIODS) {
    await prisma.proofPeriod.create({
      data: {
        orgId,
        kind: period.kind,
        label: period.label,
        periodStart: daysAgo(period.startDaysAgo),
        periodEnd: daysAgo(period.endDaysAgo),
        reportedFounderHours: period.reportedFounderHours ?? null,
        reportedContentOutput: period.reportedContentOutput ?? null,
        reportedCycleTimeDays: period.reportedCycleTimeDays ?? null,
        reportedApprovalDays: period.reportedApprovalDays ?? null,
        reportedAudienceSize: period.reportedAudienceSize ?? null,
        reportedEngagementRate: period.reportedEngagementRate ?? null,
        reportedQualifiedInquiries: period.reportedQualifiedInquiries ?? null,
        reportedCallsBooked: period.reportedCallsBooked ?? null,
        reportedAttributableValueMinor: period.reportedAttributableValueMinor ?? null,
        attributionNote: period.attributionNote ?? null,
        qualitativeNotes: period.qualitativeNotes ?? null,
        source: period.kind === "baseline" ? "client_reported" : "operator_recorded",
        lockedAt: period.kind === "baseline" ? daysAgo(112) : null,
        recordedById: period.kind === "baseline" ? founderId : operatorId,
        createdAt: daysAgo(period.endDaysAgo),
      },
    });
  }

  /* --- A notification and a task, so the brief is discoverable ------------- */

  await prisma.notification.create({
    data: {
      orgId,
      kind: "intelligence_brief",
      title: "New intelligence brief",
      body: `"${run.label}" is ready to read.`,
      href: `/app/northbeam/intelligence/runs/${run.id}`,
      createdAt: daysAgo(2),
    },
  });

  await prisma.task.create({
    data: {
      orgId,
      title: "Decide on the remaining candidate signal",
      description:
        "One candidate from the last cycle is still awaiting a decision. Nothing it suggests reaches the plan until you approve or reject it.",
      kind: "decide",
      audience: "client",
      priority: "medium",
      estimateMin: 10,
      status: "open",
      createdAt: daysAgo(2),
    },
  });

  void researchIds;

  return {
    runs: 2,
    evidence: evidenceIds.length,
    candidates: CANDIDATES.length,
    approved: approvedCount,
    tests: testCount,
    proofPeriods: PROOF_PERIODS.length,
  };
}
