import { z } from "zod";

/**
 * Every status vocabulary in the product, in one place.
 *
 * The database stores these as plain strings (see docs/DATA_MODEL.md section 1).
 * These Zod unions are the enforcement layer: any write that would persist an
 * unknown status fails validation in the server action before it reaches Prisma.
 *
 * Each vocabulary ships with `*_META` describing the label and visual tone, so
 * the UI never hand-writes a status string and labels cannot drift between screens.
 */

export type Tone =
  | "neutral"
  | "accent"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "purple"
  | "outline";

type Meta<T extends string> = Record<T, { label: string; tone: Tone; description?: string }>;

function options<T extends string>(meta: Meta<T>) {
  return (Object.keys(meta) as T[]).map((value) => ({ value, label: meta[value].label }));
}

/* ---------------------------------- Roles --------------------------------- */

export const ROLES = [
  "super_admin",
  "internal_operator",
  "client_admin",
  "client_member",
  "editor",
] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const ROLE_META: Meta<Role> = {
  super_admin: {
    label: "Super admin",
    tone: "accent",
    description: "Full access across every workspace, including client creation and billing fields.",
  },
  internal_operator: {
    label: "Operator",
    tone: "info",
    description: "Threadline staff. Works across client workspaces; no destructive org actions.",
  },
  client_admin: {
    label: "Admin",
    tone: "positive",
    description: "Full workspace access: approvals, settings and member management.",
  },
  client_member: {
    label: "Member",
    tone: "neutral",
    description: "Can contribute ideas, comment and record. Cannot approve or change settings.",
  },
  editor: {
    label: "Editor",
    tone: "purple",
    description: "Production board and assets only. No strategy or settings surfaces.",
  },
};

/* -------------------------------- Platforms -------------------------------- */

export const PLATFORMS = [
  "linkedin",
  "youtube",
  "youtube_shorts",
  "instagram",
  "tiktok",
  "x",
  "threads",
  "newsletter",
  "podcast",
] as const;
export const platformSchema = z.enum(PLATFORMS);
export type Platform = z.infer<typeof platformSchema>;

export const PLATFORM_META: Meta<Platform> = {
  linkedin: { label: "LinkedIn", tone: "info" },
  youtube: { label: "YouTube", tone: "negative" },
  youtube_shorts: { label: "YouTube Shorts", tone: "negative" },
  instagram: { label: "Instagram Reels", tone: "purple" },
  tiktok: { label: "TikTok", tone: "neutral" },
  x: { label: "X", tone: "neutral" },
  threads: { label: "Threads", tone: "neutral" },
  newsletter: { label: "Newsletter", tone: "warning" },
  podcast: { label: "Podcast", tone: "purple" },
};

export const PLATFORM_OPTIONS = options(PLATFORM_META);

/* --------------------------------- Formats -------------------------------- */

export const FORMATS = [
  "short_form",
  "long_form",
  "talking_head",
  "carousel",
  "text_post",
  "interview",
  "screen_share",
  "documentary",
] as const;
export const formatSchema = z.enum(FORMATS);
export type Format = z.infer<typeof formatSchema>;

export const FORMAT_META: Meta<Format> = {
  short_form: { label: "Short form", tone: "neutral" },
  long_form: { label: "Long form", tone: "neutral" },
  talking_head: { label: "Talking head", tone: "neutral" },
  carousel: { label: "Carousel", tone: "neutral" },
  text_post: { label: "Text post", tone: "neutral" },
  interview: { label: "Interview", tone: "neutral" },
  screen_share: { label: "Screen share", tone: "neutral" },
  documentary: { label: "Documentary", tone: "neutral" },
};

export const FORMAT_OPTIONS = options(FORMAT_META);

/* -------------------------------- Priority -------------------------------- */

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const prioritySchema = z.enum(PRIORITIES);
export type Priority = z.infer<typeof prioritySchema>;

export const PRIORITY_META: Meta<Priority> = {
  low: { label: "Low", tone: "outline" },
  medium: { label: "Medium", tone: "outline" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "negative" },
};

export const PRIORITY_OPTIONS = options(PRIORITY_META);
export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/* ------------------------------- Idea status ------------------------------- */

export const IDEA_STATUSES = [
  "backlog",
  "shortlisted",
  "approved",
  "scripted",
  "rejected",
  "archived",
] as const;
export const ideaStatusSchema = z.enum(IDEA_STATUSES);
export type IdeaStatus = z.infer<typeof ideaStatusSchema>;

export const IDEA_STATUS_META: Meta<IdeaStatus> = {
  backlog: { label: "Backlog", tone: "outline", description: "Captured, not yet triaged." },
  shortlisted: { label: "Shortlisted", tone: "info", description: "Under consideration this cycle." },
  approved: { label: "Approved", tone: "positive", description: "Cleared to be scripted." },
  scripted: { label: "Scripted", tone: "accent", description: "A script exists for this idea." },
  rejected: { label: "Rejected", tone: "negative", description: "Deliberately not pursued." },
  archived: { label: "Archived", tone: "neutral", description: "Out of rotation." },
};

export const IDEA_STATUS_OPTIONS = options(IDEA_STATUS_META);

/* ------------------------------ Commercial intent --------------------------- */

export const COMMERCIAL_INTENTS = ["low", "medium", "high"] as const;
export const commercialIntentSchema = z.enum(COMMERCIAL_INTENTS);
export type CommercialIntent = z.infer<typeof commercialIntentSchema>;

export const COMMERCIAL_INTENT_META: Meta<CommercialIntent> = {
  low: { label: "Low intent", tone: "outline", description: "Reach and audience building." },
  medium: { label: "Medium intent", tone: "info", description: "Nurtures and educates buyers." },
  high: { label: "High intent", tone: "accent", description: "Speaks directly to a buying decision." },
};

export const COMMERCIAL_INTENT_OPTIONS = options(COMMERCIAL_INTENT_META);

/* ------------------------------- Script types ------------------------------ */

export const SCRIPT_TYPES = [
  "short_form",
  "youtube",
  "linkedin_video",
  "educational",
  "founder_pov",
  "story",
  "authority",
  "case_study",
  "objection",
  "list",
  "teardown",
  "vsl",
] as const;
export const scriptTypeSchema = z.enum(SCRIPT_TYPES);
export type ScriptType = z.infer<typeof scriptTypeSchema>;

