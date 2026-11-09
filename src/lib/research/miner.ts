import "server-only";
import { prisma } from "@/lib/db/client";
import { runGeneration } from "@/lib/ai";
import { extractJson } from "@/lib/ai/provider";
import { fence, neutralise, UNTRUSTED_RULE } from "@/lib/ai/untrusted";
import { fingerprint, quarantine } from "./providers";
import { WorkflowError } from "@/lib/domain/workflow";
import { parseStringArray } from "@/lib/db/json";
import { routeFromTags, withRouteTag, type SourceRoute } from "./source-route";

/**
 * Source and idea miner (AI-01).
 *
 * Reads a transcript, call notes, a voice-note transcript or a document the
 * workspace supplied, and pulls out questions, objections, expertise, stories,
 * proof, claims and idea seeds, each as an EXACT quote from the source. A quote
 * that is not literally in the source is dropped, never repaired, so nothing
 * mined can be something the source did not say. Every item keeps where it
 * came from (asset, character offsets, source type, time) and is stored as
 * research evidence a person reviews; nothing is published or approved here.
 */
export const MINED_KINDS = ["question", "objection", "expertise", "story", "proof", "claim", "idea_seed"] as const;
export type MinedKind = (typeof MINED_KINDS)[number];

export type MineInput = {
  text: string;
  sourceType: "transcript" | "call_notes" | "voice_note" | "document" | "onboarding" | "coaching";
  sourceRef: string;
  assetId?: string | null;
  permission?: string | null;
  /** Set for every workspace file: mineAsset refuses a file with no route. */
  route?: SourceRoute;
};

const MAX_SOURCE = 60_000;
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/** Where a quote sits in the source, tolerant of whitespace differences only. */
export function locate(source: string, quote: string): { start: number; end: number } | null {
  const q = norm(quote);
  if (q.length < 12) return null;
  const direct = source.indexOf(quote);
  if (direct >= 0) return { start: direct, end: direct + quote.length };
  // Whitespace-normalised search, mapped back to original offsets.
  const map: number[] = [];
  let flat = "";
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (/\s/.test(c)) {
      if (flat.endsWith(" ") || flat.length === 0) continue;
      flat += " ";
    } else flat += c;
    map.push(i);
  }
  const at = flat.indexOf(q);
  if (at < 0) return null;
  return { start: map[at], end: map[at + q.length - 1] + 1 };
}

function minePrompt(input: { text: string; sourceType: string }) {
  return {
    key: "source.mine",
    system: `You extract material for a founder's content from their own source material.\n\n${UNTRUSTED_RULE}\n\nReturn JSON only: { "items": [ { "kind": one of ${MINED_KINDS.join(" | ")}, "quote": the exact words from the source, copied character for character, "note": one short line on why it matters } ] }. Quote exactly; never paraphrase, never merge sentences, never add words. At most 25 items.`,
    user: `SOURCE (${input.sourceType})\n${fence("source", input.text)}\n\nExtract questions buyers ask, objections, expertise only this person has, stories, proof, claims (anything factual that would need checking) and idea seeds.`,
    maxTokens: 3000,
    temperature: 0.2,
  };
}

