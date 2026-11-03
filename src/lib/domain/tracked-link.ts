import { randomBytes } from "node:crypto";
import { WorkflowError } from "./workflow";

/**
 * Threadline-owned tracked links.
 *
 * A tracked link is what makes attribution work **without Threadline publishing
 * the content**. The client or an operator posts manually, the caption or bio
 * carries a Threadline URL, and the click is still ours to observe. Waiting for
 * a platform to approve API access before any of this can work would make an
 * external approval queue into a launch blocker, which it is not.
 *
 * The security problem this file exists to solve is the open redirect. A stable
 * public URL on a company's own domain that forwards anywhere is a phishing
 * primitive: the link looks like Threadline, the destination is not. Creating a
 * link is capability-gated, but the gate is not the whole control — a
 * destination is validated at the point of write, every time, so a bad value
 * cannot be stored in the first place.
 */

/** Only these schemes. `javascript:` and `data:` are the obvious attacks. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Paths on Threadline's own origin that a tracked link may never point at.
 *
 * Redirecting to our own sign-in page from a link we published is exactly the
 * shape of a credential-harvesting hop, and there is no legitimate reason for a
 * content link to do it.
 */
const FORBIDDEN_PATH_PREFIXES = ["/login", "/api", "/admin", "/t/"];

export type ValidatedDestination = { url: string; host: string };

/**
 * Validate and normalise a redirect destination.
 *
 * Returns the canonical URL to store. Throws with a reason a person can act on,
 * because these are written by operators, not by machines.
 */
export function validateDestination(raw: string, appOrigin?: string): ValidatedDestination {
  const trimmed = raw?.trim();
  if (!trimmed) {
    throw new WorkflowError("A tracked link needs somewhere to go.");
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new WorkflowError(`"${trimmed}" is not a URL Threadline can redirect to.`);
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new WorkflowError(
      `Only http and https destinations are allowed. "${url.protocol}" is not a web address a visitor can safely be sent to.`,
    );
  }

  // Credentials in a URL are almost always an attempt to make one host look
  // like another in the address bar.
  if (url.username || url.password) {
    throw new WorkflowError("A destination cannot carry a username or password.");
  }

  if (!url.hostname) {
    throw new WorkflowError("That destination has no host.");
  }

  if (appOrigin) {
    try {
      const app = new URL(appOrigin);
      if (app.host === url.host) {
        const path = url.pathname.toLowerCase();
        if (FORBIDDEN_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
          throw new WorkflowError(
            "A tracked link cannot point back at Threadline's own sign-in, API or admin routes.",
          );
        }
      }
    } catch (error) {
      // A malformed appOrigin is a configuration problem, not a reason to
      // reject an otherwise valid destination.
      if (error instanceof WorkflowError) throw error;
    }
  }

  return { url: url.toString(), host: url.hostname };
}

/**
 * A short, unguessable slug.
 *
 * Unguessable matters: a sequential slug would let anyone enumerate every
 * client's destinations, which leaks who Threadline works with and what they
 * are promoting.
 */
export function newSlug(bytes = 6): string {
  return randomBytes(bytes).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
}

/** The public URL for a slug, given the deployment origin. */
export function trackedUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/t/${slug}`;
}

/**
 * A referrer reduced to its host.
 *
 * The full referring URL can carry personal data in its query string, and the
 * host answers the only question worth asking of it: which platform sent them.
 */
/**
 * Requests that are not a person clicking: link-preview crawlers (LinkedIn,
 * Slack, X, Facebook, WhatsApp, Telegram, Discord…), search bots, command-line
 * clients, and browser prefetches. They still get the redirect, but they are
 * not recorded as clicks; otherwise every post would show clicks before any
 * human had seen it (found live 3 Nov 2026: a curl request counted as a click).
 */
const AUTOMATED_UA = /bot\b|bot\/|crawler|spider|slurp|preview|facebookexternalhit|facebot|linkedin|slack|twitter|whatsapp|telegram|discord|skype|embedly|vkshare|pinterest|redditbot|applebot|bingpreview|googleother|headless|curl\/|wget\/|python-requests|python-urllib|httpie|go-http-client|okhttp|java\/|axios\/|node-fetch|undici|libwww|scrapy|monitor|uptime|pingdom/i;

export function isAutomatedRequest(userAgent: string | null | undefined, headers: { purpose?: string | null; secPurpose?: string | null } = {}): boolean {
  const purpose = `${headers.purpose ?? ""} ${headers.secPurpose ?? ""}`.toLowerCase();
  if (/prefetch|prerender/.test(purpose)) return true;
  if (!userAgent || userAgent.trim().length < 8) return true;
  return AUTOMATED_UA.test(userAgent);
}

export function referrerHost(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname || null;
  } catch {
    return null;
  }
}
