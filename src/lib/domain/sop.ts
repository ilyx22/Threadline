import {
  CALL_STAGES,
  isActiveProspectState,
  type CallOutcome,
  type CallStage,
  type ProspectState,
  type ReplyClass,
  type WedgeState,
} from "./enums";
import { WorkflowError } from "./workflow";

/**
 * The Living SOP Engine.
 *
 * Threadline has a shelf of standard operating procedures. A shelf is not an
 * operating system: it requires the operator to remember which document applies,
 * open it, find the relevant section, and hold the next step in their head. This
 * file converts that shelf into state.
 *
 * Every state below carries the five things a person actually needs at the
 * moment they are working:
 *
 *   1. what this state means;
 *   2. why it matters commercially;
 *   3. the exact checklist, including which items need written evidence;
 *   4. what "done" is;
 *   5. where it can legally go next, and what the system should schedule when
 *      it gets there.
 *
 * The long-form SOP stays available as an optional reference. The intent is that
 * an operator almost never opens it, because the state already told them.
 *
 * TWO RULES ARE ENFORCED RATHER THAN DOCUMENTED:
 *
 *   - **The checklist gates the transition.** A state cannot be left through a
 *     forward path while a required item is unticked, or ticked without the
 *     evidence it asked for. An override is allowed, but only with a written
 *     reason, which lands in the audit trail.
 *   - **No active record exists without a next action and a due date.**
 *     `assertActiveRecord` is called by every write. This is the invariant that
 *     stops the pipeline quietly becoming a list of things that were once
 *     interesting.
 *
 * Deliberately absent: any channel name. Whether a first touch is an email, a
 * message, a call or a conversation at an event is an operating decision
 * recorded as text on the record. The method does not depend on it and neither
 * does the arithmetic.
 */

/* -------------------------------- Structure -------------------------------- */

export type ChecklistItem = {
  /** Stable across renames; stored on the check row. */
  key: string;
  label: string;
  /** Why this item exists. Shown under the label, not in a tooltip. */
  hint?: string;
  /**
   * When true, ticking the box is not enough — the operator must write what they
   * found. Used for every item whose value is the finding rather than the doing.
   */
  requiresNote?: boolean;
  /** False for items that are a judgement call rather than an obligation. */
  required?: boolean;
};

export type StateDefinition<S extends string> = {
  state: S;
  /** One line: what it means for a record to be here. */
  meaning: string;
  /** One line: why this state exists commercially. */
  why: string;
  checklist: ChecklistItem[];
  /** What must be true to leave. Written for a person, not a validator. */
  completion: string;
  next: S[];
  /**
   * What the system schedules when a record enters this state. Only set where
   * the answer is genuinely deterministic — inventing a plausible-looking due
   * date for a state whose timing depends on a conversation is worse than
   * leaving the operator to set one.
   */
  onEnter?: { action: string; dueInDays: number };
  /** Optional long-form reference, by SopDocument key. */
  sopKey?: string;
};

/**
 * States that mean "this is over". A record may always reach one of these
 * regardless of unfinished checklists: being unable to close a record honestly
 * is how dead pipeline accumulates.
 */
export const ABANDON_STATES = ["not_fit", "lost", "revised"] as const;

function isAbandon(state: string): boolean {
  return (ABANDON_STATES as readonly string[]).includes(state);
}

/* ---------------------------- Prospect state map ---------------------------- */

