import { prisma } from "@/lib/db/client";
import { parseWith } from "@/lib/db/json";
import { contentRulesSchema, EMPTY_CONTENT_RULES, EMPTY_VOICE, voiceProfileSchema } from "@/lib/domain/brand-brain";
import type { Boundaries } from "@/lib/domain/boundaries";

/** The workspace's banned topics and avoided phrases, for the approval-time check (DR-19). */
export async function loadBoundaries(orgId: string): Promise<Boundaries> {
  const brain = await prisma.brandBrain.findUnique({ where: { orgId }, select: { contentRules: true, voice: true } });
  const rules = parseWith(brain?.contentRules, contentRulesSchema, EMPTY_CONTENT_RULES);
  const voice = parseWith(brain?.voice, voiceProfileSchema, EMPTY_VOICE);
  return { bannedTopics: rules.bannedTopics, phrasesAvoided: voice.phrasesAvoided };
}