export const SCRIPT_TYPE_META: Meta<ScriptType> = {
  short_form: { label: "Short form", tone: "neutral", description: "30–60s vertical video." },
  youtube: { label: "YouTube", tone: "neutral", description: "Long-form structured video." },
  linkedin_video: { label: "LinkedIn video", tone: "neutral", description: "Native business video." },
  educational: { label: "Educational", tone: "neutral", description: "Teach one mechanism clearly." },
  founder_pov: { label: "Founder POV", tone: "accent", description: "A belief only the founder can state." },
  story: { label: "Story", tone: "neutral", description: "Narrative with a lesson." },
  authority: { label: "Authority", tone: "neutral", description: "Demonstrates depth and credibility." },
  case_study: { label: "Case study", tone: "positive", description: "A specific result, with proof." },
  objection: { label: "Objection handling", tone: "warning", description: "Addresses a buying blocker." },
  list: { label: "List", tone: "neutral", description: "Enumerated, skimmable value." },
  teardown: { label: "Teardown", tone: "neutral", description: "Breaks down a real example." },
  vsl: { label: "VSL / ad", tone: "purple", description: "Direct-response variant." },
};

export const SCRIPT_TYPE_OPTIONS = options(SCRIPT_TYPE_META);

/* ------------------------------- Script QA state ---------------------------- */

export const SCRIPT_QA_STATES = [
  "ai_draft",
  "needs_fact_check",
  "ready_to_record",
  "approved",
] as const;
export const scriptQaStateSchema = z.enum(SCRIPT_QA_STATES);
export type ScriptQaState = z.infer<typeof scriptQaStateSchema>;

export const SCRIPT_QA_META: Meta<ScriptQaState> = {
  ai_draft: {
    label: "Draft",
    tone: "outline",
    description: "Generated or written, not yet reviewed by a human.",
  },
  needs_fact_check: {
    label: "Needs fact check",
    tone: "warning",
    description: "Contains claims a human must verify before recording.",
  },
  ready_to_record: {
    label: "Ready to record",
    tone: "info",
    description: "Reviewed and cleared for the recording queue.",
  },
  approved: { label: "Approved", tone: "positive", description: "Signed off by the founder." },
};

export const SCRIPT_QA_OPTIONS = options(SCRIPT_QA_META);

export const CLAIM_STATUSES = ["unverified", "verified", "removed"] as const;
export const claimStatusSchema = z.enum(CLAIM_STATUSES);
export type ClaimStatus = z.infer<typeof claimStatusSchema>;

/* ------------------------------- Content stage ------------------------------ */

export const CONTENT_STAGES = [
  "raw",
  "editing",
  "in_review",
  "changes_requested",
  "approved",
  "scheduled",
  "live",
] as const;
export const contentStageSchema = z.enum(CONTENT_STAGES);
export type ContentStage = z.infer<typeof contentStageSchema>;

export const CONTENT_STAGE_META: Meta<ContentStage> & Record<ContentStage, { color: string }> = {
  raw: {
    label: "Raw",
    tone: "neutral",
    color: "var(--color-stage-raw)",
    description: "Recorded footage received, not yet edited.",
  },
  editing: {
    label: "Editing",
    tone: "info",
    color: "var(--color-stage-editing)",
    description: "With the editor.",
  },
  in_review: {
    label: "In review",
    tone: "warning",
    color: "var(--color-stage-review)",
    description: "Waiting on founder review.",
  },
  changes_requested: {
    label: "Changes requested",
    tone: "negative",
    color: "var(--color-stage-changes)",
    description: "Returned to the editor with specific notes.",
  },
  approved: {
    label: "Approved",
    tone: "positive",
    color: "var(--color-stage-approved)",
    description: "Signed off, ready to package and schedule.",
  },
  scheduled: {
    label: "Scheduled",
    tone: "purple",
    color: "var(--color-stage-scheduled)",
    description: "Booked into the distribution calendar.",
  },
  live: {
    label: "Live",
    tone: "accent",
    color: "var(--color-stage-live)",
    description: "Published and collecting performance data.",
  },
};

export const CONTENT_STAGE_OPTIONS = options(CONTENT_STAGE_META);

/* ------------------------------ Publish status ------------------------------ */

export const PUBLISH_STATUSES = ["draft", "ready", "scheduled", "published", "failed"] as const;
export const publishStatusSchema = z.enum(PUBLISH_STATUSES);
export type PublishStatus = z.infer<typeof publishStatusSchema>;

export const PUBLISH_STATUS_META: Meta<PublishStatus> = {
  draft: { label: "Draft", tone: "outline" },
  ready: { label: "Ready", tone: "info" },
  scheduled: { label: "Scheduled", tone: "purple" },
  published: { label: "Published", tone: "positive" },
  failed: { label: "Failed", tone: "negative" },
};

export const PUBLISH_STATUS_OPTIONS = options(PUBLISH_STATUS_META);

/* ------------------------------ Research kinds ------------------------------ */

export const RESEARCH_KINDS = [
  "competitor_post",
  "customer_language",
  "question",
  "objection",
  "trend",
  "content_example",
  "offer_example",
  "source",
] as const;
export const researchKindSchema = z.enum(RESEARCH_KINDS);
export type ResearchKind = z.infer<typeof researchKindSchema>;

export const RESEARCH_KIND_META: Meta<ResearchKind> = {
  competitor_post: { label: "Competitor post", tone: "purple" },
  customer_language: { label: "Customer language", tone: "info" },
  question: { label: "Question", tone: "warning" },
  objection: { label: "Objection", tone: "negative" },
  trend: { label: "Trend", tone: "accent" },
  content_example: { label: "Content example", tone: "neutral" },
  offer_example: { label: "Offer example", tone: "neutral" },
  source: { label: "Source", tone: "outline" },
};

export const RESEARCH_KIND_OPTIONS = options(RESEARCH_KIND_META);

export const TAG_KINDS = [
  "theme",
  "competitor",
  "pain",
  "objection",
  "desire",
  "hook",
  "format",
  "proof",
  "trend",
  "question",
  "customer_language",
  "cta",
  "offer",
  "breakout",
] as const;
export const tagKindSchema = z.enum(TAG_KINDS);
export type TagKind = z.infer<typeof tagKindSchema>;

/* ------------------------------- Pattern kinds ------------------------------ */

export const PATTERN_KINDS = ["outlier", "pattern", "hypothesis", "test", "learning"] as const;
export const patternKindSchema = z.enum(PATTERN_KINDS);
export type PatternKind = z.infer<typeof patternKindSchema>;

export const PATTERN_KIND_META: Meta<PatternKind> = {
  outlier: {
    label: "Outlier",
    tone: "warning",
    description: "A single result far from the median. Not yet a pattern.",
  },
  pattern: {
    label: "Pattern",
    tone: "info",
    description: "A repeated observation across several pieces or sources.",
  },
  hypothesis: {
    label: "Hypothesis",
    tone: "purple",
    description: "A causal explanation worth testing.",
  },
  test: { label: "Test", tone: "accent", description: "A live experiment with a defined read." },
  learning: {
    label: "Learning",
    tone: "positive",
    description: "A validated conclusion that should change future content.",
  },
};

