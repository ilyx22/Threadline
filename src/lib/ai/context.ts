import "server-only";
import { prisma } from "@/lib/db/client";
import { parseStringArray, parseWith } from "@/lib/db/json";
import {
  companyProfileSchema,
  contentRulesSchema,
  founderProfileSchema,
  voiceProfileSchema,
  EMPTY_COMPANY,
  EMPTY_CONTENT_RULES,
  EMPTY_FOUNDER,
  EMPTY_VOICE,
} from "@/lib/domain/brand-brain";
import { money } from "@/lib/utils/format";

/**
 * Context composition.
 *
 * Eight independently composable blocks assembled from stored workspace data.
 * Generators pick the blocks a task actually needs, so prompts stay within a
 * sensible budget and irrelevant context does not dilute output quality.
 *
 * Everything here is READ-ONLY and always scoped by orgId supplied by the caller,
 * which must originate from an AuthContext (see src/lib/auth/guard.ts).
 */

export const CONTEXT_BLOCKS = [
  "CLIENT_CONTEXT",
  "FOUNDER_VOICE",
  "OFFER_CONTEXT",
  "ICP_CONTEXT",
  "MARKET_CONTEXT",
  "PERFORMANCE_CONTEXT",
  "CONTENT_HISTORY",
  "TASK_CONTEXT",
  "LESSONS",
] as const;

export type ContextBlock = (typeof CONTEXT_BLOCKS)[number];

export type WorkspaceContext = {
  blocks: Partial<Record<ContextBlock, string>>;
  /** Structured mirror of the same data, consumed by the demo provider. */
  demo: Record<string, unknown>;
  /** Which blocks were actually populated — recorded on the script version. */
  used: ContextBlock[];
};

type LoadOptions = {
  blocks?: ContextBlock[];
  /** The platform the output is for; platform-scoped lessons apply only there. */
  platform?: string;
  /** Extra task-specific instruction appended as TASK_CONTEXT. */
  task?: string;
};

