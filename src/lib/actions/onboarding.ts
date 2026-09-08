"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { generateIdeas } from "@/lib/ai/generators";
import { parseWith, stringify, stringifyArray } from "@/lib/db/json";
import { ideaPriority } from "@/lib/domain/scoring";
import {
  missingFields,
  onboardingDataSchema,
  FIELD_LABELS,
  type OnboardingData,
  ONBOARDING_STEPS,
} from "@/lib/domain/onboarding";
import { cleanText, cleanUrl, err, guarded, ok, okVoid, type ActionResult } from "./shared";

/**
 * Onboarding.
 *
 * Two properties matter here:
 *   1. Nothing is ever lost. Every step saves on advance and on back-navigation,
 *      and the schema is fully optional so a partial answer always persists.
 *   2. The build step does real work. It writes the Brand Brain, seeds research
 *      from the founder's own answers, generates starter ideas and creates the
 *      first tasks — so onboarding produces a populated workspace, not a
 *      congratulations screen.
 */

const EMPTY_DATA: OnboardingData = onboardingDataSchema.parse({});

async function loadSession(orgId: string) {
  return prisma.onboardingSession.upsert({
    where: { orgId },
    create: { orgId, currentStep: "welcome", status: "in_progress" },
    update: {},
  });
}

/** Merge a partial step payload into the stored answers. */
export async function saveOnboardingStepAction(
  orgSlug: string,
  step: string,
  payload: Record<string, unknown>,
  advance: boolean,
): Promise<ActionResult<{ nextStep: string; missing: string[] }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const session = await loadSession(ctx.org.id);

    const current = parseWith(session.data, onboardingDataSchema, EMPTY_DATA);
    const incoming = onboardingDataSchema.partial().safeParse(payload);
    if (!incoming.success) {
      return err("Some answers could not be saved. Check the highlighted fields.", "validation");
    }

    const merged: OnboardingData = { ...current, ...incoming.data };

    // Validate only when moving forward, so back-navigation never blocks.
    const missing = advance ? missingFields(step, merged) : [];
    if (missing.length > 0) {
      // Save anyway — progress is never lost because a required field is blank.
      await prisma.onboardingSession.update({
        where: { orgId: ctx.org.id },
        data: { data: stringify(merged) },
      });
      return err(
        `Still needed: ${missing.map((f) => FIELD_LABELS[f as keyof OnboardingData] ?? f).join(", ")}.`,
        "validation",
        Object.fromEntries(missing.map((f) => [f, "This is needed to continue."])),
      );
    }

    const completed = new Set(
      parseWith(session.completedSteps, z.array(z.string()), [] as string[]),
    );
    if (advance) completed.add(step);

    const { nextStep } = await import("@/lib/domain/onboarding");
    const target = advance ? nextStep(step) : step;

    await prisma.onboardingSession.update({
      where: { orgId: ctx.org.id },
      data: {
        data: stringify(merged),
        completedSteps: stringifyArray([...completed]),
        currentStep: target,
      },
    });

    await prisma.organization.update({
      where: { id: ctx.org.id },
      data: { onboardingStage: "in_progress", lastActivityAt: new Date() },
    });

    return ok({ nextStep: target, missing: [] });
  });
}

/** Move backwards without validation. Answers already saved are untouched. */
export async function goToOnboardingStepAction(
  orgSlug: string,
  step: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    // QA-006: an unknown step key used to be written straight into the session,
    // and a missing session surfaced as an unhandled Prisma error.
    if (!ONBOARDING_STEPS.some((s) => s.key === step)) {
      return err("That is not an onboarding step.", "validation");
    }
    await prisma.onboardingSession.upsert({
      where: { orgId: ctx.org.id },
      create: { orgId: ctx.org.id, currentStep: step },
      update: { currentStep: step },
    });
    revalidatePath(`/onboarding/${orgSlug}`);
    return okVoid();
  });
}

/**
 * The build step.
 *
 * Runs real work against the answers: writes the Brand Brain, creates the offer,
 * ICP and proof records, seeds research from the founder's own market answers,
 * generates a starter idea set and creates the first tasks.
 *
 * Steps are reported honestly — nothing here is a fake progress bar.
 */
