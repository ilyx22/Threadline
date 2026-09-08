/**
 * What a connection can actually do.
 *
 * The rule this module exists to enforce: **never show "Connected" when only
 * configuration exists, and never show an enabled button that cannot perform
 * the action.**
 *
 * That is not pedantry. On every platform Threadline touches, authentication
 * and permission are separately gated, and the gaps are large:
 *
 *   - LinkedIn grants member publishing self-serve and puts member *analytics*
 *     behind a months-long review. Connected, and cannot read a single metric.
 *   - An unaudited TikTok app publishes to `SELF_ONLY` while the API returns
 *     success. Connected, publishing, and invisible.
 *   - A YouTube project with an unverified OAuth consent screen uploads fine
 *     and shows the client a warning screen on the way in.
 *
 * A single boolean cannot express any of those, so `productionCapable` is
 * DERIVED here rather than stored — a stored flag is a claim somebody has to
 * remember to update, and this one would be quoted to a client.
 */

export const AUTH_STATUSES = ["none", "connected", "expired", "revoked", "error"] as const;
export type AuthStatus = (typeof AUTH_STATUSES)[number];

/**
 * How publishing actually happens today.
 *
 * `manual` and `native_delegated` are real, supported routes and not failures:
 * a person publishing from the client's own account is how most of this wedge
 * will work for months. `api_private_only` is the dangerous one — it looks like
 * success and reaches nobody.
 */
export const PUBLISH_CAPABILITIES = [
  "unavailable",
  "manual",
  "native_delegated",
  "api_private_only",
  "api_public",
] as const;
export type PublishCapability = (typeof PUBLISH_CAPABILITIES)[number];

export const ANALYTICS_CAPABILITIES = ["unavailable", "manual", "api"] as const;
export type AnalyticsCapability = (typeof ANALYTICS_CAPABILITIES)[number];

export const RESEARCH_CAPABILITIES = ["unavailable", "manual", "provider", "api"] as const;
export type ResearchCapability = (typeof RESEARCH_CAPABILITIES)[number];