export const PROSPECT_SOP: Record<ProspectState, StateDefinition<ProspectState>> = {
  new: {
    state: "new",
    meaning: "Sourced and unqualified. Nothing has been sent.",
    why: "Contacting a business to hit a volume number is how a list stops converting and a sender reputation dies. The gate is here.",
    checklist: [
      {
        key: "wedge_fit",
        label: "Confirm they sit inside the active wedge",
        hint: "Not the umbrella category — the wedge currently being sold against.",
      },
      {
        key: "criteria",
        label: "Check them against the qualification criteria",
        hint: "Proven offer, expertise that matters to the buyer, capacity for more demand.",
      },
      {
        key: "economics",
        label: "Assess whether the economics can support the fee",
        hint: "What one more good customer is worth to them. Write the number or the reason you cannot.",
        requiresNote: true,
      },
      {
        key: "reachable",
        label: "Identify a reachable decision-maker",
        hint: "A named person who can say yes, not a generic inbox.",
      },
      { key: "tier", label: "Assign a tier", hint: "A earns deep work. B earns specific work. C earns nothing yet." },
    ],
    completion:
      "You can say in one line why this business could rationally pay the fee — or you have said honestly that it cannot.",
    next: ["qualified_a", "qualified_b", "not_fit"],
    onEnter: { action: "Qualify this prospect or reject it", dueInDays: 2 },
    sopKey: "lead-qualification",
  },

  qualified_a: {
    state: "qualified_a",
    meaning: "High fit, strong economics, a visible problem. This one earns work before it earns attention.",
    why: "Before real case studies exist, competence has to be demonstrated rather than claimed. Doing something genuinely useful first is the demonstration.",
    checklist: [
      { key: "website", label: "Review the website and the offer" },
      { key: "founder", label: "Review the founder's presence and content" },
      {
        key: "specific",
        label: "Find one specific thing they have actually done",
        hint: "A named piece of work, a result, a talk, a post. Specific enough that it could not be sent to anyone else.",
        requiresNote: true,
      },
      {
        key: "constraint",
        label: "Record a likely primary constraint",
        hint: "A hypothesis, labelled as one. Three minutes of browsing does not produce a diagnosis.",
        requiresNote: true,
      },
      {
        key: "opportunity",
        label: "Identify one useful market, content or competitor opportunity",
        requiresNote: true,
      },
      {
        key: "value_asset",
        label: "Prepare the pre-completed value asset",
        hint: "A teardown, a rewritten hook, three content opportunities, a short competitor brief. Useful whether or not they reply.",
      },
      {
        key: "loom",
        label: "Record a personalised walkthrough",
        hint: "Only where the economics justify the time. A judgement call, not an obligation.",
        required: false,
      },
      { key: "sent", label: "Send the first touch" },
    ],
    completion: "Real work exists, it was done before attention was asked for, and the first touch has gone.",
    next: ["contacted", "qualified_b", "not_fit"],
    onEnter: { action: "Research and prepare the pre-completed value asset", dueInDays: 3 },
  },

  qualified_b: {
    state: "qualified_b",
    meaning: "A genuine fit that does not justify A-tier depth.",
    why: "Most qualified prospects deserve specific, truthful outreach rather than an hour of preparation. Requiring A-tier depth everywhere is how outreach stops happening.",
    checklist: [
      {
        key: "research",
        label: "Research enough to be specific and truthful",
        hint: "One real observation about their business. Not a merge field.",
        requiresNote: true,
      },
      { key: "sent", label: "Send the first touch" },
    ],
    completion: "The message could not have been sent to a different company unchanged.",
    next: ["contacted", "qualified_a", "not_fit"],
    onEnter: { action: "Research and send the first touch", dueInDays: 2 },
  },

  contacted: {
    state: "contacted",
    meaning: "A first touch has been sent and no reply has arrived yet.",
    why: "Most replies arrive after a follow-up. Most follow-ups do not happen because nobody scheduled them.",
    checklist: [
      {
        key: "followup_planned",
        label: "Decide what the follow-up will add",
        hint: "Something useful. Not the words 'just bumping this'.",
        required: false,
      },
    ],
    completion: "A reply arrived and was classified, or the follow-up sequence ran and ended.",
    next: ["replied", "follow_up", "not_fit", "lost"],
    onEnter: { action: "Follow up if there is no reply", dueInDays: 4 },
  },

  replied: {
    state: "replied",
    meaning: "They answered. The reply is its own conversion stage.",
    why: "A reply is not a booking. Treating it as one is where most outbound quietly loses the deals it earned.",
    checklist: [
      { key: "classified", label: "Classify the reply" },
      {
        key: "diagnosed",
        label: "Write what the reply actually means",
        hint: "'Send me some info' is usually a polite deferral, not a request for a PDF.",
        requiresNote: true,
      },
      {
        key: "responded",
        label: "Send the smallest useful response",
        hint: "The smallest thing that moves it forward, not the largest thing you have.",
      },
    ],
    completion: "The reply is classified, understood, answered, and has a dated next step.",
    next: ["booked", "follow_up", "not_fit", "lost"],
    onEnter: { action: "Classify the reply and send the smallest useful response", dueInDays: 1 },
  },

  booked: {
    state: "booked",
    meaning: "A call is in the diary. Preparation is not finished.",
    why: "An unprepared diagnosis call becomes a pitch, and a pitch before a diagnosis is the single most reliable way to lose a fit prospect.",
    checklist: [
      { key: "prior", label: "Review the application and every prior exchange" },
      { key: "model", label: "Review the business model and the offer" },
      {
        key: "economics",
        label: "Understand their economics",
        hint: "Deal size, customer value, capacity. Enough to judge whether solving this is rational for them.",
        requiresNote: true,
      },
      { key: "content", label: "Review their current content" },
      { key: "acquisition", label: "Review how they currently acquire customers" },
      {
        key: "hypothesis",
        label: "Write one to three constraint hypotheses",
        hint: "Labelled as hypotheses. Arrive knowing, then verify — never assert.",
        requiresNote: true,
      },
      {
        key: "demo",
        label: "Choose the demo path and exclude the rest",
        hint: "Only what proves the diagnosed constraint or removes a stated objection.",
        requiresNote: true,
      },
      { key: "reminder", label: "Confirm the reminder is active" },
    ],
    completion: "You could open the call with a specific, evidenced view of their business and be wrong out loud.",
    next: ["call_ready", "follow_up", "lost", "not_fit"],
    onEnter: { action: "Prepare the call", dueInDays: 1 },
    sopKey: "discovery-call",
  },

  call_ready: {
    state: "call_ready",
    meaning: "Prepared. The diagnosis can run.",
    why: "The state map exists so the information requirements are fixed even though the wording is not.",
    checklist: [],
    completion: "The call happened and an outcome was recorded, or it did not and was rescheduled.",
    next: ["showed", "booked", "follow_up", "lost", "not_fit"],
    onEnter: { action: "Run the diagnosis call", dueInDays: 1 },
    sopKey: "discovery-call",
  },

  showed: {
    state: "showed",
    meaning: "The call happened and is waiting for exactly one outcome.",
    why: "A call without a recorded outcome and exact language is a call whose learning is lost.",
    checklist: [
      {
        key: "voc",
        label: "Record their exact words",
        hint: "Their language, not a paraphrase into ours. This is the raw material for the offer and the content.",
        requiresNote: true,
      },
      { key: "outcome", label: "Set exactly one outcome" },
    ],
    completion: "One outcome, their exact words, and a dated next action.",
    next: ["won", "proposal", "follow_up", "lost", "not_fit"],
    onEnter: { action: "Record the outcome and their exact words", dueInDays: 1 },
  },

  proposal: {
    state: "proposal",
    meaning: "A commercial process is running.",
    why: "Proposals die of silence more often than of rejection.",
    checklist: [
      { key: "sent", label: "Send the agreement or proposal with only the agreed scope" },
      {
        key: "decision_date",
        label: "Agree a decision date with them",
        hint: "A date they said, not a date we hoped for.",
        requiresNote: true,
      },
    ],
    completion: "They have the document, and both sides know when a decision happens.",
    next: ["won", "follow_up", "lost", "not_fit"],
    onEnter: { action: "Send the proposal and agree a decision date", dueInDays: 1 },
    sopKey: "proposal",
  },

  follow_up: {
    state: "follow_up",
    meaning: "Alive, dated, and not yet decided.",
    why: "A follow-up without a reason and a blocker is a reminder to feel anxious.",
    checklist: [
      { key: "reason", label: "Write why this is still open", requiresNote: true },
      {
        key: "blocker",
        label: "Name the outstanding blocker",
        hint: "The specific thing that has to change. 'Waiting to hear back' is not a blocker.",
        requiresNote: true,
      },
    ],
    completion: "The reason, the blocker and the date are all written down.",
    next: ["replied", "booked", "proposal", "won", "lost", "not_fit"],
    onEnter: { action: "Follow up", dueInDays: 7 },
  },

  won: {
    state: "won",
    meaning: "Closed. Delivery takes over from here.",
    why: "Close to kickoff is a separate SOP with its own gate: agreement, payment, workspace, kickoff.",
    checklist: [],
    completion: "Handed to close-to-kickoff.",
    next: [],
    sopKey: "onboarding",
  },

  lost: {
    state: "lost",
    meaning: "They decided against us, and the reason is recorded.",
    why: "Loss reasons are the cheapest market research available.",
    checklist: [],
    completion: "Closed with a reason.",
    next: ["follow_up"],
  },

  not_fit: {
    state: "not_fit",
    meaning: "Correctly disqualified.",
    why: "A legitimate no-fit is a correct outcome. Selling into one costs more than losing it.",
    checklist: [],
    completion: "Closed with a reason.",
    next: ["follow_up"],
  },
};

