import type { AiProvider, AiRequest, AiResult } from "./provider";
import { AiError } from "./provider";

/**
 * Deterministic demo provider.
 *
 * Used whenever ANTHROPIC_API_KEY is absent. It composes output from the
 * workspace's own Brand Brain, research and performance data (passed as
 * `demoContext`), so a demo reads as coherent and specific rather than as
 * placeholder text.
 *
 * Two rules this provider must never break:
 *   1. Every result is flagged `isDemo: true`, and the UI labels it visibly.
 *      It must never be possible to mistake demo output for a live model call.
 *   2. It invents no facts about the client's business. It recombines material
 *      already stored in the workspace; anything resembling a statistic is
 *      emitted as an unverified claim for a human to check.
 */

export class MockProvider implements AiProvider {
  readonly name = "demo";
  readonly model = "threadline-demo-composer";
  readonly isDemo = true;

  async complete(request: AiRequest): Promise<AiResult> {
    // A short, variable delay keeps loading states honest and testable.
    await delay(320 + (hash(request.promptKey) % 380));

    const ctx = (request.demoContext ?? {}) as DemoContext;
    const text = this.render(request.promptKey, ctx);

    return {
      text,
      provider: this.name,
      model: this.model,
      inputTokens: estimateTokens(request.system + request.messages.map((m) => m.content).join("")),
      outputTokens: estimateTokens(text),
      isDemo: true,
    };
  }

  private render(promptKey: string, ctx: DemoContext): string {
    switch (promptKey) {
      case "ideas.generate":
        return JSON.stringify({ ideas: buildIdeas(ctx) });
      case "script.generate":
        return JSON.stringify(buildScript(ctx));
      case "script.hooks":
        return JSON.stringify({ hooks: buildHooks(ctx) });
      case "script.refine":
        return JSON.stringify(refineScript(ctx));
      case "packaging.generate":
        return JSON.stringify({ packages: buildPackaging(ctx) });
      case "patterns.detect":
        return JSON.stringify({ patterns: buildPatterns(ctx) });
      case "signals.extract":
        return JSON.stringify({ signals: buildSignals(ctx) });
      case "brief.summary":
        return buildBrief(ctx);
      case "report.narrative":
        return buildNarrative(ctx);
      case "lead.reply":
        return buildLeadReply(ctx);
      case "corpus.analyse":
        return JSON.stringify(buildExampleAnalysis(ctx));
      case "judge.evaluate":
        return JSON.stringify({ scores: buildJudgeScores(ctx) });
      default:
        throw new AiError(`No demo output is defined for "${promptKey}".`);
    }
  }
}

/* ------------------------------ Shared context ----------------------------- */

type DemoContext = {
  /** Corpus analysis and the Judge. */
  title?: string;
  rubricKeys?: string[];
  founderName?: string;
  company?: string;
  offerName?: string;
  offerOutcome?: string;
  offerMechanism?: string;
  pains?: string[];
  desires?: string[];
  objections?: string[];
  beliefs?: string[];
  opinions?: string[];
  stories?: string[];
  phrasesUsed?: string[];
  pillars?: string[];
  platforms?: string[];
  ctas?: string[];
  audience?: string;
  researchTitles?: string[];
  customerQuotes?: string[];
  topPerformers?: { title: string; views: number }[];
  learnings?: string[];
  count?: number;
  // Script-specific
  ideaTitle?: string;
  ideaAngle?: string;
  ideaHook?: string;
  scriptType?: string;
  platform?: string;
  targetSeconds?: number;
  existingBody?: string;
  existingHook?: string;
  instruction?: string;
  instructionLabel?: string;
  // Packaging
  contentTitle?: string;
  targetPlatforms?: string[];
  // Intelligence run
  evidenceRefs?: string[];
  evidenceTitles?: string[];
  evidenceKinds?: string[];
  periodLabel?: string;
  approvedTitles?: string[];
  approvedSoWhat?: string[];
  testTitles?: string[];
  sourceSummary?: string;
  // Report
  shipped?: number;
  views?: number;
  inquiries?: number;
  calls?: number;
  bottleneck?: string;
  /** Lead reply (AI-06). */
  leadName?: string;
  leadMessage?: string;
};

function pick<T>(list: T[] | undefined, index: number, fallback: T): T {
  if (!list || list.length === 0) return fallback;
  return list[index % list.length] as T;
}

