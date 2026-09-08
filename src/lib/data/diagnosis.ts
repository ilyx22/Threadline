import "server-only";
import { prisma } from "@/lib/db/client";
import type { ConstraintDimension, Role } from "@/lib/domain/enums";
import { clientScope } from "@/lib/domain/visibility";
import { diagnosisAverage, weakestDimension, type DimensionRating } from "@/lib/domain/diagnosis";

/** Constraint diagnosis repository. Always org-scoped. */

/**
 * The diagnosis this caller may read.
 *
 * An operator sees the draft they are still working on. A client sees the
 * current one or nothing — a hypothesis presented as a finding is exactly the
 * tentative thinking the curated surface excludes.
 */
export async function currentDiagnosis(orgId: string, role: Role) {
  return prisma.constraintDiagnosis.findFirst({
    where: { orgId, status: { in: ["active", "draft"] }, ...clientScope.diagnoses(role) },
    // A live diagnosis outranks a draft that is still being worked on.
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      assessments: true,
    },
  });
}

export type DiagnosisDetail = NonNullable<Awaited<ReturnType<typeof currentDiagnosis>>>;

export async function getDiagnosis(orgId: string, id: string, role: Role) {
  return prisma.constraintDiagnosis.findFirst({
    where: { id, orgId, ...clientScope.diagnoses(role) },
    include: { createdBy: { select: { id: true, name: true } }, assessments: true },
  });
}

/** Operator-only: the trail of what was believed and when. */
export async function diagnosisHistory(orgId: string, limit = 12) {
  return prisma.constraintDiagnosis.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { assessments: { select: { dimension: true, rating: true } } },
  });
}

export type DiagnosisHistoryItem = Awaited<ReturnType<typeof diagnosisHistory>>[number];

/** Ratings in the shape the domain helpers expect. */
export function toRatings(
  assessments: { dimension: string; rating: number }[],
): DimensionRating[] {
  return assessments.map((a) => ({
    dimension: a.dimension as ConstraintDimension,
    rating: a.rating,
  }));
}

/**
 * Compact summary used by the admin client list and the installation view,
 * where the whole diagnosis would be too much.
 */
export async function diagnosisSummary(orgId: string, role: Role) {
  const diagnosis = await currentDiagnosis(orgId, role);
  if (!diagnosis) return null;

  const ratings = toRatings(diagnosis.assessments);
  return {
    id: diagnosis.id,
    status: diagnosis.status,
    primaryConstraint: diagnosis.primaryConstraint,
    severity: diagnosis.severity,
    confidence: diagnosis.confidence,
    recommendedAction: diagnosis.recommendedAction,
    reviewDate: diagnosis.reviewDate,
    dimensionsRated: diagnosis.assessments.length,
    average: diagnosisAverage(ratings),
    weakest: weakestDimension(ratings),
    updatedAt: diagnosis.updatedAt,
  };
}

export type DiagnosisSummary = NonNullable<Awaited<ReturnType<typeof diagnosisSummary>>>;

/** Diagnoses whose review date has passed, for the operator queue. */
export async function overdueReviews(limit = 20) {
  return prisma.constraintDiagnosis.findMany({
    where: { status: "active", reviewDate: { lt: new Date() } },
    orderBy: { reviewDate: "asc" },
    take: limit,
    include: { org: { select: { id: true, slug: true, name: true } } },
  });
}
