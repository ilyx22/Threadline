import { z } from "zod";

/**
 * Onboarding contract.
 *
 * Fifteen consultative steps. Every field is optional at the schema level so
 * progress always saves — required-ness is enforced per step at submit time by
 * `REQUIRED_FIELDS`, which lets a founder move backwards and skip optional steps
 * without ever losing work.
 */

const text = z.string().max(6000).optional();
const short = z.string().max(400).optional();
const list = z.array(z.string().max(600)).max(60).optional();

export const onboardingDataSchema = z.object({
  // 02 Business
  companyName: short,
  website: short,
  industry: short,
  geography: short,
  description: text,
  teamSize: short,
  revenueRange: short,

  // 03 Offer
  offerName: short,
  offerPrice: z.coerce.number().min(0).max(100_000_000).optional(),
  offerPriceModel: short,
  offerMechanism: text,
  offerOutcome: text,
  offerDifferentiators: list,
  offerGuarantee: text,
  offerCtas: list,
  offerExclusions: text,

  // 04 Customer
  icpName: short,
  icpDescription: text,
  icpFirmographics: text,
  icpPains: list,
  icpDesires: list,
  icpObjections: list,
  icpTriggers: list,
  icpSophistication: short,

  // 05 Founder
  founderName: short,
  founderTitle: short,
  founderBio: text,
  founderExperience: text,
  founderBeliefs: list,
  founderOpinions: list,
  founderStories: list,
  founderCredentials: list,

  // 06 Voice
  voiceTone: text,
  voiceVocabulary: text,
  voiceStructure: text,
  voiceHumour: text,
  voicePhrasesUsed: list,
  voicePhrasesAvoided: list,
  voiceSoundsLikeMe: list,
  voiceNotMe: list,

  // 07 Existing content
  bestContent: list,
  worstContent: list,
  admiredContent: list,

  // 08 Market
  competitors: list,
  monitoredAccounts: list,
  customerQuestions: list,

  // 09 Current operation
  whoResearches: short,
  whoIdeates: short,
  whoScripts: short,
  whoRecords: short,
  whoEdits: short,
  whoApproves: short,
  whoPublishes: short,
  whoAnalyses: short,
  hoursPerWeek: z.coerce.number().min(0).max(168).optional(),
  peopleInvolved: z.coerce.number().int().min(0).max(200).optional(),
  monthlySpend: z.coerce.number().min(0).max(10_000_000).optional(),
  monthlyOutput: z.coerce.number().int().min(0).max(1000).optional(),
  turnaroundDays: z.coerce.number().min(0).max(365).optional(),

  // 10 Goals
  targetPlatforms: list,
  targetCadence: z.coerce.number().int().min(0).max(50).optional(),
  businessObjectives: list,
  contentPillars: list,
  bannedTopics: list,
  complianceNotes: text,

  // 11 Commercial path
  attentionToInquiry: text,
  leadMagnets: list,
  bookingUrl: short,
  averageDealValue: z.coerce.number().min(0).max(100_000_000).optional(),

  // 12 Integrations
  requestedIntegrations: list,
  integrationNotes: text,

  // Proof (collected alongside step 03)
  proofItems: list,
});

export type OnboardingData = z.infer<typeof onboardingDataSchema>;