export async function loadWorkspaceContext(
  orgId: string,
  options: LoadOptions = {},
): Promise<WorkspaceContext> {
  const wanted = new Set<ContextBlock>(options.blocks ?? [...CONTEXT_BLOCKS]);

  const [org, brain, offers, icps, proof, competitors, research, patterns, topContent, tasks] =
    await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true, industry: true, website: true, geography: true, currency: true },
      }),
      prisma.brandBrain.findUnique({ where: { orgId } }),
      wanted.has("OFFER_CONTEXT")
        ? prisma.offer.findMany({ where: { orgId }, orderBy: { isPrimary: "desc" }, take: 3 })
        : [],
      wanted.has("ICP_CONTEXT")
        ? prisma.icpProfile.findMany({ where: { orgId }, orderBy: { isPrimary: "desc" }, take: 3 })
        : [],
      wanted.has("OFFER_CONTEXT")
        ? prisma.proofItem.findMany({
            // Prohibited proof is excluded from AI context entirely — it must never
            // reach a prompt, even as background. See docs/DATA_MODEL.md section 3.
            where: { orgId, claimStatus: { in: ["allowed", "needs_review"] } },
            orderBy: { createdAt: "desc" },
            take: 12,
          })
        : [],
      wanted.has("MARKET_CONTEXT")
        ? prisma.competitor.findMany({ where: { orgId }, take: 8 })
        : [],
      wanted.has("MARKET_CONTEXT")
        ? prisma.researchItem.findMany({
            where: { orgId },
            orderBy: { capturedAt: "desc" },
            take: 30,
            include: { tags: { include: { tag: true } } },
          })
        : [],
      wanted.has("PERFORMANCE_CONTEXT")
        ? prisma.pattern.findMany({
            where: { orgId, kind: { in: ["learning", "pattern"] }, status: { not: "rejected" } },
            orderBy: { score: "desc" },
            take: 10,
          })
        : [],
      wanted.has("PERFORMANCE_CONTEXT") || wanted.has("CONTENT_HISTORY")
        ? loadTopContent(orgId)
        : [],
      wanted.has("TASK_CONTEXT")
        ? prisma.task.findMany({
            where: { orgId, status: "open", audience: "client" },
            orderBy: { dueDate: "asc" },
            take: 8,
          })
        : [],
    ]);

  const company = parseWith(brain?.company, companyProfileSchema, EMPTY_COMPANY);
  const founder = parseWith(brain?.founder, founderProfileSchema, EMPTY_FOUNDER);
  const voice = parseWith(brain?.voice, voiceProfileSchema, EMPTY_VOICE);
  const rules = parseWith(brain?.contentRules, contentRulesSchema, EMPTY_CONTENT_RULES);

  const blocks: Partial<Record<ContextBlock, string>> = {};
  const used: ContextBlock[] = [];

  /* ------------------------------ CLIENT_CONTEXT ----------------------------- */
  if (wanted.has("CLIENT_CONTEXT")) {
    const lines = [
      `Company: ${org?.name ?? "Unknown"}`,
      company.description && `What they do: ${company.description}`,
      (company.category || org?.industry) && `Category: ${company.category || org?.industry}`,
      (company.geography || org?.geography) && `Geography: ${company.geography || org?.geography}`,
      company.products.length > 0 && `Products/services: ${company.products.join("; ")}`,
      company.teamSize && `Team size: ${company.teamSize}`,
    ].filter(Boolean);
    blocks.CLIENT_CONTEXT = section("CLIENT CONTEXT", lines as string[]);
    if (lines.length > 1) used.push("CLIENT_CONTEXT");
  }

  /* ------------------------------ FOUNDER_VOICE ------------------------------ */
  if (wanted.has("FOUNDER_VOICE")) {
    const lines = [
      founder.name && `Founder: ${founder.name}${founder.title ? `, ${founder.title}` : ""}`,
      founder.bio && `Background: ${founder.bio}`,
      founder.experience && `Experience: ${founder.experience}`,
      bullets("Stated beliefs", founder.beliefs),
      bullets("Strong opinions", founder.opinions),
      bullets("Stories cleared for use", founder.approvedAnecdotes.length ? founder.approvedAnecdotes : founder.stories),
      bullets("Credentials", founder.credentials),
      voice.tone && `Tone: ${voice.tone}`,
      voice.vocabulary && `Vocabulary: ${voice.vocabulary}`,
      voice.sentenceStructure && `Sentence structure: ${voice.sentenceStructure}`,
      voice.humour && `Humour: ${voice.humour}`,
      bullets("Phrases they use", voice.phrasesUsed),
      bullets("Phrases to avoid", voice.phrasesAvoided),
      bullets("Sounds like them", voice.soundsLikeMe),
      bullets("Does NOT sound like them", voice.notMe),
    ].filter(Boolean);
    blocks.FOUNDER_VOICE = section("FOUNDER AND VOICE", lines as string[]);
    if (lines.length > 0) used.push("FOUNDER_VOICE");
  }

  /* ------------------------------ OFFER_CONTEXT ------------------------------ */
  if (wanted.has("OFFER_CONTEXT")) {
    const lines: string[] = [];
    for (const offer of offers) {
      lines.push(
        [
          `Offer: ${offer.name}${offer.isPrimary ? " (primary)" : ""}`,
          offer.priceMinor > 0 && `Price: ${money(offer.priceMinor, offer.currency)} (${offer.priceModel.replace(/_/g, " ")})`,
          offer.mechanism && `Mechanism: ${offer.mechanism}`,
          offer.outcome && `Outcome: ${offer.outcome}`,
          parseStringArray(offer.differentiators).length > 0 &&
            `Differentiators: ${parseStringArray(offer.differentiators).join("; ")}`,
          offer.guarantees && `Guarantee: ${offer.guarantees}`,
          parseStringArray(offer.ctas).length > 0 && `CTAs: ${parseStringArray(offer.ctas).join(" | ")}`,
          offer.exclusions && `Not included: ${offer.exclusions}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    if (proof.length > 0) {
      lines.push(
        bullets(
          "Proof available",
          proof.map(
            (p) =>
              `[${p.kind}] ${p.title}${p.metricValue ? ` — ${p.metricLabel ?? "result"}: ${p.metricValue}` : ""}${
                p.claimStatus === "needs_review" ? " (NOT YET CLEARED — do not state as fact)" : ""
              }`,
          ),
        ) ?? "",
      );
    }
    blocks.OFFER_CONTEXT = section("OFFER AND PROOF", lines.filter(Boolean));
    if (lines.length > 0) used.push("OFFER_CONTEXT");
  }

  /* ------------------------------- ICP_CONTEXT ------------------------------- */
  if (wanted.has("ICP_CONTEXT")) {
    const lines: string[] = [];
    for (const icp of icps) {
      lines.push(
        [
          `Audience: ${icp.name}${icp.isPrimary ? " (primary)" : ""}`,
          icp.description && icp.description,
          icp.firmographics && `Firmographics: ${icp.firmographics}`,
          icp.demographics && `Demographics: ${icp.demographics}`,
          bullets("Pains", parseStringArray(icp.pains)),
          bullets("Desired outcomes", parseStringArray(icp.desires)),
          bullets("Objections", parseStringArray(icp.objections)),
          bullets("Buying triggers", parseStringArray(icp.triggers)),
          `Sophistication: ${icp.sophistication}`,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
    blocks.ICP_CONTEXT = section("CUSTOMER", lines);
    if (lines.length > 0) used.push("ICP_CONTEXT");
  }

  /* ------------------------------ MARKET_CONTEXT ----------------------------- */
  if (wanted.has("MARKET_CONTEXT")) {
    const lines: string[] = [];
    if (competitors.length > 0) {
      lines.push(
        bullets(
          "Competitors monitored",
          competitors.map((c) => `${c.name}${c.positioning ? ` — ${c.positioning}` : ""}`),
        ) ?? "",
      );
    }
    const byKind = groupBy(research, (r) => r.kind);
    for (const [kind, items] of Object.entries(byKind)) {
      lines.push(
        bullets(
          kind.replace(/_/g, " "),
          items.slice(0, 8).map((r) => `${r.title}${r.body ? ` — ${truncateWords(r.body, 30)}` : ""}`),
        ) ?? "",
      );
    }
    blocks.MARKET_CONTEXT = section("MARKET RESEARCH", lines.filter(Boolean));
    if (research.length > 0 || competitors.length > 0) used.push("MARKET_CONTEXT");
  }

  /* --------------------------- PERFORMANCE_CONTEXT --------------------------- */
  if (wanted.has("PERFORMANCE_CONTEXT")) {
    const lines: string[] = [];
    if (topContent.length > 0) {
      lines.push(
        bullets(
          "Best performing published content",
          topContent
            .slice(0, 8)
            .map((c) => `"${c.title}" (${c.platform}) — ${c.views.toLocaleString("en-GB")} views`),
        ) ?? "",
      );
    }
    if (patterns.length > 0) {
      lines.push(
        bullets(
          "Validated learnings and patterns",
          patterns.map((p) => `[${p.kind}] ${p.title}${p.description ? ` — ${truncateWords(p.description, 28)}` : ""}`),
        ) ?? "",
      );
    }
    blocks.PERFORMANCE_CONTEXT = section("WHAT HAS WORKED", lines.filter(Boolean));
    if (lines.length > 0) used.push("PERFORMANCE_CONTEXT");
  }

  /* ----------------------------- CONTENT_HISTORY ----------------------------- */
  if (wanted.has("CONTENT_HISTORY")) {
    const recent = await prisma.idea.findMany({
      where: { orgId, status: { in: ["approved", "scripted"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true, pillar: true },
    });
    const lines = [
      bullets(
        "Recently covered — do not repeat these angles",
        recent.map((i) => `${i.title}${i.pillar ? ` (${i.pillar})` : ""}`),
      ) ?? "",
      rules.pillars.length > 0 ? bullets("Content pillars", rules.pillars) ?? "" : "",
      rules.bannedTopics.length > 0 ? bullets("BANNED topics — never cover", rules.bannedTopics) ?? "" : "",
      rules.complianceNotes ? `Compliance notes: ${rules.complianceNotes}` : "",
      rules.platforms.length > 0 ? `Platforms in use: ${rules.platforms.join(", ")}` : "",
      rules.cadencePerWeek > 0 ? `Target cadence: ${rules.cadencePerWeek} pieces per week` : "",
    ].filter(Boolean);
    blocks.CONTENT_HISTORY = section("CONTENT HISTORY AND RULES", lines);
    if (lines.length > 0) used.push("CONTENT_HISTORY");
  }

  /* --------------------------------- LESSONS --------------------------------- */
  // LRN-02: lessons in force for this workspace (and this platform, when known).
  if (wanted.has("LESSONS")) {
    const lessons = await prisma.generationLesson.findMany({
      where: { orgId, status: "active", OR: [{ scope: "workspace" }, ...(options.platform ? [{ scope: "platform", platform: options.platform }] : [])] },
      orderBy: { activatedAt: "asc" },
      take: 20,
      select: { text: true, scope: true, platform: true },
    });
    if (lessons.length) {
      blocks.LESSONS = section("LESSONS IN FORCE (confirmed by our own retests; follow them)", lessons.map((l) => `- ${l.text}${l.scope === "platform" ? ` (${l.platform} only)` : ""}`));
      used.push("LESSONS");
    }
  }

  /* ------------------------------- TASK_CONTEXT ------------------------------ */
  if (wanted.has("TASK_CONTEXT")) {
    const lines = [
      options.task ?? "",
      tasks.length > 0
        ? bullets(
            "Open client actions",
            tasks.map((t) => `${t.title}${t.dueDate ? ` (due ${t.dueDate.toLocaleDateString("en-GB")})` : ""}`),
          ) ?? ""
        : "",
    ].filter(Boolean);
    if (lines.length > 0) {
      blocks.TASK_CONTEXT = section("CURRENT SITUATION", lines);
      used.push("TASK_CONTEXT");
    }
  }

  /* --------------------------- Structured demo mirror ------------------------ */

  const primaryOffer = offers.find((o) => o.isPrimary) ?? offers[0];
  const primaryIcp = icps.find((i) => i.isPrimary) ?? icps[0];

  const demo: Record<string, unknown> = {
    founderName: founder.name || undefined,
    company: org?.name,
    offerName: primaryOffer?.name,
    offerOutcome: primaryOffer?.outcome ?? undefined,
    offerMechanism: primaryOffer?.mechanism ?? undefined,
    pains: primaryIcp ? parseStringArray(primaryIcp.pains) : [],
    desires: primaryIcp ? parseStringArray(primaryIcp.desires) : [],
    objections: primaryIcp ? parseStringArray(primaryIcp.objections) : [],
    beliefs: founder.beliefs,
    opinions: founder.opinions,
    stories: founder.stories,
    phrasesUsed: voice.phrasesUsed,
    pillars: rules.pillars,
    platforms: rules.platforms,
    ctas: primaryOffer ? parseStringArray(primaryOffer.ctas) : rules.preferredCtas,
    audience: primaryIcp?.name,
    researchTitles: research.map((r) => r.title),
    customerQuotes: research
      .filter((r) => r.kind === "customer_language" || r.kind === "question" || r.kind === "objection")
      .map((r) => r.title),
    topPerformers: topContent.map((c) => ({ title: c.title, views: c.views })),
    learnings: patterns.filter((p) => p.kind === "learning").map((p) => p.title),
  };

  return { blocks, demo, used };
}

/** Published content ranked by total views, used for performance context. */
async function loadTopContent(orgId: string) {
  const records = await prisma.publishRecord.findMany({
    where: { orgId, status: "published" },
    include: {
      contentItem: { select: { title: true } },
      snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
    take: 60,
  });

  return records
    .map((r) => ({
      title: r.contentItem.title,
      platform: r.platform,
      views: r.snapshots[0]?.views ?? 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}

/** Assemble the selected blocks into a single prompt string. */
export function renderContext(context: WorkspaceContext, order?: ContextBlock[]): string {
  const keys = order ?? CONTEXT_BLOCKS;
  return keys
    .map((key) => context.blocks[key])
    .filter((v): v is string => Boolean(v && v.trim()))
    .join("\n\n");
}

/* --------------------------------- Helpers --------------------------------- */

function section(title: string, lines: string[]) {
  const body = lines.filter((l) => l && l.trim()).join("\n");
  if (!body.trim()) return "";
  return `## ${title}\n${body}`;
}

function bullets(title: string, items: string[] | undefined) {
  if (!items || items.length === 0) return "";
  return `${title}:\n${items.map((i) => `- ${i}`).join("\n")}`;
}

function truncateWords(text: string, words: number) {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return text.trim();
  return parts.slice(0, words).join(" ") + "…";
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}