export const REVIEW_STATUSES = [
  "not_required",
  "not_submitted",
  "in_review",
  "approved",
  "rejected",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type IntegrationState = {
  provider: string;
  authStatus: AuthStatus;
  publishCapability: PublishCapability;
  analyticsCapability: AnalyticsCapability;
  researchCapability: ResearchCapability;
  reviewStatus: ReviewStatus;
  scopesRequested: string[];
  scopesGranted: string[];
  restrictions: string[];
  tokenExpiresAt: Date | null;
  lastVerifiedAt: Date | null;
  lastSuccessfulSyncAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  reconnectRequired: boolean;
  /** Whether an encrypted credential actually exists for this provider. */
  hasCredential: boolean;
};

/* -------------------------------- The reading -------------------------------- */

export const HEALTH = ["not_connected", "healthy", "degraded", "blocked", "broken"] as const;
export type Health = (typeof HEALTH)[number];

export type CapabilityReading = {
  health: Health;
  /** Short label for a badge. Never simply "Connected". */
  label: string;
  /** One sentence: what this connection can and cannot do right now. */
  summary: string;
  /** Can Threadline publish to a public audience through this, right now? */
  canPublishPublicly: boolean;
  /** Can Threadline read performance through this, right now? */
  canReadAnalytics: boolean;
  /** Scopes asked for and not granted. Usually the reason something is missing. */
  missingScopes: string[];
  /** What the operator should do next, when anything. */
  nextAction: string | null;
  /** Everything currently limiting this connection, in plain language. */
  limits: string[];
};

const TOKEN_EXPIRY_WARNING_DAYS = 7;

export function readCapability(state: IntegrationState, now = new Date()): CapabilityReading {
  const limits: string[] = [...state.restrictions];
  const missingScopes = state.scopesRequested.filter((s) => !state.scopesGranted.includes(s));

  if (missingScopes.length > 0) {
    limits.push(
      `Asked for ${missingScopes.length} permission${missingScopes.length === 1 ? "" : "s"} that ${missingScopes.length === 1 ? "was" : "were"} not granted: ${missingScopes.join(", ")}.`,
    );
  }

  const canPublishPublicly = state.authStatus === "connected" && state.publishCapability === "api_public";
  const canReadAnalytics = state.authStatus === "connected" && state.analyticsCapability === "api";

  /* Not connected at all. */
  if (state.authStatus === "none") {
    const fallback =
      state.publishCapability === "native_delegated"
        ? "Publishing happens by hand from the client's own account, which is a supported route rather than a gap."
        : state.publishCapability === "manual"
          ? "Everything here is manual for now."
          : "Nothing is configured.";
    return {
      health: "not_connected",
      label: "Not connected",
      summary: fallback,
      canPublishPublicly: false,
      canReadAnalytics: false,
      missingScopes,
      nextAction: "Connect the account, or keep working through the manual route.",
      limits,
    };
  }

  /* Connected, but the token is gone. */
  if (state.authStatus === "revoked" || state.reconnectRequired) {
    return {
      health: "broken",
      label: "Reconnect required",
      summary:
        "Access was withdrawn or the token no longer works. Nothing will publish or sync until somebody reconnects the account.",
      canPublishPublicly: false,
      canReadAnalytics: false,
      missingScopes,
      nextAction: "Reconnect the account.",
      limits,
    };
  }

  if (state.authStatus === "expired") {
    return {
      health: "broken",
      label: "Token expired",
      summary: "The stored token has expired and could not be refreshed.",
      canPublishPublicly: false,
      canReadAnalytics: false,
      missingScopes,
      nextAction: "Reconnect the account.",
      limits,
    };
  }

  if (state.authStatus === "error") {
    return {
      health: "broken",
      label: "Erroring",
      summary: state.lastErrorMessage ?? "The last call to this provider failed.",
      canPublishPublicly: false,
      canReadAnalytics: false,
      missingScopes,
      nextAction: "Check the error and retry, or reconnect.",
      limits,
    };
  }

  /* Connected. Now: what does that actually buy? */
  if (state.tokenExpiresAt) {
    const days = (state.tokenExpiresAt.getTime() - now.getTime()) / 86_400_000;
    if (days <= 0) {
      limits.push("The stored token has passed its expiry and needs refreshing.");
    } else if (days <= TOKEN_EXPIRY_WARNING_DAYS) {
      limits.push(`The token expires in ${Math.ceil(days)} day${Math.ceil(days) === 1 ? "" : "s"}.`);
    }
  }

  if (state.publishCapability === "api_private_only") {
    // The most dangerous state on the board: the API accepts the post and
    // returns success, and nobody sees it.
    limits.push(
      "Anything published through this API is visible only to the account owner until the platform completes its audit. The API reports success either way.",
    );
    return {
      health: "blocked",
      label: "Authenticated · private posts only",
      summary:
        "The account is connected and the API works, but published content is forced private until the platform's audit completes. Publishing through it would look like it worked and reach nobody.",
      canPublishPublicly: false,
      canReadAnalytics,
      missingScopes,
      nextAction:
        state.reviewStatus === "in_review"
          ? "Nothing to do here — the platform review is running."
          : "Submit the platform audit.",
      limits,
    };
  }

  if (state.reviewStatus === "rejected") {
    limits.push("The platform rejected the last review submission.");
  }

  const publishing =
    state.publishCapability === "api_public"
      ? "publish"
      : state.publishCapability === "native_delegated"
        ? "publish by hand from the client's account"
        : state.publishCapability === "manual"
          ? "publish by hand"
          : "not publish";

  const analytics =
    state.analyticsCapability === "api"
      ? "read performance automatically"
      : state.analyticsCapability === "manual"
        ? "take performance by hand"
        : "not read performance";

  const degraded =
    !canPublishPublicly ||
    !canReadAnalytics ||
    missingScopes.length > 0 ||
    state.reviewStatus === "in_review" ||
    state.reviewStatus === "rejected";

  return {
    health: degraded ? "degraded" : "healthy",
    label: degraded ? "Connected · limited" : "Connected",
    summary: `Authenticated. Threadline can ${publishing} and ${analytics}.`,
    canPublishPublicly,
    canReadAnalytics,
    missingScopes,
    nextAction:
      state.analyticsCapability !== "api" && state.reviewStatus === "not_submitted"
        ? "Apply for the analytics permission — it is the long pole on most platforms."
        : null,
    limits,
  };
}

/**
 * Whether a publish attempt should be allowed to proceed.
 *
 * Called before anything is sent. `api_private_only` refuses rather than
 * publishing invisibly — a post that silently reaches nobody while the UI says
 * "published" is the exact false-negative the build doctrine forbids.
 */
export function assertCanPublish(state: IntegrationState): { ok: true } | { ok: false; reason: string } {
  if (state.authStatus !== "connected") {
    return { ok: false, reason: "That account is not connected." };
  }
  if (state.publishCapability === "api_private_only") {
    return {
      ok: false,
      reason:
        "This platform has not finished its audit, so anything posted through the API is visible only to the account owner. The API would report success. Publish from the account directly until the audit completes.",
    };
  }
  if (state.publishCapability !== "api_public") {
    return { ok: false, reason: "This connection cannot publish through an API." };
  }
  return { ok: true };
}
