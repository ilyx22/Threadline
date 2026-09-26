/**
 * Prompt templates.
 *
 * Each template has a stable `key` recorded on every `AiGeneration` row, so a
 * change in output quality can be traced to a change in a prompt. Templates are
 * plain functions rather than string files so the shape of their inputs is typed.
 *
 * House rules encoded in every system prompt:
 *   - Write as the founder, not about them.
 *   - Never invent statistics, client names, or results.
 *   - Anything that reads as a factual claim must be surfaced for human checking.
 */
import { UNTRUSTED_RULE } from "./untrusted";

const HOUSE_RULES = `
You are the content strategist inside Threadline, an operating system installed into a
founder-led business. You are writing on behalf of a specific founder for a specific audience,
using only the context provided.

Non-negotiable rules:
1. Never invent statistics, revenue figures, client names, testimonials or case-study results.
   If a number would strengthen the piece and none is supplied, write a clearly marked placeholder
   and list it as a claim requiring verification.
2. Write in the founder's voice as supplied. If voice guidance conflicts with a stylistic instinct,
   the voice guidance wins.
3. Respect banned topics and compliance notes absolutely.
4. Do not use the words "AI", "leverage AI", or reference how the content was produced.
5. No emoji. No hype intensifiers ("massive", "insane", "game-changing"). No exclamation marks.
6. Specific beats clever. A concrete example is worth more than a memorable phrase.
`.trim();

const JSON_RULE = `
Return ONLY valid JSON matching the requested shape. No prose before or after, no markdown fences.
`.trim();

export type PromptTemplate = {
  key: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
};

/* --------------------------------- Ideas ---------------------------------- */

export function ideasPrompt(input: {
  context: string;
  count: number;
  steer?: string;
  platforms: string[];
  pillars: string[];
}): PromptTemplate {
  return {
    key: "ideas.generate",
    system: `${HOUSE_RULES}\n\n${JSON_RULE}`,
    user: `
${input.context}

## TASK
Generate ${input.count} distinct content ideas for this founder.

Rules for this task:
- Every idea must be traceable to something in the context above: a stated pain, an objection,
  a piece of customer language, a competitor observation, a founder belief, or a performance learning.
- Do not repeat angles listed under "Recently covered".
- Vary the shape: beliefs, mechanisms, objection handling, stories, teardowns, frameworks.
- Balance the mix across PESTO and funnel roles, leaning towards what the performance context shows works.
- Prefer angles only THIS founder could credibly publish.
${input.platforms.length ? `- Target platforms: ${input.platforms.join(", ")}.` : ""}
${input.pillars.length ? `- Assign each idea to one of these pillars: ${input.pillars.join(", ")}.` : ""}
${input.steer ? `- Additional steer from the operator: ${input.steer}` : ""}

Score each idea honestly from 0-100. Do not inflate. An idea with no supporting proof in the
context should score low on proofStrength.

Return JSON:
{
  "ideas": [
    {
      "title": string,
      "concept": string,
      "audience": string,
      "painDesire": string,
      "pillar": string,
      "platform": string,
      "format": string,
      "angle": string,
      "hookConcept": string,
      "objective": string,
      "cta": string,
      "commercialIntent": "low" | "medium" | "high",
      "noveltyScore": number,
      "relevanceScore": number,
      "proofStrength": number,
      "formatFit": number,
      "rationale": string,
      "pesto": "personal" | "expertise" | "social_proof" | "trending" | "opinion",
      "funnelRole": "awareness" | "consideration" | "conversion" | "retention"
    }
  ]
}

"pesto" says what kind of piece it is (a personal story from the context, expertise, social proof
the context actually contains, a timely development, or an opinion). Never label an idea
social_proof or personal unless the context contains that proof or story; do not invent one.
`.trim(),
    maxTokens: 6000,
    temperature: 0.85,
  };
}

/* --------------------------------- Scripts -------------------------------- */

