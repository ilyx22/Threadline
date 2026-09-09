import type {
  ContentStage,
  IdeaStatus,
  InquiryStage,
  PublishStatus,
  ScriptQaState,
} from "./enums";

/**
 * Workflow legality.
 *
 * These maps are the single definition of which state transitions exist in the
 * product. Server actions call `assertTransition` before writing, so an illegal
 * jump (e.g. raw -> live, skipping review and approval) fails loudly instead of
 * silently corrupting the operating loop and its derived metrics.
 *
 * The UI reads the same maps to decide which controls to render, so the buttons
 * on screen and the rules on the server cannot drift apart.
 */

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

/* ------------------------------ Content stages ----------------------------- */

export const CONTENT_TRANSITIONS: Record<ContentStage, ContentStage[]> = {
  raw: ["editing"],
  editing: ["in_review", "raw"],
  in_review: ["approved", "changes_requested", "editing"],
  changes_requested: ["editing"],
  approved: ["scheduled", "in_review"],
  scheduled: ["live", "approved"],
  live: ["scheduled"],
};

/**
 * Text-led work — posts, threads, carousels, newsletters — is written, not
 * recorded. It enters production at `editing` (copy and design), never at
 * `raw`, and no recording task or readiness check applies to it.
 */
export const TEXT_LED_FORMATS = new Set(["text_post", "carousel"]);
export const TEXT_LED_PLATFORMS = new Set(["x", "threads", "newsletter"]);
export function isTextLed(input: { format?: string | null; platform?: string | null }) {
  return TEXT_LED_FORMATS.has(input.format ?? "") || TEXT_LED_PLATFORMS.has(input.platform ?? "");
}

export function canMoveContent(from: ContentStage, to: ContentStage) {
  return CONTENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextContentStages(from: ContentStage) {
  return CONTENT_TRANSITIONS[from] ?? [];
}

/* -------------------------------- Idea status ------------------------------ */

const IDEA_TERMINAL: IdeaStatus[] = ["rejected", "archived"];

export const IDEA_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  backlog: ["shortlisted", "approved", ...IDEA_TERMINAL],
  shortlisted: ["approved", "backlog", ...IDEA_TERMINAL],
  approved: ["scripted", "shortlisted", ...IDEA_TERMINAL],
  // Once a script exists the idea cannot be walked backwards; the script is the
  // authoritative record from this point and un-linking it would orphan lineage.
  scripted: ["archived"],
  rejected: ["backlog", "archived"],
  archived: ["backlog"],
};

export function canMoveIdea(from: IdeaStatus, to: IdeaStatus) {
  return IDEA_TRANSITIONS[from]?.includes(to) ?? false;
}

/* ------------------------------ Script QA state ---------------------------- */

export const SCRIPT_TRANSITIONS: Record<ScriptQaState, ScriptQaState[]> = {
  ai_draft: ["needs_fact_check", "ready_to_record"],
  needs_fact_check: ["ready_to_record", "ai_draft"],
  ready_to_record: ["approved", "needs_fact_check"],
  approved: ["ready_to_record"],
};

export function canMoveScript(from: ScriptQaState, to: ScriptQaState) {
  return SCRIPT_TRANSITIONS[from]?.includes(to) ?? false;
}

export type Claim = { id: string; text: string; status: string; note?: string };

/**
 * The product rule that keeps AI output honest: a script carrying unverified
 * factual claims cannot be marked ready to record or approved. Enforced here,
 * called from `assertScriptTransition`, and re-checked in the server action.
 */
export function unverifiedClaims(claims: Claim[]) {
  return claims.filter((c) => c.status === "unverified");
}

export function assertScriptTransition(
  from: ScriptQaState,
  to: ScriptQaState,
  claims: Claim[],
) {
  if (!canMoveScript(from, to)) {
    throw new WorkflowError(`A script cannot move from "${from}" to "${to}".`);
  }
  if (to === "ready_to_record" || to === "approved") {
    const pending = unverifiedClaims(claims);
    if (pending.length > 0) {
      throw new WorkflowError(
        `${pending.length} factual ${
          pending.length === 1 ? "claim has" : "claims have"
        } not been verified. Verify or remove them before this script can be recorded.`,
      );
    }
  }
}

/* ------------------------------ Publish status ----------------------------- */

export const PUBLISH_TRANSITIONS: Record<PublishStatus, PublishStatus[]> = {
  draft: ["ready", "scheduled"],
  ready: ["scheduled", "published", "draft"],
  scheduled: ["published", "failed", "ready"],
  published: ["failed"],
  failed: ["ready", "scheduled"],
};

export function canMovePublish(from: PublishStatus, to: PublishStatus) {
  return PUBLISH_TRANSITIONS[from]?.includes(to) ?? false;
}

/** A published record without a URL is not verifiable, so we refuse it. */
export function assertPublishTransition(
  from: PublishStatus,
  to: PublishStatus,
  ctx: { url?: string | null; scheduledFor?: Date | null },
) {
  if (!canMovePublish(from, to)) {
    throw new WorkflowError(`A publish record cannot move from "${from}" to "${to}".`);
  }
  if (to === "published" && !ctx.url?.trim()) {
    throw new WorkflowError(
      "Add the live URL before marking this published — it is what makes performance tracking and attribution possible.",
    );
  }
  if (to === "scheduled" && !ctx.scheduledFor) {
    throw new WorkflowError("Choose a publish date before scheduling.");
  }
}

/* ------------------------------ Inquiry stages ----------------------------- */

export const INQUIRY_TRANSITIONS: Record<InquiryStage, InquiryStage[]> = {
  inquiry: ["qualified", "lost"],
  qualified: ["call_booked", "lost", "inquiry"],
  call_booked: ["won", "lost", "qualified"],
  won: ["call_booked"],
  lost: ["inquiry", "qualified"],
};

export function canMoveInquiry(from: InquiryStage, to: InquiryStage) {
  return INQUIRY_TRANSITIONS[from]?.includes(to) ?? false;
}

/* --------------------------------- Generic --------------------------------- */

export function assertTransition<T extends string>(
  map: Record<string, string[]>,
  from: T,
  to: T,
  entity: string,
) {
  if (from === to) return;
  if (!map[from]?.includes(to)) {
    throw new WorkflowError(`${entity} cannot move from "${from}" to "${to}".`);
  }
}

/**
 * Content stage changes that require a written reason. Rejecting work without
 * telling the editor why is the single biggest source of production churn, so
 * the product refuses to allow it.
 */
export function requiresNote(to: ContentStage) {
  return to === "changes_requested";
}