/* ------------------------------ Wedge state map ----------------------------- */

export const WEDGE_SOP: Record<WedgeState, StateDefinition<WedgeState>> = {
  candidate: {
    state: "candidate",
    meaning: "A possible first wedge, scored against the alternatives.",
    why: "'Expert-led B2B' is the umbrella category. A business that speaks to all of it says nothing specific to any of it.",
    checklist: [
      { key: "economics", label: "Score the economics", hint: "Can they afford this, and does one more customer justify it?", requiresNote: true },
      { key: "pain", label: "Score the recurring problem", hint: "Painful and frequent, or merely untidy?", requiresNote: true },
      { key: "reachable", label: "Score reachability", hint: "Can decision-makers be identified and reached at all?", requiresNote: true },
      { key: "precedent", label: "Confirm similar businesses already buy comparable services", requiresNote: true },
      { key: "trust", label: "Confirm founder credibility materially affects their buying" },
    ],
    completion: "Two or three candidates are scored and exactly one has been chosen for immersion.",
    next: ["immersion", "revised"],
    onEnter: { action: "Score this candidate against the alternatives", dueInDays: 5 },
    sopKey: "active-wedge",
  },

  immersion: {
    state: "immersion",
    meaning: "Reading the market before speaking to it.",
    why: "Outreach written without immersion is a guess with a merge field, and it teaches you nothing when it fails.",
    checklist: [
      { key: "companies", label: "Review 25–50 companies in the wedge" },
      { key: "founders", label: "Review at least 20 founder or content examples" },
      {
        key: "language",
        label: "Capture at least 20 pieces of market language",
        hint: "Pains, desires, objections, triggers, alternatives, buying language — in their words.",
        requiresNote: true,
      },
      {
        key: "current",
        label: "Document how content is produced today and where it breaks",
        requiresNote: true,
      },
      {
        key: "problem_bank",
        label: "Write 10 observable symptoms and 3–5 candidate root problems",
        hint: "A symptom is not a problem. Keep them separate.",
        requiresNote: true,
      },
      { key: "rules", label: "Define A/B/C fit rules and hard disqualifiers", requiresNote: true },
    ],
    completion: "You could describe this market's content problem to someone in it and have them agree without being led.",
    next: ["interviews", "revised"],
    onEnter: { action: "Complete the immersion brief", dueInDays: 10 },
    sopKey: "active-wedge",
  },

  interviews: {
    state: "interviews",
    meaning: "Research conversations with qualified people. Not disguised sales calls.",
    why: "This is the step that decides whether there is a business here. Skipping it and building instead is the most expensive mistake available.",
    checklist: [
      {
        key: "conversations",
        label: "Hold at least five research conversations",
        hint: "Recorded below, with what they said and whether they raised it themselves.",
      },
      {
        key: "recurring",
        label: "Name the recurring expensive problem",
        hint: "The same underlying problem, not the same words.",
        requiresNote: true,
      },
      {
        key: "disconfirming",
        label: "Write up the conversations that disagreed",
        hint: "These are the valuable ones. Deleting them is how a hypothesis survives being wrong.",
        requiresNote: true,
      },
    ],
    completion:
      "A recurring expensive problem is described unprompted by enough people to be worth testing commercially — and the evidence is written down, not remembered.",
    next: ["commercial_test", "revised"],
    onEnter: { action: "Book and run the research conversations", dueInDays: 14 },
    sopKey: "active-wedge",
  },

  commercial_test: {
    state: "commercial_test",
    meaning: "Small controlled batches, testing whether the market acts rather than agrees.",
    why: "People will agree a problem is real and still not buy. Agreement is not a commercial signal.",
    checklist: [
      { key: "batch", label: "Send a controlled batch against the strongest message hypothesis" },
      { key: "replies", label: "Compare reply quality, not just reply rate", requiresNote: true },
      { key: "bookings", label: "Compare booking and qualification quality", requiresNote: true },
    ],
    completion: "Qualitative evidence and market response point the same way — or they do not, and that is recorded.",
    next: ["validated", "revised"],
    onEnter: { action: "Run the commercial response batch", dueInDays: 10 },
  },

  validated: {
    state: "validated",
    meaning: "Frozen for the first controlled sales sample.",
    why: "Rewriting the offer mid-campaign destroys the only signal the campaign was producing.",
    checklist: [
      { key: "market", label: "Write the market in one sentence", requiresNote: true },
      { key: "qualification", label: "Write what must already be true for them to succeed here", requiresNote: true },
      { key: "problem", label: "Write the core problem the market itself confirmed", requiresNote: true },
      { key: "outcome", label: "Write the outcome hypothesis", requiresNote: true },
      { key: "list", label: "Confirm the first prospect list can actually be built" },
    ],
    completion: "One market, one expensive problem, one outcome — written down and not reopened because outreach felt uncomfortable.",
    next: ["revised"],
    onEnter: { action: "Freeze the hypothesis and start launch readiness", dueInDays: 2 },
    sopKey: "active-wedge",
  },

  revised: {
    state: "revised",
    meaning: "The evidence did not support the hypothesis, and that is recorded rather than quietly forgotten.",
    why: "Drifting between wedges without recording the change is how a business ends up unable to say what worked.",
    checklist: [
      { key: "why", label: "Write what the evidence actually said", requiresNote: true },
    ],
    completion: "The reason is written down and the next hypothesis is chosen deliberately.",
    next: ["candidate", "immersion", "interviews"],
    onEnter: { action: "Record what the evidence said and choose the next hypothesis", dueInDays: 3 },
    sopKey: "active-wedge",
  },
};