/* --------------------------------- Ideas ---------------------------------- */

const IDEA_SHAPES = [
  {
    frame: "The belief piece",
    build: (c: DemoContext, i: number) => ({
      title: `The ${pick(c.pains, i, "hiring")} problem nobody names out loud`,
      angle: "Contrarian belief stated plainly, then defended with one real example.",
      hook: `Most ${c.audience ?? "founders"} think ${pick(c.pains, i, "this")} is a people problem. It isn't.`,
      objective: "Authority",
      intent: "medium",
    }),
  },
  {
    frame: "The mechanism explainer",
    build: (c: DemoContext, i: number) => ({
      title: `How ${c.offerMechanism ?? "the system"} actually works, in four steps`,
      angle: "Teach the mechanism behind the outcome so the offer becomes legible.",
      hook: `There are four steps between ${pick(c.pains, i, "the problem")} and ${c.offerOutcome ?? "the result"}. Most people skip two.`,
      objective: "Education",
      intent: "high",
    }),
  },
  {
    frame: "The objection teardown",
    build: (c: DemoContext, i: number) => ({
      title: `"${pick(c.objections, i, "It is too expensive")}" — the honest answer`,
      angle: "Take the objection seriously, then reframe what it is actually measuring.",
      hook: `Someone told me last week: "${pick(c.objections, i, "we can't justify the cost")}". They were half right.`,
      objective: "Objection handling",
      intent: "high",
    }),
  },
  {
    frame: "The specific story",
    build: (c: DemoContext, i: number) => ({
      title: pick(c.stories, i, "The month I got this badly wrong"),
      angle: "A first-person account with a number in it and a lesson that transfers.",
      hook: `I got this wrong once, and it cost more than I want to admit.`,
      objective: "Trust",
      intent: "medium",
    }),
  },
  {
    frame: "The customer language mirror",
    build: (c: DemoContext, i: number) => ({
      title: `What "${pick(c.customerQuotes, i, "we just need more pipeline")}" really means`,
      angle: "Take language customers actually use and decode what sits underneath it.",
      hook: `"${pick(c.customerQuotes, i, "We just need more pipeline")}" — I hear this every week. It's almost never the real problem.`,
      objective: "Resonance",
      intent: "high",
    }),
  },
  {
    frame: "The teardown",
    build: (c: DemoContext, i: number) => ({
      title: `A teardown: ${pick(c.researchTitles, i, "a competitor's approach")}`,
      angle: "Break down a real, public example and extract the transferable principle.",
      hook: "I pulled apart a real example this week. Here is what held up and what didn't.",
      objective: "Authority",
      intent: "low",
    }),
  },
  {
    frame: "The cost of delay",
    build: (c: DemoContext, i: number) => ({
      title: `The compounding cost of putting off ${pick(c.pains, i, "this decision")}`,
      angle: "Quantify the drift, without inventing a statistic.",
      hook: `Every quarter you delay ${pick(c.pains, i, "this")}, the fix gets more expensive. Here's the mechanism.`,
      objective: "Urgency",
      intent: "high",
    }),
  },
  {
    frame: "The framework",
    build: (c: DemoContext, i: number) => ({
      title: `A simple test for whether ${pick(c.desires, i, "your process")} is actually working`,
      angle: "Give away a diagnostic the audience can run on themselves in five minutes.",
      hook: "Here's a five-minute test. If you fail it, you already know what to fix.",
      objective: "Lead generation",
      intent: "high",
    }),
  },
];