export const PATTERN_KIND_OPTIONS = options(PATTERN_KIND_META);

export const PATTERN_STATUSES = ["open", "testing", "validated", "rejected", "archived"] as const;
export const patternStatusSchema = z.enum(PATTERN_STATUSES);
export type PatternStatus = z.infer<typeof patternStatusSchema>;

export const PATTERN_STATUS_META: Meta<PatternStatus> = {
  open: { label: "Open", tone: "outline" },
  testing: { label: "Testing", tone: "info" },
  validated: { label: "Validated", tone: "positive" },
  rejected: { label: "Rejected", tone: "negative" },
  archived: { label: "Archived", tone: "neutral" },
};

export const PATTERN_STATUS_OPTIONS = options(PATTERN_STATUS_META);

/* ------------------------------ Inquiry stages ------------------------------ */

export const INQUIRY_STAGES = ["inquiry", "qualified", "call_booked", "won", "lost"] as const;
export const inquiryStageSchema = z.enum(INQUIRY_STAGES);
export type InquiryStage = z.infer<typeof inquiryStageSchema>;

export const INQUIRY_STAGE_META: Meta<InquiryStage> = {
  inquiry: { label: "Inquiry", tone: "outline", description: "Inbound contact made." },
  qualified: { label: "Qualified", tone: "info", description: "Fits the ICP and has intent." },
  call_booked: { label: "Call booked", tone: "purple", description: "Scheduled conversation." },
  won: { label: "Won", tone: "positive", description: "Closed engagement." },
  lost: { label: "Lost", tone: "negative", description: "Did not proceed." },
};

export const INQUIRY_STAGE_OPTIONS = options(INQUIRY_STAGE_META);

export const INQUIRY_SOURCES = ["content", "referral", "outbound", "other"] as const;
export const inquirySourceSchema = z.enum(INQUIRY_SOURCES);
export type InquirySource = z.infer<typeof inquirySourceSchema>;

/* ---------------------------------- Tasks ---------------------------------- */

export const TASK_KINDS = ["record", "approve", "upload", "decide", "review", "ops"] as const;
export const taskKindSchema = z.enum(TASK_KINDS);
export type TaskKind = z.infer<typeof taskKindSchema>;

export const TASK_KIND_META: Meta<TaskKind> = {
  record: { label: "Record", tone: "accent" },
  approve: { label: "Approve", tone: "positive" },
  upload: { label: "Upload", tone: "info" },
  decide: { label: "Decide", tone: "warning" },
  review: { label: "Review", tone: "purple" },
  ops: { label: "Operations", tone: "neutral" },
};

export const TASK_STATUSES = ["open", "in_progress", "done", "dismissed"] as const;
export const taskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const TASK_AUDIENCES = ["client", "internal"] as const;
export const taskAudienceSchema = z.enum(TASK_AUDIENCES);
export type TaskAudience = z.infer<typeof taskAudienceSchema>;

/* --------------------------------- Assets ---------------------------------- */

export const ASSET_CATEGORIES = [
  "raw_media",
  "edited_media",
  "script_doc",
  "transcript",
  "research_doc",
  "testimonial",
  "case_study",
  "brand_asset",
  "offer_doc",
  "thumbnail",
  "report",
  "setup_photo",
  "test_clip",
] as const;
export const assetCategorySchema = z.enum(ASSET_CATEGORIES);
export type AssetCategory = z.infer<typeof assetCategorySchema>;

export const ASSET_CATEGORY_META: Meta<AssetCategory> = {
  raw_media: { label: "Raw media", tone: "neutral" },
  edited_media: { label: "Edited media", tone: "info" },
  script_doc: { label: "Script", tone: "accent" },
  transcript: { label: "Transcript", tone: "outline" },
  research_doc: { label: "Research", tone: "purple" },
  testimonial: { label: "Testimonial", tone: "positive" },
  case_study: { label: "Case study", tone: "positive" },
  brand_asset: { label: "Brand asset", tone: "neutral" },
  offer_doc: { label: "Offer doc", tone: "warning" },
  thumbnail: { label: "Thumbnail", tone: "neutral" },
  report: { label: "Report", tone: "outline" },
  setup_photo: { label: "Setup photo", tone: "info" },
  test_clip: { label: "Test clip", tone: "info" },
};

export const ASSET_CATEGORY_OPTIONS = options(ASSET_CATEGORY_META);

/* ------------------------------- Proof / claims ----------------------------- */

export const PROOF_KINDS = ["testimonial", "case_study", "metric", "screenshot", "credential"] as const;
export const proofKindSchema = z.enum(PROOF_KINDS);
export type ProofKind = z.infer<typeof proofKindSchema>;

export const PROOF_KIND_META: Meta<ProofKind> = {
  testimonial: { label: "Testimonial", tone: "positive" },
  case_study: { label: "Case study", tone: "info" },
  metric: { label: "Metric", tone: "accent" },
  screenshot: { label: "Screenshot", tone: "neutral" },
  credential: { label: "Credential", tone: "purple" },
};

export const CLAIM_PERMISSIONS = ["allowed", "needs_review", "prohibited"] as const;
export const claimPermissionSchema = z.enum(CLAIM_PERMISSIONS);
export type ClaimPermission = z.infer<typeof claimPermissionSchema>;

export const CLAIM_PERMISSION_META: Meta<ClaimPermission> = {
  allowed: { label: "Cleared for use", tone: "positive" },
  needs_review: { label: "Needs review", tone: "warning" },
  prohibited: { label: "Do not use", tone: "negative" },
};

/* ------------------------------- Organisation ------------------------------- */

export const ORG_STATUSES = ["active", "onboarding", "paused", "churned"] as const;
export const orgStatusSchema = z.enum(ORG_STATUSES);
export type OrgStatus = z.infer<typeof orgStatusSchema>;

export const ORG_STATUS_META: Meta<OrgStatus> = {
  active: { label: "Active", tone: "positive" },
  onboarding: { label: "Onboarding", tone: "info" },
  paused: { label: "Paused", tone: "warning" },
  churned: { label: "Churned", tone: "negative" },
};

export const ORG_STATUS_OPTIONS = options(ORG_STATUS_META);

export const PACKAGE_TIERS = ["install", "operate", "scale"] as const;
export const packageTierSchema = z.enum(PACKAGE_TIERS);
export type PackageTier = z.infer<typeof packageTierSchema>;

export const PACKAGE_TIER_META: Meta<PackageTier> = {
  install: { label: "Install", tone: "outline", description: "System installation and handover." },
  operate: { label: "Operate", tone: "info", description: "Installation plus ongoing operation." },
  scale: { label: "Scale", tone: "accent", description: "Multi-platform operation and strategy." },
};