/* --------------------------------- Lookups --------------------------------- */

export function prospectState(state: string): StateDefinition<ProspectState> {
  const def = PROSPECT_SOP[state as ProspectState];
  if (!def) throw new WorkflowError(`Unknown prospect state "${state}".`);
  return def;
}

export function wedgeState(state: string): StateDefinition<WedgeState> {
  const def = WEDGE_SOP[state as WedgeState];
  if (!def) throw new WorkflowError(`Unknown wedge state "${state}".`);
  return def;
}

export const PROSPECT_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  Object.values(PROSPECT_SOP).map((d) => [d.state, d.next]),
);

export const WEDGE_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
  Object.values(WEDGE_SOP).map((d) => [d.state, d.next]),
);

/* ------------------------------ Checklist state ----------------------------- */

export type CheckState = { key: string; done: boolean; note?: string | null };

export type ChecklistStatus = {
  items: (ChecklistItem & { done: boolean; note: string | null; satisfied: boolean })[];
  /** Required items that are not satisfied. */
  outstanding: ChecklistItem[];
  complete: boolean;
  /** 0–100, counting required items only. Optional items never make a state look unfinished. */
  progress: number;
};

export function checklistStatus(
  definition: StateDefinition<string>,
  checks: CheckState[],
): ChecklistStatus {
  const byKey = new Map(checks.map((c) => [c.key, c]));

  const items = definition.checklist.map((item) => {
    const check = byKey.get(item.key);
    const done = check?.done ?? false;
    const note = check?.note?.trim() || null;
    // An item that asked for a finding is not satisfied by a tick alone. The
    // tick records that someone looked; the note records what they found, and
    // the note is the part with value.
    const satisfied = done && (!item.requiresNote || Boolean(note));
    return { ...item, done, note, satisfied };
  });

  const required = items.filter((i) => i.required !== false);
  const outstanding = required.filter((i) => !i.satisfied);

  return {
    items,
    outstanding,
    complete: outstanding.length === 0,
    progress:
      required.length === 0
        ? 100
        : Math.round(((required.length - outstanding.length) / required.length) * 100),
  };
}

