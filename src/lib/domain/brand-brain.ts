import { z } from "zod";

/**
 * Brand Brain block schemas.
 *
 * These four blocks are stored as JSON columns on `BrandBrain` (see
 * docs/DATA_MODEL.md section 3). Every field is optional at the schema level so a
 * partially-completed workspace is always readable — completeness is measured,
 * not enforced, because onboarding is progressive and a client should never be
 * blocked from using the product because one field is blank.
 */

const text = z.string().trim().max(4000);
const shortText = z.string().trim().max(400);
const list = z.array(z.string().trim().min(1).max(500)).max(60);

export const companyProfileSchema = z.object({
  description: text.default(""),
  website: z.string().trim().max(300).default(""),
  category: shortText.default(""),
  geography: shortText.default(""),
  products: list.default([]),
  teamSize: shortText.default(""),
  revenueRange: shortText.default(""),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

export const founderProfileSchema = z.object({
  name: shortText.default(""),
  title: shortText.default(""),
  bio: text.default(""),
  experience: text.default(""),
  beliefs: list.default([]),
  opinions: list.default([]),
  stories: list.default([]),
  credentials: list.default([]),
  /** Personal anecdotes the founder has explicitly cleared for use in content. */
  approvedAnecdotes: list.default([]),
});
export type FounderProfile = z.infer<typeof founderProfileSchema>;

export const voiceProfileSchema = z.object({
  tone: text.default(""),
  vocabulary: text.default(""),
  sentenceStructure: text.default(""),
  humour: text.default(""),
  phrasesUsed: list.default([]),
  phrasesAvoided: list.default([]),
  soundsLikeMe: list.default([]),
  notMe: list.default([]),
});
export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export const contentRulesSchema = z.object({
  platforms: list.default([]),
  formats: list.default([]),
  preferredCtas: list.default([]),
  /** Target pieces published per week. */
  cadencePerWeek: z.number().int().min(0).max(50).default(3),
  pillars: list.default([]),
  topics: list.default([]),
  bannedTopics: list.default([]),
  complianceNotes: text.default(""),
});
export type ContentRules = z.infer<typeof contentRulesSchema>;

export const EMPTY_COMPANY: CompanyProfile = companyProfileSchema.parse({});
export const EMPTY_FOUNDER: FounderProfile = founderProfileSchema.parse({});
export const EMPTY_VOICE: VoiceProfile = voiceProfileSchema.parse({});
export const EMPTY_CONTENT_RULES: ContentRules = contentRulesSchema.parse({});

export type BrandBrainBlocks = {
  company: CompanyProfile;
  founder: FounderProfile;
  voice: VoiceProfile;
  contentRules: ContentRules;
};

/**
 * Weighted completeness across the whole context layer, including the related
 * tables. This drives the "Brand Brain strength" indicator, which exists to tell
 * an operator where the AI context is thin before a client complains that output
 * feels generic.
 */
export const COMPLETENESS_SECTIONS = [
  "company",
  "offer",
  "icp",
  "founder",
  "voice",
  "proof",
  "contentRules",
] as const;
export type CompletenessSection = (typeof COMPLETENESS_SECTIONS)[number];

export function sectionCompleteness(
  blocks: BrandBrainBlocks,
  counts: { offers: number; icps: number; proof: number },
): Record<CompletenessSection, number> {
  const { company, founder, voice, contentRules } = blocks;

  return {
    company: score([
      filled(company.description, 2),
      filled(company.website),
      filled(company.category),
      filled(company.geography),
      hasItems(company.products),
    ]),
    offer: counts.offers > 0 ? 100 : 0,
    icp: counts.icps > 0 ? 100 : 0,
    founder: score([
      filled(founder.bio, 2),
      filled(founder.experience),
      hasItems(founder.beliefs),
      hasItems(founder.opinions),
      hasItems(founder.stories),
      hasItems(founder.credentials),
    ]),
    voice: score([
      filled(voice.tone, 2),
      filled(voice.vocabulary),
      hasItems(voice.phrasesUsed),
      hasItems(voice.phrasesAvoided),
      hasItems(voice.soundsLikeMe, 2),
      hasItems(voice.notMe),
    ]),
    proof: counts.proof >= 3 ? 100 : Math.round((counts.proof / 3) * 100),
    contentRules: score([
      hasItems(contentRules.platforms, 2),
      hasItems(contentRules.pillars),
      hasItems(contentRules.preferredCtas),
      contentRules.cadencePerWeek > 0 ? { value: 1, weight: 1 } : { value: 0, weight: 1 },
      hasItems(contentRules.topics),
    ]),
  };
}

export function overallCompleteness(sections: Record<CompletenessSection, number>) {
  const weights: Record<CompletenessSection, number> = {
    company: 1,
    offer: 1.5,
    icp: 1.5,
    founder: 1.5,
    voice: 2,
    proof: 1,
    contentRules: 1,
  };
  let total = 0;
  let weightSum = 0;
  for (const key of COMPLETENESS_SECTIONS) {
    total += sections[key] * weights[key];
    weightSum += weights[key];
  }
  return Math.round(total / weightSum);
}

type Signal = { value: number; weight: number };

function filled(value: string | undefined, weight = 1): Signal {
  return { value: value && value.trim().length >= 12 ? 1 : 0, weight };
}

function hasItems(value: string[] | undefined, weight = 1): Signal {
  return { value: (value?.length ?? 0) > 0 ? 1 : 0, weight };
}

function score(signals: Signal[]): number {
  const weightSum = signals.reduce((a, s) => a + s.weight, 0);
  if (weightSum === 0) return 0;
  const value = signals.reduce((a, s) => a + s.value * s.weight, 0);
  return Math.round((value / weightSum) * 100);
}

export const COMPLETENESS_LABELS: Record<CompletenessSection, string> = {
  company: "Company",
  offer: "Offer",
  icp: "Customer",
  founder: "Founder",
  voice: "Voice",
  proof: "Proof",
  contentRules: "Content rules",
};