export async function buildWorkspaceAction(
  orgSlug: string,
): Promise<ActionResult<{ ideas: number; research: number; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "brain.edit");
    const session = await loadSession(ctx.org.id);
    const data = parseWith(session.data, onboardingDataSchema, EMPTY_DATA);

    if (!data.companyName || !data.founderName) {
      return err("Complete the earlier steps before building the workspace.", "workflow");
    }

    await prisma.onboardingSession.update({
      where: { orgId: ctx.org.id },
      data: { status: "building" },
    });

    /* 1. Brand Brain ------------------------------------------------------- */

    const company = {
      description: cleanText(data.description ?? ""),
      website: cleanUrl(data.website) ?? "",
      category: data.industry ?? "",
      geography: data.geography ?? "",
      products: [],
      teamSize: data.teamSize ?? "",
      revenueRange: data.revenueRange ?? "",
    };

    const founder = {
      name: data.founderName ?? "",
      title: data.founderTitle ?? "Founder",
      bio: cleanText(data.founderBio ?? ""),
      experience: cleanText(data.founderExperience ?? ""),
      beliefs: data.founderBeliefs ?? [],
      opinions: data.founderOpinions ?? [],
      stories: data.founderStories ?? [],
      credentials: data.founderCredentials ?? [],
      approvedAnecdotes: data.founderStories ?? [],
    };

    const voice = {
      tone: cleanText(data.voiceTone ?? ""),
      vocabulary: cleanText(data.voiceVocabulary ?? ""),
      sentenceStructure: cleanText(data.voiceStructure ?? ""),
      humour: cleanText(data.voiceHumour ?? ""),
      phrasesUsed: data.voicePhrasesUsed ?? [],
      phrasesAvoided: data.voicePhrasesAvoided ?? [],
      soundsLikeMe: data.voiceSoundsLikeMe ?? [],
      notMe: data.voiceNotMe ?? [],
    };

    const contentRules = {
      platforms: data.targetPlatforms ?? ["linkedin"],
      formats: ["short_form", "talking_head"],
      preferredCtas: data.offerCtas ?? [],
      cadencePerWeek: data.targetCadence ?? 3,
      pillars: data.contentPillars?.length
        ? data.contentPillars
        : ["Founder POV", "Frameworks and mechanisms", "Case studies and proof", "Objection handling"],
      topics: data.businessObjectives ?? [],
      bannedTopics: data.bannedTopics ?? [],
      complianceNotes: cleanText(data.complianceNotes ?? ""),
    };

    await prisma.brandBrain.upsert({
      where: { orgId: ctx.org.id },
      create: {
        orgId: ctx.org.id,
        company: stringify(company),
        founder: stringify(founder),
        voice: stringify(voice),
        contentRules: stringify(contentRules),
      },
      update: {
        company: stringify(company),
        founder: stringify(founder),
        voice: stringify(voice),
        contentRules: stringify(contentRules),
      },
    });

    /* 2. Offer, ICP, proof -------------------------------------------------- */

    if (data.offerName) {
      const existing = await prisma.offer.findFirst({
        where: { orgId: ctx.org.id, isPrimary: true },
        select: { id: true },
      });
      const offerData = {
        name: data.offerName,
        isPrimary: true,
        priceMinor: Math.round((data.offerPrice ?? 0) * 100),
        currency: ctx.org.currency,
        priceModel: data.offerPriceModel ?? "one_off",
        mechanism: cleanText(data.offerMechanism ?? "") || null,
        outcome: cleanText(data.offerOutcome ?? "") || null,
        differentiators: stringifyArray(data.offerDifferentiators ?? []),
        guarantees: data.offerGuarantee ?? null,
        ctas: stringifyArray(data.offerCtas ?? []),
        exclusions: data.offerExclusions ?? null,
      };
      if (existing) {
        await prisma.offer.update({ where: { id: existing.id }, data: offerData });
      } else {
        await prisma.offer.create({ data: { ...offerData, orgId: ctx.org.id } });
      }
    }

    if (data.icpName) {
      const existing = await prisma.icpProfile.findFirst({
        where: { orgId: ctx.org.id, isPrimary: true },
        select: { id: true },
      });
      const icpData = {
        name: data.icpName,
        isPrimary: true,
        description: cleanText(data.icpDescription ?? "") || null,
        firmographics: cleanText(data.icpFirmographics ?? "") || null,
        pains: stringifyArray(data.icpPains ?? []),
        desires: stringifyArray(data.icpDesires ?? []),
        objections: stringifyArray(data.icpObjections ?? []),
        triggers: stringifyArray(data.icpTriggers ?? []),
        sophistication: data.icpSophistication ?? "moderate",
      };
      if (existing) {
        await prisma.icpProfile.update({ where: { id: existing.id }, data: icpData });
      } else {
        await prisma.icpProfile.create({ data: { ...icpData, orgId: ctx.org.id } });
      }
    }

    for (const proof of data.proofItems ?? []) {
      const exists = await prisma.proofItem.findFirst({
        where: { orgId: ctx.org.id, title: proof.slice(0, 300) },
        select: { id: true },
      });
      if (exists) continue;
      await prisma.proofItem.create({
        data: {
          orgId: ctx.org.id,
          kind: "case_study",
          title: proof.slice(0, 300),
          // Onboarding proof is unverified until an operator checks it. It must
          // not reach a script as an assertable fact before then.
          claimStatus: "needs_review",
        },
      });
    }

    /* 3. Seed research from the founder's own answers ----------------------- */

    let researchCreated = 0;

    const seedResearch = async (
      kind: string,
      items: string[] | undefined,
      tagName: string,
      sourceName: string,
    ) => {
      for (const item of items ?? []) {
        const title = item.trim().slice(0, 300);
        if (!title) continue;
        const exists = await prisma.researchItem.findFirst({
          where: { orgId: ctx.org.id, title },
          select: { id: true },
        });
        if (exists) continue;

        const research = await prisma.researchItem.create({
          data: {
            orgId: ctx.org.id,
            kind,
            title,
            sourceName,
            collectedVia: "manual",
          },
        });

        const tag = await prisma.tag.upsert({
          where: { orgId_name: { orgId: ctx.org.id, name: tagName } },
          create: { orgId: ctx.org.id, name: tagName, kind: tagName },
          update: {},
        });
        await prisma.researchItemTag.create({
          data: { researchItemId: research.id, tagId: tag.id },
        });
        researchCreated += 1;
      }
    };

    await seedResearch("objection", data.icpObjections, "objection", "Onboarding");
    await seedResearch("question", data.customerQuestions, "question", "Onboarding");
    await seedResearch("customer_language", data.icpPains, "pain", "Onboarding");
    await seedResearch("content_example", data.bestContent, "breakout", "Onboarding");

    for (const name of data.competitors ?? []) {
      const trimmed = name.trim().slice(0, 200);
      if (!trimmed) continue;
      const exists = await prisma.competitor.findFirst({
        where: { orgId: ctx.org.id, name: trimmed },
        select: { id: true },
      });
      if (exists) continue;
      await prisma.competitor.create({
        data: { orgId: ctx.org.id, name: trimmed, threatLevel: "medium" },
      });
    }

    /* 4. Starter ideas ------------------------------------------------------ */

    let ideaCount = 0;
    let isDemo = false;

    const existingIdeas = await prisma.idea.count({ where: { orgId: ctx.org.id } });
    if (existingIdeas === 0) {
      try {
        const { ideas, meta } = await generateIdeas({
          orgId: ctx.org.id,
          userId: ctx.user.id,
          count: 8,
        });
        isDemo = meta.isDemo;

        for (const idea of ideas) {
          await prisma.idea.create({
            data: {
              orgId: ctx.org.id,
              title: cleanText(idea.title, 240),
              concept: cleanText(idea.concept),
              audience: idea.audience || data.icpName || null,
              painDesire: idea.painDesire || null,
              pillar: idea.pillar || null,
              platform: idea.platform,
              format: idea.format,
              angle: idea.angle || null,
              hookConcept: idea.hookConcept || null,
              objective: idea.objective || null,
              cta: idea.cta || null,
              commercialIntent: idea.commercialIntent,
              noveltyScore: Math.round(idea.noveltyScore),
              relevanceScore: Math.round(idea.relevanceScore),
              proofStrength: Math.round(idea.proofStrength),
              formatFit: Math.round(idea.formatFit),
              priorityScore: ideaPriority(idea),
              rationale: idea.rationale || null,
              source: "onboarding",
              status: "backlog",
              createdById: ctx.user.id,
            },
          });
          ideaCount += 1;
        }
      } catch (error) {
        // Idea generation is the one step that can fail without invalidating the
        // rest of onboarding. The workspace is still fully configured.
        console.error("[onboarding] idea generation failed", error);
      }
    }

    /* 4b. Constraint diagnosis and installation baseline -------------------- */

    /*
     * Onboarding can honestly rate four of the nine dimensions from concrete
     * answers (see provisionalRatings). The other five need a person to look at
     * the actual work, so they are left unrated — which also means this
     * diagnosis stays a draft and cannot be activated until an operator
     * completes it. That is the point: it forces the "is more content actually
     * the answer here?" conversation before delivery starts.
     */
    const existingDiagnosis = await prisma.constraintDiagnosis.findFirst({
      where: { orgId: ctx.org.id },
      select: { id: true },
    });

    if (!existingDiagnosis) {
      const { provisionalRatings, weakestDimension, suggestedSeverity, defaultReviewDate } =
        await import("@/lib/domain/diagnosis");

      const { ratings, notes } = provisionalRatings({
        offerMechanism: data.offerMechanism,
        offerOutcome: data.offerOutcome,
        differentiatorCount: (data.offerDifferentiators ?? []).length,
        icpDescription: data.icpDescription,
        icpFirmographics: data.icpFirmographics,
        painCount: (data.icpPains ?? []).length,
        founderHoursPerWeek: data.hoursPerWeek,
        peopleInvolved: data.peopleInvolved,
        turnaroundDays: data.turnaroundDays,
        hasBookingUrl: Boolean(data.bookingUrl?.trim()),
        leadMagnetCount: (data.leadMagnets ?? []).length,
        attentionToInquiry: data.attentionToInquiry,
      });

      const weakest = weakestDimension(ratings);
      const weakestRating = ratings.find((r) => r.dimension === weakest)?.rating ?? 3;

      if (weakest) {
        const diagnosis = await prisma.constraintDiagnosis.create({
          data: {
            orgId: ctx.org.id,
            status: "draft",
            primaryConstraint: weakest,
            severity: suggestedSeverity(weakestRating),
            // Low on purpose: four of nine dimensions from a questionnaire is a
            // starting point, not a finding.
            confidence: 30,
            evidence:
              "Seeded from onboarding answers. Four dimensions were rated from concrete answers; positioning, content-market fit, differentiation, creative quality and distribution need an operator to review the actual work before this can become the current diagnosis.",
            reviewDate: defaultReviewDate(),
            createdById: ctx.user.id,
          },
        });

        await prisma.constraintAssessment.createMany({
          data: ratings.map((rating) => ({
            diagnosisId: diagnosis.id,
            dimension: rating.dimension,
            rating: rating.rating,
            note: notes[rating.dimension] ?? null,
          })),
        });
      }
    }

    /*
     * The baseline for proof capture. These figures describe the operation
     * BEFORE Threadline, which nothing inside the product can observe — so they
     * are stored exactly as the founder reported them and are labelled that way
     * wherever they appear.
     */
    const existingBaseline = await prisma.proofPeriod.findFirst({
      where: { orgId: ctx.org.id, kind: "baseline" },
      select: { id: true },
    });

    if (!existingBaseline && (data.hoursPerWeek != null || data.monthlyOutput != null)) {
      const end = new Date();
      const start = new Date(end);
      start.setMonth(start.getMonth() - 3);

      await prisma.proofPeriod.create({
        data: {
          orgId: ctx.org.id,
          kind: "baseline",
          label: "Before Threadline",
          periodStart: start,
          periodEnd: end,
          reportedFounderHours: data.hoursPerWeek ?? null,
          // Reported monthly; the baseline period covers three months.
          reportedContentOutput:
            data.monthlyOutput != null ? Math.round(data.monthlyOutput * 3) : null,
          reportedCycleTimeDays: data.turnaroundDays ?? null,
          qualitativeNotes:
            "Reported by the founder during installation. Nothing before the engagement is observable from inside the product, so these figures are what was described, not what was measured.",
          source: "client_reported",
          recordedById: ctx.user.id,
        },
      });
    }

    /* 5. First tasks -------------------------------------------------------- */

    const openTasks = await prisma.task.count({
      where: { orgId: ctx.org.id, audience: "client", status: "open" },
    });
    if (openTasks === 0) {
      await prisma.task.createMany({
        data: [
          {
            orgId: ctx.org.id,
            title: "Review your first content opportunities",
            description: `${ideaCount} ideas were generated from your answers. Shortlist the ones that sound like you.`,
            kind: "review",
            audience: "client",
            priority: "high",
            estimateMin: 10,
          },
          {
            orgId: ctx.org.id,
            title: "Complete the constraint diagnosis",
            description:
              "Four of the nine dimensions were rated from your answers. The rest need a look at the actual work, and until they are rated we would just be assuming more content is the answer.",
            kind: "decide",
            audience: "internal",
            priority: "high",
            estimateMin: 30,
          },
          {
            orgId: ctx.org.id,
            title: "Add your strongest proof",
            description:
              "Testimonials, case studies and real numbers. Anything cleared for public use makes every script stronger.",
            kind: "upload",
            audience: "client",
            priority: "medium",
            estimateMin: 10,
          },
        ],
      });
    }

    /* 6. Finish ------------------------------------------------------------- */

    await prisma.onboardingSession.update({
      where: { orgId: ctx.org.id },
      data: { status: "complete", completedAt: new Date(), currentStep: "done" },
    });

    await prisma.organization.update({
      where: { id: ctx.org.id },
      data: {
        onboardingStage: "complete",
        status: "active",
        name: data.companyName ?? ctx.org.name,
        website: cleanUrl(data.website),
        industry: data.industry ?? null,
        geography: data.geography ?? null,
        lastActivityAt: new Date(),
      },
    });

    // Recompute Brand Brain completeness now that everything is written.
    const [offers, icps, proofCount, brain] = await Promise.all([
      prisma.offer.count({ where: { orgId: ctx.org.id } }),
      prisma.icpProfile.count({ where: { orgId: ctx.org.id } }),
      prisma.proofItem.count({ where: { orgId: ctx.org.id } }),
      prisma.brandBrain.findUnique({ where: { orgId: ctx.org.id } }),
    ]);

    if (brain) {
      const { sectionCompleteness, overallCompleteness } = await import("@/lib/domain/brand-brain");
      const sections = sectionCompleteness(
        { company, founder, voice, contentRules },
        { offers, icps, proof: proofCount },
      );
      await prisma.brandBrain.update({
        where: { orgId: ctx.org.id },
        data: { completeness: overallCompleteness(sections) },
      });
    }

    await prisma.notification.create({
      data: {
        orgId: ctx.org.id,
        kind: "system",
        title: "Your Threadline workspace is ready",
        body: `${ideaCount} content opportunities and ${researchCreated} research items were created from your answers.`,
        href: `/app/${orgSlug}`,
        severity: "success",
      },
    });

    await audit(ctx, {
      action: "onboarding.complete",
      entityType: "organization",
      entityId: ctx.org.id,
      summary: "Completed onboarding and built the workspace",
      meta: { ideas: ideaCount, research: researchCreated, isDemo },
    });
    await touchOrg(ctx.org.id);

    revalidatePath(`/app/${orgSlug}`);
    revalidatePath(`/onboarding/${orgSlug}`);

    return ok({ ideas: ideaCount, research: researchCreated, isDemo }, "Workspace built.");
  });
}

export async function resetOnboardingAction(orgSlug: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "workspace.settings");

    await prisma.onboardingSession.update({
      where: { orgId: ctx.org.id },
      data: { currentStep: "welcome", status: "in_progress", completedSteps: "[]", completedAt: null },
    });
    await prisma.organization.update({
      where: { id: ctx.org.id },
      data: { onboardingStage: "in_progress" },
    });

    await audit(ctx, {
      action: "onboarding.reset",
      entityType: "organization",
      entityId: ctx.org.id,
      summary: "Restarted onboarding",
    });
    revalidatePath(`/onboarding/${orgSlug}`);

    return okVoid("Onboarding restarted. Your answers were kept.");
  });
}
