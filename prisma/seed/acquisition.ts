import type { PrismaClient } from "@prisma/client";

/**
 * Demo data for Threadline's own acquisition — the Living SOP Engine.
 *
 * This is not tenant data. It is Threadline running Threadline, and it is
 * seeded to show the engine in the state a real launch is actually in rather
 * than a flattering one:
 *
 *   - the active wedge was chosen days ago and has zero research conversations,
 *     so the commercial-testing gate genuinely refuses and the pipeline visibly
 *     belongs to the wedge that was set aside;
 *   - the funnel has enough first touches for a booking rate and too few calls
 *     for a close rate, so some steps read "too few to judge";
 *   - the qualification rate is measured, because call outcomes exist;
 *   - one record deliberately sits in each of the states the cockpit surfaces,
 *     so the queues are not empty on a first run.
 *
 * Every company below is fictional.
 */

type SeedContext = {
  prisma: PrismaClient;
  operatorId: string;
  superAdminId: string;
  daysAgo: (days: number, hour?: number) => Date;
  daysFromNow: (days: number, hour?: number) => Date;
};

/**
 * The active wedge: senior founder- and partner-led AI and digital
 * transformation advisory firms, US and UK.
 *
 * Seeded at immersion with **no research conversations**, which is the honest
 * state of it. The previous wedge is kept below as inactive history rather than
 * deleted — a business that cannot say which wedges it tried, and why it set
 * them down, cannot tell whether it is learning or just drifting.
 */
const WEDGE = {
  label: "Founder-led AI and digital transformation advisories, US and UK",
  summary:
    "Senior partner- or founder-led consultancies selling AI and digital transformation work into mid-market and enterprise buyers. The founder's judgement is the product, and buyers are choosing between firms that all describe themselves in nearly identical language.",
  problem:
    "Hypothesis, not yet validated: the expertise that differentiates the firm never reaches the market, so it competes on undifferentiated positioning against every other firm claiming AI capability — and has to re-establish credibility from scratch in each sales conversation.",
  outcome:
    "The founder's judgement is visible enough before the first conversation that buyers arrive already believing this firm knows something the others do not.",
  qualification:
    "A proven offer with engagement economics that make a five-figure commitment rational, a founder whose credibility materially affects who wins the work, capacity to take on more, and a willingness to record.",
  mechanism:
    "Market evidence to signal, signal to strategy, strategy to script, script to recorded footage, footage to published asset, published asset back to commercial signal.",
};

/**
 * The wedge that was active before, kept as history.
 *
 * Its three research conversations stay attached to it. They were real evidence
 * about that market and they say nothing about this one, so moving them across
 * would be manufacturing validation for a hypothesis that has none.
 */
const PREVIOUS_WEDGE = {
  label: "Independent M&A and corporate finance advisors, 5–25 people",
  summary:
    "Owner-led advisory firms where the founder's judgement is the product. They win work through reputation and referral, and the founder is the only person who can credibly explain what the firm actually knows.",
  problem:
    "The expertise that wins mandates never leaves the room. Content gets started, stalls the moment a live deal appears, and the firm stays invisible to buyers who are not already in the referral network.",
  outcome:
    "The founder's judgement reaches the market consistently enough that inbound conversations start arriving from people who have not been referred.",
  qualification:
    "A proven offer with deal economics that make a five-figure engagement rational, a founder whose credibility materially affects who wins the mandate, and capacity to take on more work.",
  mechanism:
    "Market evidence to signal, signal to strategy, strategy to script, script to recorded footage, footage to published asset, published asset back to commercial signal.",
  setAside:
    "Set aside in favour of AI and digital transformation advisory. Three research conversations were completed and are kept below. The reason for moving was reachability and the founder's own access, not evidence that this market lacks the problem — if the current wedge fails, this is the first place to come back to.",
};

/**
 * Three conversations, belonging to the PREVIOUS wedge.
 *
 * Below the interim checkpoint, let alone the ten that make a wedge eligible
 * for a validation decision. Kept with the wedge they were about.
 */