export const ONBOARDING_STEPS = [
  {
    key: "welcome",
    number: "01",
    title: "Welcome",
    subtitle: "What is about to happen",
    why: "Threadline is configured around your business, not the other way round. This is where that configuration comes from.",
    estimateMin: 1,
    optional: false,
  },
  {
    key: "business",
    number: "02",
    title: "Business",
    subtitle: "What the company actually does",
    why: "Every idea, script and caption the system produces is anchored to this. Without it, output reads like it could belong to anyone.",
    estimateMin: 3,
    optional: false,
  },
  {
    key: "offer",
    number: "03",
    title: "Offer",
    subtitle: "What you sell and how it works",
    why: "Content that teaches without connecting to a mechanism produces audience, not customers. The system needs to know what it is pointing at.",
    estimateMin: 4,
    optional: false,
  },
  {
    key: "customer",
    number: "04",
    title: "Customer",
    subtitle: "Who you are talking to",
    why: "Pains, desires and objections are the raw material of hooks. This is the section that most determines whether content resonates.",
    estimateMin: 4,
    optional: false,
  },
  {
    key: "founder",
    number: "05",
    title: "Founder",
    subtitle: "Your background, beliefs and stories",
    why: "The reason this works is that you can say things nobody else can. This captures what those things are.",
    estimateMin: 4,
    optional: false,
  },
  {
    key: "voice",
    number: "06",
    title: "Voice",
    subtitle: "How you sound",
    why: "This is the difference between a script you record and a script you rewrite. Examples matter more than adjectives here.",
    estimateMin: 4,
    optional: false,
  },
  {
    key: "content",
    number: "07",
    title: "Existing content",
    subtitle: "What has already worked",
    why: "Your own performance history is better evidence than any general best practice.",
    estimateMin: 2,
    optional: true,
  },
  {
    key: "market",
    number: "08",
    title: "Market",
    subtitle: "Who else your audience listens to",
    why: "Seeds the research workspace so the first cycle starts with evidence rather than guesswork.",
    estimateMin: 2,
    optional: true,
  },
  {
    key: "operation",
    number: "09",
    title: "Current operation",
    subtitle: "How content gets made today",
    why: "We measure the change against this. It is also how we find the real bottleneck rather than the loud one.",
    estimateMin: 3,
    optional: false,
  },
  {
    key: "goals",
    number: "10",
    title: "Goals",
    subtitle: "Platforms, cadence and objectives",
    why: "Sets the target the weekly report measures against, and scopes which platforms the system packages for.",
    estimateMin: 2,
    optional: false,
  },
  {
    key: "commercial",
    number: "11",
    title: "Commercial path",
    subtitle: "How attention becomes revenue",
    why: "Without this, we can only report on views. With it, we can report on conversations.",
    estimateMin: 2,
    optional: false,
  },
  {
    key: "integrations",
    number: "12",
    title: "Access",
    subtitle: "What we can connect and what stays manual",
    why: "We only ask for access we can genuinely use. Everything else has a manual workflow that works today.",
    estimateMin: 2,
    optional: true,
  },
  {
    key: "review",
    number: "13",
    title: "Review",
    subtitle: "What Threadline learned",
    why: "Check it before we build. Anything here can still be edited.",
    estimateMin: 3,
    optional: false,
  },
  {
    key: "build",
    number: "14",
    title: "Build",
    subtitle: "Configuring your workspace",
    why: "",
    estimateMin: 1,
    optional: false,
  },
  {
    key: "done",
    number: "15",
    title: "Command centre",
    subtitle: "Your system is ready",
    why: "",
    estimateMin: 0,
    optional: false,
  },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]["key"];

export const STEP_KEYS = ONBOARDING_STEPS.map((s) => s.key) as OnboardingStepKey[];

/** Fields that must be present before a step can be completed. */
export const REQUIRED_FIELDS: Partial<Record<OnboardingStepKey, (keyof OnboardingData)[]>> = {
  business: ["companyName", "description"],
  offer: ["offerName", "offerOutcome"],
  customer: ["icpName", "icpPains"],
  founder: ["founderName", "founderBio"],
  voice: ["voiceTone"],
  operation: ["hoursPerWeek"],
  goals: ["targetPlatforms", "targetCadence"],
  commercial: ["attentionToInquiry"],
};

export function stepIndex(key: string) {
  return STEP_KEYS.indexOf(key as OnboardingStepKey);
}

export function nextStep(key: string): OnboardingStepKey {
  const index = stepIndex(key);
  return STEP_KEYS[Math.min(index + 1, STEP_KEYS.length - 1)] as OnboardingStepKey;
}

export function previousStep(key: string): OnboardingStepKey {
  const index = stepIndex(key);
  return STEP_KEYS[Math.max(index - 1, 0)] as OnboardingStepKey;
}

export function stepMeta(key: string) {
  return ONBOARDING_STEPS.find((s) => s.key === key) ?? ONBOARDING_STEPS[0];
}