function buildIdeas(ctx: DemoContext) {
  const count = Math.min(Math.max(ctx.count ?? 6, 1), 12);
  const pillars = ctx.pillars?.length ? ctx.pillars : ["Founder POV", "Frameworks", "Case studies"];
  const platforms = ctx.platforms?.length ? ctx.platforms : ["linkedin"];

  return Array.from({ length: count }, (_, i) => {
    const shape = IDEA_SHAPES[i % IDEA_SHAPES.length]!;
    const built = shape.build(ctx, i);
    const seed = hash(built.title + i);

    return {
      title: built.title,
      concept: `${built.angle} Anchored to ${ctx.offerName ?? "the core offer"} without pitching it directly.`,
      audience: ctx.audience ?? "Target customer",
      painDesire: pick(ctx.pains, i, pick(ctx.desires, i, "Wants a system that holds under pressure")),
      pillar: pillars[i % pillars.length],
      platform: platforms[i % platforms.length],
      format: i % 3 === 0 ? "talking_head" : "short_form",
      angle: built.angle,
      hookConcept: built.hook,
      objective: built.objective,
      cta: pick(ctx.ctas, i, "Comment 'system' and I'll send the breakdown"),
      commercialIntent: built.intent,
      noveltyScore: 52 + (seed % 40),
      relevanceScore: 60 + (seed % 34),
      proofStrength: ctx.topPerformers?.length ? 55 + (seed % 38) : 40 + (seed % 30),
      formatFit: 58 + (seed % 36),
      rationale: `Demo composition. Frame: ${shape.frame}. Built from the workspace's stored ${
        ctx.pains?.length ? "customer pains" : "context"
      }${ctx.learnings?.length ? " and the most recent performance learning" : ""}. Review the angle before scripting.`,
    };
  });
}

/* --------------------------------- Scripts --------------------------------- */

function buildHooks(ctx: DemoContext) {
  const topic = ctx.ideaTitle ?? "this";
  const pain = pick(ctx.pains, 0, "the obvious problem");
  const objection = pick(ctx.objections, 0, "it costs too much");

  return [
    ctx.ideaHook ?? `Most people get ${topic} exactly backwards.`,
    `I used to believe ${pain} was unavoidable. I was wrong, and it cost me.`,
    `"${objection}" — I hear that every week. Here's the part that's actually true.`,
    `There's a version of ${topic} nobody talks about because it makes us look bad.`,
    `If you only change one thing about ${topic} this quarter, make it this.`,
    `Everyone optimises ${topic}. Almost nobody checks whether it should exist.`,
  ].slice(0, 6);
}

function buildScript(ctx: DemoContext) {
  const founder = ctx.founderName ?? "the founder";
  const hooks = buildHooks(ctx);
  const pain = pick(ctx.pains, 0, "the problem");
  const desire = pick(ctx.desires, 0, "the outcome you want");
  const belief = pick(ctx.beliefs, 0, "systems beat effort");
  const mechanism = ctx.offerMechanism ?? "the process";
  const cta = pick(ctx.ctas, 0, "If this is your situation, the link is in my profile.");
  const seconds = ctx.targetSeconds ?? 60;

  const body = [
    `${hooks[0]}`,
    "",
    `Here's what I actually see. ${capitalise(pain)} is almost never the root cause — it's the symptom that finally gets loud enough to notice.`,
    "",
    `The reason is structural. When ${mechanism} isn't defined, every decision gets re-litigated from scratch. That's not a discipline problem. That's a design problem.`,
    "",
    `Three things change when you fix the structure:`,
    "",
    `One — the decision gets made once and then it holds.`,
    `Two — the people around you stop waiting on you to unblock them.`,
    `Three — you get ${desire} without adding headcount to get there.`,
    "",
    `I believe ${belief}. Not because it sounds good, but because I've watched the alternative fail in the same way three times.`,
    "",
    `${cta}`,
  ].join("\n");

  return {
    hook: hooks[0],
    altHooks: hooks.slice(1),
    body,
    cta,
    filmingNotes: [
      `Straight to camera, no intro card. ${founder} starts on the hook with no preamble.`,
      "Hold a beat after the hook before the first line of the body.",
      "Drop energy slightly for the three-point section so it reads as considered, not sold.",
      "Last line delivered flat and direct — no upward inflection.",
    ].join("\n"),
    estimatedSeconds: seconds,
    claims: [
      {
        text: "I've watched the alternative fail in the same way three times.",
        reason: "First-person frequency claim — confirm this matches real engagements before recording.",
      },
      {
        text: "You get the outcome without adding headcount.",
        reason: "Outcome claim — confirm this is supportable by a real client result.",
      },
    ],
  };
}

