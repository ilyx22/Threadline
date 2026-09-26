import "server-only";
import { fingerprint, quarantine, type ProviderResult, type ProviderState, type ResearchItemInput, type ResearchProvider } from "./providers";

/**
 * Apify as a ResearchProvider (optional, off by default).
 *
 * The Master Blueprint treats Apify as a candidate, not a dependency: output is
 * normalised into ResearchItemInput so it can be swapped for Bright Data or
 * another provider without touching research or judgement logic. Nothing about
 * an Actor's schema leaks past `normalise()`.
 *
 * Three switches, all required before a single request is made:
 *   RESEARCH_EXTERNAL_PROVIDERS contains "apify"  (the owner approved paid collection)
 *   APIFY_TOKEN                                     (secret; sent as a bearer header, never in a URL)
 *   APIFY_ACTOR_ID                                  (the Actor chosen after benchmarking)
 * Optional: APIFY_INPUT_TEMPLATE (JSON with "{{url}}"), APIFY_MAX_ITEMS (cost cap, default 20, max 100).
 *
 * Used only for public content a person pointed at (a post or profile URL),
 * as the fallback when the plain public reader is refused. It does not log in
 * as anyone, does not use rented identities and does not engage with content.
 */

type Env = Record<string, string | undefined>;

export type ApifyConfig = { token: string; actorId: string; template: string; maxItems: number };

export function apifyConfig(env: Env = process.env): { ok: true; config: ApifyConfig } | { ok: false; state: ProviderState; reason: string } {
  const enabled = (env.RESEARCH_EXTERNAL_PROVIDERS ?? "").split(",").map((s) => s.trim().toLowerCase()).includes("apify");
  if (!enabled) return { ok: false, state: "REVIEW_REQUIRED", reason: "Apify is not approved for this deployment (RESEARCH_EXTERNAL_PROVIDERS does not include apify)." };
  const token = env.APIFY_TOKEN?.trim() ?? "";
  if (!token) return { ok: false, state: "AUTH_REQUIRED", reason: "APIFY_TOKEN is not set." };
  const actorId = env.APIFY_ACTOR_ID?.trim() ?? "";
  if (!/^[\w.-]+([/~][\w.-]+)?$/.test(actorId)) return { ok: false, state: "UNAVAILABLE", reason: "APIFY_ACTOR_ID is missing or not an Actor id." };
  const template = env.APIFY_INPUT_TEMPLATE?.trim() || '{"startUrls":[{"url":"{{url}}"}]}';
  try {
    JSON.parse(template.replace("{{url}}", "https://example.com"));
  } catch {
    return { ok: false, state: "UNAVAILABLE", reason: "APIFY_INPUT_TEMPLATE is not valid JSON." };
  }
  const max = Number.parseInt(env.APIFY_MAX_ITEMS ?? "20", 10);
  return { ok: true, config: { token, actorId, template, maxItems: Number.isFinite(max) ? Math.min(Math.max(max, 1), 100) : 20 } };
}

/** Build the Actor input with the URL escaped as a JSON string value. */
export function actorInput(template: string, url: string) {
  return JSON.parse(template.replace("{{url}}", JSON.stringify(url).slice(1, -1)));
}

const TEXT_FIELDS = ["text", "caption", "description", "content", "transcript", "fullText", "body", "title"] as const;
const URL_FIELDS = ["url", "postUrl", "inputUrl", "link"] as const;
const AUTHOR_FIELDS = ["ownerUsername", "authorName", "author", "username", "channelName"] as const;

function firstString(row: Record<string, unknown>, keys: readonly string[]) {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v && typeof v === "object" && typeof (v as { name?: unknown }).name === "string") return String((v as { name: string }).name);
  }
  return null;
}