export function totalEstimateMinutes() {
  return ONBOARDING_STEPS.reduce((a, s) => a + s.estimateMin, 0);
}

/** Which required fields are still missing for a given step. */
export function missingFields(step: string, data: OnboardingData): string[] {
  const required = REQUIRED_FIELDS[step as OnboardingStepKey] ?? [];
  return required.filter((field) => {
    const value = data[field];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "number") return Number.isNaN(value);
    return !value || String(value).trim().length === 0;
  });
}

export const FIELD_LABELS: Partial<Record<keyof OnboardingData, string>> = {
  companyName: "Company name",
  description: "What the company does",
  offerName: "Offer name",
  offerOutcome: "The outcome you deliver",
  icpName: "Who you serve",
  icpPains: "Their pains",
  founderName: "Founder name",
  founderBio: "Founder background",
  voiceTone: "Tone",
  hoursPerWeek: "Founder hours per week",
  targetPlatforms: "Target platforms",
  targetCadence: "Target cadence",
  attentionToInquiry: "How attention becomes an inquiry",
};

/** Progress percentage across the substantive steps (excluding build and done). */
export function onboardingProgress(completedSteps: string[]) {
  const substantive = STEP_KEYS.filter((k) => k !== "build" && k !== "done");
  const done = substantive.filter((k) => completedSteps.includes(k)).length;
  return Math.round((done / substantive.length) * 100);
}

/* ----------------------------- Kickoff-call mode ----------------------------- */

/**
 * Onboarding on the kickoff call (27 Sept 2026).
 *
 * In "kickoff" mode the client only does a short prep before the call (the
 * business basics and what we can access); Threadline fills the rest with them
 * on the call, then sends it back for the client to check and confirm. "self"
 * is the original flow: the client fills every section alone.
 */
export type OnboardingMode = "kickoff" | "self";
export const ONBOARDING_MODES: OnboardingMode[] = ["kickoff", "self"];

/** Sections the client completes before the kickoff call. */
export const CLIENT_PREP_STEPS: OnboardingStepKey[] = ["welcome", "business", "integrations"];

export type OnboardingPhase = "prep" | "call" | "confirm" | "self";

/**
 * Who is looking and where the session stands decides what they see:
 * - prep: the client before the call; only the prep sections, then a "ready for the call" screen.
 * - call: Threadline staff, on or after the call; every section, jump anywhere.
 * - confirm: the client after the call; every section, checked and confirmed at Review.
 * - self: the client filling it alone.
 */
export function onboardingPhase(input: { mode: string; isStaff: boolean; sentForReview: boolean }): OnboardingPhase {
  if (input.isStaff) return "call";
  if (input.mode !== "kickoff") return "self";
  return input.sentForReview ? "confirm" : "prep";
}

/** The steps this phase walks through, in order. */
export function stepsForPhase(phase: OnboardingPhase): OnboardingStepKey[] {
  if (phase === "prep") return [...CLIENT_PREP_STEPS, "review"];
  return STEP_KEYS;
}

/** The next step within this phase. */
export function nextStepIn(phase: OnboardingPhase, key: string): OnboardingStepKey {
  const seq = stepsForPhase(phase);
  const i = seq.indexOf(key as OnboardingStepKey);
  if (i === -1) return nextStep(key);
  return seq[Math.min(i + 1, seq.length - 1)]!;
}

/** Minutes the client spends before the kickoff call. */
export function prepEstimateMinutes() {
  return ONBOARDING_STEPS.filter((s) => (CLIENT_PREP_STEPS as string[]).includes(s.key)).reduce((a, s) => a + s.estimateMin, 0);
}

export type FieldSource = "threadline" | "client";

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Record who entered each answer that changed in this save. */
export function trackSources(
  sources: Record<string, FieldSource>,
  before: OnboardingData,
  incoming: Partial<OnboardingData>,
  by: FieldSource,
): Record<string, FieldSource> {
  const next = { ...sources };
  for (const [key, value] of Object.entries(incoming)) {
    if (!sameValue(before[key as keyof OnboardingData], value)) next[key] = by;
  }
  return next;
}