function refineScript(ctx: DemoContext) {
  const body = ctx.existingBody ?? "";
  const instruction = ctx.instruction ?? "shorter";
  const lines = body.split("\n");

  let revised = body;
  let summary = `Demo refinement: ${ctx.instructionLabel ?? instruction}.`;

  switch (instruction) {
    case "shorter":
      revised = lines.filter((l, i) => l.trim() === "" || i % 3 !== 2).join("\n");
      summary = "Demo refinement: tightened by removing supporting lines, keeping the argument spine.";
      break;
    case "more_direct":
      revised = lines
        .map((l) => l.replace(/^(I think|I believe|Maybe|Perhaps)\s+/i, "").replace(/\bkind of\b|\bsort of\b/gi, ""))
        .join("\n");
      summary = "Demo refinement: hedging language removed, statements made declarative.";
      break;
    case "less_hype":
      revised = lines
        .map((l) =>
          l
            .replace(/\b(massive|huge|insane|game-?changing|incredible)\b/gi, "significant")
            .replace(/!+/g, "."),
        )
        .join("\n");
      summary = "Demo refinement: intensifiers and exclamation marks removed.";
      break;
    case "more_specific":
      revised = `${body}\n\nThe specific version: name the client situation, the number that moved, and the timeframe it moved in. Replace this line with the real detail before recording.`;
      summary = "Demo refinement: added a placeholder prompting a concrete, verifiable example.";
      break;
    case "add_proof":
      revised = `${body}\n\n[Proof slot] Insert the strongest cleared proof item from the Brand Brain here — a named result or a direct customer quote.`;
      summary = "Demo refinement: inserted a proof slot pointing at cleared proof items.";
      break;
    case "more_like_me":
      revised = `${body}\n\n${ctx.phrasesUsed?.length ? `In your own words: "${ctx.phrasesUsed[0]}".` : "Rewrite the closing line in your own phrasing."}`;
      summary = "Demo refinement: aligned closing to stored voice phrases.";
      break;
    case "change_angle":
      revised = `${buildHooks(ctx)[2]}\n\n${lines.slice(2).join("\n")}`;
      summary = "Demo refinement: re-opened on the objection angle instead of the belief angle.";
      break;
    default:
      revised = body;
  }

  return {
    hook: ctx.existingHook ?? buildHooks(ctx)[0],
    body: revised.trim(),
    changeSummary: summary,
  };
}

/* -------------------------------- Packaging -------------------------------- */

const PLATFORM_RULES: Record<
  string,
  { titleStyle: (t: string) => string; captionStyle: (t: string, c: DemoContext) => string; tags: string[] }
> = {
  youtube: {
    titleStyle: (t) => `${t} (the part most people skip)`,
    captionStyle: (t, c) =>
      `${t}\n\nIn this video I break down the mechanism behind ${c.offerOutcome ?? "the outcome"} and the three structural changes that make it hold.\n\nChapters:\n00:00 The problem\n00:42 Why it isn't a people problem\n01:20 The three changes\n02:40 What to do this week`,
    tags: [],
  },
  youtube_shorts: {
    titleStyle: (t) => t,
    captionStyle: (t) => `${t} #shorts`,
    tags: ["#shorts"],
  },
  linkedin: {
    titleStyle: (t) => t,
    captionStyle: (t, c) =>
      `${t}\n\nMost of the time the loud problem isn't the real one.\n\nThree things change when the structure is right:\n\n1. The decision gets made once.\n2. Nobody waits on you to unblock them.\n3. You get there without more headcount.\n\n${pick(c.ctas, 0, "Happy to go deeper if this is where you are — comment below.")}`,
    tags: [],
  },
  instagram: {
    titleStyle: (t) => t,
    captionStyle: (t) => `${t}\n\nSave this one for the next planning session.`,
    tags: ["#founders", "#operations", "#b2b"],
  },
  tiktok: {
    titleStyle: (t) => t,
    captionStyle: (t) => `${t} — the structural version, not the motivational one.`,
    tags: ["#founder", "#business"],
  },
  x: {
    titleStyle: (t) => t,
    captionStyle: (t) =>
      `${t}\n\nThe loud problem is rarely the real one.\n\nFix the structure and the symptom stops recurring.`,
    tags: [],
  },
};

