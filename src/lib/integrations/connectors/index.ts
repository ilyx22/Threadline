/**
 * Platform connectors — the real request/response shapes for each provider,
 * behind one mockable HTTP boundary.
 *
 * What is real here: typed configuration, scope sets, authorise/token URLs,
 * request builders for publishing and analytics, response parsers, error and
 * rate-limit mapping, and idempotent publish retries. What is not: live
 * credentials and platform review. Those are external gates; until they open,
 * every connector reports its capability honestly and the manual route stays.
 *
 * Scope names and endpoints follow each platform's public documentation as of
 * September 2026 and are listed in `docs/PLATFORM_APPLICATIONS.md`. Re-verify
 * them when a live application is approved — providers change them.
 */
import type { ProviderAuthConfig } from "../oauth";

export type EnvLike = Record<string, string | undefined>;

export type ConnectorErrorCode = "auth_expired" | "forbidden_scope" | "review_required" | "rate_limited" | "not_found" | "invalid_request" | "provider_error" | "network";

export type PublishOutcome =
  | { ok: true; externalId: string; url: string | null; providerStatus: string; raw?: unknown }
  | { ok: false; code: ConnectorErrorCode; message: string; retryAfterSec?: number; retryable: boolean };

export type MetricsOutcome =
  | { ok: true; metrics: Record<string, number | null>; measuredAt: Date | null; endpoint: string; raw?: unknown }
  | { ok: false; code: ConnectorErrorCode; message: string; retryAfterSec?: number };

export type StatusOutcome = { ok: true; status: "processing" | "published" | "failed"; externalId?: string; url?: string | null; message?: string } | { ok: false; code: ConnectorErrorCode; message: string };

export type PublishInput = {
  accessToken: string;
  /** Provider account / channel / page id when the API needs it. */
  externalAccountId?: string | null;
  text: string;
  title?: string;
  mediaUrl?: string | null;
  mediaKind?: "video" | "image" | "none";
  /** Client-supplied key so a retried publish cannot post twice where the provider supports it. */
  idempotencyKey?: string;
};

export type Connector = {
  provider: string;
  label: string;
  scopes: { publish: string[]; analytics: string[] };
  /** Built from environment; null until client credentials exist. Secrets never leave the server. */
  authConfig(env?: EnvLike): ProviderAuthConfig | null;
  /** What live use needs beyond credentials — platform review, partner tiers. */
  gates: string[];
  externalIdFromUrl?(url: string): string | null;
  publish(input: PublishInput): Promise<PublishOutcome>;
  publishStatus?(input: { accessToken: string; externalId: string }): Promise<StatusOutcome>;
  fetchMetrics(input: { accessToken: string; externalId: string }): Promise<MetricsOutcome>;
};

/* ------------------------------ HTTP boundary ------------------------------ */

let fetchImpl: typeof fetch = (...args) => fetch(...args);
export function __setConnectorFetch(next: typeof fetch | null) {
  fetchImpl = next ?? ((...args) => fetch(...args));
}

export async function http(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<{ status: number; headers: Headers; json: unknown; text: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), init.timeoutMs ?? 15000);
  try {
    const res = await fetchImpl(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let json: unknown = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    return { status: res.status, headers: res.headers, json, text };
  } finally {
    clearTimeout(t);
  }
}

/** Map an HTTP failure to a connector error. Shared so every provider classifies the same way. */
export function mapHttpError(status: number, headers: Headers, body: unknown, provider: string): { code: ConnectorErrorCode; message: string; retryAfterSec?: number; retryable: boolean } {
  const retryAfter = Number(headers.get("retry-after") ?? headers.get("x-rate-limit-reset") ?? "");
  const detail = typeof body === "object" && body ? JSON.stringify(body).slice(0, 200) : String(body ?? "").slice(0, 200);
  if (status === 401) return { code: "auth_expired", message: `${provider}: access token rejected (401). Reconnect the account.`, retryable: false };
  if (status === 403) {
    const text = detail.toLowerCase();
    if (/scope|permission|insufficient/.test(text)) return { code: "forbidden_scope", message: `${provider}: the token lacks a required scope (403).`, retryable: false };
    return { code: "review_required", message: `${provider}: refused (403) — the app likely needs platform review or a partner tier for this call.`, retryable: false };
  }
  if (status === 404) return { code: "not_found", message: `${provider}: the post was not found (404).`, retryable: false };
  if (status === 429) return { code: "rate_limited", message: `${provider}: rate limited (429).`, retryAfterSec: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60, retryable: true };
  if (status >= 500) return { code: "provider_error", message: `${provider}: provider error (${status}).`, retryable: true };
  return { code: "invalid_request", message: `${provider}: request rejected (${status}) ${detail}`, retryable: false };
}

export function envAuthConfig(input: { provider: string; authorizeUrl: string; tokenUrl: string; scopes: string[]; usesPkce: boolean; extra?: Record<string, string>; env?: EnvLike }): ProviderAuthConfig | null {
  const env = input.env ?? process.env;
  const key = input.provider.toUpperCase();
  const clientId = env[`${key}_CLIENT_ID`];
  const clientSecret = env[`${key}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) return null;
  return { provider: input.provider, authorizeUrl: input.authorizeUrl, tokenUrl: input.tokenUrl, clientId, clientSecret, scopes: input.scopes, usesPkce: input.usesPkce, extraAuthorizeParams: input.extra };
}

/* --------------------------------- Registry -------------------------------- */

import { linkedin } from "./linkedin";
import { youtube } from "./youtube";
import { instagram } from "./meta";
import { tiktok } from "./tiktok";
import { x } from "./x";
import { facebook } from "./facebook";
import { threads } from "./threads";

const CONNECTORS: Record<string, Connector> = { linkedin, youtube, instagram, tiktok, x, facebook, threads };

export function getConnector(provider: string): Connector | null {
  return CONNECTORS[provider] ?? null;
}

export function listConnectors() {
  return Object.values(CONNECTORS);
}

/** Truthful capability for a provider in this deployment. */
export function connectorReadiness(provider: string, env: EnvLike = process.env) {
  const c = getConnector(provider);
  if (!c) return { provider, state: "UNSUPPORTED" as const, gates: [] as string[] };
  const configured = !!c.authConfig(env);
  return { provider, state: configured ? ("AUTH_REQUIRED" as const) : ("CREDENTIALS_MISSING" as const), gates: c.gates, scopes: c.scopes };
}
