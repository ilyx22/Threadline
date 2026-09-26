import "server-only";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { loadWorkspaceContext, renderContext, type ContextBlock } from "./context";
import { runGeneration, runStructured, type GenerationMeta } from "./index";
import {
  briefPrompt,
  hooksPrompt,
  ideasPrompt,
  packagingPrompt,
  patternsPrompt,
  refinePrompt,
  reportNarrativePrompt,
  scriptPrompt,
  signalsPrompt,
  type RefineInstruction,
} from "./prompts";
import { estimateSpokenSeconds } from "@/lib/utils/format";

/**
 * Task-level generators.
 *
 * These are the only AI entry points the rest of the application uses. Each one:
 *   1. composes exactly the context blocks it needs,
 *   2. renders a versioned prompt template,
 *   3. validates the response against a Zod schema,
 *   4. returns typed data plus generation metadata (including whether it was demo output).
 *
 * No generator writes to the database — persistence is the server action's job,
 * which keeps generation retryable and side-effect free.
 */

const zodResult = <T>(schema: z.ZodType<T>) => {
  return (value: unknown) => {
    const parsed = schema.safeParse(value);
    return parsed.success
      ? ({ success: true, data: parsed.data } as const)
      : ({ success: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") } as const);
  };
};

/* --------------------------------- Ideas ---------------------------------- */

const generatedIdeaSchema = z.object({
  title: z.string().min(3).max(240),
  concept: z.string().max(2000).default(""),
  audience: z.string().max(300).default(""),
  painDesire: z.string().max(500).default(""),
  pillar: z.string().max(120).default(""),
  platform: z.string().max(60).default("linkedin"),
  format: z.string().max(60).default("short_form"),
  angle: z.string().max(1000).default(""),
  hookConcept: z.string().max(600).default(""),
  objective: z.string().max(200).default(""),
  cta: z.string().max(300).default(""),
  commercialIntent: z.enum(["low", "medium", "high"]).default("medium"),
  noveltyScore: z.coerce.number().min(0).max(100).default(50),
  relevanceScore: z.coerce.number().min(0).max(100).default(50),
  proofStrength: z.coerce.number().min(0).max(100).default(50),
  formatFit: z.coerce.number().min(0).max(100).default(50),
  rationale: z.string().max(1500).default(""),
});

export type GeneratedIdea = z.infer<typeof generatedIdeaSchema>;

const ideasResponseSchema = z.object({ ideas: z.array(generatedIdeaSchema).min(1).max(20) });

const IDEA_BLOCKS: ContextBlock[] = [
  "CLIENT_CONTEXT",
  "OFFER_CONTEXT",
  "ICP_CONTEXT",
  "FOUNDER_VOICE",
  "MARKET_CONTEXT",
  "PERFORMANCE_CONTEXT",
  "CONTENT_HISTORY",
  "LESSONS",
];

export async function generateIdeas(input: {
  orgId: string;
  userId: string;
  count: number;
  steer?: string;
  platforms?: string[];
  pillars?: string[];
}): Promise<{ ideas: GeneratedIdea[]; meta: GenerationMeta }> {
  const context = await loadWorkspaceContext(input.orgId, { blocks: IDEA_BLOCKS });

  const template = ideasPrompt({
    context: renderContext(context, IDEA_BLOCKS),
    count: input.count,
    steer: input.steer,
    platforms: input.platforms ?? (context.demo.platforms as string[]) ?? [],
    pillars: input.pillars ?? (context.demo.pillars as string[]) ?? [],
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "ideas",
      demoContext: { ...context.demo, count: input.count },
    },
    zodResult(ideasResponseSchema),
  );

  return { ideas: data.ideas, meta };
}

/* --------------------------------- Scripts -------------------------------- */

const claimSchema = z.object({
  text: z.string().min(1).max(600),
  reason: z.string().max(600).default(""),
});

const scriptResponseSchema = z.object({
  hook: z.string().min(1).max(1000),
  altHooks: z.array(z.string().max(1000)).max(8).default([]),
  body: z.string().min(1).max(20000),
  cta: z.string().max(600).default(""),
  filmingNotes: z.string().max(4000).default(""),
  estimatedSeconds: z.coerce.number().min(5).max(3600).optional(),
  claims: z.array(claimSchema).max(20).default([]),
});

export type GeneratedScript = {
  hook: string;
  altHooks: string[];
  body: string;
  cta: string;
  filmingNotes: string;
  estimatedSeconds: number;
  claims: { id: string; text: string; status: "unverified"; note: string }[];
  contextUsed: ContextBlock[];
};

const SCRIPT_BLOCKS: ContextBlock[] = [
  "CLIENT_CONTEXT",
  "FOUNDER_VOICE",
  "OFFER_CONTEXT",
  "ICP_CONTEXT",
  "MARKET_CONTEXT",
  "PERFORMANCE_CONTEXT",
  "CONTENT_HISTORY",
  "LESSONS",
];

export async function generateScript(input: {
  orgId: string;
  userId: string;
  title: string;
  angle?: string;
  hookConcept?: string;
  scriptType: string;
  platform: string;
  targetSeconds: number;
  cta?: string;
  entityId?: string;
}): Promise<{ script: GeneratedScript; meta: GenerationMeta }> {
  const context = await loadWorkspaceContext(input.orgId, { blocks: SCRIPT_BLOCKS, platform: input.platform });

  const template = scriptPrompt({
    context: renderContext(context, SCRIPT_BLOCKS),
    title: input.title,
    angle: input.angle,
    hookConcept: input.hookConcept,
    scriptType: input.scriptType,
    platform: input.platform,
    targetSeconds: input.targetSeconds,
    cta: input.cta,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "script",
      entityType: "script",
      entityId: input.entityId,
      demoContext: {
        ...context.demo,
        ideaTitle: input.title,
        ideaAngle: input.angle,
        ideaHook: input.hookConcept,
        scriptType: input.scriptType,
        platform: input.platform,
        targetSeconds: input.targetSeconds,
      },
    },
    zodResult(scriptResponseSchema),
  );

  return {
    script: {
      hook: data.hook,
      altHooks: data.altHooks,
      body: data.body,
      cta: data.cta,
      filmingNotes: data.filmingNotes,
      // Trust the model's estimate only when it is plausible; otherwise compute
      // it from the actual word count so the recording queue's time budget is real.
      estimatedSeconds: plausibleDuration(data.estimatedSeconds, data.body),
      claims: data.claims.map((c) => ({
        id: randomUUID(),
        text: c.text,
        status: "unverified" as const,
        note: c.reason,
      })),
      contextUsed: context.used,
    },
    meta,
  };
}

function plausibleDuration(claimed: number | undefined, body: string) {
  const computed = estimateSpokenSeconds(body);
  if (!claimed) return computed;
  const ratio = claimed / computed;
  return ratio > 0.5 && ratio < 2 ? Math.round(claimed) : computed;
}

const hooksResponseSchema = z.object({ hooks: z.array(z.string().min(1).max(1000)).min(1).max(12) });

export async function generateHooks(input: {
  orgId: string;
  userId: string;
  title: string;
  body: string;
  count: number;
  entityId?: string;
}): Promise<{ hooks: string[]; meta: GenerationMeta }> {
  const blocks: ContextBlock[] = ["FOUNDER_VOICE", "ICP_CONTEXT", "PERFORMANCE_CONTEXT"];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  const template = hooksPrompt({
    context: renderContext(context, blocks),
    title: input.title,
    body: input.body,
    count: input.count,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "hooks",
      entityType: "script",
      entityId: input.entityId,
      demoContext: { ...context.demo, ideaTitle: input.title },
    },
    zodResult(hooksResponseSchema),
  );

  return { hooks: data.hooks.slice(0, input.count), meta };
}

const refineResponseSchema = z.object({
  hook: z.string().min(1).max(1000),
  body: z.string().min(1).max(20000),
  changeSummary: z.string().max(600).default(""),
});

export async function refineScriptContent(input: {
  orgId: string;
  userId: string;
  hook: string;
  body: string;
  cta?: string;
  instruction: RefineInstruction;
  note?: string;
  entityId?: string;
}): Promise<{
  hook: string;
  body: string;
  changeSummary: string;
  estimatedSeconds: number;
  meta: GenerationMeta;
}> {
  const blocks: ContextBlock[] = ["FOUNDER_VOICE", "OFFER_CONTEXT", "ICP_CONTEXT"];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  const template = refinePrompt({
    context: renderContext(context, blocks),
    hook: input.hook,
    body: input.body,
    cta: input.cta,
    instruction: input.instruction,
    note: input.note,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "refine",
      entityType: "script",
      entityId: input.entityId,
      demoContext: {
        ...context.demo,
        existingBody: input.body,
        existingHook: input.hook,
        instruction: input.instruction,
      },
    },
    zodResult(refineResponseSchema),
  );

  return {
    hook: data.hook,
    body: data.body,
    changeSummary: data.changeSummary,
    estimatedSeconds: estimateSpokenSeconds(data.body),
    meta,
  };
}

/* -------------------------------- Packaging ------------------------------- */

const packageSchema = z.object({
  platform: z.string().min(1).max(60),
  title: z.string().max(400).default(""),
  caption: z.string().max(6000).default(""),
  description: z.string().max(6000).default(""),
  hashtags: z.array(z.string().max(80)).max(30).default([]),
  overlays: z.array(z.string().max(300)).max(20).default([]),
  thumbnailConcepts: z.array(z.string().max(400)).max(10).default([]),
  ctaOptions: z.array(z.string().max(400)).max(10).default([]),
  clipOpportunities: z
    .array(
      z.object({
        label: z.string().max(200),
        startSec: z.coerce.number().min(0).default(0),
        endSec: z.coerce.number().min(0).default(0),
        rationale: z.string().max(500).default(""),
      }),
    )
    .max(10)
    .default([]),
  repurposing: z.string().max(2000).default(""),
});

export type GeneratedPackage = z.infer<typeof packageSchema>;

const packagingResponseSchema = z.object({ packages: z.array(packageSchema).min(1).max(8) });

export async function generatePackaging(input: {
  orgId: string;
  userId: string;
  title: string;
  hook?: string;
  body?: string;
  platforms: string[];
  entityId?: string;
}): Promise<{ packages: GeneratedPackage[]; meta: GenerationMeta }> {
  const blocks: ContextBlock[] = ["CLIENT_CONTEXT", "FOUNDER_VOICE", "OFFER_CONTEXT", "ICP_CONTEXT"];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  const template = packagingPrompt({
    context: renderContext(context, blocks),
    title: input.title,
    hook: input.hook,
    body: input.body,
    platforms: input.platforms,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "packaging",
      entityType: "content_item",
      entityId: input.entityId,
      demoContext: {
        ...context.demo,
        contentTitle: input.title,
        targetPlatforms: input.platforms,
      },
    },
    zodResult(packagingResponseSchema),
  );

  return { packages: data.packages, meta };
}

/* --------------------------------- Patterns -------------------------------- */

const patternSchema = z.object({
  kind: z.enum(["outlier", "pattern", "hypothesis", "test", "learning"]),
  title: z.string().min(3).max(300),
  description: z.string().max(3000).default(""),
  confidence: z.coerce.number().min(0).max(100).default(40),
  impact: z.coerce.number().min(1).max(5).default(3),
  effort: z.coerce.number().min(1).max(5).default(3),
  nextExperiment: z.string().max(1000).default(""),
});

export type GeneratedPattern = z.infer<typeof patternSchema>;

const patternsResponseSchema = z.object({ patterns: z.array(patternSchema).min(1).max(12) });

export async function detectPatterns(input: {
  orgId: string;
  userId: string;
  performanceSummary: string;
}): Promise<{ patterns: GeneratedPattern[]; meta: GenerationMeta }> {
  const blocks: ContextBlock[] = [
    "CLIENT_CONTEXT",
    "ICP_CONTEXT",
    "MARKET_CONTEXT",
    "PERFORMANCE_CONTEXT",
  ];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  const template = patternsPrompt({
    context: renderContext(context, blocks),
    performanceSummary: input.performanceSummary,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "patterns",
      demoContext: context.demo,
    },
    zodResult(patternsResponseSchema),
  );

  return { patterns: data.patterns, meta };
}

/* ---------------------------- Intelligence run ----------------------------- */

const candidateSignalSchema = z.object({
  kind: z.enum([
    "customer_language",
    "pain",
    "desire",
    "objection",
    "competitor_theme",
    "content_outlier",
    "recurring_hook",
    "offer_shift",
    "content_gap",
  ]),
  title: z.string().min(3).max(300),
  rationale: z.string().max(3000).default(""),
  soWhat: z.string().max(1000).default(""),
  confidence: z.coerce.number().min(0).max(100).default(40),
  impact: z.coerce.number().min(1).max(5).default(3),
  effort: z.coerce.number().min(1).max(5).default(3),
  evidenceIds: z.array(z.string().max(20)).min(1),
});

export type GeneratedSignal = z.infer<typeof candidateSignalSchema>;

const signalsResponseSchema = z.object({
  signals: z.array(candidateSignalSchema).max(20),
});

export type EvidenceForSignals = {
  id: string;
  kind: string;
  title: string;
  body?: string | null;
  url?: string | null;
  sourceName?: string | null;
  author?: string | null;
  capturedAt: Date;
};

/**
 * Extract candidate signals from the evidence collected by a run.
 *
 * Evidence is passed with short reference ids (e1, e2, ...) and every returned
 * candidate is filtered against the ids actually supplied. A candidate citing
 * an id that was never sent is dropped rather than repaired, because a citation
 * that does not resolve is exactly the failure mode this gate exists to catch.
 *
 * Nothing is persisted here; the caller decides what to store, and a human
 * decides what influences strategy.
 */
export async function extractSignals(input: {
  orgId: string;
  userId: string;
  evidence: EvidenceForSignals[];
  focus?: string;
  maxSignals?: number;
}): Promise<{
  signals: (GeneratedSignal & { evidenceItemIds: string[] })[];
  dropped: number;
  meta: GenerationMeta;
}> {
  const blocks: ContextBlock[] = [
    "CLIENT_CONTEXT",
    "OFFER_CONTEXT",
    "ICP_CONTEXT",
    "MARKET_CONTEXT",
    "PERFORMANCE_CONTEXT",
  ];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  // Short, stable reference ids. The real cuids are never shown to the model —
  // they are long, and a short id makes an invented citation obvious.
  const refToId = new Map<string, string>();
  const lines = input.evidence.map((item, index) => {
    const ref = `e${index + 1}`;
    refToId.set(ref, item.id);
    const source = [item.sourceName, item.author].filter(Boolean).join(" / ");
    const excerpt = (item.body ?? "").replace(/\s+/g, " ").slice(0, 600);
    return [
      `[${ref}] (${item.kind}${source ? `, ${source}` : ""}, captured ${item.capturedAt.toISOString().slice(0, 10)})`,
      `Title: ${item.title}`,
      excerpt ? `Content: ${excerpt}` : null,
      item.url ? `URL: ${item.url}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const template = signalsPrompt({
    context: renderContext(context, blocks),
    evidence: lines.join("\n\n"),
    focus: input.focus,
    maxSignals: input.maxSignals ?? 8,
  });

  const { data, meta } = await runStructured(
    template,
    {
      orgId: input.orgId,
      userId: input.userId,
      kind: "signals",
      demoContext: {
        ...context.demo,
        evidenceRefs: [...refToId.keys()],
        evidenceTitles: input.evidence.map((e) => e.title),
        evidenceKinds: input.evidence.map((e) => e.kind),
      },
    },
    zodResult(signalsResponseSchema),
  );

  let dropped = 0;
  const signals: (GeneratedSignal & { evidenceItemIds: string[] })[] = [];
  for (const signal of data.signals) {
    const resolved = signal.evidenceIds
      .map((ref) => refToId.get(ref.trim()))
      .filter((id): id is string => Boolean(id));

    // A candidate whose citations do not resolve is discarded, not salvaged.
    if (resolved.length === 0) {
      dropped += 1;
      continue;
    }
    signals.push({ ...signal, evidenceItemIds: [...new Set(resolved)] });
  }

  return { signals, dropped, meta };
}

/** The client-facing opening paragraphs of a published brief. */
export async function generateBriefSummary(input: {
  orgId: string;
  userId: string;
  periodLabel: string;
  approvedSignals: { title: string; soWhat: string | null; evidenceCount: number }[];
  tests: { title: string; successMetric: string | null }[];
  sourceSummary: string;
}): Promise<{ summary: string; meta: GenerationMeta }> {
  const blocks: ContextBlock[] = ["CLIENT_CONTEXT", "OFFER_CONTEXT", "ICP_CONTEXT"];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  const template = briefPrompt({
    context: renderContext(context, blocks),
    periodLabel: input.periodLabel,
    sourceSummary: input.sourceSummary,
    approvedSignals: input.approvedSignals.length
      ? input.approvedSignals
          .map(
            (s) =>
              `- ${s.title}${s.soWhat ? ` — ${s.soWhat}` : ""} (${s.evidenceCount} supporting item${s.evidenceCount === 1 ? "" : "s"})`,
          )
          .join("\n")
      : "None were approved this cycle.",
    tests: input.tests.length
      ? input.tests
          .map((t) => `- ${t.title}${t.successMetric ? ` — read on: ${t.successMetric}` : ""}`)
          .join("\n")
      : "No tests queued yet.",
  });

  const { result, meta } = await runGeneration(template, {
    orgId: input.orgId,
    userId: input.userId,
    kind: "brief",
    demoContext: {
      ...context.demo,
      periodLabel: input.periodLabel,
      approvedTitles: input.approvedSignals.map((s) => s.title),
      approvedSoWhat: input.approvedSignals.map((s) => s.soWhat ?? ""),
      testTitles: input.tests.map((t) => t.title),
      sourceSummary: input.sourceSummary,
    },
  });

  return { summary: result.text.trim(), meta };
}

/* ---------------------------------- Report --------------------------------- */

export async function generateReportNarrative(input: {
  orgId: string;
  userId: string;
  periodLabel: string;
  metricsSummary: string;
  demoNumbers: {
    shipped: number;
    views: number;
    inquiries: number;
    calls: number;
    bottleneck?: string;
  };
}): Promise<{ narrative: string; meta: GenerationMeta }> {
  const blocks: ContextBlock[] = ["CLIENT_CONTEXT", "OFFER_CONTEXT", "PERFORMANCE_CONTEXT"];
  const context = await loadWorkspaceContext(input.orgId, { blocks });

  const template = reportNarrativePrompt({
    context: renderContext(context, blocks),
    metrics: input.metricsSummary,
    periodLabel: input.periodLabel,
  });

  const { result, meta } = await runGeneration(template, {
    orgId: input.orgId,
    userId: input.userId,
    kind: "report",
    demoContext: { ...context.demo, ...input.demoNumbers },
  });

  return { narrative: result.text.trim(), meta };
}