export const PACKAGE_TIER_OPTIONS = options(PACKAGE_TIER_META);

export const ONBOARDING_STAGES = ["not_started", "in_progress", "complete"] as const;
export const onboardingStageSchema = z.enum(ONBOARDING_STAGES);
export type OnboardingStage = z.infer<typeof onboardingStageSchema>;

export const ONBOARDING_STAGE_META: Meta<OnboardingStage> = {
  not_started: { label: "Not started", tone: "outline" },
  in_progress: { label: "In progress", tone: "warning" },
  complete: { label: "Complete", tone: "positive" },
};

/* --------------------------------- Support --------------------------------- */

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const severitySchema = z.enum(SEVERITIES);
export type Severity = z.infer<typeof severitySchema>;

export const SEVERITY_META: Meta<Severity> = {
  low: { label: "Low", tone: "outline" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  critical: { label: "Critical", tone: "negative" },
};

export const SEVERITY_OPTIONS = options(SEVERITY_META);

export const ISSUE_STATUSES = ["open", "investigating", "blocked", "resolved"] as const;
export const issueStatusSchema = z.enum(ISSUE_STATUSES);
export type IssueStatus = z.infer<typeof issueStatusSchema>;

export const ISSUE_STATUS_META: Meta<IssueStatus> = {
  open: { label: "Open", tone: "warning" },
  investigating: { label: "Investigating", tone: "info" },
  blocked: { label: "Blocked", tone: "negative" },
  resolved: { label: "Resolved", tone: "positive" },
};

export const ISSUE_STATUS_OPTIONS = options(ISSUE_STATUS_META);

export const SOP_CATEGORIES = [
  "sales",
  "delivery",
  "research",
  "production",
  "account",
  "support",
] as const;
export const sopCategorySchema = z.enum(SOP_CATEGORIES);
export type SopCategory = z.infer<typeof sopCategorySchema>;

export const SOP_CATEGORY_META: Meta<SopCategory> = {
  sales: { label: "Sales", tone: "accent" },
  delivery: { label: "Delivery", tone: "info" },
  research: { label: "Research", tone: "purple" },
  production: { label: "Production", tone: "warning" },
  account: { label: "Account", tone: "positive" },
  support: { label: "Support", tone: "neutral" },
};

export const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "call_booked",
  "accepted",
  "declined",
] as const;
export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const APPLICATION_STATUS_META: Meta<ApplicationStatus> = {
  new: { label: "New", tone: "accent" },
  reviewing: { label: "Reviewing", tone: "info" },
  call_booked: { label: "Call booked", tone: "purple" },
  accepted: { label: "Accepted", tone: "positive" },
  declined: { label: "Declined", tone: "neutral" },
};

export const APPLICATION_STATUS_OPTIONS = options(APPLICATION_STATUS_META);

/* ------------------------------- Integrations ------------------------------- */

export const INTEGRATION_STATUSES = ["not_configured", "configured", "error", "disabled"] as const;
export const integrationStatusSchema = z.enum(INTEGRATION_STATUSES);
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

export const INTEGRATION_STATUS_META: Meta<IntegrationStatus> = {
  not_configured: { label: "Not set up", tone: "outline" },
  configured: { label: "Set up", tone: "positive" },
  error: { label: "Error", tone: "negative" },
  disabled: { label: "Disabled", tone: "neutral" },
};

/**
 * How access to a provider actually works.
 *
 * Kept separate from status on purpose. "Set up" answers *have we finished the
 * setup*; access method answers *what actually happens when something is
 * published*. Collapsing them is how a product ends up implying an API
 * connection it does not have.
 */
export const ACCESS_METHODS = ["manual", "native_delegated", "api"] as const;
export const accessMethodSchema = z.enum(ACCESS_METHODS);
export type AccessMethod = z.infer<typeof accessMethodSchema>;

export const ACCESS_METHOD_META: Meta<AccessMethod> = {
  manual: {
    label: "Manual",
    tone: "outline",
    description:
      "Threadline prepares everything; a person publishes from the client's own account and records the live URL.",
  },
  native_delegated: {
    label: "Native delegated",
    tone: "info",
    description:
      "A Threadline operator holds delegated access inside the platform's own tools and publishes from there. No credential is stored by Threadline, and nothing is automated.",
  },
  api: {
    label: "API",
    tone: "accent",
    description: "A real, working API connection. Only ever shown when one genuinely exists.",
  },
};

export const ACCESS_METHOD_OPTIONS = options(ACCESS_METHOD_META);

/* -------------------------------- Content pillars --------------------------- */

export const DEFAULT_PILLARS = [
  "Founder POV",
  "Frameworks",
  "Case studies",
  "Objection handling",
  "Market commentary",
  "Behind the business",
] as const;

/* ---------------------------- Intelligence runs ----------------------------- */

/**
 * A run moves forward only. Scoping declares the sources, collecting gathers or
 * accepts evidence, synthesis proposes candidate signals, review is where a
 * human decides, and publishing freezes the brief the client reads.
 */
export const RUN_STATUSES = [
  "scoping",
  "collecting",
  "synthesis",
  "review",
  "published",
  "archived",
] as const;
export const runStatusSchema = z.enum(RUN_STATUSES);
export type RunStatus = z.infer<typeof runStatusSchema>;

export const RUN_STATUS_META: Meta<RunStatus> = {
  scoping: {
    label: "Scoping",
    tone: "outline",
    description: "Declaring which sources this cycle will draw on.",
  },
  collecting: {
    label: "Collecting",
    tone: "info",
    description: "Gathering evidence, with every item keeping its source and timestamp.",
  },
  synthesis: {
    label: "Synthesis",
    tone: "purple",
    description: "Extracting candidate signals from the evidence gathered.",
  },
  review: {
    label: "Awaiting review",
    tone: "warning",
    description: "Candidates are proposed. Nothing influences strategy until a human decides.",
  },
  published: {
    label: "Published",
    tone: "positive",
    description: "The brief is frozen and visible to the client.",
  },
  archived: { label: "Archived", tone: "neutral", description: "Closed without publishing." },
};

export const RUN_STATUS_OPTIONS = options(RUN_STATUS_META);

export const RUN_SOURCE_KINDS = [
  "competitor",
  "creator",
  "category",
  "sales_call",
  "customer_language",
  "historic_content",
  "performance",
  "pipeline",
  "url",
  "note",
] as const;
export const runSourceKindSchema = z.enum(RUN_SOURCE_KINDS);
export type RunSourceKind = z.infer<typeof runSourceKindSchema>;

