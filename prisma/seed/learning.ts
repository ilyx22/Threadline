import type { PrismaClient } from "@prisma/client";

/**
 * The learning loop, demonstrated end to end.
 *
 *   SCORE -> EXPLAIN -> DIAGNOSE -> PRESCRIBE -> RETEST
 *
 * One thesis, three attempts, and a visible trajectory. The shape is chosen to
 * teach the reader what the system is for in about thirty seconds:
 *
 *   1. **The first attempt under-performs on reach but engages well.** That is
 *      the diagnosis worth showing, because the naive reading ("it flopped,
 *      drop it") is wrong: the thesis earned its audience once it reached them.
 *   2. **The correction is recorded and marked as having worked.** A closed
 *      loop is the only thing that distinguishes a learning system from a
 *      dashboard.
 *   3. **A second correction is left pending.** Most corrections are pending
 *      most of the time, and a demo where every loop is neatly closed would
 *      misrepresent how this actually feels to operate.
 *
 * Everything here hangs off content the main seed already created, so the
 * lineage is real rather than a parallel fiction.
 */
export async function seedLearning(
  prisma: PrismaClient,
  orgId: string,
  operatorId: string,
  founderId: string,
  contentIds: Map<string, string>,
  daysAgo: (days: number, hour?: number) => Date,
) {
  /* ------------------------------- The thesis ------------------------------- */

  const root = await prisma.contentRoot.create({
    data: {
      orgId,
      label: "The CRM is not the problem",
      thesis:
        "Pipeline data is unreliable because the system asks people to do work that benefits somebody else. Blaming the reps for poor hygiene treats a design failure as a discipline failure, and no amount of chasing fixes it.",
      audience: "Founders and sales leaders at 20-200 person B2B companies",
      pillar: "Forecast reliability",
      status: "open",
      createdById: operatorId,
      createdAt: daysAgo(58),
      updatedAt: daysAgo(58),
    },
  });

  // A second thesis that has already been retired, so `abandoned` is visible as
  // a legitimate outcome rather than something the system hides.
  await prisma.contentRoot.create({
    data: {
      orgId,
      label: "Everyone is drowning in tools",
      thesis:
        "Sales teams are buying more software than they can operate, and the tool sprawl is the real reason forecasting slips.",
      audience: "Operations leads",
      pillar: "Forecast reliability",
      status: "abandoned",
      closedAt: daysAgo(20),
      closedReason:
        "Two attempts, both reached the right people and neither produced a single reply that named the problem. The market does not experience this as a problem worth solving, whatever we thought.",
      createdById: operatorId,
      createdAt: daysAgo(52),
      updatedAt: daysAgo(20),
    },
  });

  /* ------------------------ Attach the existing content ---------------------- */

  // Titles from the main seed. Missing ones are skipped rather than invented:
  // a lineage claim about content that does not exist would be a lie in a demo
  // whose entire selling point is that it does not fake things.
  const lineage: { title: string; role: "source" | "derivative" | "retest" }[] = [
    { title: "Your CRM is not the problem", role: "source" },
    { title: "Stop asking your reps to be disciplined", role: "retest" },
    { title: "Pipeline hygiene is not a discipline problem", role: "derivative" },
  ];

  const attached: { id: string; role: string; title: string }[] = [];
  let previousSourceId: string | null = null;

  for (const entry of lineage) {
    const id = contentIds.get(entry.title);
    if (!id) continue;
    await prisma.contentItem.update({
      where: { id },
      data: {
        rootId: root.id,
        lineageRole: entry.role,
        derivedFromId: entry.role === "derivative" ? previousSourceId : null,
      },
    });
    if (entry.role === "source") previousSourceId = id;
    attached.push({ id, role: entry.role, title: entry.title });
  }

  const source = attached.find((a) => a.role === "source");
  const retest = attached.find((a) => a.role === "retest");

  /* ------------------------- What we expected, frozen ------------------------ */

  const dimensions = (over: Record<string, number> = {}) =>
    JSON.stringify(
      [
        ["icp_relevance", 4],
        ["hook_strength", 4],
        ["authority_signal", 5],
        ["delivery", 4],
        ["retention_structure", 3],
        ["proof_credibility", 4],
        ["commercial_intent", 4],
        ["voice_cta_fit", 3],
      ].map(([key, score]) => ({
        key,
        score: over[key as string] ?? score,
        source: "rubric",
        reason: "Seeded illustration of the decomposition, not a real model run.",
      })),
    );

  let sourceExpectationId: string | null = null;

  if (source) {
    const expectation = await prisma.contentExpectation.create({
      data: {
        orgId,
        rootId: root.id,
        subjectType: "content",
        subjectId: source.id,
        rubricVersion: "v0.1",
        overall: 78,
        dimensions: dimensions(),
        predictedStrengths: JSON.stringify([
          "Contradicts what most sales leaders have been told, which earns a second read.",
          "The founder has run the teams, so the claim is hard to dismiss as theory.",
        ]),
        predictedWeaknesses: JSON.stringify([
          "The opening names the category rather than the moment it goes wrong.",
        ]),
        expectedClass: "strong",
        confidence: "low",
        calibrated: false,
        provider: "seed",
        model: "seed",
        promptVersion: "seed",
        reasoning:
          "Illustrative expectation shipped with the seed. Not a real evaluation.",
        createdById: operatorId,
        createdAt: daysAgo(46),
      },
    });
    sourceExpectationId = expectation.id;
  }

  if (retest) {
    await prisma.contentExpectation.create({
      data: {
        orgId,
        rootId: root.id,
        subjectType: "content",
        subjectId: retest.id,
        rubricVersion: "v0.1",
        // Higher, because the correction was applied to the thing the first
        // reading said was weak.
        overall: 84,
        dimensions: dimensions({ hook_strength: 5, retention_structure: 4 }),
        predictedStrengths: JSON.stringify([
          "Opens on the instruction a sales leader has actually given, not on the concept.",
          "Same argument, which already engaged the people who reached it.",
        ]),
        predictedWeaknesses: JSON.stringify(["The ask is still soft."]),
        expectedClass: "strong",
        confidence: "moderate",
        calibrated: false,
        provider: "seed",
        model: "seed",
        promptVersion: "seed",
        createdById: operatorId,
        createdAt: daysAgo(24),
      },
    });
  }

  /* ----------------------------- What we concluded --------------------------- */

  let diagnosisId: string | null = null;

  if (source) {
    const diagnosis = await prisma.contentDiagnosis.create({
      data: {
        orgId,
        rootId: root.id,
        contentItemId: source.id,
        expectationId: sourceExpectationId,
        windowStart: daysAgo(44),
        windowEnd: daysAgo(30),
        maturityDays: 14,
        evidence: JSON.stringify({
          note: "Illustrative evidence shipped with the seed.",
          band: "under",
          snapshotCount: 3,
          engagementRate: 0.061,
          saveRate: 0.019,
        }),
        strongestDimension: "authority_signal",
        weakestDimension: "hook_strength",
        failureClass: "hook_packaging",
        explanation:
          "Reach came in flat while the people who did see it responded strongly — a 6.1% engagement rate and saves well above this client's norm. That pattern points at the opening rather than the idea: the argument earned its audience once it was reached.",
        failedAssumption:
          "That naming the category plainly would be enough to earn the first two lines.",
        confidence: "moderate",
        preserveThesis: true,
        prescription: "Keep the thesis. Rewrite the opening and retest two hooks against it.",
        nextIntervention: "hook",
        retestBatchSize: 2,
        aiAssisted: false,
        provider: "seed",
        model: "seed",
        approvalState: "approved",
        approvedAt: daysAgo(29),
        approvedById: founderId,
        createdById: operatorId,
        createdAt: daysAgo(30),
        updatedAt: daysAgo(29),
      },
    });
    diagnosisId = diagnosis.id;
  }

  /* ------------------------------- Corrections -------------------------------- */

  if (diagnosisId) {
    // Closed loop: the correction was tested and it worked.
    await prisma.correctionEntry.create({
      data: {
        orgId,
        rootId: root.id,
        diagnosisId,
        believed:
          "That stating the CRM problem clearly would be enough to hold attention in the opening lines.",
        actual:
          "Reach sat flat against this client's median while engagement among the people who did see it ran roughly three times their norm.",
        failedAssumption:
          "That a clearly-stated problem is as arresting as a specific instruction. It is not — this audience has heard the category before.",
        correction:
          "Open on the sentence a sales leader has actually said out loud — telling the team to be more disciplined — and put the systems argument second.",
        lever: "hook",
        worked: true,
        verdictNote:
          "The retest reached roughly 4x the original within the same window and held the engagement rate. Same argument, different opening.",
        verdictAt: daysAgo(10),
        retestContentItemId: retest?.id ?? null,
        createdById: operatorId,
        createdAt: daysAgo(29),
        updatedAt: daysAgo(10),
      },
    });

    // Open loop: recorded, not yet tested. This is the normal state and the
    // reports count it as pending rather than as a failure.
    await prisma.correctionEntry.create({
      data: {
        orgId,
        rootId: root.id,
        diagnosisId,
        believed:
          "That an audience persuaded by the argument would follow a soft closing line to the site.",
        actual:
          "Strong saves and almost no tracked clicks. People kept it and did not act on it.",
        failedAssumption:
          "That saving and acting are the same intent expressed differently.",
        correction:
          "Replace the closing line with a specific, low-commitment next step tied to the problem just described.",
        lever: "cta",
        worked: null,
        createdById: operatorId,
        createdAt: daysAgo(9),
        updatedAt: daysAgo(9),
      },
    });
  }

  return { rootId: root.id, attached: attached.length };
}
