import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { parseJson, stringify } from "@/lib/db/json";
import { credentialAad, open, safeEqual, seal, type SealedSecret } from "@/lib/security/secret-box";
import { putCredential } from "./credentials";
import { safePath } from "@/lib/security/safe-path";

/**
 * One OAuth implementation, not five.
 *
 * Every provider Threadline touches differs in scopes, endpoints and quirks,
 * but the security-critical parts are identical everywhere: a single-use
 * `state` bound to the tenant, PKCE where supported, a redirect URI that cannot
 * be steered by the caller, and a token that never touches a log.
 *
 * Writing that five times is how one of the five ends up subtly wrong.
 *
 * WHAT MAKES THE STATE SINGLE-USE
 *
 * It is a database row that is *consumed* — marked used inside the same query
 * that reads it. Replaying a callback then finds a consumed row and is refused.
 * A signed cookie could prove authenticity but not first-use, and an
 * authorisation code replay is exactly the attack that matters here.
 */

/** How long a handshake may sit unfinished. Long enough to log in, no longer. */
const STATE_TTL_MS = 10 * 60 * 1000;

export type ProviderAuthConfig = {
  provider: string;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  /** Whether the provider supports PKCE. Used when it does; never faked. */
  usesPkce: boolean;
  /** Extra params some providers require on the authorize call. */
  extraAuthorizeParams?: Record<string, string>;
};

export type StartResult =
  | { ok: true; authorizeUrl: string; state: string }
  | { ok: false; reason: string };

/* --------------------------------- Starting ---------------------------------- */

function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/**
 * The redirect URI, derived from configuration rather than from the request.
 *
 * Taking it from a header would let a caller point the provider's callback
 * wherever they liked, which hands an authorisation code to an attacker. It is
 * built from `NEXT_PUBLIC_APP_URL` and nothing else.
 */