const CONVERSATIONS = [
  {
    person: "Managing partner, mid-market advisory",
    company: "Fictional Advisory A",
    problem:
      "Content stops the moment a deal goes live. Six weeks of nothing, then a burst, then nothing again.",
    volunteered: true,
    quote:
      "We are the most consistent people in the world at client work and the least consistent at anything that markets us.",
    currentProcess:
      "The founder writes posts himself between meetings. No research step. Nobody else can write in his voice.",
    triedBefore: "Hired a marketing generalist for nine months. They produced volume nobody read.",
    consequence:
      "Estimates two or three mandates a year come from reputation they cannot influence deliberately.",
  },
  {
    person: "Founding partner, boutique corporate finance",
    company: "Fictional Advisory B",
    problem:
      "Everything published sounds like everyone else in the sector, because the interesting parts are the parts they are nervous about saying.",
    volunteered: true,
    quote: "The stuff worth saying is the stuff our compliance instinct removes.",
    currentProcess: "An agency writes from a quarterly briefing call. The founder rewrites most of it.",
    triedBefore: "Two agencies. Both produced competent, anonymous content.",
    consequence:
      "Rewriting costs the founder around four hours a week and the output still gets no response.",
  },
  {
    person: "Partner, sector-specialist advisory",
    company: "Fictional Advisory C",
    problem:
      "They can produce content but cannot tell whether any of it contributed to a conversation.",
    volunteered: false,
    quote: "We assume it helps. We have never been able to show that it does.",
    currentProcess: "In-house marketer publishes weekly. No source question on the enquiry form.",
    triedBefore: "Nothing systematic.",
    consequence:
      "Cannot justify increasing the budget, so it stays at a level that cannot work.",
  },
];