function buildPackaging(ctx: DemoContext) {
  const title = ctx.contentTitle ?? "Untitled piece";
  const platforms = ctx.targetPlatforms?.length ? ctx.targetPlatforms : ["linkedin"];

  return platforms.map((platform) => {
    const rules = PLATFORM_RULES[platform] ?? PLATFORM_RULES.linkedin;
    return {
      platform,
      title: rules.titleStyle(title),
      caption: rules.captionStyle(title, ctx),
      description:
        platform === "youtube"
          ? `A breakdown of ${title.toLowerCase()} for ${ctx.audience ?? "founders"}.`
          : "",
      hashtags: rules.tags,
      overlays: [
        "Hook line, first 2 seconds, top third",
        "Three-point list as sequential text cards",
        "Closing line held on screen for the CTA",
      ],
      thumbnailConcepts:
        platform === "youtube"
          ? [
              "Founder mid-sentence, four words maximum in the frame",
              "Split frame: the symptom on the left, the structure on the right",
            ]
          : [],
      ctaOptions: ctx.ctas?.length ? ctx.ctas.slice(0, 3) : ["Comment for the breakdown"],
      clipOpportunities: [
        { label: "The hook plus the reframe", startSec: 0, endSec: 18, rationale: "Strongest standalone moment." },
        { label: "The three-point section", startSec: 24, endSec: 52, rationale: "Reads well silently with captions." },
      ],
      repurposing:
        platform === "linkedin"
          ? "Convert the three-point section into a standalone text post next week."
          : "Pull the hook into a short-form cut for the secondary platform.",
    };
  });
}

/* --------------------------------- Patterns -------------------------------- */

function buildPatterns(ctx: DemoContext) {
  const top = ctx.topPerformers ?? [];
  const patterns: {
    kind: string;
    title: string;
    description: string;
    confidence: number;
    impact: number;
    effort: number;
    nextExperiment: string;
  }[] = [];

  if (top.length >= 2) {
    patterns.push({
      kind: "pattern",
      title: "First-person opening outperforms the framework opening",
      description: `Across the pieces with the strongest reach — including "${top[0]?.title}" — the opening line is a first-person statement rather than a framework label. Pieces that open by naming the framework sit below the median.`,
      confidence: 68,
      impact: 4,
      effort: 2,
      nextExperiment: "Run three pieces next cycle where the framework name is withheld until after the second beat.",
    });
  }

  if ((ctx.objections?.length ?? 0) > 0) {
    patterns.push({
      kind: "hypothesis",
      title: `Content naming "${ctx.objections?.[0]}" attracts higher-intent conversations`,
      description:
        "Objection-led pieces appear alongside the inbound conversations recorded in the pipeline. The sample is small, so this is a hypothesis rather than a learning.",
      confidence: 45,
      impact: 5,
      effort: 2,
      nextExperiment: "Publish two objection-led pieces in the next fortnight and tag any resulting inquiries.",
    });
  }

  if ((ctx.customerQuotes?.length ?? 0) > 0) {
    patterns.push({
      kind: "outlier",
      title: `Repeated customer phrasing: "${ctx.customerQuotes?.[0]}"`,
      description:
        "This phrasing recurs across separate research items. Repeated language usually indicates a shared underlying belief worth addressing directly.",
      confidence: 55,
      impact: 3,
      effort: 1,
      nextExperiment: "Write one piece that quotes this phrasing verbatim in the hook.",
    });
  }

  if (patterns.length === 0) {
    patterns.push({
      kind: "outlier",
      title: "Not enough evidence yet to detect a pattern",
      description:
        "There is insufficient published performance data and research in this workspace to support a pattern. Capture more research items and publish more pieces before running detection again.",
      confidence: 20,
      impact: 1,
      effort: 1,
      nextExperiment: "Add research items and publish at least five pieces, then re-run detection.",
    });
  }

  return patterns;
}

/* --------------------------------- Report ---------------------------------- */

/* --------------------------- Intelligence run ------------------------------ */

/**
 * Demo signal extraction.
 *
 * The rule the live provider is held to applies here too: every candidate cites
 * evidence refs that were actually supplied, and none of them assert a fact
 * about the business that is not already in the workspace. With no evidence,
 * this returns nothing rather than inventing a market observation - an empty
 * run is a truthful result.
 */
