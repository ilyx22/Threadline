import { createHash } from "node:crypto";
import type { CandidateKind, RunSourceKind, RunStatus } from "./enums";
import { WorkflowError } from "./workflow";

/**
 * Intelligence run rules.
 *
 * The run is the mechanism behind the sentence a client should be able to read
 * every week: "here is what Threadline found in your market, why it matters,
 * and what we are doing because of it."
 *
 * Two invariants live here and are enforced, not advised:
 *
 *   1. Nothing a machine proposed influences strategy until a human decides on
 *      it. A run cannot be published while candidates are still pending, and a
 *      candidate cannot become a Pattern except through an explicit approval.
 *   2. Evidence keeps its provenance. Every research item collected by a run
 *      carries its source URL, source type, timestamp and metadata, and is
 *      fingerprinted so the same item collected twice does not inflate the
 *      apparent weight of a signal.
 */

/* ------------------------------- Run lifecycle ------------------------------ */

export const RUN_TRANSITIONS: Record<RunStatus, RunStatus[]> = {
  scoping: ["collecting", "archived"],
  collecting: ["synthesis", "scoping", "archived"],
  synthesis: ["review", "collecting", "archived"],
  review: ["published", "synthesis", "archived"],
  // A published brief is frozen. Re-opening it would change what the client was
  // told after the fact, which is the same rule the weekly report follows.
  published: ["archived"],
  archived: [],
};

