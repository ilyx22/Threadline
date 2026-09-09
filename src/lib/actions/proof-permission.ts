"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { requireOrgAccess } from "@/lib/auth/guard";
import { audit } from "@/lib/auth/audit";
import { checkbox, cleanText, err, guarded, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Testimonial / proof permissions.
 *
 * Willingness to be interviewed is asked once, early, and stored as an
 * answer (yes / maybe / no). Each use of the client's name, words, numbers or
 * logo is a separate permission; granting one never implies another. A
 * testimonial request is only ever triggered by an operator confirming a
 * positive outcome — never by the calendar.
 */

const PERMISSION_KEYS = ["allowInterview", "allowInternalUse", "allowTestimonial", "allowPublicTestimonial", "allowNamedCaseStudy", "allowAnonCaseStudy", "allowPublishMetrics", "allowLogo"] as const;

const willingnessSchema = z.object({ interviewWillingness: z.enum(["unknown", "yes", "maybe", "no"]) });

export async function setInterviewWillingnessAction(orgSlug: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "proof.edit");
    const input = parseForm(willingnessSchema, formData);
    await prisma.proofPermission.upsert({ where: { orgId: ctx.org.id }, create: { orgId: ctx.org.id, interviewWillingness: input.interviewWillingness }, update: { interviewWillingness: input.interviewWillingness } });
    await audit(ctx, { action: "proof.willingness", entityType: "ProofPermission", entityId: ctx.org.id, summary: `Success-interview willingness: ${input.interviewWillingness}` });
    revalidatePath(`/app/${orgSlug}/settings`);
    revalidatePath(`/admin/clients/${ctx.org.id}`);
    return okVoid("Saved.");
  });
}

const grantSchema = z.object({
  ...Object.fromEntries(PERMISSION_KEYS.map((k) => [k, checkbox])),
  grantedNote: z.string().max(1000).optional(),
});

/** The client (admin) grants specific permissions. Each box is its own decision. */
export async function grantProofPermissionsAction(orgSlug: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "proof.edit");
    if (!["client_admin", "super_admin"].includes(ctx.role)) return err("Only the client's own admin can grant permission to use their name, words or numbers.", "auth");
    const input = parseForm(grantSchema, formData) as Record<string, boolean | string | undefined>;
    const data = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, Boolean(input[k])]));
    await prisma.proofPermission.upsert({
      where: { orgId: ctx.org.id },
      create: { orgId: ctx.org.id, ...data, grantedAt: new Date(), grantedNote: input.grantedNote ? cleanText(String(input.grantedNote), 1000) : null },
      update: { ...data, grantedAt: new Date(), grantedNote: input.grantedNote ? cleanText(String(input.grantedNote), 1000) : null },
    });
    await audit(ctx, { action: "proof.permissions", entityType: "ProofPermission", entityId: ctx.org.id, summary: `Permissions granted: ${PERMISSION_KEYS.filter((k) => data[k]).join(", ") || "none"}` });
    revalidatePath(`/app/${orgSlug}/settings`);
    revalidatePath(`/admin/clients/${ctx.org.id}`);
    return okVoid("Permissions recorded. Each one can be withdrawn here at any time.");
  });
}

const successSchema = z.object({ successNote: z.string().min(10, "Say what the positive outcome was, in a sentence somebody can check.").max(2000) });

/** Operator confirms a positive, checkable outcome. This — not elapsed time — is what makes a testimonial request appropriate. */
export async function confirmSuccessAction(orgSlug: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "attribution.manage");
    const input = parseForm(successSchema, formData);
    await prisma.proofPermission.upsert({
      where: { orgId: ctx.org.id },
      create: { orgId: ctx.org.id, successConfirmedAt: new Date(), successConfirmedById: ctx.user.id, successNote: cleanText(input.successNote, 2000) },
      update: { successConfirmedAt: new Date(), successConfirmedById: ctx.user.id, successNote: cleanText(input.successNote, 2000) },
    });
    await audit(ctx, { action: "proof.success_confirmed", entityType: "ProofPermission", entityId: ctx.org.id, summary: "Operator confirmed a positive outcome" });
    revalidatePath(`/admin/clients/${ctx.org.id}`);
    return okVoid("Outcome confirmed. A testimonial request is now appropriate if the client said yes or maybe to an interview.");
  });
}

export async function requestTestimonialAction(orgSlug: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "attribution.manage");
    const p = await prisma.proofPermission.findUnique({ where: { orgId: ctx.org.id } });
    if (!p?.successConfirmedAt) return err("Confirm a positive outcome first. Time passing is not a reason to ask.", "workflow");
    if (p.interviewWillingness === "no") return err("The client said no to a success interview. That answer stands until they change it.", "workflow");
    if (p.interviewWillingness === "unknown") return err("Ask the willingness question before requesting anything.", "workflow");
    await prisma.proofPermission.update({ where: { orgId: ctx.org.id }, data: { requestedAt: new Date() } });
    await audit(ctx, { action: "proof.testimonial_requested", entityType: "ProofPermission", entityId: ctx.org.id, summary: "Testimonial / success interview requested" });
    revalidatePath(`/admin/clients/${ctx.org.id}`);
    return okVoid("Recorded. Make the ask personally; the system only records that it is now appropriate.");
  });
}

export const PROOF_PERMISSION_LABELS: Record<(typeof PERMISSION_KEYS)[number], string> = {
  allowInterview: "Take part in a success interview",
  allowInternalUse: "Threadline may use the outcome internally (calibration, training)",
  allowTestimonial: "A written testimonial, shown privately to prospects",
  allowPublicTestimonial: "A public testimonial on threadline.com",
  allowNamedCaseStudy: "A named case study",
  allowAnonCaseStudy: "An anonymised case study",
  allowPublishMetrics: "Publish specific numbers",
  allowLogo: "Show the company logo",
};
