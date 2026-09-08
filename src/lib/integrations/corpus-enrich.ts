import "server-only";
import { fetchPublicJson, fetchPublicPage } from "./fetch-url";
import type { ExampleFormat } from "@/lib/domain/corpus";

/**
 * Turning a pasted URL into as much of a corpus row as can honestly be obtained.
 *
 * THE CONSTRAINT THAT SHAPES ALL OF THIS
 *
 * **No unauthenticated public endpoint returns a view count on any platform in
 * this wedge.** Not LinkedIn, not TikTok, not Instagram, not X, and not YouTube.
 * oEmbed gives a title and an author and stops there. Everything else is behind
 * either a login wall or an API key that is currently in a review queue
 * (`docs/PLATFORM_APPLICATIONS.md`).
 *
 * So enrichment does the descriptive half — platform, format, creator, title,
 * and the text where it is readable — and the operator supplies the numbers.
 * That is not a temporary embarrassment to be papered over with an estimate: a
 * fabricated view count would flow straight into the baseline median and
 * corrupt every band computed against it. `metricsProvenance` records the
 * difference on every row.
 *
 * What each source can actually do:
 *
 *   - **YouTube** — oEmbed, public and credential-free: title, channel name,
 *     channel URL. No metrics. Real automatic capture of the descriptive half.
 *   - **Ordinary web pages** (Substack, blogs, newsletters, podcast show notes)
 *     — the SSRF-guarded page reader: title and full readable text, which is a
 *     genuine transcript for written formats.
 *   - **LinkedIn, TikTok, Instagram, X** — login-walled to server-side requests.
 *     The URL alone yields the platform and usually the handle; everything else
 *     is pasted. This is the common case in this wedge and the workflow treats
 *     it as the normal path rather than a failure.
 */

export const PROVENANCE = ["manual", "auto_oembed", "auto_page", "url_only"] as const;
export type Provenance = (typeof PROVENANCE)[number];

export const METRICS_PROVENANCE = ["manual", "api", "unknown"] as const;
export type MetricsProvenance = (typeof METRICS_PROVENANCE)[number];

export type Enrichment = {
  url: string;
  platform: string;
  format: ExampleFormat;
  creatorHandle: string | null;
  creatorName: string | null;
  title: string | null;
  transcript: string | null;
  provenance: Provenance;
  /** What was obtained and what still has to be typed. Shown to the operator. */
  note: string;
};

/* ------------------------------ Platform shape ------------------------------ */

type Shape = { platform: string; format: ExampleFormat };

/**
 * What the URL alone reveals.
 *
 * Deliberately conservative. Guessing `short_video` for every TikTok is safe;
 * guessing it for every YouTube URL is not, because the format decides which
 * baseline the piece is compared against and a wrong guess quietly moves a
 * long-form video into the wrong median.
 */
export function detectShape(url: URL): Shape {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const path = url.pathname.toLowerCase();

  if (host.endsWith("youtube.com") || host === "youtu.be") {
    return path.startsWith("/shorts/")
      ? { platform: "YouTube Shorts", format: "short_video" }
      : { platform: "YouTube", format: "long_video" };
  }
  if (host.endsWith("tiktok.com")) return { platform: "TikTok", format: "short_video" };
  if (host.endsWith("instagram.com")) {
    return path.startsWith("/reel")
      ? { platform: "Instagram", format: "short_video" }
      : { platform: "Instagram", format: "carousel" };
  }
  if (host.endsWith("linkedin.com")) {
    // A LinkedIn URL does not distinguish a text post from a native video, and
    // the two do not share a baseline. Unknown is the honest answer; the
    // operator sets it in one click.
    return { platform: "LinkedIn", format: "unknown" };
  }
  if (host === "x.com" || host.endsWith("twitter.com")) {
    return { platform: "X", format: "text_post" };
  }
  if (host.endsWith("substack.com")) return { platform: "Substack", format: "newsletter" };
  return { platform: "Other", format: "unknown" };
}

/**
 * Best guess at the creator's handle from the URL.
 *
 * Returns null rather than something wrong. A wrong handle is worse than no
 * handle here, because handles are the key the creator baseline is grouped by —
 * a typo silently splits one creator into two and destroys both baselines.
 */