function buildSignals(ctx: DemoContext) {
  const refs = ctx.evidenceRefs ?? [];
  const titles = ctx.evidenceTitles ?? [];
  const kinds = ctx.evidenceKinds ?? [];
  if (refs.length === 0) return [];

  const signals: {
    kind: string;
    title: string;
    rationale: string;
    soWhat: string;
    confidence: number;
    impact: number;
    effort: number;
    evidenceIds: string[];
  }[] = [];

  const refsOfKind = (kind: string) =>
    refs.filter((_, i) => kinds[i] === kind).slice(0, 4);

  const quote = ctx.customerQuotes?.[0];
  const languageRefs = refsOfKind("customer_language");
  if (quote && languageRefs.length > 0) {
    signals.push({
      kind: "customer_language",
      title: `Buyers describe the problem as "${quote}"`,
      rationale: `The same phrasing appears across ${languageRefs.length} of the items collected this cycle, including "${titles[refs.indexOf(languageRefs[0])] ?? "a captured item"}". The business currently describes the same problem in its own vocabulary rather than the buyer's.`,
      soWhat:
        "Using the buyer's own words in hooks and offer copy shortens the distance between recognising the problem and recognising the offer.",
      confidence: languageRefs.length >= 3 ? 62 : languageRefs.length === 2 ? 48 : 35,
      impact: 4,
      effort: 1,
      evidenceIds: languageRefs,
    });
  }

  const objection = ctx.objections?.[0];
  const objectionRefs = refsOfKind("objection");
  if (objection && objectionRefs.length > 0) {
    signals.push({
      kind: "objection",
      title: `"${objection}" is raised before price is discussed`,
      rationale: `${objectionRefs.length} item(s) in this cycle record this objection surfacing early in the conversation rather than at the point of decision.`,
      soWhat:
        "An objection raised early is a positioning problem, not a closing problem. Answering it in content removes it from the call.",
      confidence: objectionRefs.length >= 3 ? 58 : 40,
      impact: 5,
      effort: 2,
      evidenceIds: objectionRefs,
    });
  }

  const competitorRefs = refsOfKind("competitor_post");
  if (competitorRefs.length >= 2) {
    signals.push({
      kind: "competitor_theme",
      title: "Competitors are converging on the same outcome claim",
      rationale: `${competitorRefs.length} competitor items collected this cycle lead with a similar outcome promise. Where everyone claims the same outcome, the claim stops carrying information.`,
      soWhat:
        "There is room to own the mechanism rather than the outcome, which is harder to copy and easier to prove.",
      confidence: competitorRefs.length >= 4 ? 60 : 45,
      impact: 4,
      effort: 3,
      evidenceIds: competitorRefs,
    });
  }

  const questionRefs = refsOfKind("question");
  if (questionRefs.length > 0) {
    signals.push({
      kind: "content_gap",
      title: "A recurring question in this market has no good public answer",
      rationale: `${questionRefs.length} item(s) record the same question being asked. Nothing collected this cycle answers it in a form a buyer could act on.`,
      soWhat:
        "A question asked repeatedly and answered badly is the cheapest content gap to own, and it attracts people already in the problem.",
      confidence: questionRefs.length >= 3 ? 55 : 38,
      impact: 4,
      effort: 2,
      evidenceIds: questionRefs,
    });
  }

  const outlierRefs = refsOfKind("content_example");
  if (outlierRefs.length > 0) {
    signals.push({
      kind: "content_outlier",
      title: "Specific-number openings sit above the median in this market",
      rationale: `Among the content examples collected this cycle, the strongest openings name a specific figure or timeframe in the first line. This is one cycle of evidence, so it is an observation rather than a settled pattern.`,
      soWhat:
        "Testing a concrete opening against the current framing is cheap and gives a readable result within one publishing cycle.",
      confidence: 34,
      impact: 3,
      effort: 1,
      evidenceIds: outlierRefs,
    });
  }

  // Nothing recognisable: cite what was collected and say so plainly rather
  // than inventing a market observation to fill the screen.
  if (signals.length === 0) {
    signals.push({
      kind: "content_gap",
      title: "Not enough evidence this cycle to support a signal",
      rationale: `${refs.length} item(s) were collected, but they do not repeat enough to read anything across them. Widening the sources or adding sales-call notes would change that.`,
      soWhat:
        "Acting on a single unrepeated observation is how a content operation ends up chasing noise. This cycle is better recorded as thin.",
      confidence: 15,
      impact: 1,
      effort: 1,
      evidenceIds: refs.slice(0, 2),
    });
  }

  return signals;
}