export const RUN_SOURCE_KIND_META: Meta<RunSourceKind> = {
  competitor: { label: "Competitor", tone: "purple", description: "A named competitor already on the radar." },
  creator: { label: "Creator", tone: "info", description: "A creator or account worth watching in this market." },
  category: { label: "Category", tone: "neutral", description: "A topic or category to sweep rather than one account." },
  sales_call: {
    label: "Sales call",
    tone: "accent",
    description: "Notes or a transcript from a real conversation. Supplied by a person.",
  },
  customer_language: {
    label: "Customer language",
    tone: "info",
    description: "Reviews, support threads, community posts, verbatim quotes.",
  },
  historic_content: {
    label: "Historic content",
    tone: "neutral",
    description: "What this business has already published.",
  },
  performance: {
    label: "Performance data",
    tone: "positive",
    description: "Measured results already held in the workspace.",
  },
  pipeline: {
    label: "Pipeline data",
    tone: "positive",
    description: "Commercial outcomes already held in the workspace.",
  },
  url: { label: "URL", tone: "outline", description: "A single page or post supplied by hand." },
  note: { label: "Note", tone: "outline", description: "Context written directly by an operator or the founder." },
};

export const RUN_SOURCE_KIND_OPTIONS = options(RUN_SOURCE_KIND_META);

export const RUN_SOURCE_STATUSES = ["pending", "collected", "unavailable", "skipped"] as const;
export const runSourceStatusSchema = z.enum(RUN_SOURCE_STATUSES);
export type RunSourceStatus = z.infer<typeof runSourceStatusSchema>;

export const RUN_SOURCE_STATUS_META: Meta<RunSourceStatus> = {
  pending: { label: "Awaiting input", tone: "outline" },
  collected: { label: "Collected", tone: "positive" },
  unavailable: { label: "Not collectable", tone: "warning" },
  skipped: { label: "Skipped", tone: "neutral" },
};

export const COLLECTION_MODES = ["manual", "url", "adapter"] as const;
export const collectionModeSchema = z.enum(COLLECTION_MODES);
export type CollectionMode = z.infer<typeof collectionModeSchema>;

export const COLLECTION_MODE_META: Meta<CollectionMode> = {
  manual: { label: "Supplied by hand", tone: "neutral" },
  url: { label: "From a URL", tone: "info" },
  adapter: { label: "Automatic", tone: "accent" },
};

export const CANDIDATE_KINDS = [
  "customer_language",
  "pain",
  "desire",
  "objection",
  "competitor_theme",
  "content_outlier",
  "recurring_hook",
  "offer_shift",
  "content_gap",
] as const;
export const candidateKindSchema = z.enum(CANDIDATE_KINDS);
export type CandidateKind = z.infer<typeof candidateKindSchema>;

export const CANDIDATE_KIND_META: Meta<CandidateKind> = {
  customer_language: {
    label: "Customer language",
    tone: "info",
    description: "Words buyers use that the business is not yet using back.",
  },
  pain: { label: "Pain", tone: "negative", description: "A problem stated repeatedly and specifically." },
  desire: { label: "Desire", tone: "accent", description: "An outcome buyers describe wanting." },
  objection: {
    label: "Objection",
    tone: "warning",
    description: "A recurring reason buyers hesitate or say no.",
  },
  competitor_theme: {
    label: "Competitor theme",
    tone: "purple",
    description: "A message a competitor is building a position around.",
  },
  content_outlier: {
    label: "Content outlier",
    tone: "warning",
    description: "A piece that performed far outside the norm for this market.",
  },
  recurring_hook: {
    label: "Recurring hook",
    tone: "neutral",
    description: "A hook structure appearing across several strong pieces.",
  },
  offer_shift: {
    label: "Offer shift",
    tone: "accent",
    description: "A change in how offers in this market are packaged or priced.",
  },
  content_gap: {
    label: "Content gap",
    tone: "positive",
    description: "Something buyers ask about that nobody in the market answers well.",
  },
};

export const CANDIDATE_KIND_OPTIONS = options(CANDIDATE_KIND_META);

export const CANDIDATE_DECISIONS = ["pending", "approved", "rejected"] as const;
export const candidateDecisionSchema = z.enum(CANDIDATE_DECISIONS);
export type CandidateDecision = z.infer<typeof candidateDecisionSchema>;

export const CANDIDATE_DECISION_META: Meta<CandidateDecision> = {
  pending: { label: "Awaiting decision", tone: "warning" },
  approved: { label: "Approved", tone: "positive" },
  rejected: { label: "Rejected", tone: "neutral" },
};

/* ----------------------------- Constraint diagnosis ------------------------- */

/**
 * The nine dimensions a demand problem can live in.
 *
 * The point of naming all nine is that "make more content" is only one possible
 * answer. If the constraint is positioning or conversion, more content makes the
 * problem more expensive rather than smaller.
 */
export const CONSTRAINT_DIMENSIONS = [
  "positioning",
  "audience",
  "offer_alignment",
  "content_market_fit",
  "differentiation",
  "creative_quality",
  "distribution",
  "conversion",
  "operations",
] as const;
export const constraintDimensionSchema = z.enum(CONSTRAINT_DIMENSIONS);
export type ConstraintDimension = z.infer<typeof constraintDimensionSchema>;

export const CONSTRAINT_DIMENSION_META: Meta<ConstraintDimension> = {
  positioning: {
    label: "Positioning",
    tone: "accent",
    description: "Whether the market can tell what this business is for, and who it beats.",
  },
  audience: {
    label: "Audience and ICP",
    tone: "info",
    description: "Whether the people reached are the people who can buy.",
  },
  offer_alignment: {
    label: "Offer alignment",
    tone: "purple",
    description: "Whether the offer matches the problem the audience actually has.",
  },
  content_market_fit: {
    label: "Content-market fit",
    tone: "info",
    description: "Whether the topics being published are ones this market cares about.",
  },
  differentiation: {
    label: "Differentiation",
    tone: "purple",
    description: "Whether the point of view is distinguishable from the rest of the category.",
  },
  creative_quality: {
    label: "Creative quality",
    tone: "warning",
    description: "Whether hooks, structure and delivery hold attention.",
  },
  distribution: {
    label: "Distribution",
    tone: "neutral",
    description: "Whether enough of the right people see the work at all.",
  },
  conversion: {
    label: "Conversion path",
    tone: "positive",
    description: "Whether an interested viewer has an obvious next step.",
  },
  operations: {
    label: "Operations",
    tone: "neutral",
    description: "Whether the business can sustain output without the founder being the bottleneck.",
  },
};

export const CONSTRAINT_DIMENSION_OPTIONS = options(CONSTRAINT_DIMENSION_META);

export const DIAGNOSIS_STATUSES = ["draft", "active", "superseded"] as const;
export const diagnosisStatusSchema = z.enum(DIAGNOSIS_STATUSES);
export type DiagnosisStatus = z.infer<typeof diagnosisStatusSchema>;