/* ------------------------------ Saving a check ------------------------------ */

/**
 * What a checklist write actually stores.
 *
 * A self-saving checkbox cannot reliably tell the server its new value: the
 * browser serialises the box on render, so a form submitted from inside the
 * change handler carries the value it had *before* the click. Rather than race
 * that, the interface sends an instruction — "toggle" — and the decision is
 * made here from what is stored. An explicit save sends "set", where the posted
 * value is authoritative because the operator pressed a button after the render.
 */
export function resolveCheck(
  mode: "toggle" | "set",
  posted: { done: boolean; note: string | null },
  stored: { done: boolean; note: string | null } | null,
): { done: boolean; note: string | null } {
  if (mode === "toggle") {
    // A toggle carries no note of its own; the stored one is preserved so
    // ticking a box never silently erases what somebody wrote.
    return { done: !stored?.done, note: stored?.note ?? null };
  }
  return { done: posted.done, note: posted.note };
}

/* -------------------------------- Invariants -------------------------------- */

/**
 * The hard operating invariant: no active record without a next action and a
 * due date.
 *
 * Enforced here rather than as a database constraint because "active" is a
 * property of the state, not of the row, and SQLite cannot express a
 * conditional NOT NULL without a trigger that would then have to be maintained
 * in two dialects. The service layer is the honest place for it, and it is
 * covered by tests.
 */
export function assertActiveRecord(
  state: string,
  input: { nextAction?: string | null; nextActionDueAt?: Date | null },
  label = "record",
) {
  if (!isActiveProspectState(state) && !isWedgeActive(state)) return;

  const action = input.nextAction?.trim();
  if (!action) {
    throw new WorkflowError(
      `An active ${label} needs a next action. Write the specific thing that happens next, or close the ${label}.`,
    );
  }
  if (!input.nextActionDueAt) {
    throw new WorkflowError(
      `An active ${label} needs a date. "${action}" without a date is a wish, not a plan.`,
    );
  }
}

function isWedgeActive(state: string): boolean {
  return state in WEDGE_SOP && state !== "revised";
}

/** True when a record in this state must carry a next action and a due date. */
export function requiresNextAction(state: string): boolean {
  if (state in WEDGE_SOP) return isWedgeActive(state);
  return isActiveProspectState(state);
}