export function scriptPrompt(input: {
  context: string;
  title: string;
  angle?: string;
  hookConcept?: string;
  scriptType: string;
  platform: string;
  targetSeconds: number;
  cta?: string;
}): PromptTemplate {
  return {
    key: "script.generate",
    system: `${HOUSE_RULES}\n\n${JSON_RULE}`,
    user: `
${input.context}

## TASK
Write a ${input.scriptType.replace(/_/g, " ")} script for ${input.platform}.

Concept: ${input.title}
${input.angle ? `Angle: ${input.angle}` : ""}
${input.hookConcept ? `Hook direction: ${input.hookConcept}` : ""}
${input.cta ? `Preferred CTA: ${input.cta}` : ""}
Target spoken length: approximately ${input.targetSeconds} seconds (roughly ${Math.round(
      (input.targetSeconds / 60) * 145,
    )} words).

Requirements:
- The hook must work with the sound off and without context. No throat-clearing.
- The body must contain at least one concrete, specific example or mechanism — not general advice.
- Write for the ear. Short sentences. One idea per line.
- Filming notes should tell the founder how to deliver it, not how to edit it.
- List every statement that a reasonable person could challenge as a factual claim, with the
  reason it needs verification. Include any number, frequency, comparison or outcome claim.

Return JSON:
{
  "hook": string,
  "altHooks": string[],        // 4 alternatives, each a genuinely different angle
  "body": string,              // the spoken script, newline separated
  "cta": string,
  "filmingNotes": string,
  "estimatedSeconds": number,
  "claims": [{ "text": string, "reason": string }]
}
`.trim(),
    maxTokens: 4000,
    temperature: 0.8,
  };
}

export function hooksPrompt(input: {
  context: string;
  title: string;
  body: string;
  count: number;
}): PromptTemplate {
  return {
    key: "script.hooks",
    system: `${HOUSE_RULES}\n\n${JSON_RULE}`,
    user: `
${input.context}

## TASK
Write ${input.count} alternative opening hooks for this script.

Script concept: ${input.title}

Current script body:
"""
${input.body.slice(0, 4000)}
"""

Requirements:
- Each hook must take a genuinely different approach (belief, question, story-open, objection,
  number, contradiction). Do not produce ${input.count} variations of one idea.
- Each must stand alone in the first two seconds with no setup.
- Each must be deliverable in the founder's voice as described in the context.

Return JSON: { "hooks": string[] }
`.trim(),
    maxTokens: 1500,
    temperature: 0.95,
  };
}

export const REFINE_INSTRUCTIONS = {
  more_like_me: {
    label: "More like me",
    instruction:
      "Rewrite so it matches the founder's stored voice more closely. Use their documented phrases and sentence rhythm. Remove anything from the 'does not sound like them' list.",
  },
  more_direct: {
    label: "More direct",
    instruction:
      "Remove hedging, qualifiers and throat-clearing. Make every sentence declarative. Cut any sentence that does not advance the argument.",
  },
  less_hype: {
    label: "Less hype",
    instruction:
      "Remove intensifiers, superlatives and exclamation marks. Lower the emotional register. Let the substance carry it.",
  },
  shorter: {
    label: "Shorter",
    instruction:
      "Cut roughly 30% of the length while preserving the hook, the central mechanism and the CTA. Remove supporting examples before removing structure.",
  },
  more_specific: {
    label: "More specific",
    instruction:
      "Replace general statements with concrete detail: a named situation, a real sequence of events, a specific mechanism. Where a specific is needed but not supplied in the context, insert a clearly marked placeholder and add it as a claim to verify.",
  },
  add_proof: {
    label: "Add proof",
    instruction:
      "Work a cleared proof item from the context into the body where it strengthens the argument. Only use proof marked as available. Never state a proof item marked as not cleared.",
  },
  change_angle: {
    label: "Change angle",
    instruction:
      "Keep the same subject but approach it from a different angle entirely — if it currently leads with a belief, lead with an objection or a story instead.",
  },
  rewrite_hook: {
    label: "Rewrite hook",
    instruction:
      "Keep the body unchanged. Replace only the hook with a stronger opening that works with the sound off.",
  },
} as const;

export type RefineInstruction = keyof typeof REFINE_INSTRUCTIONS;

