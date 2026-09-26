/**
 * Integration registry.
 *
 * The honest source of truth about what Threadline can and cannot do today.
 *
 * `implementation` is the field that matters:
 *   - `available`   the integration genuinely works with the configuration the
 *                   UI collects, and requires no credentials we cannot obtain.
 *   - `adapter_only` the connector code exists (src/lib/integrations/connectors:
 *                   auth config, publish/status/metrics, error mapping, tested
 *                   to a mocked boundary), but completing the connection needs
 *                   platform credentials and/or app review we do not yet have.
 *                   The connector reports a truthful capability state
 *                   (credentials missing / auth required / reconnect) and the
 *                   UI must say so plainly. Nothing is simulated.
 *   - `manual_only` no API path in v1. A working manual workflow is provided.
 *
 * Rule enforced across the product: nothing renders a "Connect" button that
 * cannot actually connect. Where a connection is impossible today, the card
 * explains why and points at the manual fallback.
 */

export type IntegrationImplementation = "available" | "adapter_only" | "manual_only";

/**
 * How access to a provider actually works today.
 *
 * Separate from `implementation`, which describes what Threadline's code can
 * do. This describes what actually happens when something gets published, and
 * it exists because "set up" and "connected to an API" are different claims —
 * collapsing them is how a product ends up implying connectivity it lacks.
 *
 * `native_delegated` is the honest description of the normal arrangement: a
 * Threadline operator has been given access inside the platform's own tools and
 * publishes from there, by hand. No credential is stored here, and nothing is
 * automated — but it is materially different from the client doing it
 * themselves, so it deserves its own name rather than being called manual.
 */
export type AccessMethodOption = "manual" | "native_delegated" | "api";

/** Access methods genuinely available for a provider, in preference order. */
export function accessOptionsFor(definition: IntegrationDefinition): AccessMethodOption[] {
  if (definition.implementation === "available") return ["api"];
  if (definition.category === "publishing") return ["manual", "native_delegated"];
  return ["manual"];
}

export type IntegrationCategory =
  | "publishing"
  | "analytics"
  | "storage"
  | "crm"
  | "scheduling"
  | "payments";

export type IntegrationDefinition = {
  provider: string;
  name: string;
  category: IntegrationCategory;
  summary: string;
  capabilities: string[];
  implementation: IntegrationImplementation;
  /** Why it is not available yet. Required unless implementation is `available`. */
  blockedReason?: string;
  /** The workflow the client uses instead, today. */
  manualFallback: string;
  /** Non-secret configuration this integration collects. */
  configFields?: {
    key: string;
    label: string;
    placeholder?: string;
    hint?: string;
    type?: "text" | "url";
  }[];
  docsUrl?: string;
};

