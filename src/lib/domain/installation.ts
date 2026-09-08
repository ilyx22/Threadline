/**
 * Installation milestones — the first-value flow.
 *
 * The commercial promise of the first week is narrow and checkable: by day
 * seven the client should be able to see that Threadline understands their
 * market and has already turned that understanding into usable creative output.
 *
 * Milestone state is DERIVED from real workspace records wherever it can be, so
 * the progress bar cannot say "first scripts ready" while no script exists.
 * Only two things are stored (see `InstallationMilestone`): an explicit human
 * sign-off, for the milestone that genuinely needs a decision rather than a
 * record, and an operator-written blocker.
 */

export const MILESTONE_KEYS = [
  "context_captured",
  "diagnosis_complete",
  "first_brief",
  "strategy_approved",
  "first_scripts",
  "recording_ready",
  "first_recording",
  "first_production",
] as const;

export type MilestoneKey = (typeof MILESTONE_KEYS)[number];

export type MilestoneStatus = "not_started" | "in_progress" | "complete" | "blocked";

export type MilestoneDefinition = {
  key: MilestoneKey;
  /** What the client reads. Outcome-shaped, not task-shaped. */
  label: string;
  /** One line the client sees under the label. */
  clientDescription: string;
  /** What the operator needs to do to move it. */
  operatorAction: string;
  /** Who has to act for this to complete. */
  owner: "threadline" | "client" | "shared";
  /** Target day within the installation week. */
  targetDay: number;
  /**
   * True when completion needs a human decision rather than the existence of a
   * record. Only these read the stored sign-off.
   */
  requiresSignOff: boolean;
  /** Where the work happens, relative to the workspace root. */
  href: (slug: string) => string;
};

export const MILESTONES: MilestoneDefinition[] = [
  {
    key: "context_captured",
    label: "Business context captured",
    clientDescription:
      "Your offer, customer, positioning, proof and voice are recorded, so everything the system produces starts from your business rather than a template.",
    operatorAction: "Complete onboarding and fill the Brand Brain to at least 60% context strength.",
    owner: "shared",
    targetDay: 1,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/intelligence`,
  },
  {
    key: "diagnosis_complete",
    label: "Constraint diagnosis complete",
    clientDescription:
      "We have named what is actually limiting demand — which is not always content — and what we intend to do about it.",
    operatorAction: "Rate all nine dimensions, set the primary constraint and activate the diagnosis.",
    owner: "threadline",
    targetDay: 2,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/intelligence/diagnosis`,
  },
  {
    key: "first_brief",
    label: "First intelligence brief delivered",
    clientDescription:
      "What we found in your market, the evidence behind it, and the tests we want to run because of it.",
    operatorAction: "Run a full intelligence cycle and publish the brief.",
    owner: "threadline",
    targetDay: 4,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/intelligence/runs`,
  },
  {
    key: "strategy_approved",
    label: "30-day strategy approved",
    clientDescription:
      "You have seen the themes and tests for the next 30 days, and signed them off.",
    operatorAction: "Walk the client through the approved signals and ranked tests, then record their sign-off.",
    owner: "client",
    targetDay: 5,
    requiresSignOff: true,
    href: (slug) => `/app/${slug}/intelligence/signals`,
  },
  {
    key: "first_scripts",
    label: "First researched scripts ready",
    clientDescription:
      "Scripts built from the research, fact-checked, and ready for you to record.",
    operatorAction: "Take at least three scripts through to ready-to-record, clearing every factual claim.",
    owner: "threadline",
    targetDay: 6,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/create/scripts`,
  },
  {
    key: "recording_ready",
    label: "Recording setup checked",
    clientDescription:
      "We have checked that your setup produces publishable footage, and that you can reproduce it without help.",
    operatorAction:
      "Watch the test clip, rate all seven checks, and set an honest status. A limitation named now is cheaper than one found in the third batch.",
    owner: "shared",
    targetDay: 6,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/install/recording`,
  },
  {
    key: "first_recording",
    label: "First recording completed",
    clientDescription: "One focused batch. You record; everything after that is ours.",
    owner: "client",
    operatorAction: "Book and run the first recording batch, then mark the queue recorded.",
    targetDay: 7,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/production/recording`,
  },
  {
    key: "first_production",
    label: "First assets in production",
    clientDescription: "Your footage is with the editor and moving through the board.",
    operatorAction: "Assign an editor and move the first pieces into editing.",
    owner: "threadline",
    targetDay: 7,
    requiresSignOff: false,
    href: (slug) => `/app/${slug}/production`,
  },
];