export function refinePrompt(input: {
  context: string;
  hook: string;
  body: string;
  cta?: string;
  instruction: RefineInstruction;
  note?: string;
}): PromptTemplate {
  const spec = REFINE_INSTRUCTIONS[input.instruction];
  return {
    key: "script.refine",
    system: `${HOUSE_RULES}\n\n${JSON_RULE}`,
    user: `
${input.context}

## TASK
Revise the script below.

Revision requested: ${spec.label}
${spec.instruction}
${input.note ? `Additional note from the founder: ${input.note}` : ""}

Current hook:
"""
${input.hook}
"""

Current body:
"""
${input.body.slice(0, 6000)}
"""

Return JSON:
{
  "hook": string,
  "body": string,
  "changeSummary": string   // one sentence describing what you changed and why
}
`.trim(),
    maxTokens: 4000,
    temperature: 0.7,
  };
}

/* -------------------------------- Packaging ------------------------------- */

export function packagingPrompt(input: {
  context: string;
  title: string;
  hook?: string;
  body?: string;
  platforms: string[];
}): PromptTemplate {
  return {
    key: "packaging.generate",
    system: `${HOUSE_RULES}\n\n${JSON_RULE}`,
    user: `
${input.context}

## TASK
Package this content for distribution across: ${input.platforms.join(", ")}.

Title: ${input.title}
${input.hook ? `Hook: ${input.hook}` : ""}
${input.body ? `Script:\n"""\n${input.body.slice(0, 5000)}\n"""` : ""}

Requirements:
- Each platform gets genuinely different copy. Do not write one caption and reuse it.
  LinkedIn rewards a structured argument with line breaks. YouTube rewards a searchable title and
  a real description. X rewards compression. Instagram and TikTok reward a first line that stops
  the scroll.
- Only include hashtags where they genuinely help on that platform. Empty array otherwise.
- Thumbnail concepts only for YouTube.
- Clip opportunities should reference real moments in the script with approximate timings.

Return JSON:
{
  "packages": [
    {
      "platform": string,
      "title": string,
      "caption": string,
      "description": string,
      "hashtags": string[],
      "overlays": string[],
      "thumbnailConcepts": string[],
      "ctaOptions": string[],
      "clipOpportunities": [{ "label": string, "startSec": number, "endSec": number, "rationale": string }],
      "repurposing": string
    }
  ]
}
`.trim(),
    maxTokens: 5000,
    temperature: 0.75,
  };
}

/* --------------------------------- Patterns -------------------------------- */

/* ---------------------------- Intelligence run ----------------------------- */

/**
 * Signal extraction.
 *
 * The evidence is passed in with short reference ids and the model is required
 * to cite them. The caller drops any candidate citing an id it did not supply,
 * which is what makes "never invent evidence" enforceable rather than merely
 * requested — a fabricated observation has nothing legitimate to cite.
 */
export function signalsPrompt(input: {
  context: string;
  evidence: string;
  focus?: string;
  maxSignals: number;
}): PromptTemplate {
  return {
    key: "signals.extract",
    system: `${HOUSE_RULES}\n\n${UNTRUSTED_RULE}\n\n${JSON_RULE}`,
    user: `
${input.context}

## EVIDENCE COLLECTED THIS CYCLE
Each item has a reference id in square brackets. You may only cite these ids.

${input.evidence}

## TASK
Read the evidence and propose at most ${input.maxSignals} candidate signals for a human to review.
${input.focus ? `The operator asked this run to focus on: ${input.focus}` : ""}

A signal is something that should change what this business says or makes. Look for:
- customer language the business is not yet using back
- pains, desires and objections stated repeatedly and specifically
- themes a competitor is building a position around
- content that performed far outside the norm, and what its structure has in common
- hook structures recurring across strong pieces
- shifts in how offers in this market are packaged or priced
- questions buyers ask that nobody in the market answers well

Requirements:
- EVERY candidate must cite at least one evidence id. A candidate you cannot cite must not be returned.
- Do not restate a single item as a signal. A signal is a reading across evidence, or an item so
  far outside the norm that it is worth acting on alone - and if it is the latter, say so.
- Confidence must reflect how many independent items support it. One item cannot exceed 40.
- "soWhat" must say what changes commercially if this is true, in one sentence, without hype.
- Quote the customer's actual words where the signal is about language.
- If the evidence does not support any signal, return an empty array. An empty run is a valid result
  and is more useful than a plausible invention.

Return JSON:
{
  "signals": [
    {
      "kind": "customer_language" | "pain" | "desire" | "objection" | "competitor_theme" | "content_outlier" | "recurring_hook" | "offer_shift" | "content_gap",
      "title": string,
      "rationale": string,      // what in the evidence supports this, specifically
      "soWhat": string,         // what changes commercially if it is true
      "confidence": number,     // 0-100
      "impact": number,         // 1-5
      "effort": number,         // 1-5, how hard it is to act on
      "evidenceIds": string[]   // ids from the evidence above, at least one
    }
  ]
}
`.trim(),
    maxTokens: 3500,
    temperature: 0.4,
  };
}