export const DIAGNOSIS_STATUS_META: Meta<DiagnosisStatus> = {
  draft: { label: "Draft", tone: "outline" },
  active: { label: "Current", tone: "accent" },
  superseded: { label: "Superseded", tone: "neutral" },
};

/* ------------------------------ Proof capture ------------------------------- */

/**
 * A proof period is a service period, not a calendar month.
 *
 * Delivery and billing run on four-week cycles, so a comparison period that
 * drifted with the calendar would compare four weeks of work against five.
 */
export const PROOF_PERIOD_KINDS = ["baseline", "period"] as const;
export const proofPeriodKindSchema = z.enum(PROOF_PERIOD_KINDS);
export type ProofPeriodKind = z.infer<typeof proofPeriodKindSchema>;

export const PROOF_PERIOD_KIND_META: Meta<ProofPeriodKind> = {
  baseline: {
    label: "Baseline",
    tone: "outline",
    description: "How the operation ran before Threadline. Reported by the client.",
  },
  period: {
    label: "Service period",
    tone: "info",
    description: "One four-week period of the engagement.",
  },
};

export const PROOF_SOURCES = ["client_reported", "operator_recorded"] as const;
export const proofSourceSchema = z.enum(PROOF_SOURCES);
export type ProofSource = z.infer<typeof proofSourceSchema>;

export const PROOF_SOURCE_META: Meta<ProofSource> = {
  client_reported: { label: "Client reported", tone: "outline" },
  operator_recorded: { label: "Operator recorded", tone: "info" },
};

/* --------------------- Threadline's own commercial states -------------------- */

/**
 * The vocabularies below describe **Threadline's own business**, not a client's.
 *
 * They belong to the Living SOP Engine: the operator opens a record, sees the
 * state it is in, and the state tells them exactly what happens next. Nothing
 * here is tenant data and none of it is ever readable from a client workspace.
 *
 * No channel name appears in any of these vocabularies, deliberately. Which
 * channel carries a first touch is an operating choice recorded as free text on
 * the record; the state machine and the arithmetic are the same either way.
 */

export const WEDGE_STATES = [
  "candidate",
  "immersion",
  "interviews",
  "commercial_test",
  "validated",
  "revised",
] as const;
export const wedgeStateSchema = z.enum(WEDGE_STATES);
export type WedgeState = z.infer<typeof wedgeStateSchema>;

export const WEDGE_STATE_META: Meta<WedgeState> = {
  candidate: {
    label: "Candidate",
    tone: "outline",
    description: "Scored against the others, not yet chosen for immersion.",
  },
  immersion: {
    label: "Immersion",
    tone: "info",
    description: "Reading the market before speaking to it.",
  },
  interviews: {
    label: "Interviews",
    tone: "purple",
    description: "Research conversations. Not disguised sales calls.",
  },
  commercial_test: {
    label: "Commercial test",
    tone: "warning",
    description: "Small controlled outreach batches, testing whether the market acts.",
  },
  validated: {
    label: "Validated",
    tone: "positive",
    description: "One market, one expensive problem, one outcome. Frozen for a sales sample.",
  },
  revised: {
    label: "Revised",
    tone: "negative",
    description: "The evidence did not support the hypothesis. Recorded rather than quietly dropped.",
  },
};

export const WEDGE_STATE_OPTIONS = options(WEDGE_STATE_META);

export const PROSPECT_STATES = [
  "new",
  "qualified_a",
  "qualified_b",
  "contacted",
  "replied",
  "booked",
  "call_ready",
  "showed",
  "proposal",
  "follow_up",
  "won",
  "lost",
  "not_fit",
] as const;
export const prospectStateSchema = z.enum(PROSPECT_STATES);
export type ProspectState = z.infer<typeof prospectStateSchema>;

export const PROSPECT_STATE_META: Meta<ProspectState> = {
  new: { label: "New", tone: "outline", description: "Sourced, not yet qualified." },
  qualified_a: { label: "A-tier", tone: "accent", description: "High fit and high value. Earns deep work." },
  qualified_b: { label: "B-tier", tone: "info", description: "Good fit. Researched but scalable outreach." },
  contacted: { label: "Contacted", tone: "purple", description: "First touch sent. Awaiting a reply." },
  replied: { label: "Replied", tone: "warning", description: "They answered. Classify it and act." },
  booked: { label: "Booked", tone: "purple", description: "A call exists. Preparation not finished." },
  call_ready: { label: "Call ready", tone: "positive", description: "Prepared. The diagnosis can run." },
  showed: { label: "Showed", tone: "info", description: "The call happened and needs an outcome." },
  proposal: { label: "Proposal", tone: "warning", description: "A commercial process is running." },
  follow_up: { label: "Follow-up", tone: "warning", description: "Alive, dated, and not yet decided." },
  won: { label: "Won", tone: "positive", description: "Closed. Hand to close-to-kickoff." },
  lost: { label: "Lost", tone: "negative", description: "Decided against us. Reason recorded." },
  not_fit: { label: "Not a fit", tone: "neutral", description: "A correct outcome, not a failure." },
};

export const PROSPECT_STATE_OPTIONS = options(PROSPECT_STATE_META);

/** States a record can sit in indefinitely without anyone acting. */
export const TERMINAL_PROSPECT_STATES: ProspectState[] = ["won", "lost", "not_fit"];

export function isActiveProspectState(state: string): boolean {
  return !TERMINAL_PROSPECT_STATES.includes(state as ProspectState);
}

export const PROSPECT_TIERS = ["a", "b", "c"] as const;
export const prospectTierSchema = z.enum(PROSPECT_TIERS);
export type ProspectTier = z.infer<typeof prospectTierSchema>;

export const PROSPECT_TIER_META: Meta<ProspectTier> = {
  a: {
    label: "A-tier",
    tone: "accent",
    description: "High fit, strong economics, visible problem. Deep research and work done in advance.",
  },
  b: {
    label: "B-tier",
    tone: "info",
    description: "Qualified fit. Researched enough to be specific and truthful.",
  },
  c: {
    label: "C-tier",
    tone: "neutral",
    description: "Borderline. Does not consume acquisition time unless the evidence changes.",
  },
};

export const PROSPECT_TIER_OPTIONS = options(PROSPECT_TIER_META);

export const REPLY_CLASSES = [
  "interested",
  "curious",
  "send_info",
  "not_now",
  "objection",
  "referral",
  "not_fit",
  "booked",
] as const;
export const replyClassSchema = z.enum(REPLY_CLASSES);
export type ReplyClass = z.infer<typeof replyClassSchema>;

