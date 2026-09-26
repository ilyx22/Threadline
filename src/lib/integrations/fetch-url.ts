import "server-only";
import { lookup } from "node:dns/promises";
import { lookup as lookupCb, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";

/**
 * Public page reader.
 *
 * This is the one genuinely automatic collection path in the intelligence run,
 * and it is deliberately narrow: it fetches a URL a person supplied and extracts
 * the readable text. It is not a crawler, it does not follow links, and it holds
 * no platform credentials — so where a platform requires a login, this reports
 * that honestly and the operator pastes the content instead.
 *
 * Because the URL comes from a user, this is a server-side request to an
 * attacker-influenceable address. Every fetch is therefore constrained:
 *
 *   - http/https only, no other protocol
 *   - the hostname is resolved and rejected if it points at a private,
 *     loopback, link-local or otherwise internal address (SSRF)
 *   - redirects are followed manually so each hop is re-validated
 *   - hard caps on time, redirect count and response size
 *   - no request headers are forwarded from the caller
 */

export type FetchOutcome =
  | {
      ok: true;
      url: string;
      title: string;
      text: string;
      contentType: string;
      fetchedAt: Date;
    }
  | { ok: false; reason: string; blocked: boolean };

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;

/** Hosts known to answer automated requests with a login wall rather than content. */
const LOGIN_WALLED = [
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
];

export async function fetchPublicPage(rawUrl: string): Promise<FetchOutcome> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "That is not a valid URL.", blocked: false };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "Only http and https addresses can be read.", blocked: true };
  }

  const walled = LOGIN_WALLED.find((host) => hostMatches(url.hostname, host));
  if (walled) {
    return {
      ok: false,
      blocked: true,
      reason: `${walled} serves a login wall to automated requests, and Threadline holds no credentials for it. Open the post and paste the text into this source instead — it will be stored with the URL and timestamp exactly as if it had been read automatically.`,
    };
  }

  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const guard = await assertPublicHost(current.hostname);
    if (!guard.ok) return guard;

    let response: Response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      response = await pinnedFetch(current, {
        signal: controller.signal,
        headers: {
          // Identify honestly. A reader that lies about what it is has no place
          // in a product whose selling point is that it does not fake things.
          "user-agent": "ThreadlineIntelligence/1.0 (+https://threadline.example; research reader)",
          accept: "text/html,text/plain;q=0.9,*/*;q=0.1",
        },
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        blocked: false,
        reason: aborted
          ? "The page did not respond within 12 seconds."
          : "The page could not be reached.",
      };
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, blocked: false, reason: "The page redirected without a destination." };
      }
      try {
        current = new URL(location, current);
      } catch {
        return { ok: false, blocked: false, reason: "The page redirected to an invalid address." };
      }
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        return { ok: false, blocked: true, reason: "The page redirected to an unsupported protocol." };
      }
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        blocked: true,
        reason: `The page returned ${response.status}, which usually means it requires a login. Paste the content into this source instead.`,
      };
    }
    if (!response.ok) {
      return { ok: false, blocked: false, reason: `The page returned HTTP ${response.status}.` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
      return {
        ok: false,
        blocked: false,
        reason: `That address returned ${contentType || "an unknown content type"}, which cannot be read as text.`,
      };
    }

    const body = await readCapped(response);
    if (body === null) {
      return { ok: false, blocked: false, reason: "The page was too large to read." };
    }

    const { title, text } = extractReadable(body);
    if (!text.trim()) {
      return {
        ok: false,
        blocked: false,
        reason:
          "The page loaded but contained no readable text — it is probably rendered by JavaScript. Paste the content instead.",
      };
    }

    return {
      ok: true,
      url: current.toString(),
      title: title || current.hostname,
      text,
      contentType,
      fetchedAt: new Date(),
    };
  }

  return { ok: false, blocked: false, reason: "Too many redirects." };
}

/* ------------------------- Pinned connection (SEC-10) ------------------------ */

/**
 * The address check runs inside the socket's own DNS lookup, so the address
 * that was checked is the address that is connected to. A hostname that
 * answers "public" to the first lookup and "private" to the second (DNS
 * rebinding) is refused at connect time. Redirects are never followed here.
 */
export const guardedLookup: LookupFunction = (hostname, options, callback) => {
  lookupCb(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return (callback as (e: NodeJS.ErrnoException | null, a: LookupAddress[]) => void)(err, []);
    const list = addresses as unknown as LookupAddress[];
    const bad = !list.length || list.some((a) => isPrivateAddress(a.address));
    if (bad) {
      const e = Object.assign(new Error(`Refused: ${hostname} resolves to a private network.`), { code: "EPRIVATE" });
      return (callback as (e: NodeJS.ErrnoException | null, a: LookupAddress[]) => void)(e, []);
    }
    if ((options as { all?: boolean }).all) return (callback as (e: null, a: LookupAddress[]) => void)(null, list);
    return (callback as (e: null, a: string, f: number) => void)(null, list[0].address, list[0].family);
  });
};