/** The client-facing headline of an intelligence brief. */
export function briefPrompt(input: {
  context: string;
  periodLabel: string;
  approvedSignals: string;
  tests: string;
  sourceSummary: string;
}): PromptTemplate {
  return {
    key: "brief.summary",
    system: HOUSE_RULES,
    user: `
${input.context}

## PERIOD
${input.periodLabel}

## WHAT THE RUN DREW ON
${input.sourceSummary}

## SIGNALS A HUMAN APPROVED
${input.approvedSignals}

## TESTS QUEUED BECAUSE OF THEM
${input.tests}

## TASK
Write the opening of this week's intelligence brief for the founder. Two or three short
paragraphs, 120-180 words total.

It must answer, in this order:
1. What did we find in your market?
2. Why does it matter to your business specifically?
3. What are we doing about it?

Rules:
- Only reference signals listed above as approved. Nothing else exists as far as this brief is concerned.
- Do not describe the process, the tooling, or how the analysis was done.
- Do not claim a result, a lift or a return. Nothing has been tested yet.
- If the sources were thin, say so plainly in the first paragraph rather than padding.
- Plain sentences. No bullet points, no headings, no sign-off.
`.trim(),
    maxTokens: 700,
    temperature: 0.5,
  };
}

export function patternsPrompt(input: { context: string; performanceSummary: string }): PromptTemplate {
  return {
    key: "patterns.detect",
    system: `${HOUSE_RULES}\n\n${JSON_RULE}`,
    user: `
${input.context}

## PERFORMANCE DATA
${input.performanceSummary}

## TASK
Identify patterns in this workspace's content performance and market research.

Requirements:
- Be conservative. With fewer than five published pieces, classify observations as "outlier",
  not "pattern". Only use "learning" where the evidence is genuinely repeated.
- State what the evidence is, not just the conclusion.
- Confidence must reflect sample size honestly. A single data point cannot exceed 40.
- Every pattern needs a next experiment that would actually test it.
- If the data does not support any pattern, say so in a single entry rather than inventing one.

Return JSON:
{
  "patterns": [
    {
      "kind": "outlier" | "pattern" | "hypothesis" | "test" | "learning",
      "title": string,
      "description": string,
      "confidence": number,   // 0-100
      "impact": number,       // 1-5
      "effort": number,       // 1-5
      "nextExperiment": string
    }
  ]
}
`.trim(),
    maxTokens: 3000,
    temperature: 0.5,
  };
}

/* ---------------------------------- Report --------------------------------- */

export function reportNarrativePrompt(input: {
  context: string;
  metrics: string;
  periodLabel: string;
}): PromptTemplate {
  return {
    key: "report.narrative",
    system: `${HOUSE_RULES}

You are writing the executive summary of a weekly report for the founder who pays for this
service. Be direct and unsentimental. If the week was weak, say so. Never restate a number that
is not in the data provided, and never round in a flattering direction.

Return plain prose. No JSON, no markdown headings, no bullet points. Three to five sentences.`,
    user: `
${input.context}

## THIS WEEK (${input.periodLabel})
${input.metrics}

## TASK
Write the executive summary for this week. Lead with what actually matters: whether the operation
produced, what the commercial signal was, and where the constraint sits. Do not congratulate.
`.trim(),
    maxTokens: 700,
    temperature: 0.6,
  };
}

/* ------------------------- Corpus analysis and Judge ----------------------- */

/**
 * Pull the working variables out of one piece of market content.
 *
 * Deliberately extraction rather than opinion: the model is describing what is
 * there, and the one judgement it is asked for — whether the attention looks
 * commercial — is asked as a question with a "cannot tell" answer available.
 */