export const REPLY_CLASS_META: Meta<ReplyClass> = {
  interested: { label: "Interested", tone: "positive", description: "Wants to talk. Get to a booking." },
  curious: { label: "Curious", tone: "info", description: "Engaged but uncommitted. Answer the real question." },
  send_info: {
    label: "Asked for info",
    tone: "warning",
    description: "Often a polite deferral. Send the smallest useful thing and ask for the call.",
  },
  not_now: { label: "Not now", tone: "neutral", description: "Timing. Date it and stop selling." },
  objection: { label: "Objection", tone: "warning", description: "Diagnose what it means before answering." },
  referral: { label: "Referral", tone: "purple", description: "Pointed elsewhere. Thank them and follow it." },
  not_fit: { label: "Not a fit", tone: "neutral", description: "Close it honestly." },
  booked: { label: "Booked", tone: "positive", description: "A call is in the diary." },
};

export const REPLY_CLASS_OPTIONS = options(REPLY_CLASS_META);

/**
 * The sales call state map. Wording on the call is flexible; the information
 * requirements are not. The operator sees which of these is still missing.
 */
export const CALL_STAGES = [
  "open",
  "economics",
  "current_state",
  "desired_state",
  "constraint",
  "consequence",
  "prescription",
  "demo",
  "commercials",
  "decision",
] as const;
export const callStageSchema = z.enum(CALL_STAGES);
export type CallStage = z.infer<typeof callStageSchema>;

export const CALL_STAGE_META: Meta<CallStage> = {
  open: { label: "Open", tone: "outline", description: "Agenda, and why they took the call." },
  economics: {
    label: "Economics",
    tone: "info",
    description: "Offer, deal size, customer value, capacity. What one more good customer is worth.",
  },
  current_state: {
    label: "Current state",
    tone: "info",
    description: "How content actually gets made today, and who does what.",
  },
  desired_state: {
    label: "Desired state",
    tone: "info",
    description: "What commercially useful content would mean in 90 days.",
  },
  constraint: {
    label: "Constraint",
    tone: "warning",
    description: "The primary bottleneck. Verified with them, not asserted at them.",
  },
  consequence: {
    label: "Consequence",
    tone: "warning",
    description: "What leaving it unfixed costs. Quantified where honest.",
  },
  prescription: {
    label: "Prescription",
    tone: "purple",
    description: "How the existing Threadline process addresses it — or an honest no-fit.",
  },
  demo: {
    label: "Demo",
    tone: "purple",
    description: "Only what proves the diagnosed constraint. Never a tour.",
  },
  commercials: { label: "Commercials", tone: "accent", description: "Terms, division of labour, dependencies." },
  decision: { label: "Decision", tone: "positive", description: "One outcome, exact words, next action." },
};

export const CALL_STAGE_OPTIONS = options(CALL_STAGE_META);

export const CALL_OUTCOMES = ["won", "follow_up", "proposal_process", "not_fit", "lost"] as const;
export const callOutcomeSchema = z.enum(CALL_OUTCOMES);
export type CallOutcome = z.infer<typeof callOutcomeSchema>;

export const CALL_OUTCOME_META: Meta<CallOutcome> = {
  won: { label: "Won", tone: "positive" },
  follow_up: { label: "Follow-up", tone: "warning" },
  proposal_process: { label: "Proposal process", tone: "purple" },
  not_fit: { label: "Not a fit", tone: "neutral" },
  lost: { label: "Lost", tone: "negative" },
};

export const CALL_OUTCOME_OPTIONS = options(CALL_OUTCOME_META);

/* ------------------------- Evidence and attribution ------------------------- */

/**
 * How strongly a commercial signal is actually connected to the content.
 *
 * Organic content does not have paid-advertising certainty, and the product must
 * not imply that it does. Every commercial figure carries one of these, and the
 * UI reads the label from here so no screen can quietly upgrade a correlation
 * into a causal claim.
 */
export const ATTRIBUTION_CLASSES = [
  "directly_tracked",
  "buyer_named",
  "multi_touch",
  "associated",
  "qualitative_only",
] as const;
export const attributionClassSchema = z.enum(ATTRIBUTION_CLASSES);
export type AttributionClass = z.infer<typeof attributionClassSchema>;

export const ATTRIBUTION_CLASS_META: Meta<AttributionClass> = {
  directly_tracked: {
    label: "Directly tracked",
    tone: "positive",
    description: "A tracked link, content ID, booking or CRM path supports the connection.",
  },
  buyer_named: {
    label: "Buyer named",
    tone: "info",
    description: "The buyer or the client said the content influenced this.",
  },
  multi_touch: {
    label: "Influenced",
    tone: "purple",
    description: "One identifiable touch in a longer journey. Not the cause on its own.",
  },
  associated: {
    label: "Associated",
    tone: "warning",
    description: "It happened in the same period. Causality is not established.",
  },
  qualitative_only: {
    label: "Qualitative only",
    tone: "neutral",
    description: "Authority, trust or buyer language, with no defensible monetary path.",
  },
};

export const ATTRIBUTION_CLASS_OPTIONS = options(ATTRIBUTION_CLASS_META);

/** Ranked strongest first, so a set of signals can be summarised honestly. */
export const ATTRIBUTION_STRENGTH: Record<AttributionClass, number> = {
  directly_tracked: 4,
  buyer_named: 3,
  multi_touch: 2,
  associated: 1,
  qualitative_only: 0,
};

/** Whether a number was observed by Threadline or reported by someone else. */
export const EVIDENCE_BASES = ["measured", "client_reported", "unavailable"] as const;
export const evidenceBasisSchema = z.enum(EVIDENCE_BASES);
export type EvidenceBasis = z.infer<typeof evidenceBasisSchema>;

export const EVIDENCE_BASIS_META: Meta<EvidenceBasis> = {
  measured: { label: "Measured", tone: "positive", description: "Threadline observed this directly." },
  client_reported: {
    label: "Client reported",
    tone: "info",
    description: "The client told us. Recorded as their figure, not ours.",
  },
  unavailable: {
    label: "Unavailable",
    tone: "neutral",
    description: "Not obtainable. Left empty rather than estimated.",
  },
};

export const EVIDENCE_BASIS_OPTIONS = options(EVIDENCE_BASIS_META);

/* ------------------------------- Attribution -------------------------------- */

/**
 * What happened at a touchpoint.
 *
 * A touchpoint is an observation, not an inference. Every one of these is
 * something that was actually recorded: a click through a Threadline link, a
 * form arriving, or an operator writing down something a person told them.
 * Nothing here is derived from a model.
 */
export const TOUCHPOINT_KINDS = ["click", "form", "reported", "provider"] as const;
export const touchpointKindSchema = z.enum(TOUCHPOINT_KINDS);
export type TouchpointKind = z.infer<typeof touchpointKindSchema>;