/* ------------------------------- Transitions -------------------------------- */

export type TransitionInput = {
  checks: CheckState[];
  /** A written reason, when the operator is deliberately skipping the checklist. */
  override?: string | null;
};

function assertStateTransition(
  map: Record<string, string[]>,
  lookup: (state: string) => StateDefinition<string>,
  from: string,
  to: string,
  input: TransitionInput,
  entity: string,
) {
  if (from === to) return;

  const definition = lookup(from);
  lookup(to); // reject an unknown destination before anything else

  if (!map[from]?.includes(to)) {
    throw new WorkflowError(`A ${entity} cannot move from "${from}" to "${to}".`);
  }

  // Closing a record honestly is always allowed. Requiring a finished checklist
  // before someone may write "not a fit" is how dead records accumulate.
  if (isAbandon(to)) return;

  const status = checklistStatus(definition, input.checks);
  if (status.complete) return;

  if (input.override?.trim()) return;

  const names = status.outstanding.map((i) => `"${i.label}"`).join(", ");
  throw new WorkflowError(
    `${status.outstanding.length === 1 ? "This is" : "These are"} not finished yet: ${names}. Complete ${status.outstanding.length === 1 ? "it" : "them"}, or record a reason for moving on without ${status.outstanding.length === 1 ? "it" : "them"}.`,
  );
}

export function assertProspectTransition(
  from: string,
  to: string,
  input: TransitionInput,
) {
  assertStateTransition(PROSPECT_TRANSITIONS, prospectState, from, to, input, "prospect");
}

export function assertWedgeTransition(from: string, to: string, input: TransitionInput) {
  assertStateTransition(WEDGE_TRANSITIONS, wedgeState, from, to, input, "wedge");
}

/**
 * What the system schedules when a record arrives in a state.
 *
 * Returns null where the timing genuinely depends on a conversation. A default
 * that looks deliberate but was invented is worse than an empty field the
 * operator has to fill in, because it will be trusted.
 */
export function defaultNextAction(
  definition: StateDefinition<string>,
  from: Date = new Date(),
): { action: string; dueAt: Date } | null {
  if (!definition.onEnter) return null;
  const dueAt = new Date(from);
  dueAt.setDate(dueAt.getDate() + definition.onEnter.dueInDays);
  dueAt.setHours(12, 0, 0, 0);
  return { action: definition.onEnter.action, dueAt };
}

/* ------------------------- Interview evidence gating ------------------------ */

/**
 * Two thresholds, doing two different jobs.
 *
 * **Five is an interim checkpoint, not a gate.** It is enough to notice whether
 * a hypothesis is going anywhere and to decide whether to keep booking — it is
 * not enough to decide anything about a market. Treating it as a gate was the
 * earlier mistake: a business that freezes a wedge on five conversations has
 * mostly measured its own ability to find five agreeable people.
 *
 * **Ten makes a wedge eligible for a formal validation decision.** Eligible, not
 * validated. Eligibility is about sample size; validation is about what the
 * sample says.
 */
export const INTERIM_CHECKPOINT = 5;
export const VALIDATION_DECISION_MINIMUM = 10;

/**
 * How many conversations must materially converge on the same expensive
 * recurring problem before a wedge can be called validated.
 *
 * More than five — so six. Note this is a count of *converging* conversations,
 * not a proportion: six of ten converging is a signal, and six of forty is
 * evidence the hypothesis is wrong, so the sample size is reported alongside it
 * and never folded into a single number.
 */
export const CONVERGENCE_MINIMUM = 6;

export type ConversationEvidence = {
  /** True when they raised the problem before we named it. */
  volunteered: boolean;
  problem: string;
  /**
   * The recurring problem this conversation belongs to, assigned by an operator.
   *
   * Convergence is a judgement about whether two people described the *same
   * expensive problem in different words*, and no string comparison can make
   * that judgement. So a person makes it and the system counts it. A
   * conversation with no theme is deliberately excluded from convergence rather
   * than guessed at.
   */
  theme?: string | null;
};

export type ValidationReading = {
  total: number;
  volunteered: number;
  /** Five reached: worth reviewing, not worth deciding on. */
  checkpointReached: boolean;
  /** Ten reached: the sample is large enough for a formal decision. */
  decisionEligible: boolean;
  /** Conversations sharing the largest theme. */
  convergence: number;
  /** More than five converging. */
  convergenceMet: boolean;
  /** Conversations an operator has not yet assigned a theme. */
  unclassified: number;
  /** The theme they converge on, when one leads. */
  headline: string | null;
  /** How the evidence should be described out loud. Never a percentage. */
  reading: string;
};