export function analyseExamplePrompt(input: {
  platform: string;
  creator: string;
  title: string;
  transcript: string;
  notes: string;
  wedge: string;
}): PromptTemplate {
  return {
    key: "corpus.analyse",
    system: [
      "You analyse high-performing B2B content so a strategist can see what made it work.",
      "You are describing what is present, not praising it. If a field is not in the material, return an empty string rather than inferring one.",
      "Never invent metrics, claims, or details about the creator that are not in the input.",
      "Respond with JSON only.",
    ].join("\n"),
    user: [
      `Market being studied: ${input.wedge || "expert-led B2B"}`,
      `Platform: ${input.platform}`,
      `Creator: ${input.creator}`,
      `Title: ${input.title}`,
      input.transcript ? `Transcript:\n${input.transcript}` : "No transcript supplied.",
      input.notes ? `Operator notes:\n${input.notes}` : "",
      "",
      "Return JSON with these keys, each a short string:",
      "topic, buyerPain, hook, thesis, promise, proof, format, storyStructure, cta, emotionalDriver, whyItWorked",
      "",
      'Also return "commercialRelevance": one of "commercial", "mixed", "entertainment".',
      '"commercial" means the attention this earned plausibly belongs to someone who could buy.',
      '"entertainment" means it earned attention that is unlikely to convert, however large.',
      '"mixed" is the honest answer when you cannot tell — use it rather than guessing.',
    ]
      .filter(Boolean)
      .join("\n"),
    maxTokens: 1600,
    temperature: 0.2,
  };
}

/**
 * The Judge.
 *
 * The model scores each criterion and says why. It is explicitly NOT asked for
 * an overall verdict: that arithmetic is ours, so the threshold stays auditable
 * and cannot drift between runs.
 */
export function judgePrompt(input: {
  rubric: { key: string; label: string; question: string; why: string }[];
  subjectKind: string;
  subject: string;
  context: string;
}): PromptTemplate {
  return {
    key: "judge.evaluate",
    system: [
      "You are an adversarial reviewer for expert-led B2B content. Your job is to find what is weak before a human does.",
      "Score each criterion 0-5 and give a specific reason. A reason that would apply to any piece of content is not a reason.",
      "Be hard to please. A 5 means you cannot see how it could be better; a 3 means it is competent and unremarkable.",
      "Do not return an overall score or a verdict. Those are computed elsewhere.",
      "Name what you expect to work and what you expect to fail. This is a prediction that will be checked against what actually happens, so make it specific enough to be wrong.",
      "Respond with JSON only.",
    ].join("\n"),
    user: [
      `You are reviewing a ${input.subjectKind}.`,
      input.context ? `Context about the business:\n${input.context}` : "",
      "",
      "The material:",
      input.subject,
      "",
      "Criteria:",
      ...input.rubric.map((c) => `- ${c.key} (${c.label}): ${c.question} Why it matters: ${c.why}`),
      "",
      'Return JSON: { "scores": [{ "key": "...", "score": 0-5, "reason": "..." }], "predictedStrengths": ["..."], "predictedWeaknesses": ["..."] }',
      "Score every criterion listed. If you cannot assess one from the material given, score it and say that in the reason.",
      // Stated up front so a post-hoc explanation cannot later become the thing
      // we "always thought". These are the falsifiable half of the prediction.
      "predictedStrengths and predictedWeaknesses are what you expect to carry this piece and what you expect to hold it back, in the market rather than on the page. Two or three each, concrete enough to be proved wrong.",
    ]
      .filter(Boolean)
      .join("\n"),
    maxTokens: 2000,
    temperature: 0.3,
  };
}

/* ------------------------------ Lead reply (AI-06) ------------------------- */

export function leadReplyPrompt(input: { context: string; leadName: string; channel: string; thread: string }): PromptTemplate {
  return {
    key: "lead.reply",
    system: `${HOUSE_RULES}

You draft a first reply to an inbound lead, for the founder to check, edit and send themselves.
Write as the founder, in their voice. Be brief: three to five sentences. Answer what they asked
if the thread says it; otherwise ask one qualifying question. Propose one next step. Never invent
prices, availability, results, clients or guarantees that are not in the context. No flattery.

${UNTRUSTED_RULE}

Return plain text only.`,
    user: `
${input.context}

## THE LEAD
Name: ${input.leadName}
Channel: ${input.channel}

## THREAD (oldest first)
${input.thread}

## TASK
Draft the reply.
`.trim(),
    maxTokens: 400,
    temperature: 0.5,
  };
}