/**
 * Clean a model's draft of onboarding answers taken from a call transcript:
 * keep only known fields that parse, drop empty values, and never propose a
 * value identical to what is already saved.
 */
export function cleanTranscriptDraft(raw: unknown, current: OnboardingData): Partial<OnboardingData> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  const shape = onboardingDataSchema.shape;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(key in shape)) continue;
    let v: unknown = value;
    if (typeof v === "string") v = v.trim();
    if (Array.isArray(v)) v = v.filter((x) => typeof x === "string" && x.trim()).map((x) => (x as string).trim());
    if (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) continue;
    const parsed = shape[key as keyof typeof shape].safeParse(v);
    if (!parsed.success || parsed.data === undefined) continue;
    if (sameValue(current[key as keyof OnboardingData], parsed.data)) continue;
    out[key] = parsed.data;
  }
  return out as Partial<OnboardingData>;
}

/** Plain labels for every answer, used when reviewing a transcript draft. */
export const ANSWER_LABELS: Record<keyof OnboardingData, string> = {
  companyName: "Company name", website: "Website", industry: "Industry", geography: "Geography", description: "What the company does", teamSize: "Team size", revenueRange: "Revenue range",
  offerName: "Offer name", offerPrice: "Offer price", offerPriceModel: "Pricing model", offerMechanism: "How the offer works", offerOutcome: "The outcome you deliver", offerDifferentiators: "Differentiators", offerGuarantee: "Guarantee", offerCtas: "Calls to action", offerExclusions: "What is not included",
  icpName: "Who you serve", icpDescription: "Customer description", icpFirmographics: "Company profile", icpPains: "Their pains", icpDesires: "What they want", icpObjections: "Their objections", icpTriggers: "Buying triggers", icpSophistication: "How much they already know",
  founderName: "Founder name", founderTitle: "Founder title", founderBio: "Founder background", founderExperience: "Experience", founderBeliefs: "Beliefs", founderOpinions: "Opinions", founderStories: "Stories", founderCredentials: "Credentials",
  voiceTone: "Tone", voiceVocabulary: "Vocabulary", voiceStructure: "Structure", voiceHumour: "Humour", voicePhrasesUsed: "Phrases they use", voicePhrasesAvoided: "Phrases to avoid", voiceSoundsLikeMe: "Sounds like me", voiceNotMe: "Not me",
  bestContent: "Best content", worstContent: "Content that fell flat", admiredContent: "Content they admire",
  competitors: "Competitors", monitoredAccounts: "Accounts to watch", customerQuestions: "Customer questions",
  whoResearches: "Who researches", whoIdeates: "Who comes up with ideas", whoScripts: "Who scripts", whoRecords: "Who records", whoEdits: "Who edits", whoApproves: "Who approves", whoPublishes: "Who publishes", whoAnalyses: "Who analyses",
  hoursPerWeek: "Founder hours per week", peopleInvolved: "People involved", monthlySpend: "Monthly spend", monthlyOutput: "Pieces per 4-week period", turnaroundDays: "Turnaround in days",
  targetPlatforms: "Target platforms", targetCadence: "Posts per week", businessObjectives: "Business objectives", contentPillars: "Content pillars", bannedTopics: "Banned topics", complianceNotes: "Compliance notes",
  attentionToInquiry: "How attention becomes an inquiry", leadMagnets: "Lead magnets", bookingUrl: "Booking link", averageDealValue: "Average deal value",
  requestedIntegrations: "Requested integrations", integrationNotes: "Access notes",
  proofItems: "Proof",
};

/** The answer fields a transcript draft may fill, one per line, for the prompt. */
export function draftFieldList() {
  return Object.entries(onboardingDataSchema.shape)
    .map(([key, schema]) => {
      const inner = schema instanceof z.ZodOptional ? schema.unwrap() : schema;
      const type = inner instanceof z.ZodArray ? "list" : inner instanceof z.ZodNumber ? "number" : "text";
      return `${key} (${type}): ${ANSWER_LABELS[key as keyof OnboardingData]}`;
    })
    .join("\n");
}