export function redirectUriFor(provider: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/api/oauth/${provider}/callback`;
}

export async function startAuthorization(input: {
  orgId: string;
  userId: string;
  config: ProviderAuthConfig;
  returnTo?: string;
}): Promise<StartResult> {
  const { config } = input;

  if (!config.clientId || !config.clientSecret) {
    return {
      ok: false,
      reason: `No ${config.provider} application is configured. Add the client id and secret before connecting an account.`,
    };
  }

  const state = randomBytes(32).toString("base64url");
  const pkce = config.usesPkce ? pkcePair() : null;

  await prisma.oAuthState.create({
    data: {
      orgId: input.orgId,
      provider: config.provider,
      state,
      sealedVerifier: pkce
        ? stringify(seal(pkce.verifier, credentialAad(input.orgId, config.provider, "pkce")))
        : null,
      // Only a same-origin path is ever stored. An absolute URL here would be
      // an open redirect wearing an OAuth callback's authority.
      returnTo: safeReturnTo(input.returnTo),
      scopesRequested: stringify(config.scopes),
      createdById: input.userId,
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    },
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUriFor(config.provider),
    scope: config.scopes.join(" "),
    state,
    ...(config.extraAuthorizeParams ?? {}),
  });
  if (pkce) {
    params.set("code_challenge", pkce.challenge);
    params.set("code_challenge_method", "S256");
  }

  return { ok: true, authorizeUrl: `${config.authorizeUrl}?${params.toString()}`, state };
}

/** Only a relative, single-slash-prefixed path survives. */
export function safeReturnTo(value: string | undefined | null): string | null {
  return safePath(value);
}

/* -------------------------------- Completing ---------------------------------- */

export type ConsumedState = {
  orgId: string;
  provider: string;
  returnTo: string | null;
  scopesRequested: string[];
  verifier: string | null;
};

/**
 * Verify and consume a callback's `state`.
 *
 * Consumption is the point. The update is conditioned on `consumedAt` still
 * being null, so two concurrent callbacks race and exactly one wins — a replay
 * of the same authorisation code cannot be exchanged twice.
 */
export async function consumeState(state: string): Promise<ConsumedState | { error: string }> {
  if (!state || state.length > 512) return { error: "Missing or malformed state." };

  const row = await prisma.oAuthState.findUnique({ where: { state } });
  if (!row) return { error: "That authorisation attempt is not one we started." };

  // Constant-time, even though the lookup already matched: the comparison is
  // cheap and the habit is what keeps it correct when this code is copied.
  if (!safeEqual(row.state, state)) return { error: "State mismatch." };

  if (row.consumedAt) return { error: "That authorisation callback has already been used." };
  if (row.expiresAt.getTime() < Date.now()) {
    return { error: "That authorisation attempt expired. Start the connection again." };
  }

  const claimed = await prisma.oAuthState.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) {
    return { error: "That authorisation callback has already been used." };
  }

  let verifier: string | null = null;
  if (row.sealedVerifier) {
    const sealed = parseJson<SealedSecret | null>(row.sealedVerifier, null);
    verifier = sealed
      ? open(sealed, credentialAad(row.orgId, row.provider, "pkce"))
      : null;
  }

  return {
    orgId: row.orgId,
    provider: row.provider,
    returnTo: row.returnTo,
    scopesRequested: parseJson<string[]>(row.scopesRequested, []),
    verifier,
  };
}

export type TokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresInSec: number | null;
  /** What the provider says it granted. Frequently a subset of what was asked. */
  scopesGranted: string[];
  externalAccountId: string | null;
};

export type ExchangeOutcome =
  | { ok: true; token: TokenResponse }
  | { ok: false; reason: string; retryable: boolean };

/**
 * Swap an authorisation code for tokens.
 *
 * Errors are classified rather than thrown as strings: a 5xx is worth retrying
 * and an `invalid_grant` never is, and a caller that cannot tell the difference
 * will retry its way into a rate limit.
 */
export async function exchangeCode(input: {
  config: ProviderAuthConfig;
  code: string;
  verifier: string | null;
}): Promise<ExchangeOutcome> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: redirectUriFor(input.config.provider),
    client_id: input.config.clientId,
    client_secret: input.config.clientSecret,
  });
  if (input.verifier) body.set("code_verifier", input.verifier);

  return postForToken(input.config, body);
}

/** Refresh an access token. Same classification rules as the initial exchange. */
export async function refreshAccessToken(input: {
  config: ProviderAuthConfig;
  refreshToken: string;
}): Promise<ExchangeOutcome> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: input.refreshToken,
    client_id: input.config.clientId,
    client_secret: input.config.clientSecret,
  });
  return postForToken(input.config, body);
}

async function postForToken(
  config: ProviderAuthConfig,
  body: URLSearchParams,
): Promise<ExchangeOutcome> {
  let response: Response;
  try {
    response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, reason: "Could not reach the provider's token endpoint.", retryable: true };
  }

  const text = await response.text();

  if (!response.ok) {
    // The body can contain the client secret echoed back by some providers, so
    // only the error code is surfaced and nothing is logged wholesale.
    const code = extractErrorCode(text);
    const retryable = response.status >= 500 || response.status === 429;
    return {
      ok: false,
      reason: `The provider refused the token request (${response.status}${code ? `: ${code}` : ""}).`,
      retryable,
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "The provider's token response was not JSON.", retryable: false };
  }

  const accessToken = typeof parsed.access_token === "string" ? parsed.access_token : null;
  if (!accessToken) {
    return { ok: false, reason: "The provider returned no access token.", retryable: false };
  }

  const scopeRaw = typeof parsed.scope === "string" ? parsed.scope : "";

  return {
    ok: true,
    token: {
      accessToken,
      refreshToken: typeof parsed.refresh_token === "string" ? parsed.refresh_token : null,
      expiresInSec: typeof parsed.expires_in === "number" ? parsed.expires_in : null,
      scopesGranted: scopeRaw ? scopeRaw.split(/[\s,]+/).filter(Boolean) : [],
      externalAccountId:
        typeof parsed.open_id === "string"
          ? parsed.open_id
          : typeof parsed.user_id === "string"
            ? parsed.user_id
            : null,
    },
  };
}

function extractErrorCode(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    return typeof parsed.error === "string" ? parsed.error : null;
  } catch {
    return null;
  }
}

/* --------------------------------- Persisting ---------------------------------- */

/**
 * Store the result of a successful handshake.
 *
 * Writes the tokens into the encrypted store and the *capabilities* onto the
 * integration row — including which scopes were actually granted, so the UI can
 * say "connected, and cannot read analytics" rather than "connected".
 */
export async function persistConnection(input: {
  orgId: string;
  provider: string;
  token: TokenResponse;
  scopesRequested: string[];
  publishCapability: string;
  analyticsCapability: string;
  reviewStatus: string;
  restrictions: string[];
  accountLabel?: string | null;
}): Promise<void> {
  const expiresAt = input.token.expiresInSec
    ? new Date(Date.now() + input.token.expiresInSec * 1000)
    : null;

  await putCredential({
    orgId: input.orgId,
    provider: input.provider,
    purpose: "oauth_access",
    secret: input.token.accessToken,
    scopes: input.token.scopesGranted,
    expiresAt,
    externalAccountId: input.token.externalAccountId,
    externalAccountLabel: input.accountLabel ?? null,
  });

  if (input.token.refreshToken) {
    await putCredential({
      orgId: input.orgId,
      provider: input.provider,
      purpose: "oauth_refresh",
      secret: input.token.refreshToken,
      scopes: input.token.scopesGranted,
      externalAccountId: input.token.externalAccountId,
    });
  }

  const capabilities = {
    authStatus: "connected",
    publishCapability: input.publishCapability,
    analyticsCapability: input.analyticsCapability,
    reviewStatus: input.reviewStatus,
    scopesRequested: stringify(input.scopesRequested),
    scopesGranted: stringify(input.token.scopesGranted),
    restrictions: stringify(input.restrictions),
    externalAccountId: input.token.externalAccountId,
    externalAccountLabel: input.accountLabel ?? null,
    tokenExpiresAt: expiresAt,
    lastVerifiedAt: new Date(),
    reconnectRequired: false,
    lastErrorAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    connectedAt: new Date(),
    status: "configured",
    accessMethod: "api",
  };

  await prisma.integration.upsert({
    where: { orgId_provider: { orgId: input.orgId, provider: input.provider } },
    create: { orgId: input.orgId, provider: input.provider, ...capabilities },
    update: capabilities,
  });
}

/** Housekeeping: expired handshakes are noise and should not accumulate. */
export async function purgeExpiredStates(): Promise<number> {
  const result = await prisma.oAuthState.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } },
  });
  return result.count;
}
