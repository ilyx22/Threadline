"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit, touchOrg } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import {
  CONSTRAINT_DIMENSIONS,
  constraintDimensionSchema,
  severitySchema,
} from "@/lib/domain/enums";
import {
  defaultReviewDate,
  isComplete,
  missingDimensions,
  suggestedSeverity,
  weakestDimension,
  type DimensionRating,
} from "@/lib/domain/diagnosis";
import {
  cleanText,
  err,
  guarded,
  ok,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Constraint diagnosis mutations.
 *
 * The gate worth noticing: a diagnosis cannot be activated until all nine
 * dimensions are rated. Partially rating them would let an operator pick the
 * two dimensions they already had an opinion about and call the result a
 * diagnosis, which is exactly the failure this module exists to prevent.
 */

const ratingsSchema = z.object({
  ...Object.fromEntries(
    CONSTRAINT_DIMENSIONS.flatMap((dimension) => [
      [`rating_${dimension}`, z.coerce.number().min(1).max(5).optional()],
      [`note_${dimension}`, z.string().max(2000).optional()],
    ]),
  ),
});

const diagnosisSchema = z.object({
  primaryConstraint: constraintDimensionSchema.optional(),
  severity: severitySchema.optional(),
  confidence: z.coerce.number().min(0).max(100).default(50),
  evidence: z.string().max(4000).optional(),
  commercialImpact: z.string().max(2000).optional(),
  recommendedAction: z.string().max(2000).optional(),
  experiment: z.string().max(2000).optional(),
  reviewDate: optionalDate,
});

/** Create or update the working diagnosis for this workspace. */
export async function saveDiagnosisAction(
  orgSlug: string,
  diagnosisId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "diagnosis.edit");
    const input = parseForm(diagnosisSchema.and(ratingsSchema), formData);

    const ratings: DimensionRating[] = [];
    for (const dimension of CONSTRAINT_DIMENSIONS) {
      const value = (input as Record<string, unknown>)[`rating_${dimension}`];
      if (typeof value === "number") ratings.push({ dimension, rating: value });
    }

    let existing = diagnosisId
      ? await prisma.constraintDiagnosis.findFirst({
          where: { id: diagnosisId, orgId: ctx.org.id },
          select: { id: true, status: true },
        })
      : null;

    if (diagnosisId && !existing) return err("That diagnosis no longer exists.", "not_found");
    if (existing?.status === "superseded") {
      return err(
        "A superseded diagnosis is a historical record. Start a new one rather than rewriting it.",
        "workflow",
      );
    }

    // The weakest dimension is the recommendation; the operator can override it,
    // but a stored constraint nobody chose would be a guess presented as a call.
    const suggested = weakestDimension(ratings);
    const primary = input.primaryConstraint ?? suggested;
    if (!primary) {
      return err("Rate at least one dimension before saving.", "validation");
    }

    const primaryRating = ratings.find((r) => r.dimension === primary)?.rating ?? 3;
    const data = {
      primaryConstraint: primary,
      severity: input.severity ?? suggestedSeverity(primaryRating),
      confidence: Math.round(input.confidence),
      evidence: input.evidence ? cleanText(input.evidence, 4000) : null,
      commercialImpact: input.commercialImpact ? cleanText(input.commercialImpact, 2000) : null,
      recommendedAction: input.recommendedAction ? cleanText(input.recommendedAction, 2000) : null,
      experiment: input.experiment ? cleanText(input.experiment, 2000) : null,
      reviewDate: input.reviewDate ?? defaultReviewDate(),
    };

    if (!existing) {
      const created = await prisma.constraintDiagnosis.create({
        data: { ...data, orgId: ctx.org.id, status: "draft", createdById: ctx.user.id },
        select: { id: true, status: true },
      });
      existing = created;
    } else {
      await prisma.constraintDiagnosis.update({ where: { id: existing.id }, data });
    }

    for (const dimension of CONSTRAINT_DIMENSIONS) {
      const rating = (input as Record<string, unknown>)[`rating_${dimension}`];
      const note = (input as Record<string, unknown>)[`note_${dimension}`];
      if (typeof rating !== "number") continue;

      await prisma.constraintAssessment.upsert({
        where: { diagnosisId_dimension: { diagnosisId: existing.id, dimension } },
        create: {
          diagnosisId: existing.id,
          dimension,
          rating: Math.round(rating),
          note: typeof note === "string" ? cleanText(note, 2000) : null,
        },
        update: {
          rating: Math.round(rating),
          note: typeof note === "string" ? cleanText(note, 2000) : null,
        },
      });
    }

    await audit(ctx, {
      action: diagnosisId ? "diagnosis.update" : "diagnosis.create",
      entityType: "constraint_diagnosis",
      entityId: existing.id,
      summary: `${diagnosisId ? "Updated" : "Started"} constraint diagnosis — primary constraint: ${primary.replace(/_/g, " ")}`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/diagnosis`);
    revalidatePath(`/app/${orgSlug}/install`);

    return ok({ id: existing.id }, "Diagnosis saved.");
  });
}

/**
 * Activate a diagnosis.
 *
 * Requires all nine dimensions and a written commercial impact: a constraint
 * with no stated commercial consequence is an observation, and the whole point
 * of the diagnosis is to force the argument about what it costs.
 */
export async function activateDiagnosisAction(
  orgSlug: string,
  diagnosisId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "diagnosis.edit");

    const diagnosis = await prisma.constraintDiagnosis.findFirst({
      where: { id: diagnosisId, orgId: ctx.org.id },
      include: { assessments: { select: { dimension: true, rating: true } } },
    });
    if (!diagnosis) return err("That diagnosis no longer exists.", "not_found");
    if (diagnosis.status === "active") return okVoid("Already the current diagnosis.");

    const ratings = diagnosis.assessments.map((a) => ({
      dimension: a.dimension as (typeof CONSTRAINT_DIMENSIONS)[number],
      rating: a.rating,
    }));

    if (!isComplete(ratings)) {
      const missing = missingDimensions(ratings);
      return err(
        `${missing.length} dimension(s) are still unrated: ${missing.map((d) => d.replace(/_/g, " ")).join(", ")}. Rating only some of them makes it possible to name a constraint you had already decided on.`,
        "workflow",
      );
    }
    if (!diagnosis.commercialImpact?.trim()) {
      return err(
        "Write what this constraint costs the business before making it current. A constraint with no commercial consequence is an observation, not a diagnosis.",
        "workflow",
      );
    }

    // Exactly one diagnosis is current at a time; the previous one becomes history.
    await prisma.constraintDiagnosis.updateMany({
      where: { orgId: ctx.org.id, status: "active", id: { not: diagnosisId } },
      data: { status: "superseded" },
    });
    await prisma.constraintDiagnosis.update({
      where: { id: diagnosisId },
      data: { status: "active", reviewedAt: new Date() },
    });

    await audit(ctx, {
      action: "diagnosis.activate",
      entityType: "constraint_diagnosis",
      entityId: diagnosisId,
      summary: `Made "${diagnosis.primaryConstraint.replace(/_/g, " ")}" the current primary constraint`,
    });
    await touchOrg(ctx.org.id);
    revalidatePath(`/app/${orgSlug}/intelligence/diagnosis`);
    revalidatePath(`/app/${orgSlug}/install`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid("This is now the current diagnosis.");
  });
}

/** Record a monthly strategy review without changing the constraint. */
export async function reviewDiagnosisAction(
  orgSlug: string,
  diagnosisId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "diagnosis.edit");
    const input = parseForm(
      z.object({
        note: z.string().min(10, "Say what the review concluded.").max(2000),
        reviewDate: optionalDate,
      }),
      formData,
    );

    const diagnosis = await prisma.constraintDiagnosis.findFirst({
      where: { id: diagnosisId, orgId: ctx.org.id },
      select: { id: true, evidence: true, primaryConstraint: true },
    });
    if (!diagnosis) return err("That diagnosis no longer exists.", "not_found");

    const stamp = new Date().toISOString().slice(0, 10);
    const note = cleanText(input.note, 2000);

    await prisma.constraintDiagnosis.update({
      where: { id: diagnosisId },
      data: {
        reviewedAt: new Date(),
        reviewDate: input.reviewDate ?? defaultReviewDate(),
        // Appended, never overwritten: the history of what was believed and when
        // is the thing that makes a diagnosis worth keeping.
        evidence: [diagnosis.evidence, `[Review ${stamp}] ${note}`].filter(Boolean).join("\n\n"),
      },
    });

    await audit(ctx, {
      action: "diagnosis.review",
      entityType: "constraint_diagnosis",
      entityId: diagnosisId,
      summary: `Reviewed the constraint diagnosis: ${note.slice(0, 160)}`,
    });
    revalidatePath(`/app/${orgSlug}/intelligence/diagnosis`);

    return okVoid("Review recorded.");
  });
}