export function canMoveRun(from: RunStatus, to: RunStatus) {
  return RUN_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextRunStatuses(from: RunStatus) {
  return RUN_TRANSITIONS[from] ?? [];
}

export type RunGateContext = {
  /** Sources that have actually produced evidence or been explicitly resolved. */
  resolvedSources: number;
  totalSources: number;
  evidenceCount: number;
  candidateCount: number;
  pendingCandidates: number;
  approvedCandidates: number;
  hasSummary: boolean;
};

/**
 * Guard a run transition.
 *
 * Each gate exists because skipping it would produce a brief that looks
 * finished and is not: a synthesis with no evidence, a review with nothing
 * proposed, or a published brief still carrying undecided machine output.
 */
export function assertRunTransition(from: RunStatus, to: RunStatus, ctx: RunGateContext) {
  if (from === to) return;

  if (!canMoveRun(from, to)) {
    throw new WorkflowError(`An intelligence run cannot move from "${from}" to "${to}".`);
  }

  if (to === "collecting" && ctx.totalSources === 0) {
    throw new WorkflowError(
      "Add at least one source before collecting. A run with no declared sources cannot produce evidence anyone can check.",
    );
  }

  if (to === "synthesis") {
    if (ctx.evidenceCount === 0) {
      throw new WorkflowError(
        "There is no evidence in this run yet. Collect or paste at least one source before extracting signals.",
      );
    }
    if (ctx.resolvedSources < ctx.totalSources) {
      throw new WorkflowError(
        `${ctx.totalSources - ctx.resolvedSources} source(s) are still waiting on input. Mark each one collected, unavailable or skipped so the brief states honestly what it drew on.`,
      );
    }
  }

  if (to === "review" && ctx.candidateCount === 0) {
    throw new WorkflowError(
      "No candidate signals have been proposed yet, so there is nothing to review.",
    );
  }

  if (to === "published") {
    if (ctx.pendingCandidates > 0) {
      throw new WorkflowError(
        `${ctx.pendingCandidates} candidate signal(s) have not been decided. Nothing proposed by the system may reach the client before a person approves or rejects it.`,
      );
    }
    if (!ctx.hasSummary) {
      throw new WorkflowError(
        "Write the brief summary before publishing. The client should read a human account of what was found, not a list of rows.",
      );
    }
  }
}

/** A run is only client-visible once published — earlier states are working state. */
export function isClientVisible(status: RunStatus) {
  return status === "published";
}

/* ------------------------------- Deduplication ------------------------------ */

/**
 * Fingerprint a piece of evidence.
 *
 * A URL identifies an item exactly when there is one; otherwise we fall back to
 * the normalised text, so the same quote pasted twice from two call transcripts
 * collapses into one item rather than appearing to be two independent sources.
 */
export function evidenceFingerprint(input: {
  url?: string | null;
  title?: string | null;
  body?: string | null;
}): string {
  const url = normaliseUrl(input.url);
  const basis = url ?? normaliseText(`${input.title ?? ""} ${input.body ?? ""}`);
  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

function normaliseUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    // Tracking parameters make identical pages look like different sources.
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref|si$|igshid)/i.test(key)) url.searchParams.delete(key);
    }
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.hostname.replace(/^www\./, "")}${path}${url.search}`.toLowerCase();
  } catch {
    return null;
  }
}

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

/* --------------------------- Source collection modes ------------------------ */

/**
 * How a source kind can be collected today.
 *
 * This is deliberately conservative. Nothing here claims an automatic path that
 * does not exist: public pages are fetched from a URL supplied by a person,
 * call notes and customer language are pasted in, and the only truly automatic
 * sources are the ones already inside the workspace.
 */
export const SOURCE_COLLECTION: Record<
  RunSourceKind,
  { mode: "manual" | "url" | "internal"; guidance: string }
> = {
  competitor: {
    mode: "url",
    guidance:
      "Paste the post or profile URL you want read. Threadline has no approved API access to any social platform, so nothing is scraped in the background.",
  },
  creator: {
    mode: "url",
    guidance: "Paste specific post URLs. A creator handle alone cannot be collected automatically.",
  },
  category: {
    mode: "manual",
    guidance:
      "Describe the category and paste the examples worth reading. There is no automated category sweep in this version.",
  },
  sales_call: {
    mode: "manual",
    guidance:
      "Paste the notes or transcript. This is the highest-value source in the run and it only exists because a person supplies it.",
  },
  customer_language: {
    mode: "manual",
    guidance: "Paste reviews, support threads, community posts or verbatim quotes.",
  },
  historic_content: {
    mode: "internal",
    guidance: "Read from the content already published in this workspace.",
  },
  performance: {
    mode: "internal",
    guidance: "Read from the performance snapshots already recorded in this workspace.",
  },
  pipeline: {
    mode: "internal",
    guidance: "Read from the inquiries and outcomes already recorded in this workspace.",
  },
  url: { mode: "url", guidance: "A single page to read." },
  note: { mode: "manual", guidance: "Context written directly by an operator or the founder." },
};

/** True when a source draws on records this workspace already holds. */
export function isInternalSource(kind: RunSourceKind) {
  return SOURCE_COLLECTION[kind].mode === "internal";
}

/* -------------------------------- Test ranking ------------------------------ */

export type TestRankInput = {
  confidence: number;
  impact: number;
  effort: number;
  evidenceCount: number;
};

/**
 * Rank approved signals as content tests.
 *
 * Deterministic arithmetic over stored inputs, in the same spirit as every
 * other score in the product: confidence scales impact, effort discounts it,
 * and independent evidence adds a bounded amount of weight so a signal seen
 * three times outranks one seen once without letting volume dominate.
 */
export function testRankScore(input: TestRankInput): number {
  const confidence = clamp(input.confidence, 0, 100) / 100;
  const impact = clamp(input.impact, 1, 5);
  const effort = clamp(input.effort, 1, 5);
  // Bounded at both ends: negative or non-finite input must not drag the score
  // below zero, and volume above six sources must not dominate the ranking.
  const evidence = clamp(input.evidenceCount, 0, 6) / 6;

  const base = (confidence * impact) / effort; // 0 - 5
  return round1((base * 4 + evidence * 5) * (100 / 25)); // 0 - 100
}

/**
 * How a published result should move a signal's confidence.
 *
 * The step is small and bounded on purpose. One post is not proof, and a signal
 * should need several consistent reads before the system treats it as settled.
 */
export function adjustedConfidence(current: number, outcome: "supported" | "contradicted" | "mixed") {
  const step = outcome === "supported" ? 8 : outcome === "contradicted" ? -12 : -2;
  return clamp(Math.round(current + step), 5, 95);
}

/* ------------------------------ Candidate rules ----------------------------- */

/**
 * A candidate must cite evidence.
 *
 * This is the rule that stops the run from becoming a generator of plausible
 * sentences. If the system cannot point at the item that produced a claim, the
 * claim does not enter the workspace.
 */
export function assertCandidateHasEvidence(kind: CandidateKind, evidenceCount: number) {
  if (evidenceCount > 0) return;
  throw new WorkflowError(
    `A "${kind.replace(/_/g, " ")}" signal cannot be created without at least one piece of evidence behind it.`,
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}