/**
 * How to read a set of validation conversations, honestly.
 *
 * This function will not return a rate, a percentage or a confidence score, and
 * that is the point. At these sample sizes any of those would be false
 * precision that someone would eventually quote in a sales call.
 */
export function readValidation(conversations: ConversationEvidence[]): ValidationReading {
  const total = conversations.length;
  const volunteered = conversations.filter((c) => c.volunteered).length;

  const themed = conversations.filter((c) => c.theme?.trim());
  const unclassified = total - themed.length;

  const counts = new Map<string, number>();
  for (const c of themed) {
    const key = (c.theme as string).trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const convergence = top?.[1] ?? 0;
  const headline = top
    ? (themed.find((c) => (c.theme as string).trim().toLowerCase() === top[0])?.theme ?? null)
    : null;

  const checkpointReached = total >= INTERIM_CHECKPOINT;
  const decisionEligible = total >= VALIDATION_DECISION_MINIMUM;
  const convergenceMet = convergence >= CONVERGENCE_MINIMUM;

  const reading = describe({
    total,
    volunteered,
    convergence,
    unclassified,
    headline,
    checkpointReached,
    decisionEligible,
    convergenceMet,
  });

  return {
    total,
    volunteered,
    checkpointReached,
    decisionEligible,
    convergence,
    convergenceMet,
    unclassified,
    headline,
    reading,
  };
}

function describe(r: {
  total: number;
  volunteered: number;
  convergence: number;
  unclassified: number;
  headline: string | null;
  checkpointReached: boolean;
  decisionEligible: boolean;
  convergenceMet: boolean;
}): string {
  if (r.total === 0) {
    return "No conversations recorded. There is nothing here to read yet.";
  }

  if (!r.checkpointReached) {
    return `${r.total} of ${INTERIM_CHECKPOINT} to the interim checkpoint. Too early to read as anything.`;
  }

  if (!r.decisionEligible) {
    const at = r.total === INTERIM_CHECKPOINT ? "Interim checkpoint reached" : `${r.total} conversations`;
    return `${at}. This is a progress check, not a decision — a wedge becomes eligible for a validation decision at ${VALIDATION_DECISION_MINIMUM}. ${
      r.convergence > 1
        ? `${r.convergence} so far describe the same problem, which is worth noticing and not worth acting on.`
        : "No recurring problem yet."
    }`;
  }

  if (r.volunteered === 0) {
    return "Every problem here was one we named first. Agreement with our own suggestion is the weakest evidence available, whatever the sample size — book conversations where they speak first before deciding anything.";
  }

  if (!r.convergenceMet) {
    const gap = r.unclassified > 0 ? ` ${r.unclassified} conversations have no theme assigned and are not counted.` : "";
    return `${r.total} conversations, but only ${r.convergence} converge on the same expensive problem — validation needs more than ${INTERIM_CHECKPOINT}.${gap} Interview more or change the hypothesis. Do not resolve this by building.`;
  }

  return `${r.convergence} of ${r.total} conversations describe the same expensive recurring problem, and ${r.volunteered} raised it before we did. That is enough to make a validation decision — a decision on a sample, not a measured rate, and it must not be described as one.`;
}

/**
 * The gate on leaving interviews for commercial testing.
 *
 * Two conditions, refused separately so the operator is told which one is
 * missing. Neither has an override: the whole purpose of the state is that the
 * conversations happened and that they said the same thing.
 */
export function assertInterviewEvidence(conversationCount: number, convergence: number) {
  if (conversationCount < VALIDATION_DECISION_MINIMUM) {
    throw new WorkflowError(
      `${conversationCount} of ${VALIDATION_DECISION_MINIMUM} research conversations recorded.${
        conversationCount >= INTERIM_CHECKPOINT
          ? ` ${INTERIM_CHECKPOINT} is an interim checkpoint, not a validation gate.`
          : ""
      } Commercial testing against an unvalidated problem produces a number nobody can interpret.`,
    );
  }

  if (convergence < CONVERGENCE_MINIMUM) {
    throw new WorkflowError(
      `${conversationCount} conversations recorded, but only ${convergence} converge on the same expensive recurring problem. Validation needs more than ${INTERIM_CHECKPOINT} converging — a large sample that agrees on nothing is evidence the hypothesis is wrong, not evidence to test it.`,
    );
  }
}

/* --------------------------------- The call --------------------------------- */

export type CallStageProgress = {
  stage: CallStage;
  covered: boolean;
  note: string | null;
};

export function callProgress(
  covered: string[],
  notes: Record<string, string> = {},
): CallStageProgress[] {
  const set = new Set(covered);
  return CALL_STAGES.map((stage) => ({
    stage,
    covered: set.has(stage),
    note: notes[stage]?.trim() || null,
  }));
}

/** Stages whose information the call cannot honestly end without. */
export const REQUIRED_CALL_STAGES: CallStage[] = [
  "economics",
  "current_state",
  "constraint",
  "consequence",
];

export function missingCallStages(covered: string[]): CallStage[] {
  const set = new Set(covered);
  return REQUIRED_CALL_STAGES.filter((s) => !set.has(s));
}

/**
 * Closing a call.
 *
 * Two rules, both from the sales SOP and both refused rather than warned about:
 * a call ends in exactly one outcome, and every outcome that is still alive
 * carries their exact words plus a dated next action. A no-fit needs neither a
 * next action nor an apology — it is a correct outcome.
 */
export function assertCallOutcome(
  outcome: CallOutcome,
  input: {
    voc?: string | null;
    nextAction?: string | null;
    nextActionDueAt?: Date | null;
    stagesCovered: string[];
  },
) {
  const missing = missingCallStages(input.stagesCovered);
  if (outcome !== "not_fit" && missing.length > 0) {
    const labels = missing.map((s) => s.replace(/_/g, " ")).join(", ");
    throw new WorkflowError(
      `The call did not cover ${labels}. Recording an outcome without it means the diagnosis was not made — mark what was actually covered first, or close this as not a fit.`,
    );
  }

  if (!input.voc?.trim()) {
    throw new WorkflowError(
      "Record what they actually said, in their words. Paraphrasing into our language is how a market's vocabulary gets replaced by our own.",
    );
  }

  const alive = outcome === "follow_up" || outcome === "proposal_process";
  if (alive) {
    if (!input.nextAction?.trim()) {
      throw new WorkflowError("An outcome that is still alive needs a next action.");
    }
    if (!input.nextActionDueAt) {
      throw new WorkflowError("An outcome that is still alive needs a date.");
    }
  }
}

/** Where a prospect lands after a call outcome. */
export const OUTCOME_TO_STATE: Record<CallOutcome, ProspectState> = {
  won: "won",
  follow_up: "follow_up",
  proposal_process: "proposal",
  not_fit: "not_fit",
  lost: "lost",
};

/* ---------------------------- Reply-to-booking ------------------------------ */

/**
 * What a reply class means and what to do about it.
 *
 * Deliberately objectives rather than scripts. A word-for-word reply written by
 * a system that has never spoken to this market would be worse than the
 * operator's own sentence, and the useful version of this comes from real
 * conversations, which is what the notes on each record are for.
 */
export const REPLY_GUIDANCE: Record<
  ReplyClass,
  { objective: string; smallestStep: string; nextState: ProspectState; dueInDays: number }
> = {
  interested: {
    objective: "They want to talk. The only job left is making it easy.",
    smallestStep: "Offer two specific times and say what the call will cover.",
    nextState: "booked",
    dueInDays: 1,
  },
  curious: {
    objective: "Engaged but uncommitted. Something specific is unresolved.",
    smallestStep: "Answer the actual question, then ask for the conversation.",
    nextState: "follow_up",
    dueInDays: 2,
  },
  send_info: {
    objective:
      "Usually a polite deferral rather than a request for a document. Sending a deck here is how the thread ends.",
    smallestStep: "Send the smallest useful thing, and ask one question only they can answer.",
    nextState: "follow_up",
    dueInDays: 2,
  },
  not_now: {
    objective: "Timing, not fit. Stop selling and protect the relationship.",
    smallestStep: "Agree when to come back, and come back then.",
    nextState: "follow_up",
    dueInDays: 30,
  },
  objection: {
    objective:
      "Diagnose it before answering. 'Too expensive' can mean cash flow, low belief, low priority, wrong timing or the wrong person.",
    smallestStep: "Ask the question that separates those meanings.",
    nextState: "follow_up",
    dueInDays: 2,
  },
  referral: {
    objective: "They pointed elsewhere. That is a gift and a signal about fit.",
    smallestStep: "Thank them properly, then start the referred record from scratch.",
    nextState: "follow_up",
    dueInDays: 3,
  },
  not_fit: {
    objective: "Close it honestly. A correct no costs nothing and keeps the door open.",
    smallestStep: "Reply once, briefly, and record why.",
    nextState: "not_fit",
    dueInDays: 1,
  },
  booked: {
    objective: "A call exists. Preparation starts now, not the night before.",
    smallestStep: "Confirm, send what the call covers, and start the prep checklist.",
    nextState: "booked",
    dueInDays: 1,
  },
};
