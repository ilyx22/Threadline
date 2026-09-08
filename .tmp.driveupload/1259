"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { MILESTONE_BY_KEY, MILESTONE_KEYS } from "@/lib/domain/installation";
import {
  cleanText,
  err,
  guarded,
  okVoid,
  optionalDate,
  parseForm,
  type ActionResult,
} from "./shared";

/**
 * Installation milestone mutations.
 *
 * These write the small stored overlay only. Milestone completion itself is
 * derived from real workspace records (see `src/lib/domain/installation.ts`),
 * so there is deliberately no action here that marks a step done — the way to
 * complete a milestone is to do the work it describes.
 *
 * The one exception is the 30-day strategy, which is a client decision rather
 * than a record, and therefore has an explicit sign-off.
 */

const milestoneKeySchema = z.enum(MILESTONE_KEYS);

/** Record the client's sign-off on the 30-day strategy. */
export async function signOffMilestoneAction(
  orgSlug: string,
  key: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "install.signoff");
    const milestoneKey = milestoneKeySchema.parse(key);
    const definition = MILESTONE_BY_KEY[milestoneKey];

    if (!definition.requiresSignOff) {
      return err(
        `"${definition.label}" completes when the work exists, not when someone says it does. There is nothing to sign off.`,
        "workflow",
      );
    }

    await prisma.installationMilestone.upsert({
      where: { orgId_key: { orgId: ctx.org.id, key: milestoneKey } },
      create: {
        orgId: ctx.org.id,
        key: milestoneKey,
        signedOffAt: new Date(),
        signedOffById: ctx.user.id,
      },
      update: { signedOffAt: new Date(), signedOffById: ctx.user.id, blockedReason: null },
    });

    await audit(ctx, {
      action: "installation.signoff",
      entityType: "installation_milestone",
      entityId: milestoneKey,
      summary: `Signed off "${definition.label}"`,
    });
    revalidatePath(`/app/${orgSlug}/install`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid("Signed off.");
  });
}

export async function clearSignOffAction(orgSlug: string, key: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "install.signoff");
    const milestoneKey = milestoneKeySchema.parse(key);

    await prisma.installationMilestone.updateMany({
      where: { orgId: ctx.org.id, key: milestoneKey },
      data: { signedOffAt: null, signedOffById: null },
    });

    await audit(ctx, {
      action: "installation.signoff.clear",
      entityType: "installation_milestone",
      entityId: milestoneKey,
      summary: `Withdrew sign-off on "${MILESTONE_BY_KEY[milestoneKey].label}"`,
    });
    revalidatePath(`/app/${orgSlug}/install`);

    return okVoid("Sign-off withdrawn.");
  });
}

const noteSchema = z.object({
  note: z.string().max(2000).optional(),
  blockedReason: z.string().max(1000).optional(),
  targetDate: optionalDate,
});

/**
 * Record a blocker or an operator note against a milestone.
 *
 * A blocker overrides the derived status everywhere it is shown. That is
 * intentional: an operator saying a step is stuck is more useful than a count
 * that happens to look healthy, and hiding it would be the green-dashboard
 * dishonesty this product is meant to avoid.
 */
export async function updateMilestoneAction(
  orgSlug: string,
  key: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "install.signoff");
    const milestoneKey = milestoneKeySchema.parse(key);
    const input = parseForm(noteSchema, formData);

    const blockedReason = input.blockedReason ? cleanText(input.blockedReason, 1000) : null;
    const note = input.note ? cleanText(input.note, 2000) : null;

    await prisma.installationMilestone.upsert({
      where: { orgId_key: { orgId: ctx.org.id, key: milestoneKey } },
      create: {
        orgId: ctx.org.id,
        key: milestoneKey,
        note,
        blockedReason,
        targetDate: input.targetDate,
      },
      update: { note, blockedReason, targetDate: input.targetDate },
    });

    await audit(ctx, {
      action: blockedReason ? "installation.blocked" : "installation.note",
      entityType: "installation_milestone",
      entityId: milestoneKey,
      summary: blockedReason
        ? `Marked "${MILESTONE_BY_KEY[milestoneKey].label}" blocked: ${blockedReason}`
        : `Noted against "${MILESTONE_BY_KEY[milestoneKey].label}"`,
    });
    revalidatePath(`/app/${orgSlug}/install`);
    revalidatePath(`/app/${orgSlug}`);

    return okVoid(blockedReason ? "Blocker recorded." : "Note saved.");
  });
}