/** Actor rows → evidence items. Rows with no readable text are dropped, not invented. */
export function normalise(rows: unknown[], ref: string, actorId: string, fetchedAt: string): ResearchItemInput[] {
  const items: ResearchItemInput[] = [];
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const body = firstString(row, TEXT_FIELDS);
    if (!body) continue;
    const url = firstString(row, URL_FIELDS) ?? ref;
    const { text, injectionFlag } = quarantine(body);
    const author = firstString(row, AUTHOR_FIELDS);
    items.push({
      kind: "source",
      title: (firstString(row, ["title"]) ?? text.slice(0, 120)).slice(0, 300),
      body: text.slice(0, 60_000),
      url,
      sourceName: author,
      fingerprint: fingerprint(text, url),
      provenance: { provider: "apify", method: `actor:${actorId}`, sourceRef: url, fetchedAt, note: `requested for ${ref}` },
      injectionFlag,
    });
  }
  return items;
}

export function makeApifyProvider(env: Env = process.env, fetchImpl: typeof fetch = fetch): ResearchProvider {
  const provider: ResearchProvider = {
    id: "apify",
    label: "Apify (public content, optional)",
    capabilities: () => ["getPost", "batch"],
    async health() {
      const c = apifyConfig(env);
      return c.ok ? { state: "AVAILABLE", detail: `Actor ${c.config.actorId}, at most ${c.config.maxItems} items a request.` } : { state: c.state, detail: c.reason };
    },
    async getPost({ ref }): Promise<ProviderResult> {
      const c = apifyConfig(env);
      if (!c.ok) return { ok: false, state: c.state, reason: c.reason };
      let url: URL;
      try {
        url = new URL(ref);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("scheme");
      } catch {
        return { ok: false, state: "UNSUPPORTED", reason: "Give a public http(s) URL." };
      }
      const actor = encodeURIComponent(c.config.actorId.replace("/", "~"));
      let res: Response;
      try {
        res = await fetchImpl(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?maxItems=${c.config.maxItems}&clean=true`, {
          method: "POST",
          headers: { Authorization: `Bearer ${c.config.token}`, "Content-Type": "application/json" },
          body: JSON.stringify(actorInput(c.config.template, url.toString())),
          signal: AbortSignal.timeout(120_000),
        });
      } catch (error) {
        return { ok: false, state: "DEGRADED", reason: `Apify did not answer (${error instanceof Error ? error.name : "network"}). Nothing was collected.` };
      }
      if (res.status === 401 || res.status === 403) return { ok: false, state: "AUTH_REQUIRED", reason: "Apify refused the token." };
      if (res.status === 402) return { ok: false, state: "UNAVAILABLE", reason: "The Apify account has no remaining credit." };
      if (!res.ok) return { ok: false, state: "DEGRADED", reason: `Apify returned ${res.status}. Nothing was collected.` };
      let rows: unknown;
      try {
        rows = await res.json();
      } catch {
        return { ok: false, state: "DEGRADED", reason: "Apify returned something that was not JSON." };
      }
      if (!Array.isArray(rows)) return { ok: false, state: "DEGRADED", reason: "Apify returned no dataset items." };
      const items = normalise(rows.slice(0, c.config.maxItems), url.toString(), c.config.actorId, new Date().toISOString());
      if (!items.length) return { ok: false, state: "UNAVAILABLE", reason: "The Actor returned nothing readable for that URL." };
      return { ok: true, state: "AVAILABLE", items, note: `${items.length} item(s) from Actor ${c.config.actorId}` };
    },
    async batch({ orgId, refs }) {
      const items: ResearchItemInput[] = [];
      const failures: string[] = [];
      for (const ref of refs.slice(0, 10)) {
        const r = await provider.getPost!({ orgId, ref });
        if (r.ok) items.push(...r.items);
        else failures.push(`${ref}: ${r.reason}`);
      }
      return { ok: true, items, state: failures.length ? "DEGRADED" : "AVAILABLE", note: failures.join(" | ") || undefined };
    },
  };
  return provider;
}