function buildBrief(ctx: DemoContext) {
  const company = ctx.company ?? "this business";
  const approved = ctx.approvedTitles ?? [];
  const tests = ctx.testTitles ?? [];
  const audience = ctx.audience ?? "the people you sell to";

  if (approved.length === 0) {
    return [
      `This cycle produced no approved signals for ${company}. The sources were read and nothing repeated clearly enough to justify changing what we make next.`,
      "That is worth recording rather than papering over: a thin cycle usually means the sources are too narrow, and the fastest fix is adding sales-call notes and customer language from real conversations.",
      "Nothing changes in the plan on this basis. The next run will widen the sources.",
    ].join("\n\n");
  }

  const first = approved[0];
  const second = approved[1];

  return [
    `This cycle, the clearest thing in your market was: ${lowerFirst(first)}.${second ? ` Alongside it, ${lowerFirst(second)}.` : ""}`,
    `It matters for ${company} because ${audience} are already describing the problem in these terms, and the current messaging answers a slightly different question. That gap is where interested people quietly decide the offer is not for them.`,
    tests.length > 0
      ? `Because of that, ${tests.length === 1 ? "one test is" : `${tests.length} tests are`} queued for the coming cycle, starting with ${lowerFirst(tests[0])}. Nothing is being rewritten wholesale until there is a read on ${tests.length === 1 ? "it" : "them"}.`
      : "No tests are queued yet. The approved signals go into the next planning pass before anything is committed to.",
  ].join("\n\n");
}

function lowerFirst(value: string) {
  if (!value) return value;
  // Leave acronyms and proper nouns alone.
  if (value.slice(0, 2) === value.slice(0, 2).toUpperCase() && /[A-Z]{2}/.test(value.slice(0, 2))) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function buildNarrative(ctx: DemoContext) {
  const shipped = ctx.shipped ?? 0;
  const views = ctx.views ?? 0;
  const inquiries = ctx.inquiries ?? 0;
  const calls = ctx.calls ?? 0;

  const lines = [
    `${shipped === 0 ? "Nothing shipped this week" : `${shipped} ${shipped === 1 ? "piece" : "pieces"} shipped`}${
      views > 0 ? `, reaching ${views.toLocaleString("en-GB")} views` : ""
    }.`,
  ];

  if (inquiries > 0) {
    lines.push(
      `${inquiries} inbound ${inquiries === 1 ? "inquiry" : "inquiries"} were logged against published content${
        calls > 0 ? `, of which ${calls} converted to a booked call` : ""
      }.`,
    );
  } else {
    lines.push("No inbound inquiries were attributed to content this week.");
  }

  if (ctx.bottleneck) {
    lines.push(`The constraint this week sat at ${ctx.bottleneck}. That is where the next intervention should land.`);
  }

  if (ctx.learnings?.length) {
    lines.push(`The clearest read from the data: ${ctx.learnings[0]}`);
  }

  lines.push(
    "This summary was composed in demo mode from the numbers stored in this workspace. The figures above are computed directly from records, not generated.",
  );

  return lines.join(" ");
}

/* --------------------------------- Helpers --------------------------------- */

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Demo analysis of a corpus example.
 *
 * Deliberately bland and clearly generic. The demo provider exists so the
 * plumbing can be exercised without an API key — its output must never be
 * mistaken for a real reading of a real piece of content.
 */
function buildExampleAnalysis(ctx: DemoContext) {
  const title = String(ctx.title ?? "Untitled example");
  return {
    topic: "Demo analysis — no model was called",
    buyerPain: "",
    hook: title.slice(0, 120),
    thesis: "",
    promise: "",
    proof: "",
    format: String(ctx.platform ?? "unknown"),
    storyStructure: "",
    cta: "",
    emotionalDriver: "",
    whyItWorked:
      "This is demo output from the offline provider. Set ANTHROPIC_API_KEY to analyse this example for real.",
    commercialRelevance: "mixed",
  };
}

/**
 * Demo Judge scores.
 *
 * Every criterion at 3 — competent and unremarkable — so the demo can never
 * produce a passing verdict that somebody mistakes for an assessment.
 */
function buildJudgeScores(ctx: DemoContext) {
  const keys = Array.isArray(ctx.rubricKeys) ? (ctx.rubricKeys as string[]) : [];
  return keys.map((key) => ({
    key,
    score: 3,
    reason: "Demo output from the offline provider. No model was called, so this is not an assessment.",
  }));
}

function buildLeadReply(ctx: DemoContext) {
  const first = (ctx.leadName ?? "there").split(" ")[0];
  const asked = ctx.leadMessage ? " about what you described" : "";
  return `Hi ${first}, thanks for getting in touch${asked}. Would a 20-minute call next week work to see whether this is a fit? If so, tell me two times that suit you.

${ctx.founderName ?? ""}`.trim();
}
