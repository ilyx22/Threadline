"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { proofPeriodKindSchema } from "@/lib/domain/enums";
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
import { assertNotSyntheticProof } from "@/lib/domain/synthetic";

/**
 * Proof capture mutations.
 *
 * Only client-reported figures are stored. Everything the platform can observe
 * is recomputed at read time from the workspace's own records, so a comparison
 * can never drift away from the content, publishing and pipeline data behind
 * it — and nobody can quietly improve a month by editing a number.
 */

const moneySchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value?.trim()) return null;
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    // Stored in minor units, like every other money field in the product.
    return Math.round(parsed * 100);
  });

const optionalNumber = (max: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      if (!value?.trim()) return null;
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return null;
      return parsed;
    });

const periodSchema = z.object({
  kind: proofPeriodKindSchema.default("period"),
  label: z.string().min(2, "Name the period.").max(120),
  periodStart: optionalDate,
  periodEnd: optionalDate,
  reportedFounderHours: optionalNumber(200),
  reportedContentOutput: optionalNumber(10_000),
  reportedCycleTimeDays: optionalNumber(365),
  reportedApprovalDays: optionalNumber(365),
  reportedAudienceSize: optionalNumber(100_000_000),
  reportedEngagementRate: optionalNumber(100),
  reportedQualifiedInquiries: optionalNumber(100_000),
  reportedCallsBooked: optionalNumber(100_000),
  reportedAttributableValueMinor: moneySchema,
  attributionNote: z.string().max(2000).optional(),
  qualitativeNotes: z.string().max(4000).optional(),
});

export async function saveProofPeriodAction(
  orgSlug: string,
  periodId: string | null,
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "proof.edit");
    const input = parseForm(periodSchema, formData);

    if (!input.periodStart || !input.periodEnd) {
      return err("Set the start and end of the period.", "validation", {
        periodStart: "Required.",
        periodEnd: "Required.",
      });
    }
    if (input.periodStart > input.periodEnd) {
      return err("The period start must come before the period end.", "validation", {
        periodStart: "Start after end.",
      });
    }

    const existing = periodId
      ? await prisma.proofPeriod.findFirst({
          where: { id: periodId, orgId: ctx.org.id },
          select: { id: true, lockedAt: true, label: true },
        })
      : null;
    if (periodId && !existing) return err("That period no longer exists.", "not_found");
    if (existing?.lockedAt) {
      return err(
        `"${existing.label}" is locked. A period that has been shown to a client stays as it was reported.`,
        "workflow",
      );
    }

    // One baseline per workspace: two would make "compared with before" ambiguous.
    if (input.kind === "baseline") {
      const other = await prisma.proofPeriod.findFirst({
        where: { orgId: ctx.org.id, kind: "baseline", ...(periodId ? { id: { not: periodId } } : {}) },
        select: { id: true },
      });
      if (other) {
        return err(
          "A baseline already exists. Edit it rather than adding a second — two baselines make every comparison ambiguous.",
          "workflow",
        );
      }
    }

    const data = {
      kind: input.kind,
      label: cleanText(input.label, 120),
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      reportedFounderHours: input.reportedFounderHours,
      reportedContentOutput: input.reportedContentOutput ? Math.round(input.reportedContentOutput) : null,
      reportedCycleTimeDays: input.reportedCycleTimeDays,
      reportedApprovalDays: input.reportedApprovalDays,
      reportedAudienceSize: input.reportedAudienceSize ? Math.round(input.reportedAudienceSize) : null,
      reportedEngagementRate: input.reportedEngagementRate,
      reportedQualifiedInquiries: input.reportedQualifiedInquiries
        ? Math.round(input.reportedQualifiedInquiries)
        : null,
      reportedCallsBooked: input.reportedCallsBooked ? Math.round(input.reportedCallsBooked) : null,
      reportedAttributableValueMinor: input.reportedAttributableValueMinor,
      attributionNote: input.attributionNote ? cleanText(input.attributionNote, 2000) : null,
      qualitativeNotes: input.qualitativeNotes ? cleanText(input.qualitativeNotes, 4000) : null,
      source: ctx.isInternal ? "operator_recorded" : "client_reported",
      recordedById: ctx.user.id,
    };

    let id = periodId;
    if (existing) {
      await prisma.proofPeriod.update({ where: { id: existing.id }, data });
    } else {
      const clash = await prisma.proofPeriod.findFirst({
        where: { orgId: ctx.org.id, kind: input.kind, periodStart: input.periodStart },
        select: { id: true, label: true },
      });
      if (clash) {
        return err(`"${clash.label}" already covers that start date.`, "validation");
      }
      const created = await prisma.proofPeriod.create({ data: { ...data, orgId: ctx.org.id } });
      id = created.id;
    }

    await audit(ctx, {
      action: periodId ? "proof.update" : "proof.create",
      entityType: "proof_period",
      entityId: id,
      summary: `${periodId ? "Updated" : "Recorded"} ${input.kind} "${input.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/performance/proof`);

    return ok({ id: id as string }, periodId ? "Period updated." : "Period recorded.");
  });
}

/**
 * Lock a period.
 *
 * Once a set of figures has been put in front of a client, changing them later
 * rewrites what was said. Locking follows the same rule as a frozen weekly
 * report and a published brief.
 */
export async function lockProofPeriodAction(
  orgSlug: string,
  periodId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "proof.edit");
    const period = await prisma.proofPeriod.findFirst({
      where: { id: periodId, orgId: ctx.org.id },
      select: { id: true, label: true, lockedAt: true },
    });
    if (!period) return err("That period no longer exists.", "not_found");
    if (period.lockedAt) return okVoid("Already locked.");

    // Locking declares the period final proof. A dry run may record proof
    // periods to exercise the path, but must never be able to finalise one —
    // a locked synthetic period is one screenshot away from being quoted.
    assertNotSyntheticProof(ctx.org, "locked proof");

    await prisma.proofPeriod.update({ where: { id: periodId }, data: { lockedAt: new Date() } });
    await audit(ctx, {
      action: "proof.lock",
      entityType: "proof_period",
      entityId: periodId,
      summary: `Locked "${period.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/performance/proof`);

    return okVoid("Locked. These figures now stay as reported.");
  });
}

export async function deleteProofPeriodAction(
  orgSlug: string,
  periodId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "proof.edit");
    const period = await prisma.proofPeriod.findFirst({
      where: { id: periodId, orgId: ctx.org.id },
      select: { id: true, label: true, lockedAt: true },
    });
    if (!period) return err("That period no longer exists.", "not_found");
    if (period.lockedAt) {
      return err("A locked period cannot be deleted. It is the record of what was reported.", "workflow");
    }

    await prisma.proofPeriod.delete({ where: { id: periodId } });
    await audit(ctx, {
      action: "proof.delete",
      entityType: "proof_period",
      entityId: periodId,
      summary: `Deleted period "${period.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/performance/proof`);

    return okVoid("Period deleted.");
  });
}