export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    provider: "booking",
    name: "Booking link",
    category: "scheduling",
    summary:
      "The external scheduling URL used at the end of the application flow and in content CTAs.",
    capabilities: ["Route applicants to a booking page", "Reused across CTAs"],
    implementation: "available",
    manualFallback: "Not applicable — this works today.",
    configFields: [
      {
        key: "url",
        label: "Booking URL",
        placeholder: "https://cal.example.com/threadline/strategy-call",
        hint: "Any scheduling provider. No credentials needed — Threadline only stores and links to this URL.",
        type: "url",
      },
    ],
  },
  {
    provider: "youtube",
    name: "YouTube",
    category: "publishing",
    summary: "Publish videos and import performance data for published assets.",
    capabilities: ["Publish", "Import metrics", "Sync titles and descriptions"],
    implementation: "adapter_only",
    blockedReason:
      "Requires a Google Cloud project with the YouTube Data API enabled and an OAuth consent screen verified for your brand. Threadline cannot supply these on your behalf.",
    manualFallback:
      "Upload through YouTube Studio using the packaging Threadline generates, then paste the live URL into the publish record. Enter performance figures in the Performance module weekly.",
    configFields: [
      { key: "channelId", label: "Channel ID", placeholder: "UC…", hint: "Used to label the destination." },
      { key: "channelUrl", label: "Channel URL", type: "url" },
    ],
  },
  {
    provider: "linkedin",
    name: "LinkedIn",
    category: "publishing",
    summary: "Publish posts and videos to a personal profile or company page.",
    capabilities: ["Publish", "Import metrics"],
    implementation: "adapter_only",
    blockedReason:
      "LinkedIn's posting and analytics APIs require an approved Marketing Developer Platform application. Access is granted per-company by LinkedIn.",
    manualFallback:
      "Post manually using the generated caption, then paste the post URL into the publish record. Impressions and engagement are entered weekly.",
    configFields: [
      { key: "profileUrl", label: "Profile or page URL", type: "url" },
      { key: "handle", label: "Handle", placeholder: "alex-morgan" },
    ],
  },
  {
    provider: "instagram",
    name: "Instagram",
    category: "publishing",
    summary: "Publish Reels and import insights.",
    capabilities: ["Publish Reels", "Import insights"],
    implementation: "adapter_only",
    blockedReason:
      "Requires a Meta app with Instagram Graph API permissions, a connected Business account and App Review approval.",
    manualFallback:
      "Publish from the Instagram app using the generated caption and overlays. Paste the URL back into Threadline and log insights weekly.",
    configFields: [{ key: "handle", label: "Handle", placeholder: "@alexmorgan" }],
  },
  {
    provider: "facebook",
    name: "Facebook Page",
    category: "publishing",
    summary: "Publish Page posts and videos, and import engagement.",
    capabilities: ["Publish to a Page", "Import engagement and video views"],
    implementation: "adapter_only",
    blockedReason:
      "The connector is built against the Graph API; live use needs a Meta app approved in App Review for pages_manage_posts, pages_read_engagement and read_insights, and business verification.",
    manualFallback:
      "Publish from Meta Business Suite using the generated copy. Paste the post URL back into Threadline and log engagement weekly.",
    configFields: [{ key: "profileUrl", label: "Page URL", type: "url" }],
  },
  {
    provider: "threads",
    name: "Threads",
    category: "publishing",
    summary: "Publish posts and import insights.",
    capabilities: ["Publish text, image and video posts", "Import insights"],
    implementation: "adapter_only",
    blockedReason:
      "The connector is built against the Threads API; live use needs a Meta app approved in App Review for threads_content_publish and threads_manage_insights.",
    manualFallback: "Post from the Threads app using the generated copy (500 characters). Paste the URL back and log insights weekly.",
    configFields: [{ key: "handle", label: "Handle", placeholder: "@alexmorgan" }],
  },
  {
    provider: "tiktok",
    name: "TikTok",
    category: "publishing",
    summary: "Publish videos and import analytics.",
    capabilities: ["Publish", "Import analytics"],
    implementation: "adapter_only",
    blockedReason:
      "TikTok's Content Posting API requires an approved developer application and audited scopes.",
    manualFallback: "Publish in-app, paste the URL into the publish record, log analytics weekly.",
    configFields: [{ key: "handle", label: "Handle", placeholder: "@alexmorgan" }],
  },
  {
    provider: "x",
    name: "X",
    category: "publishing",
    summary: "Publish posts and import engagement.",
    capabilities: ["Publish", "Import engagement"],
    implementation: "adapter_only",
    blockedReason: "Posting and analytics require a paid X API tier with per-project credentials.",
    manualFallback: "Post manually, paste the URL, log engagement weekly.",
    configFields: [{ key: "handle", label: "Handle", placeholder: "@alexmorgan" }],
  },
  {
    provider: "google_drive",
    name: "Google Drive",
    category: "storage",
    summary: "Reference raw and edited media that lives in the client's Drive.",
    capabilities: ["Link files", "Reference folders"],
    implementation: "manual_only",
    blockedReason:
      "Drive access requires OAuth consent per workspace. In v1, Threadline stores links rather than holding Drive credentials.",
    manualFallback:
      "Paste shareable Drive links onto content items and library records. Threadline stores the link, not the file.",
    configFields: [
      { key: "folderUrl", label: "Working folder URL", type: "url", hint: "Where editors collect raw footage." },
    ],
  },
  {
    provider: "dropbox",
    name: "Dropbox",
    category: "storage",
    summary: "Reference media stored in Dropbox.",
    capabilities: ["Link files"],
    implementation: "manual_only",
    blockedReason: "Requires an OAuth app per workspace; not implemented in v1.",
    manualFallback: "Paste shared links onto content items and library records.",
    configFields: [{ key: "folderUrl", label: "Working folder URL", type: "url" }],
  },
  {
    provider: "stripe",
    name: "Stripe",
    category: "payments",
    summary: "Attribute closed revenue to content that produced the conversation.",
    capabilities: ["Import payments", "Attribute revenue"],
    implementation: "adapter_only",
    blockedReason:
      "Requires a restricted Stripe API key with read access to charges. Not collected in v1 because it is a live financial credential.",
    manualFallback:
      "Record closed value manually on the pipeline record. Threadline attributes it to the linked content item.",
  },
  {
    provider: "hubspot",
    name: "HubSpot",
    category: "crm",
    summary: "Sync inbound inquiries and booked calls into the pipeline layer.",
    capabilities: ["Import contacts", "Import deals"],
    implementation: "adapter_only",
    blockedReason: "Requires a HubSpot private app token with CRM scopes.",
    manualFallback: "Add inquiries and calls manually in Pipeline, linked to the content that caused them.",
  },
  {
    provider: "gohighlevel",
    name: "GoHighLevel",
    category: "crm",
    summary: "Sync opportunities into the pipeline layer.",
    capabilities: ["Import opportunities"],
    implementation: "adapter_only",
    blockedReason: "Requires a location API key from the client's sub-account.",
    manualFallback: "Add pipeline records manually.",
  },
  {
    provider: "analytics",
    name: "Web analytics",
    category: "analytics",
    summary: "Attribute site sessions and conversions to content.",
    capabilities: ["Import sessions", "Attribute conversions"],
    implementation: "manual_only",
    blockedReason:
      "Threadline does not proxy analytics providers in v1; approaches differ too much between providers to build one honest adapter.",
    manualFallback:
      "Use a tracked link per CTA and record the resulting inquiries in Pipeline against the source content.",
    configFields: [{ key: "dashboardUrl", label: "Dashboard URL", type: "url" }],
  },
];

export function integrationByProvider(provider: string) {
  return INTEGRATIONS.find((i) => i.provider === provider);
}

export function integrationsByCategory(category: IntegrationCategory) {
  return INTEGRATIONS.filter((i) => i.category === category);
}

export const IMPLEMENTATION_META: Record<
  IntegrationImplementation,
  { label: string; tone: "positive" | "warning" | "neutral"; explanation: string }
> = {
  available: {
    label: "Available",
    tone: "positive",
    explanation: "Works today with the configuration below.",
  },
  adapter_only: {
    label: "Credentials required",
    tone: "warning",
    explanation:
      "The adapter is built. Connecting it needs platform credentials that only you can obtain.",
  },
  manual_only: {
    label: "Manual workflow",
    tone: "neutral",
    explanation: "No automated connection in v1. A manual workflow is provided and supported.",
  },
};

export const PUBLISHABLE_PLATFORMS = ["youtube", "linkedin", "instagram", "tiktok", "x", "facebook", "threads"] as const;