export const MILESTONE_BY_KEY: Record<MilestoneKey, MilestoneDefinition> = Object.fromEntries(
  MILESTONES.map((m) => [m.key, m]),
) as Record<MilestoneKey, MilestoneDefinition>;

/**
 * Observable facts about the workspace, gathered once by the repository. Every
 * value here is a count or a flag read from a real record.
 */
export type InstallationFacts = {
  brandBrainCompleteness: number;
  /** From RecordingReadiness. "not_assessed" when nothing has been reviewed. */
  readinessStatus: string;
  readinessSubmitted: boolean;
  onboardingComplete: boolean;
  diagnosisActive: boolean;
  diagnosisDimensionsRated: number;
  publishedRuns: number;
  runsInProgress: number;
  approvedSignals: number;
  scriptsReady: number;
  scriptsDrafted: number;
  contentItems: number;
  contentInProduction: number;
  recordingQueue: number;
};

export type StoredMilestone = {
  key: string;
  note: string | null;
  blockedReason: string | null;
  signedOffAt: Date | null;
  targetDate: Date | null;
};

export type MilestoneState = MilestoneDefinition & {
  status: MilestoneStatus;
  /** 0-100. Partial progress is shown so a half-done step does not read as nothing. */
  progress: number;
  /** The specific record that satisfies the milestone, in plain language. */
  detail: string;
  note: string | null;
  blockedReason: string | null;
  signedOffAt: Date | null;
  targetDate: Date | null;
};

/**
 * Resolve every milestone from facts plus the stored overlay.
 *
 * A blocker always wins: an operator saying a step is blocked is more
 * informative than a derived count, and hiding it would be the exact kind of
 * green-dashboard dishonesty this product is meant to avoid.
 */
export function resolveMilestones(
  facts: InstallationFacts,
  stored: StoredMilestone[] = [],
): MilestoneState[] {
  const overlay = new Map(stored.map((s) => [s.key, s]));

  return MILESTONES.map((definition) => {
    const saved = overlay.get(definition.key);
    const derived = deriveMilestone(definition.key, facts);

    let status: MilestoneStatus = derived.status;
    let progress = derived.progress;
    let detail = derived.detail;

    if (definition.requiresSignOff) {
      if (saved?.signedOffAt) {
        status = "complete";
        progress = 100;
        detail = "Signed off.";
      } else if (derived.status === "complete") {
        // The underlying work exists but nobody has confirmed it. Saying
        // "complete" here would claim a client decision that never happened.
        status = "in_progress";
        progress = 75;
        detail = `${detail} Awaiting sign-off.`;
      }
    }

    if (saved?.blockedReason) {
      status = "blocked";
    }

    return {
      ...definition,
      status,
      progress,
      detail,
      note: saved?.note ?? null,
      blockedReason: saved?.blockedReason ?? null,
      signedOffAt: saved?.signedOffAt ?? null,
      targetDate: saved?.targetDate ?? null,
    };
  });
}

