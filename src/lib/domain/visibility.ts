import type { Role } from "./enums";
import { isInternalRole } from "@/lib/auth/roles";

/**
 * Client visibility.
 *
 * Threadline runs one system with two experiences. The client sees actions
 * required, approved strategy, content status and results. They do not see the
 * kitchen: raw and rejected research, undecided machine output, tentative
 * diagnoses, AI accounting, vendor cost, or operator-private notes.
 *
 * ## The design, and why it is shaped this way
 *
 * The obvious implementation is a `visibility` column on every model. That was
 * rejected: most of the answer is already encoded in state the product has, and
 * a duplicated flag is a second source of truth that will eventually disagree
 * with the first. A brief is client-visible because it is *published*; a
 * diagnosis because it is *active*; a task because its *audience* is the client.
 * Adding a column next to those would let a record be published and invisible,
 * or internal and shared, with nothing to say which is correct.
 *
 * So visibility is **derived** from existing state wherever existing state
 * answers it, and **stored in exactly one place** where it does not:
 * `Pattern.visibility`. A signal is internal working thought until somebody
 * decides the client should see it, and no existing status encodes that
 * decision. (`Comment.internal` is a separate, narrower thing: a private place
 * for operator notes, not a visibility state machine.)
 *
 * ## The enforcement rule
 *
 * Hidden navigation is not security. Every client-scoped read goes through a
 * `where` clause built here, and every internal-only route is guarded by a
 * capability the client roles do not hold. `src/lib/auth/visibility.test.ts`
 * asserts both.
 */

export const VISIBILITY_LEVELS = [
  "internal",
  "client_draft",
  "client_action_required",
  "client_published",
] as const;

export type Visibility = (typeof VISIBILITY_LEVELS)[number];

export const VISIBILITY_META: Record<
  Visibility,
  { label: string; description: string; clientVisible: boolean }
> = {
  internal: {
    label: "Internal",
    description: "Threadline working state. Never rendered on a client surface.",
    clientVisible: false,
  },
  client_draft: {
    label: "Shared, in progress",
    description: "The client can see it exists and what stage it is at, but it is not finished.",
    clientVisible: true,
  },
  client_action_required: {
    label: "Needs the client",
    description: "Visible to the client and waiting on a decision or an action from them.",
    clientVisible: true,
  },
  client_published: {
    label: "Delivered",
    description: "Finished and delivered to the client.",
    clientVisible: true,
  },
};

export function isClientVisible(visibility: string): boolean {
  return VISIBILITY_META[visibility as Visibility]?.clientVisible ?? false;
}

/**
 * Whether this caller is looking at the operator experience.
 *
 * The one place the two surfaces diverge. Everything else asks this question
 * rather than testing roles directly, so adding a role cannot accidentally open
 * the operator surface.
 */
export function seesOperatorSurface(role: Role): boolean {
  return isInternalRole(role);
}

/* --------------------------- Derivation per entity -------------------------- */

/**
 * An intelligence brief is client-visible once published, and not before.
 * Working state — sources half-collected, candidates undecided — is the exact
 * "tentative internal thinking" the client must not see.
 */
export function runVisibility(status: string): Visibility {
  return status === "published" ? "client_published" : "internal";
}

/**
 * A diagnosis is client-visible once it is the current one. A draft is a
 * hypothesis an operator is still arguing with themselves about.
 */
export function diagnosisVisibility(status: string): Visibility {
  return status === "active" ? "client_published" : "internal";
}

/** Signals carry the one stored flag. Default internal: silence is the safe default. */
export function patternVisibility(stored: string): Visibility {
  return stored === "client_published" ? "client_published" : "internal";
}

/** Tasks already carry an audience. Client tasks are, by definition, actions required. */
export function taskVisibility(audience: string): Visibility {
  return audience === "client" ? "client_action_required" : "internal";
}

/**
 * A weekly report is client-visible once final. A draft is a number that may
 * still move, and a client who reads one remembers the first figure they saw.
 */
export function reportVisibility(status: string): Visibility {
  return status === "final" ? "client_published" : "internal";
}

/**
 * A proof period is client-visible once locked, and shared-in-progress before
 * that — the client should be able to see the month is being assembled without
 * treating a half-entered figure as the answer.
 */
export function proofVisibility(lockedAt: Date | null | undefined): Visibility {
  return lockedAt ? "client_published" : "client_draft";
}

/**
 * Content the client can always see. It is their content; the point of the
 * status board is that they never have to ask where anything is.
 */
export function contentVisibility(stage: string): Visibility {
  return stage === "in_review" ? "client_action_required" : "client_draft";
}

/* --------------------------- Prisma where fragments ------------------------- */

/**
 * Filters applied to client-scoped reads.
 *
 * Each returns `{}` for an operator and a narrowing clause for a client, so a
 * repository can spread it into an existing `where` without branching.
 */
export const clientScope = {
  patterns(role: Role) {
    return seesOperatorSurface(role) ? {} : { visibility: "client_published" };
  },
  runs(role: Role) {
    return seesOperatorSurface(role) ? {} : { status: "published" };
  },
  diagnoses(role: Role) {
    return seesOperatorSurface(role) ? {} : { status: "active" };
  },
  reports(role: Role) {
    return seesOperatorSurface(role) ? {} : { status: "final" };
  },
  comments(role: Role) {
    return seesOperatorSurface(role) ? {} : { internal: false };
  },
} as const;

/**
 * Fields stripped from an organisation before it reaches a client surface.
 *
 * Commercials are Threadline's business, not the client's dashboard. Listed
 * here rather than omitted ad hoc at each call site so the set is auditable.
 */
export const INTERNAL_ORG_FIELDS = [
  "setupFee",
  "periodFee",
  "healthScore",
  "supportNotes",
] as const;

/**
 * Entities a client role must never reach, whatever the URL.
 *
 * This is documentation for reviewers; enforcement is the capability matrix,
 * which is what the guards and the tests actually read.
 */
export const INTERNAL_ONLY = [
  "Raw and rejected research (Market Radar)",
  "Undecided candidate signals and in-flight intelligence cycles",
  "Unapproved signals, outliers and hypotheses",
  "Draft and superseded constraint diagnoses",
  "AI generation records, provider, model, token and cost data",
  "Editor and vendor cost, fees and margin",
  "Operator-private comments",
  "Audit log, support issues, SOPs and admin surfaces",
  "Internal task queues that require nothing from the client",
] as const;