export async function mineSource(orgId: string, userId: string, input: MineInput) {
  const raw = input.text.slice(0, MAX_SOURCE);
  if (norm(raw).length < 40) throw new WorkflowError("There is not enough text to mine.");
  const { text: clean, injectionFlag } = quarantine(raw);
  // The model sees a neutralised copy; quotes are matched against the stored original.
  const promptCopy = clean.split(/\n{2,}/).map((p) => neutralise(p, 4000).text).join("\n\n");
  const { result, meta } = await runGeneration(minePrompt({ text: promptCopy, sourceType: input.sourceType }), { orgId, userId, kind: "mine", entityType: input.assetId ? "asset" : undefined, entityId: input.assetId ?? undefined, demoContext: { mineSource: clean } });
  const parsed = (extractJson(result.text) ?? {}) as { items?: { kind?: string; quote?: string; note?: string }[] };
  const items = (parsed.items ?? []).slice(0, 25);
  let dropped = 0;
  const kept: { id: string; kind: MinedKind; quote: string }[] = [];
  for (const it of items) {
    const kind = MINED_KINDS.find((k) => k === it.kind);
    const quote = typeof it.quote === "string" ? it.quote : "";
    const at = kind ? locate(clean, quote) : null;
    if (!kind || !at) {
      dropped++;
      continue;
    }
    const exact = clean.slice(at.start, at.end);
    const dedupeKey = `mine:${fingerprint(exact, input.sourceRef)}`;
    const row = await prisma.researchItem.upsert({
      where: { orgId_dedupeKey: { orgId, dedupeKey } },
      create: {
        orgId,
        kind,
        title: exact.slice(0, 140),
        body: exact,
        sourceName: input.sourceRef.slice(0, 200),
        collectedVia: "miner",
        dedupeKey,
        sourceMeta: JSON.stringify({ sourceType: input.sourceType, sourceRef: input.sourceRef, assetId: input.assetId ?? null, charStart: at.start, charEnd: at.end, permission: input.permission ?? null, ...(input.route ? { sourceRoute: input.route } : {}), note: typeof it.note === "string" ? it.note.slice(0, 300) : null, minedBy: userId, minedAt: new Date().toISOString(), injectionFlag, demo: meta.isDemo }),
      },
      update: {},
      select: { id: true },
    });
    kept.push({ id: row.id, kind, quote: exact });
  }
  return { kept, dropped, injectionFlag, isDemo: meta.isDemo };
}

/** Mine a stored text file (a transcript, notes, a document) in the workspace. */
export async function mineAsset(orgId: string, userId: string, assetId: string) {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, orgId }, select: { id: true, title: true, mimeType: true, storagePath: true, category: true, sourceNote: true, createdAt: true, tags: true } });
  if (!asset?.storagePath) throw new WorkflowError("That file is not stored here, so it cannot be read.");
  if (!asset.mimeType || !/^text\/|application\/json/.test(asset.mimeType)) throw new WorkflowError("Only text files (transcripts, notes, documents saved as text) can be mined.");
  const route = routeFromTags(parseStringArray(asset.tags));
  if (!route) throw new WorkflowError("Choose how this source may be used before mining it.");
  if (route === "EXCLUDED") throw new WorkflowError("This source is excluded, so it cannot be mined.");
  const { getStorage } = await import("@/lib/storage");
  const text = (await getStorage().get(asset.storagePath)).toString("utf8");
  const sourceType = asset.category === "transcript" ? "transcript" : "document";
  return mineSource(orgId, userId, { text, sourceType, sourceRef: `${asset.title} (${asset.createdAt.toISOString().slice(0, 10)})`, assetId: asset.id, permission: asset.sourceNote, route });
}

/**
 * Route a workspace file, and carry the route onto anything already mined from
 * it. Existing idea links are not removed silently: the count comes back so a
 * person can review ideas that cited a source that is no longer public.
 */
export async function setAssetRoute(orgId: string, assetId: string, route: SourceRoute) {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, orgId }, select: { id: true, tags: true } });
  if (!asset) throw new WorkflowError("That file no longer exists.");
  await prisma.asset.update({ where: { id: asset.id }, data: { tags: JSON.stringify(withRouteTag(parseStringArray(asset.tags), route)) } });
  const mined = await prisma.researchItem.findMany({ where: { orgId, collectedVia: "miner", sourceMeta: { contains: `"assetId":"${asset.id}"` } }, select: { id: true, sourceMeta: true } });
  for (const m of mined) {
    await prisma.researchItem.update({ where: { id: m.id }, data: { sourceMeta: JSON.stringify({ ...(JSON.parse(m.sourceMeta) as object), sourceRoute: route }) } });
  }
  const citedByIdeas = route === "PUBLIC_CONTENT_ELIGIBLE" || mined.length === 0 ? 0 : await prisma.ideaEvidence.count({ where: { researchItemId: { in: mined.map((m) => m.id) } } });
  return { updated: mined.length, citedByIdeas };
}
