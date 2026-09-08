import { WorkflowError } from "./workflow";

/**
 * Recording readiness.
 *
 * The first batch is where an installation succeeds or quietly fails. A room
 * with a hum in it, a phone that refocuses every eight seconds, or a setup the
 * founder cannot reproduce next week are not problems the operating loop can
 * fix downstream — they are problems that make every downstream stage worse
 * while looking like a content problem.
 *
 * So readiness is an explicit gate with three honest outcomes. `blocked` is a
 * real, usable answer: it says the setup cannot produce publishable footage
 * yet, and it names the one thing the client has to do about it.
 *
 * This is setup QA. It is deliberately not a gear shop: there are no product
 * recommendations, no affiliate links and no equipment catalogue anywhere in it.
 */

export const READINESS_STATUSES = [
  "not_assessed",
  "ready",
  "ready_with_limitation",
  "blocked",
] as const;
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];

export const READINESS_STATUS_META: Record<
  ReadinessStatus,
  { label: string; tone: "outline" | "positive" | "warning" | "negative"; description: string }
> = {
  not_assessed: {
    label: "Not assessed",
    tone: "outline",
    description: "The setup has not been reviewed yet.",
  },
  ready: {
    label: "Ready",
    tone: "positive",
    description: "This setup produces publishable footage, repeatably.",
  },
  ready_with_limitation: {
    label: "Ready with a limitation",
    tone: "warning",
    description:
      "Usable footage, with a named constraint we work around rather than pretend is not there.",
  },
  blocked: {
    label: "Blocked",
    tone: "negative",
    description: "This setup cannot produce publishable footage yet. One thing has to change.",
  },
};

export const CHECK_STATES = ["unknown", "ok", "limitation", "blocked"] as const;
export type CheckState = (typeof CHECK_STATES)[number];

export const CHECK_STATE_META: Record<
  CheckState,
  { label: string; tone: "outline" | "positive" | "warning" | "negative" }
> = {
  unknown: { label: "Not checked", tone: "outline" },
  ok: { label: "Good", tone: "positive" },
  limitation: { label: "Workable", tone: "warning" },
  blocked: { label: "Blocking", tone: "negative" },
};

export const READINESS_CHECKS = [
  "audio",
  "light",
  "framing",
  "background",
  "focus_stability",
  "repeatability",
  "format",
] as const;
export type ReadinessCheckKey = (typeof READINESS_CHECKS)[number];

export type CheckDefinition = {
  key: ReadinessCheckKey;
  label: string;
  /** What an operator is actually judging. */
  question: string;
  /** Why it matters enough to hold up an installation. */
  why: string;
};

export const CHECK_DEFINITIONS: CheckDefinition[] = [
  {
    key: "audio",
    label: "Audio",
    question: "Is the voice clean, close and free of room echo, hum or handling noise?",
    why: "Viewers forgive poor picture and leave over poor sound. This is the single highest-value check.",
  },
  {
    key: "light",
    label: "Light",
    question: "Is the face lit from the front, evenly, without colour casts or hard shadows?",
    why: "Backlit or mixed-temperature footage cannot be graded into looking deliberate.",
  },
  {
    key: "framing",
    label: "Framing",
    question: "Is the camera at eye level, with the subject correctly placed for the format?",
    why: "A low-angle laptop camera reads as unprepared regardless of what is being said.",
  },
  {
    key: "background",
    label: "Background",
    question: "Is the background clean, non-distracting and free of anything that dates the footage?",
    why: "A distracting background costs attention in the first two seconds, which is where a piece is won.",
  },
  {
    key: "focus_stability",
    label: "Focus and stability",
    question: "Does the camera hold focus and stay still for the length of a take?",
    why: "Hunting focus and drift make an edit unusable no matter how good the take was.",
  },
  {
    key: "repeatability",
    label: "Repeatability",
    question: "Can the founder reproduce this setup alone, in under ten minutes, next week?",
    why: "A setup that only works when somebody helps produces one good batch and then silence.",
  },
  {
    key: "format",
    label: "Format",
    question: "Does the setup cover every format this client needs, at the right orientation?",
    why: "Discovering the room only works in landscape, after committing to vertical, costs a whole cycle.",
  },
];

export const CHECK_BY_KEY: Record<ReadinessCheckKey, CheckDefinition> = Object.fromEntries(
  CHECK_DEFINITIONS.map((c) => [c.key, c]),
) as Record<ReadinessCheckKey, CheckDefinition>;

