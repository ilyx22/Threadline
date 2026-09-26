import "server-only";
import { looksLikeInstruction } from "@/lib/ai/untrusted";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { fetchPublicPage } from "@/lib/integrations/fetch-url";

/**
 * ResearchProvider — one interface for every way evidence enters a run.
 *
 * Three providers ship: the workspace's own records, material a person
 * pastes, and a public URL read server-side (SSRF-guarded, login walls
 * refused by name). External platform adapters plug into the same interface
 * and must report one of the truthful states below rather than simulating
 * access. Every item carries provenance and a fingerprint for de-duplication.
 *
 * Retrieved text is DATA. It is stored and shown to a person; it is never
 * executed as an instruction. `quarantine()` strips control characters and
 * flags instruction-shaped text so a prompt-injection attempt is visible
 * rather than silently forwarded to a model.
 */

export const PROVIDER_STATES = ["AVAILABLE", "DEGRADED", "AUTH_REQUIRED", "REVIEW_REQUIRED", "UNAVAILABLE", "UNSUPPORTED"] as const;
export type ProviderState = (typeof PROVIDER_STATES)[number];

export type Capability = "search" | "getPost" | "getCreator" | "getComments" | "getTranscriptOrMedia" | "batch";

export type Provenance = { provider: string; method: string; sourceRef: string; fetchedAt: string; note?: string };

export type ResearchItemInput = {
  kind: string;
  title: string;
  body: string;
  url: string | null;
  sourceName: string | null;
  fingerprint: string;
  provenance: Provenance;
  /** Set when the text looks like it is addressing the model rather than the reader. */
  injectionFlag: boolean;
};

export type ProviderResult =
  | { ok: true; items: ResearchItemInput[]; state: ProviderState; note?: string }
  | { ok: false; state: ProviderState; reason: string };

export interface ResearchProvider {
  readonly id: string;
  readonly label: string;
  capabilities(): Capability[];
  health(): Promise<{ state: ProviderState; detail: string }>;
  search?(input: { orgId: string; query: string; limit?: number }): Promise<ProviderResult>;
  getPost?(input: { orgId: string; ref: string }): Promise<ProviderResult>;
  getCreator?(input: { orgId: string; ref: string }): Promise<ProviderResult>;
  getComments?(input: { orgId: string; ref: string }): Promise<ProviderResult>;
  getTranscriptOrMedia?(input: { orgId: string; ref: string }): Promise<ProviderResult>;
  batch?(input: { orgId: string; refs: string[] }): Promise<ProviderResult>;
}