function deriveMilestone(
  key: MilestoneKey,
  facts: InstallationFacts,
): { status: MilestoneStatus; progress: number; detail: string } {
  switch (key) {
    case "context_captured": {
      const pct = facts.brandBrainCompleteness;
      if (pct >= 60 && facts.onboardingComplete) {
        return { status: "complete", progress: 100, detail: `Context strength ${pct}%.` };
      }
      if (pct > 0) {
        return {
          status: "in_progress",
          progress: Math.min(95, Math.round((pct / 60) * 100)),
          detail: facts.onboardingComplete
            ? `Context strength ${pct}%. Needs 60% before the output stops sounding generic.`
            : `Context strength ${pct}%. Onboarding is not finished.`,
        };
      }
      return { status: "not_started", progress: 0, detail: "No context captured yet." };
    }

    case "diagnosis_complete": {
      if (facts.diagnosisActive) {
        return { status: "complete", progress: 100, detail: "Primary constraint named and active." };
      }
      if (facts.diagnosisDimensionsRated > 0) {
        return {
          status: "in_progress",
          progress: Math.round((facts.diagnosisDimensionsRated / 9) * 90),
          detail: `${facts.diagnosisDimensionsRated} of 9 dimensions rated.`,
        };
      }
      return { status: "not_started", progress: 0, detail: "Not started." };
    }

    case "first_brief": {
      if (facts.publishedRuns > 0) {
        return {
          status: "complete",
          progress: 100,
          detail: `${facts.publishedRuns} brief${facts.publishedRuns === 1 ? "" : "s"} published.`,
        };
      }
      if (facts.runsInProgress > 0) {
        return { status: "in_progress", progress: 50, detail: "A run is under way." };
      }
      return { status: "not_started", progress: 0, detail: "No run started." };
    }

    case "strategy_approved": {
      if (facts.approvedSignals >= 3) {
        return {
          status: "complete",
          progress: 100,
          detail: `${facts.approvedSignals} signals approved.`,
        };
      }
      if (facts.approvedSignals > 0) {
        return {
          status: "in_progress",
          progress: Math.round((facts.approvedSignals / 3) * 80),
          detail: `${facts.approvedSignals} of 3 signals approved.`,
        };
      }
      return { status: "not_started", progress: 0, detail: "Nothing approved yet." };
    }

    case "first_scripts": {
      if (facts.scriptsReady >= 3) {
        return {
          status: "complete",
          progress: 100,
          detail: `${facts.scriptsReady} scripts cleared for recording.`,
        };
      }
      if (facts.scriptsReady > 0 || facts.scriptsDrafted > 0) {
        return {
          status: "in_progress",
          progress: Math.min(90, Math.round((facts.scriptsReady / 3) * 80) + 10),
          detail:
            facts.scriptsReady > 0
              ? `${facts.scriptsReady} of 3 cleared for recording.`
              : `${facts.scriptsDrafted} drafted, none fact-checked yet.`,
        };
      }
      return { status: "not_started", progress: 0, detail: "No scripts yet." };
    }

    case "recording_ready": {
      // A limitation is a complete check: it means somebody looked, named the
      // constraint and decided the setup is workable anyway. Only "blocked" and
      // "not yet looked at" are incomplete.
      if (facts.readinessStatus === "ready" || facts.readinessStatus === "ready_with_limitation") {
        return {
          status: "complete",
          progress: 100,
          detail:
            facts.readinessStatus === "ready"
              ? "Setup checked and clear."
              : "Checked, with a named limitation we work around.",
        };
      }
      if (facts.readinessStatus === "blocked") {
        return {
          status: "blocked",
          progress: 60,
          detail: "The setup cannot produce publishable footage yet.",
        };
      }
      if (facts.readinessSubmitted) {
        return { status: "in_progress", progress: 50, detail: "Submitted, awaiting review." };
      }
      return { status: "not_started", progress: 0, detail: "Setup not described yet." };
    }

    case "first_recording": {
      if (facts.contentItems > 0) {
        return {
          status: "complete",
          progress: 100,
          detail: `${facts.contentItems} recorded piece${facts.contentItems === 1 ? "" : "s"}.`,
        };
      }
      if (facts.recordingQueue > 0) {
        return {
          status: "in_progress",
          progress: 40,
          detail: `${facts.recordingQueue} in the recording queue, none recorded.`,
        };
      }
      return { status: "not_started", progress: 0, detail: "Nothing queued to record." };
    }

    case "first_production": {
      if (facts.contentInProduction > 0) {
        return {
          status: "complete",
          progress: 100,
          detail: `${facts.contentInProduction} piece${facts.contentInProduction === 1 ? "" : "s"} in production.`,
        };
      }
      if (facts.contentItems > 0) {
        return { status: "in_progress", progress: 40, detail: "Footage received, not yet assigned." };
      }
      return { status: "not_started", progress: 0, detail: "Nothing in production." };
    }
  }
}

/** Overall installation progress: the mean of the milestone progress values. */
export function installationProgress(states: MilestoneState[]): number {
  if (states.length === 0) return 0;
  const total = states.reduce((sum, s) => sum + s.progress, 0);
  return Math.round(total / states.length);
}

export function isInstallationComplete(states: MilestoneState[]): boolean {
  return states.every((s) => s.status === "complete");
}

/** The single next thing to do, so the client is never shown a wall of steps. */
export function nextMilestone(states: MilestoneState[]): MilestoneState | null {
  return (
    states.find((s) => s.status === "blocked") ??
    states.find((s) => s.status === "in_progress") ??
    states.find((s) => s.status === "not_started") ??
    null
  );
}

/** Day number within the installation, 1-indexed, capped so it never runs away. */
export function installationDay(startedAt: Date | null | undefined, now = new Date()): number | null {
  if (!startedAt) return null;
  const ms = now.getTime() - startedAt.getTime();
  if (ms < 0) return 1;
  return Math.min(99, Math.floor(ms / 86_400_000) + 1);
}

export const MILESTONE_STATUS_META: Record<
  MilestoneStatus,
  { label: string; tone: "positive" | "info" | "outline" | "negative" }
> = {
  complete: { label: "Done", tone: "positive" },
  in_progress: { label: "In progress", tone: "info" },
  not_started: { label: "Not started", tone: "outline" },
  blocked: { label: "Blocked", tone: "negative" },
};