function pinnedFetch(url: URL, init: { signal: AbortSignal; headers: Record<string, string> }): Promise<Response> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(url, { method: "GET", headers: init.headers, lookup: guardedLookup, signal: init.signal }, (res) => {
      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (c: Buffer) => {
        total += c.length;
        if (total > MAX_BYTES + 1) {
          res.destroy();
          return;
        }
        chunks.push(c);
      });
      res.on("close", () => {
        const headers = new Headers();
        for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
        const status = res.statusCode ?? 0;
        const noBody = status === 204 || status === 304 || (status >= 300 && status < 400);
        resolve(new Response(noBody ? null : new Uint8Array(Buffer.concat(chunks)), { status: status < 200 || status > 599 ? 502 : status, headers }));
      });
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

/* --------------------------------- Guards ---------------------------------- */

async function assertPublicHost(
  hostname: string,
): Promise<{ ok: true } | { ok: false; reason: string; blocked: true }> {
  const literal = isIP(hostname);
  if (literal) {
    return isPrivateAddress(hostname)
      ? { ok: false, blocked: true, reason: "That address is on a private network." }
      : { ok: true };
  }

  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal")) {
    return { ok: false, blocked: true, reason: "That address is internal." };
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    return { ok: false, blocked: true, reason: "That hostname could not be resolved." };
  }

  if (addresses.length === 0) {
    return { ok: false, blocked: true, reason: "That hostname could not be resolved." };
  }
  // Every resolved address must be public — one private answer is enough to refuse.
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    return { ok: false, blocked: true, reason: "That hostname resolves to a private network." };
  }
  return { ok: true };
}

export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const parts = address.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts as [number, number, number, number];
    if (a === 0 || a === 10 || a === 127) return true; // this network, private, loopback
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a === 192 && b === 0) return true; // IETF protocol assignments
    if (a >= 224) return true; // multicast and reserved
    return false;
  }
  if (version === 6) {
    const value = address.toLowerCase();
    if (value === "::" || value === "::1") return true;
    if (value.startsWith("fe80") || value.startsWith("fc") || value.startsWith("fd")) return true;
    // IPv4-mapped addresses are judged on the embedded IPv4 address.
    const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1] as string);
    return false;
  }
  return true;
}

async function readCapped(response: Response): Promise<string | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }

  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

/**
 * Extract a title and readable body text.
 *
 * Deliberately simple: strip the parts of a document that are never prose, then
 * collapse whitespace. The output is evidence for a human to read, not a
 * faithful reproduction of the page.
 */
export function extractReadable(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(stripTags(titleMatch[1] as string)).trim().slice(0, 300) : "";

  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Keep block boundaries so sentences do not run together.
    .replace(/<\/(p|div|li|h[1-6]|section|article|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  const text = decodeEntities(stripTags(stripped))
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 20_000);

  return { title, text };
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => safeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeCodePoint(parseInt(code, 16)));
}

function safeCodePoint(code: number) {
  if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return " ";
  return String.fromCodePoint(code);
}

/** True when `hostname` is `domain` or a subdomain of it. */
function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}

/* ------------------------------- JSON reader -------------------------------- */

export type JsonOutcome =
  | { ok: true; data: unknown; fetchedAt: Date }
  | { ok: false; reason: string };

/**
 * Read a small public JSON document, under the same SSRF guards as the page
 * reader.
 *
 * This exists for oEmbed endpoints — the one genuinely public, credential-free
 * metadata source any of the platforms in this wedge offer. It is deliberately
 * separate from `fetchPublicPage` rather than a flag on it: that function
 * promises readable prose and is used where prose is expected, and quietly
 * teaching it to return JSON would break that promise for every existing caller.
 *
 * The login-wall list is not consulted here, because an oEmbed endpoint is
 * public even on hosts whose pages are not.
 */
export async function fetchPublicJson(rawUrl: string): Promise<JsonOutcome> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "That is not a valid URL." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only https endpoints are read for metadata." };
  }

  const guard = await assertPublicHost(url.hostname);
  if (!guard.ok) return { ok: false, reason: guard.reason };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await pinnedFetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "ThreadlineIntelligence/1.0 (+https://threadline.example; research reader)",
        accept: "application/json",
      },
    });
  } catch {
    return { ok: false, reason: "The metadata endpoint could not be reached." };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    return { ok: false, reason: `The metadata endpoint returned HTTP ${response.status}.` };
  }

  const body = await readCapped(response);
  if (body === null) return { ok: false, reason: "The metadata response was too large." };

  try {
    return { ok: true, data: JSON.parse(body), fetchedAt: new Date() };
  } catch {
    return { ok: false, reason: "The metadata endpoint did not return JSON." };
  }
}