/* --------------------------------- Formats -------------------------------- */

export const RECORDING_FORMATS = ["vertical_short", "horizontal_long"] as const;
export type RecordingFormat = (typeof RECORDING_FORMATS)[number];

export const RECORDING_FORMAT_META: Record<
  RecordingFormat,
  { label: string; orientation: string; description: string }
> = {
  vertical_short: {
    label: "Vertical short-form",
    orientation: "9:16",
    description: "Short vertical video for feeds. The default for every engagement.",
  },
  horizontal_long: {
    label: "Horizontal long-form",
    orientation: "16:9",
    description: "Long-form landscape video. Part of the long-form pilot, not the base retainer.",
  },
};

/* --------------------------------- Rules ---------------------------------- */

export type CheckInput = { key: string; state: string };

/**
 * The status the checks point at.
 *
 * A recommendation for the operator, not the stored answer — the same pattern
 * the constraint diagnosis follows. One blocking check blocks the whole
 * assessment, because a setup is only as good as its worst dimension.
 */
export function suggestedStatus(checks: CheckInput[]): ReadinessStatus {
  if (checks.length === 0) return "not_assessed";
  const states = checks.map((c) => c.state);
  if (states.includes("blocked")) return "blocked";
  if (states.some((s) => s === "unknown")) return "not_assessed";
  if (states.includes("limitation")) return "ready_with_limitation";
  return "ready";
}

export function blockingChecks(checks: CheckInput[]): string[] {
  return checks.filter((c) => c.state === "blocked").map((c) => c.key);
}

export function limitedChecks(checks: CheckInput[]): string[] {
  return checks.filter((c) => c.state === "limitation").map((c) => c.key);
}

export function isComplete(checks: CheckInput[]): boolean {
  const seen = new Set(checks.filter((c) => c.state !== "unknown").map((c) => c.key));
  return READING_KEYS.every((key) => seen.has(key));
}

const READING_KEYS: readonly string[] = READINESS_CHECKS;

export function missingChecks(checks: CheckInput[]): ReadinessCheckKey[] {
  const seen = new Set(checks.filter((c) => c.state !== "unknown").map((c) => c.key));
  return READINESS_CHECKS.filter((key) => !seen.has(key));
}

/**
 * Guard an assessment.
 *
 * Two rules, both there to stop a green status that is not true:
 *
 *   1. `ready` requires every check assessed and none blocking. Marking a setup
 *      ready with an unchecked dimension is how a client gets told to record and
 *      then finds out the audio was never listened to.
 *   2. `blocked` and `ready_with_limitation` require a client action. A blocker
 *      with nothing for the client to do is a status nobody can act on, which
 *      makes it decoration.
 */
export function assertReadinessAssessment(
  status: ReadinessStatus,
  checks: CheckInput[],
  input: { clientAction?: string | null },
) {
  if (status === "not_assessed") return;

  const blocking = blockingChecks(checks);

  if (status === "ready") {
    if (blocking.length > 0) {
      throw new WorkflowError(
        `${blocking.map(labelFor).join(", ")} ${blocking.length === 1 ? "is" : "are"} still blocking. A setup is only as good as its worst dimension.`,
      );
    }
    const missing = missingChecks(checks);
    if (missing.length > 0) {
      throw new WorkflowError(
        `${missing.map(labelFor).join(", ")} ${missing.length === 1 ? "has" : "have"} not been checked. Marking a setup ready with a dimension unchecked is how a client is told to record and then discovers nobody listened to the audio.`,
      );
    }
    return;
  }

  if (status === "blocked" && blocking.length === 0) {
    throw new WorkflowError(
      "Nothing is marked as blocking. Mark the check that is actually the problem, so the client knows what to fix.",
    );
  }

  if (!input.clientAction?.trim()) {
    throw new WorkflowError(
      "Write the one thing the client needs to do. A limitation or a blocker with no action is a status nobody can act on.",
    );
  }
}

/** A blocked or limited setup owes the client an action. */
export function needsClientAction(status: ReadinessStatus): boolean {
  return status === "blocked" || status === "ready_with_limitation";
}

/** Recording can begin unless the setup is blocked or unreviewed. */
export function canRecord(status: ReadinessStatus): boolean {
  return status === "ready" || status === "ready_with_limitation";
}

function labelFor(key: string): string {
  return CHECK_BY_KEY[key as ReadinessCheckKey]?.label ?? key;
}