export function fingerprint(text: string, url?: string | null) {
  const basis = (url ? url.toLowerCase().replace(/[?#].*$/, "") : "") + "\n" + text.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 2000);
  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

const INJECTION_PATTERNS = [
  /ignore (all|any|the|previous|prior|above) instructions/i,
  /you are (now|an?) (ai|assistant|model)/i,
  /system prompt/i,
  /as an? (ai|llm|language model)/i,
  /disregard (the|your|all) (rules|guidelines|instructions)/i,
  /(reveal|print|output) (the|your) (prompt|instructions|secret)/i,
  /\bassistant:\s/i,
  /<\|?(system|im_start|endoftext)\|?>/i,
];

/** Strip control characters and flag instruction-shaped text. The text is kept — it is evidence — but marked. */
export function quarantine(text: string): { text: string; injectionFlag: boolean } {
  const cleaned = text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "");
  // AI-09: the same instruction detector as the prompt fence, line by line.
  const flagged = INJECTION_PATTERNS.some((p) => p.test(cleaned)) || cleaned.split(/\r?\n/).some((line) => looksLikeInstruction(line));
  return { text: cleaned, injectionFlag: flagged };
}

function hostOf(url: string | null) {
  try { return url ? new URL(url).hostname : null; } catch { return null; }
}

/* ------------------------------ Internal workspace ------------------------------ */

export const internalWorkspaceProvider: ResearchProvider = {
  id: "internal",
  label: "Workspace records",
  capabilities: () => ["search", "batch"],
  async health() {
    return { state: "AVAILABLE", detail: "Reads the workspace's own content, performance and pipeline. No credentials." };
  },
  async search({ orgId, query, limit = 20 }) {
    const q = query.trim();
    const [items, ideas, inquiries] = await Promise.all([
      prisma.contentItem.findMany({ where: { orgId, ...(q ? { title: { contains: q } } : {}), liveAt: { not: null } }, select: { id: true, title: true, platform: true, liveAt: true, publishRecords: { select: { url: true, snapshots: { select: { views: true }, orderBy: { capturedAt: "desc" }, take: 1 } }, take: 1 } }, take: limit, orderBy: { liveAt: "desc" } }),
      prisma.idea.findMany({ where: { orgId, ...(q ? { title: { contains: q } } : {}) }, select: { id: true, title: true, concept: true }, take: Math.ceil(limit / 2) }),
      prisma.inquiry.findMany({ where: { orgId, ...(q ? { notes: { contains: q } } : {}) }, select: { id: true, name: true, notes: true, stage: true }, take: Math.ceil(limit / 2) }),
    ]);
    const now = new Date().toISOString();
    const out: ResearchItemInput[] = [];
    for (const c of items) {
      const views = c.publishRecords[0]?.snapshots[0]?.views ?? 0;
      const body = `${c.title} — ${c.platform}, published ${c.liveAt?.toISOString().slice(0, 10)}, ${views} views.`;
      out.push({ kind: "content_example", title: c.title, body, url: c.publishRecords[0]?.url ?? null, sourceName: "own content", fingerprint: fingerprint(body, `internal:content:${c.id}`), provenance: { provider: "internal", method: "search", sourceRef: `content:${c.id}`, fetchedAt: now }, injectionFlag: false });
    }
    for (const i of ideas) {
      const body = i.concept ?? i.title;
      out.push({ kind: "trend", title: i.title, body, url: null, sourceName: "idea backlog", fingerprint: fingerprint(body, `internal:idea:${i.id}`), provenance: { provider: "internal", method: "search", sourceRef: `idea:${i.id}`, fetchedAt: now }, injectionFlag: false });
    }
    for (const inq of inquiries) {
      const q2 = quarantine(inq.notes ?? "");
      if (!q2.text.trim()) continue;
      out.push({ kind: "customer_language", title: `${inq.name} (${inq.stage})`, body: q2.text, url: null, sourceName: "pipeline notes", fingerprint: fingerprint(q2.text, `internal:inquiry:${inq.id}`), provenance: { provider: "internal", method: "search", sourceRef: `inquiry:${inq.id}`, fetchedAt: now }, injectionFlag: q2.injectionFlag });
    }
    return { ok: true, items: out, state: "AVAILABLE" };
  },
};

/* ---------------------------------- Manual paste --------------------------------- */

export const manualProvider: ResearchProvider = {
  id: "manual",
  label: "Pasted material",
  capabilities: () => ["getPost", "batch"],
  async health() {
    return { state: "AVAILABLE", detail: "A person pastes what they can see. Always available; provenance is the person." };
  },
  async getPost({ ref }) {
    return manualProvider.batch!({ orgId: "", refs: [ref] });
  },
  async batch({ refs }) {
    const now = new Date().toISOString();
    const items: ResearchItemInput[] = [];
    for (const raw of refs) {
      const { text, injectionFlag } = quarantine(raw);
      const trimmed = text.trim();
      if (trimmed.length < 20) continue;
      const title = trimmed.split(/\n|\. /)[0].slice(0, 120);
      items.push({ kind: "source", title, body: trimmed.slice(0, 60_000), url: null, sourceName: "pasted", fingerprint: fingerprint(trimmed), provenance: { provider: "manual", method: "paste", sourceRef: "operator", fetchedAt: now }, injectionFlag });
    }
    return { ok: true, items, state: "AVAILABLE" };
  },
};

/* ------------------------------------ Public URL ---------------------------------- */

export const urlProvider: ResearchProvider = {
  id: "url",
  label: "Public URL",
  capabilities: () => ["getPost", "batch"],
  async health() {
    return { state: "DEGRADED", detail: "Reads public pages server-side. Login-walled platforms are refused by name; JavaScript-rendered pages return nothing." };
  },
  async getPost({ ref }) {
    const outcome = await fetchPublicPage(ref);
    if (!outcome.ok) {
      const state: ProviderState = /login|sign in|wall/i.test(outcome.reason) ? "AUTH_REQUIRED" : "UNAVAILABLE";
      return { ok: false, state, reason: outcome.reason };
    }
    const { text, injectionFlag } = quarantine(outcome.text);
    const now = new Date().toISOString();
    return {
      ok: true,
      state: "AVAILABLE",
      items: [{ kind: "source", title: outcome.title.slice(0, 300), body: text.slice(0, 60_000), url: outcome.url, sourceName: hostOf(outcome.url), fingerprint: fingerprint(text, outcome.url), provenance: { provider: "url", method: "fetch", sourceRef: outcome.url, fetchedAt: now, note: outcome.contentType }, injectionFlag }],
    };
  },
  async batch({ orgId, refs }) {
    const items: ResearchItemInput[] = [];
    const failures: string[] = [];
    for (const ref of refs.slice(0, 10)) {
      const r = await urlProvider.getPost!({ orgId, ref });
      if (r.ok) items.push(...r.items);
      else failures.push(`${ref}: ${r.reason}`);
    }
    return { ok: true, items, state: failures.length ? "DEGRADED" : "AVAILABLE", note: failures.join(" | ") || undefined };
  },
};

/* ------------------------------------- Registry ------------------------------------ */

const PROVIDERS = new Map<string, ResearchProvider>([
  [internalWorkspaceProvider.id, internalWorkspaceProvider],
  [manualProvider.id, manualProvider],
  [urlProvider.id, urlProvider],
]);

export function registerResearchProvider(p: ResearchProvider) {
  PROVIDERS.set(p.id, p);
}
export function getResearchProvider(id: string) {
  return PROVIDERS.get(id) ?? null;
}
export function listResearchProviders() {
  return [...PROVIDERS.values()];
}

/** A provider stub for platforms that need credentials — truthful state, no simulated results. */
export function unavailablePlatformProvider(id: string, label: string, state: Exclude<ProviderState, "AVAILABLE">, detail: string): ResearchProvider {
  const refuse = async (): Promise<ProviderResult> => ({ ok: false, state, reason: detail });
  return { id, label, capabilities: () => ["search", "getPost", "getCreator", "getComments"], health: async () => ({ state, detail }), search: refuse, getPost: refuse, getCreator: refuse, getComments: refuse };
}

/** De-duplicate against what the workspace already holds. */
export async function dedupe(orgId: string, items: ResearchItemInput[]) {
  const existing = await prisma.researchItem.findMany({ where: { orgId, dedupeKey: { in: items.map((i) => i.fingerprint) } }, select: { dedupeKey: true } });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh: ResearchItemInput[] = [];
  let duplicates = 0;
  for (const i of items) {
    if (seen.has(i.fingerprint)) { duplicates++; continue; }
    seen.add(i.fingerprint);
    fresh.push(i);
  }
  return { fresh, duplicates };
}