export const TOUCHPOINT_KIND_META: Meta<TouchpointKind> = {
  click: {
    label: "Click",
    tone: "accent",
    description: "A tracked Threadline link was followed.",
  },
  form: {
    label: "Form",
    tone: "info",
    description: "Something was submitted on a destination we can see.",
  },
  reported: {
    label: "Reported",
    tone: "outline",
    description: "Somebody said this happened. Recorded as their account of it.",
  },
  provider: {
    label: "Provider",
    tone: "purple",
    description: "Imported from an external attribution provider.",
  },
};

export const TOUCHPOINT_KIND_OPTIONS = options(TOUCHPOINT_KIND_META);

/**
 * The commercial funnel, as discrete dated events.
 *
 * Ordered. A stage further down is worth more and is harder to observe, which
 * is exactly why each one is recorded separately with its own provenance rather
 * than inferred from the one before it.
 */
export const COMMERCIAL_EVENT_KINDS = [
  "opt_in",
  "inquiry",
  "booked_call",
  "showed",
  "qualified",
  "opportunity",
  "won",
] as const;
export const commercialEventKindSchema = z.enum(COMMERCIAL_EVENT_KINDS);
export type CommercialEventKind = z.infer<typeof commercialEventKindSchema>;

export const COMMERCIAL_EVENT_KIND_META: Meta<CommercialEventKind> = {
  opt_in: { label: "Opt-in", tone: "outline", description: "Gave an email address." },
  inquiry: { label: "Enquiry", tone: "info", description: "Made contact." },
  booked_call: { label: "Booked", tone: "purple", description: "A call went in the diary." },
  showed: { label: "Showed", tone: "purple", description: "They attended." },
  qualified: { label: "Qualified", tone: "warning", description: "A genuine fit." },
  opportunity: { label: "Opportunity", tone: "warning", description: "Live pipeline with a value." },
  won: { label: "Won", tone: "positive", description: "Closed. Revenue, where observable." },
};

export const COMMERCIAL_EVENT_KIND_OPTIONS = options(COMMERCIAL_EVENT_KIND_META);

/** Funnel order, used to draw the stages that actually have data. */
export const COMMERCIAL_FUNNEL: CommercialEventKind[] = [
  "opt_in",
  "inquiry",
  "booked_call",
  "showed",
  "qualified",
  "opportunity",
  "won",
];

/**
 * Where a commercial event came from.
 *
 * Kept separate from the evidence class. Provenance is *who told us*; evidence
 * strength is *how well the connection to content holds up*. A CRM-sourced deal
 * has excellent provenance and may still be qualitative-only against content.
 */
export const EVENT_SOURCES = [
  "native",
  "crm",
  "booking",
  "payment",
  "manual",
  "client_reported",
] as const;
export const eventSourceSchema = z.enum(EVENT_SOURCES);
export type EventSource = z.infer<typeof eventSourceSchema>;

export const EVENT_SOURCE_META: Meta<EventSource> = {
  native: {
    label: "Threadline tracking",
    tone: "positive",
    description: "Observed by a tracked link or a destination we can see.",
  },
  crm: { label: "CRM", tone: "info", description: "Mapped from an external CRM record." },
  booking: { label: "Booking system", tone: "info", description: "From the booking tool." },
  payment: { label: "Payment", tone: "info", description: "From the payment or invoicing system." },
  manual: { label: "Operator", tone: "outline", description: "An operator recorded it, with a note." },
  client_reported: {
    label: "Client reported",
    tone: "outline",
    description: "The client told us. Their figure, not ours.",
  },
};

export const EVENT_SOURCE_OPTIONS = options(EVENT_SOURCE_META);

/**
 * The three attribution models, and only these three.
 *
 * All transparent enough that a client can be told exactly how the number was
 * produced. Nothing weighted, nothing learned, nothing proprietary — a model a
 * client cannot check is a model they have to take on trust, which is the
 * opposite of what attribution is for.
 */
export const ATTRIBUTION_MODELS = ["first_touch", "last_touch", "linear"] as const;
export const attributionModelSchema = z.enum(ATTRIBUTION_MODELS);
export type AttributionModel = z.infer<typeof attributionModelSchema>;

export const ATTRIBUTION_MODEL_META: Meta<AttributionModel> = {
  first_touch: {
    label: "First touch",
    tone: "info",
    description: "All credit to the earliest recorded touch before the event. Answers what created awareness.",
  },
  last_touch: {
    label: "Last touch",
    tone: "info",
    description: "All credit to the latest recorded touch before the event. Answers what closed the loop.",
  },
  linear: {
    label: "Linear",
    tone: "purple",
    description: "Credit split evenly across the distinct assets touched. Answers what contributed.",
  },
};

export const ATTRIBUTION_MODEL_OPTIONS = options(ATTRIBUTION_MODEL_META);

/* ---------------------------- Delivery load tags ---------------------------- */

/**
 * What a piece of delivery work turns out to be, once it has been done and
 * timed.
 *
 * The point of recording this is to find the real delegation trigger from
 * measured work rather than from a revenue milestone somebody picked. Nothing
 * here is decided in advance: it is filled in afterwards, by whoever did it.
 */
export const WORK_CLASSES = [
  "founder_only",
  "becomes_sop",
  "ai_assisted",
  "delegatable",
  "automatable",
  "delete",
] as const;
export const workClassSchema = z.enum(WORK_CLASSES);
export type WorkClass = z.infer<typeof workClassSchema>;

export const WORK_CLASS_META: Meta<WorkClass> = {
  founder_only: {
    label: "Founder only",
    tone: "accent",
    description: "Needs judgement or relationships nobody else has yet.",
  },
  becomes_sop: {
    label: "Becomes an SOP",
    tone: "info",
    description: "Ran the same way twice. Worth writing down.",
  },
  ai_assisted: { label: "AI-assisted", tone: "purple", description: "Machine drafts, person decides." },
  delegatable: {
    label: "Delegatable",
    tone: "positive",
    description: "Clear enough to teach and to check.",
  },
  automatable: {
    label: "Automatable",
    tone: "positive",
    description: "Deterministic, and safe to run without a person.",
  },
  delete: { label: "Delete", tone: "neutral", description: "Did not need to exist." },
};

export const WORK_CLASS_OPTIONS = options(WORK_CLASS_META);

/* ------------------------------- Helper lookups ----------------------------- */

export function metaOf<T extends string>(
  meta: Meta<T>,
  value: string,
  fallback: { label: string; tone: Tone } = { label: value, tone: "neutral" },
) {
  return (meta as Record<string, { label: string; tone: Tone; description?: string }>)[value] ?? fallback;
}