export async function seedAcquisition(ctx: SeedContext) {
  const { prisma, operatorId, superAdminId, daysAgo, daysFromNow } = ctx;

  /* ---------------------------------- Wedge --------------------------------- */

  const wedge = await prisma.marketWedge.create({
    data: {
      label: WEDGE.label,
      // Immersion, with no conversations yet. A wedge chosen last week has not
      // been validated, and seeding it as though it had would be the exact
      // dishonesty the validation gate exists to prevent.
      state: "immersion",
      active: true,
      summary: WEDGE.summary,
      problem: WEDGE.problem,
      outcome: WEDGE.outcome,
      qualification: WEDGE.qualification,
      mechanism: WEDGE.mechanism,
      scoreEconomics: 5,
      scorePain: 4,
      scoreReach: 4,
      scorePrecedent: 3,
      ownerId: superAdminId,
      nextAction: "Complete the immersion brief, then book the first research conversations",
      nextActionDueAt: daysFromNow(9),
      notes:
        "Chosen over the M&A wedge on reachability and founder access. Precedent is the weakest input: these firms buy demand generation, but managed founder-content operations are less established. Nothing here is validated — zero research conversations so far.",
      createdAt: daysAgo(6),
    },
  });

  // The previous wedge, kept as history. Inactive, and holding the three
  // conversations that were genuinely about it.
  const previous = await prisma.marketWedge.create({
    data: {
      label: PREVIOUS_WEDGE.label,
      state: "interviews",
      active: false,
      summary: PREVIOUS_WEDGE.summary,
      problem: PREVIOUS_WEDGE.problem,
      outcome: PREVIOUS_WEDGE.outcome,
      qualification: PREVIOUS_WEDGE.qualification,
      mechanism: PREVIOUS_WEDGE.mechanism,
      scoreEconomics: 5,
      scorePain: 4,
      scoreReach: 3,
      scorePrecedent: 4,
      ownerId: superAdminId,
      nextAction: "Hold. Revisit only if the current wedge fails",
      nextActionDueAt: daysFromNow(45),
      notes: PREVIOUS_WEDGE.setAside,
      createdAt: daysAgo(24),
    },
  });

  // A second candidate, kept rather than deleted. Recording why a wedge was not
  // chosen is what makes it possible to revisit the decision later.
  await prisma.marketWedge.create({
    data: {
      label: "Specialist recruitment firms, 10–40 people",
      state: "candidate",
      summary:
        "Founder-led recruitment businesses in a defined vertical, where the founder's network is the asset.",
      scoreEconomics: 3,
      scorePain: 4,
      scoreReach: 4,
      scorePrecedent: 2,
      ownerId: superAdminId,
      nextAction: "Hold until the first wedge is decided",
      nextActionDueAt: daysFromNow(30),
      notes:
        "Reachable and clearly in pain, but the deal economics are thinner and the sector is crowded with people selling content services already.",
      createdAt: daysAgo(24),
    },
  });

  for (const [index, conversation] of CONVERSATIONS.entries()) {
    await prisma.validationConversation.create({
      data: {
        wedgeId: previous.id,
        person: conversation.person,
        company: conversation.company,
        heldAt: daysAgo(18 - index * 4),
        problem: conversation.problem,
        volunteered: conversation.volunteered,
        // Themes assigned by an operator. Two of the three converge; the third
        // described a different problem and is themed as such rather than being
        // folded in to make the sample look stronger.
        problemTheme:
          conversation.volunteered && index < 2
            ? "expertise never leaves the room"
            : "cannot tell whether content contributed",
        quote: conversation.quote,
        currentProcess: conversation.currentProcess,
        triedBefore: conversation.triedBefore,
        consequence: conversation.consequence,
      },
    });
  }

  // Immersion is finished; the interview checklist is genuinely part-done.
  await prisma.sopCheck.createMany({
    data: [
      { wedgeId: previous.id, state: "immersion", key: "companies", done: true },
      { wedgeId: previous.id, state: "immersion", key: "founders", done: true },
      {
        wedgeId: previous.id,
        state: "immersion",
        key: "language",
        done: true,
        note: "Twenty-three phrases captured verbatim. The recurring one is some version of 'we are invisible to anyone who has not already worked with us'.",
      },
      {
        wedgeId: previous.id,
        state: "immersion",
        key: "current",
        done: true,
        note: "Content is almost always the founder writing between meetings. It breaks whenever a mandate goes live, which is most of the time.",
      },
      {
        wedgeId: previous.id,
        state: "immersion",
        key: "problem_bank",
        done: true,
        note: "Eleven symptoms recorded. Candidate root problems: no owner, no research step, and no way to tell whether any of it worked.",
      },
      {
        wedgeId: previous.id,
        state: "immersion",
        key: "rules",
        done: true,
        note: "A-fit: proven offer, founder-led credibility, capacity for more work. Disqualifiers: pre-revenue, low-ticket, expects guaranteed reach or revenue.",
      },
      {
        wedgeId: previous.id,
        state: "interviews",
        key: "disconfirming",
        done: true,
        note: "The third conversation did not describe the same problem unprompted — they framed it as measurement rather than production. Recorded rather than smoothed over.",
      },
    ],
  });

  /* --------------------------------- Target --------------------------------- */

  const periodStart = daysAgo(28);
  const periodEnd = daysFromNow(62);

  await prisma.acquisitionTarget.create({
    data: {
      label: "First two retained clients",
      targetWins: 2,
      periodStart,
      periodEnd,
      status: "active",
      // Deliberately conservative placeholders. They are shown as assumptions
      // everywhere and are replaced by real rates as soon as the sample allows.
      assumedBookingRatePct: 2,
      assumedShowRatePct: 75,
      assumedQualifiedRatePct: 75,
      assumedCloseRatePct: 15,
      notes:
        "The rates here are planning assumptions, not benchmarks, and not borrowed from anyone. They exist so the arithmetic can run before Threadline has its own numbers.",
    },
  });

  /* -------------------------------- Prospects ------------------------------- */

  // Attached to the PREVIOUS wedge, because that is where they were sourced.
  // Moving them across would show a pipeline for a hypothesis that has none —
  // and the cost of changing wedge is exactly this: a pipeline pointing at a
  // market you have set aside. That is worth seeing rather than hiding.

  const companies = [
    "Halcyon Corporate Finance",
    "Marlowe & Reed Advisory",
    "Stonebridge Partners",
    "Keel Advisory Group",
    "Ardent Corporate Finance",
    "Northgate Deal Advisory",
    "Wren & Locke",
    "Pemberton Transaction Services",
    "Vaux Advisory",
    "Calder Partners",
    "Sableworth Advisory",
    "Trenton Reed & Co",
    "Ashcombe Corporate Finance",
    "Linfield Advisory",
    "Barrow Hill Partners",
    "Everly Deal Advisory",
    "Fenwick & Shaw",
    "Roderick Grey Advisory",
  ];

  /**
   * A quiet bulk of contacted records, so the booking rate has a real
   * denominator. These carry no calls and no replies — which is what most
   * outreach looks like, and pretending otherwise would make the funnel read
   * far better than any launch actually does.
   */
  const bulk = [];
  for (let i = 0; i < 46; i += 1) {
    bulk.push({
      company: `${companies[i % companies.length]} ${Math.floor(i / companies.length) + 1}`,
      sourceNote: "Sourced from the wedge list",
      state: "contacted",
      tier: i % 5 === 0 ? "a" : "b",
      wedgeId: previous.id,
      channel: i % 7 === 0 ? "referral" : "direct outreach",
      ownerId: superAdminId,
      nextAction: "Follow up if there is no reply",
      nextActionDueAt: daysFromNow((i % 9) - 2),
      firstTouchAt: daysAgo(26 - Math.floor(i / 2)),
      ...(i % 9 === 0 ? { repliedAt: daysAgo(20 - Math.floor(i / 2)) } : {}),
    });
  }
  await prisma.prospect.createMany({ data: bulk });

  /* One record in each state the cockpit surfaces. */

  await prisma.prospect.create({
    data: {
      company: "Thackeray Corporate Finance",
      contactName: "Managing partner",
      website: "https://example.com",
      state: "new",
      tier: "a",
      wedgeId: previous.id,
      channel: "referral",
      ownerId: superAdminId,
      nextAction: "Qualify this prospect or reject it",
      nextActionDueAt: daysFromNow(1),
      sourceNote: "Mentioned by name in the second research conversation.",
      createdAt: daysAgo(2),
    },
  });

  const aTier = await prisma.prospect.create({
    data: {
      company: "Ravensworth Advisory",
      contactName: "Founding partner",
      website: "https://example.com",
      state: "qualified_a",
      tier: "a",
      wedgeId: previous.id,
      channel: "direct outreach",
      ownerId: superAdminId,
      economicsNote:
        "Typical mandate fee in the low six figures. One additional mandate a year would cover several years of this.",
      constraintHypothesis:
        "Hypothesis, not a diagnosis: they have distribution and no point of view. Everything published could have come from any firm in the sector.",
      nextAction: "Finish the teardown and send it",
      nextActionDueAt: daysFromNow(1),
      createdAt: daysAgo(4),
    },
  });

  await prisma.sopCheck.createMany({
    data: [
      { prospectId: aTier.id, state: "qualified_a", key: "website", done: true },
      { prospectId: aTier.id, state: "qualified_a", key: "founder", done: true },
      {
        prospectId: aTier.id,
        state: "qualified_a",
        key: "specific",
        done: true,
        note: "Advised on a carve-out that made the trade press last year, and the founder was quoted explaining the structure clearly.",
      },
      {
        prospectId: aTier.id,
        state: "qualified_a",
        key: "constraint",
        done: true,
        note: "Publishing consistently, saying nothing anyone could disagree with. Differentiation rather than volume.",
      },
    ],
  });

  await prisma.prospect.create({
    data: {
      company: "Ledgerwood Partners",
      contactName: "Partner",
      state: "qualified_b",
      tier: "b",
      wedgeId: previous.id,
      channel: "direct outreach",
      ownerId: operatorId,
      nextAction: "Research and send the first touch",
      nextActionDueAt: daysFromNow(0),
      createdAt: daysAgo(3),
    },
  });

  await prisma.prospect.create({
    data: {
      company: "Aldermere Advisory",
      contactName: "Managing director",
      state: "replied",
      tier: "b",
      wedgeId: previous.id,
      channel: "direct outreach",
      ownerId: superAdminId,
      replyClass: "send_info",
      firstTouchAt: daysAgo(9),
      repliedAt: daysAgo(2),
      nextAction: "Send the smallest useful thing, and ask one question only they can answer",
      nextActionDueAt: daysFromNow(0),
      notes:
        "Asked us to 'send some information'. Usually a polite deferral rather than a request for a document.",
      createdAt: daysAgo(12),
    },
  });

  const booked = await prisma.prospect.create({
    data: {
      company: "Corvel Deal Advisory",
      contactName: "Founder",
      state: "booked",
      tier: "a",
      wedgeId: previous.id,
      channel: "referral",
      ownerId: superAdminId,
      firstTouchAt: daysAgo(14),
      repliedAt: daysAgo(8),
      positiveReplyAt: daysAgo(8),
      replyClass: "interested",
      economicsNote: "Six to eight mandates a year, average fee around GBP 90k.",
      nextAction: "Prepare the call",
      nextActionDueAt: daysFromNow(0),
      createdAt: daysAgo(16),
    },
  });

  await prisma.salesCall.create({
    data: {
      prospectId: booked.id,
      scheduledAt: daysFromNow(1, 14),
      ownerId: superAdminId,
    },
  });

  await prisma.sopCheck.createMany({
    data: [
      { prospectId: booked.id, state: "booked", key: "prior", done: true },
      { prospectId: booked.id, state: "booked", key: "model", done: true },
      {
        prospectId: booked.id,
        state: "booked",
        key: "economics",
        done: true,
        note: "Six to eight mandates a year at roughly GBP 90k. One extra mandate justifies a year of this several times over — worth saying only if they raise it.",
      },
      { prospectId: booked.id, state: "booked", key: "content", done: true },
    ],
  });

  /* Two completed calls, so the qualified rate is measured rather than assumed. */

  const won = await prisma.prospect.create({
    data: {
      company: "Ellsworth Corporate Finance",
      contactName: "Managing partner",
      state: "proposal",
      tier: "a",
      wedgeId: previous.id,
      channel: "referral",
      ownerId: superAdminId,
      firstTouchAt: daysAgo(30),
      repliedAt: daysAgo(24),
      positiveReplyAt: daysAgo(24),
      replyClass: "interested",
      nextAction: "Chase the decision agreed on the call",
      nextActionDueAt: daysFromNow(2),
      createdAt: daysAgo(32),
    },
  });

  await prisma.salesCall.create({
    data: {
      prospectId: won.id,
      scheduledAt: daysAgo(6, 11),
      completedAt: daysAgo(6, 12),
      attended: true,
      qualified: true,
      offerMade: true,
      outcome: "proposal_process",
      ownerId: superAdminId,
      stagesCovered: JSON.stringify([
        "open",
        "economics",
        "current_state",
        "desired_state",
        "constraint",
        "consequence",
        "prescription",
        "demo",
        "commercials",
        "decision",
      ]),
      stageNotes: JSON.stringify({
        economics: "Eight mandates a year, average fee around GBP 120k. Capacity for two or three more.",
        constraint:
          "Not production. They publish. Nothing they publish distinguishes them from four other firms the buyer is also speaking to.",
        consequence:
          "Their words: competing on relationships they have not built yet, against firms the buyer already knows.",
      }),
      voc: "We are not short of things to say. We are short of a reason anyone should hear it from us rather than from the firm down the road.",
      objections: "Wants to understand what happens if the founder cannot record for three weeks during a live deal.",
      valueMinor: 1_000_000,
    },
  });

  const notFit = await prisma.prospect.create({
    data: {
      company: "Bramley Ventures",
      contactName: "Founder",
      state: "not_fit",
      tier: "b",
      wedgeId: previous.id,
      channel: "direct outreach",
      ownerId: operatorId,
      firstTouchAt: daysAgo(26),
      repliedAt: daysAgo(21),
      positiveReplyAt: daysAgo(21),
      replyClass: "interested",
      closedAt: daysAgo(13),
      closedReason:
        "Pre-revenue and looking for reach. A legitimate no-fit — selling into it would have cost more than losing it.",
      createdAt: daysAgo(28),
    },
  });

  await prisma.salesCall.create({
    data: {
      prospectId: notFit.id,
      scheduledAt: daysAgo(13, 10),
      completedAt: daysAgo(13, 11),
      attended: true,
      qualified: false,
      offerMade: false,
      outcome: "not_fit",
      ownerId: operatorId,
      stagesCovered: JSON.stringify(["open", "economics"]),
      stageNotes: JSON.stringify({
        economics: "Pre-revenue, raising. No offer to point content at yet.",
      }),
      voc: "We want to be known before we launch.",
    },
  });

  /* --------------------------- The weekly control loop ---------------------- */

  const lastWeek = daysAgo(7);
  lastWeek.setHours(0, 0, 0, 0);
  const monday = new Date(lastWeek);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  await prisma.funnelReview.create({
    data: {
      weekStart: monday,
      counts: JSON.stringify({
        firstTouches: 24,
        replies: 3,
        positiveReplies: 2,
        booked: 1,
        showed: 1,
        qualified: 1,
        offers: 1,
        won: 0,
      }),
      brokenStep: "reply",
      variableChanged: "The opening line of the first touch",
      hypothesis:
        "Leading with the observation about their own content rather than with what Threadline does should raise the reply rate. Everything else stays the same so the comparison is readable.",
      learning:
        "Three replies from twenty-four is too thin to conclude anything, but the two that came back both mentioned the specific observation rather than the offer. Worth one more week before deciding.",
      createdById: superAdminId,
    },
  });

  return { wedgeId: wedge.id };
}