export function handleFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host.endsWith("tiktok.com")) {
    const at = segments.find((s) => s.startsWith("@"));
    return at ? at.toLowerCase() : null;
  }
  if (host.endsWith("linkedin.com")) {
    const i = segments.indexOf("in");
    return i >= 0 && segments[i + 1] ? `@${segments[i + 1].toLowerCase()}` : null;
  }
  if (host === "x.com" || host.endsWith("twitter.com")) {
    return segments[0] && segments[0] !== "i" ? `@${segments[0].toLowerCase()}` : null;
  }
  if (host.endsWith("substack.com")) {
    const sub = url.hostname.replace(/^www\./, "").split(".")[0];
    return sub && sub !== "substack" ? `@${sub.toLowerCase()}` : null;
  }
  if (host.endsWith("youtube.com")) {
    const at = segments.find((s) => s.startsWith("@"));
    return at ? at.toLowerCase() : null;
  }
  return null;
}

/* -------------------------------- Enrichment -------------------------------- */

const OEMBED_HOSTS = /(^|\.)(youtube\.com|youtu\.be)$/i;

function oembedEndpoint(url: URL): string | null {
  if (OEMBED_HOSTS.test(url.hostname.replace(/^www\./, ""))) {
    return `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url.toString())}`;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function enrichExampleUrl(rawUrl: string): Promise<Enrichment | { error: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { error: "That is not a URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { error: "Only http and https addresses can be captured." };
  }

  const shape = detectShape(url);
  const base: Enrichment = {
    url: url.toString(),
    platform: shape.platform,
    format: shape.format,
    creatorHandle: handleFromUrl(url),
    creatorName: null,
    title: null,
    transcript: null,
    provenance: "url_only",
    note: "",
  };

  // 1. oEmbed, where the platform offers it. Public, credential-free, and the
  //    only automatic path that survives on a video platform.
  const oembed = oembedEndpoint(url);
  if (oembed) {
    const result = await fetchPublicJson(oembed);
    if (result.ok && result.data && typeof result.data === "object") {
      const data = result.data as Record<string, unknown>;
      const authorUrl = asString(data.author_url);
      let handle = base.creatorHandle;
      if (!handle && authorUrl) {
        try {
          handle = handleFromUrl(new URL(authorUrl));
        } catch {
          handle = null;
        }
      }
      return {
        ...base,
        title: asString(data.title),
        creatorName: asString(data.author_name),
        creatorHandle: handle,
        provenance: "auto_oembed",
        note: "Title and channel read from YouTube's public oEmbed endpoint. View counts are not available there — enter them by hand, or wait for the YouTube Data API key.",
      };
    }
    return {
      ...base,
      note: `oEmbed did not answer (${result.ok ? "unexpected shape" : result.reason}). Fill the details in by hand.`,
    };
  }

  // 2. Ordinary pages. For written formats the readable text *is* the transcript.
  const page = await fetchPublicPage(url.toString());
  if (page.ok) {
    return {
      ...base,
      title: page.title,
      transcript: page.text,
      provenance: "auto_page",
      note: "Title and full text read from the public page. Metrics are not on the page — enter them by hand.",
    };
  }

  return {
    ...base,
    note: page.blocked
      ? `${shape.platform} does not serve this to automated requests, which is normal for this wedge. Paste the post text and the numbers — they are stored with the URL exactly as if they had been read automatically.`
      : `Could not read the page (${page.reason}). Fill the details in by hand.`,
  };
}

/**
 * Split a pasted block into candidate URLs.
 *
 * Accepts whatever a person actually pastes: one per line, comma-separated,
 * wrapped in whitespace, with or without surrounding prose. Order is preserved
 * and duplicates within the paste are collapsed, because pasting the same link
 * twice in one go is an accident every time.
 */
export function parseUrlList(raw: string): string[] {
  const found = raw.match(/https?:\/\/[^\s,<>"')\]]+/gi) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of found) {
    const trimmed = candidate.replace(/[.,;]+$/, "");
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
