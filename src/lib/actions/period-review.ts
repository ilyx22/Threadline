"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { appUrl } from "@/lib/app-url";
import { enqueue } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import { WorkflowError } from "@/lib/domain/workflow";
import { draftReviewSections, finaliseReview, openPeriodReview, refreshFigures, reviseReview, saveReviewSections } from "@/lib/reports/period-review";
import { err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/** Four-week reviews (REP-02): written and finalised by Threadline, read by the client. */
const wrap = (e: unknown) => (e instanceof WorkflowError ? err(e.message, "workflow") : null);
const where = (slug: string, id?: string) => {
  revalidatePath(`/app/${slug}/reports`);
  if (id) revalidatePath(`/app/${slug}/reports/reviews/${id}`);
};

export async function openPeriodReviewAction(orgSlug: string, periodNumber: number): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    const e = await prisma.engagement.findFirst({ where: { orgId: ctx.org.id, status: { in: ["active", "paused", "ended", "terminated"] } }, orderBy: { createdAt: "desc" }, select: { id: true } });
    if (!e) return err("This workspace has no started engagement.", "workflow");
    try {
      const r = await openPeriodReview(ctx.org.id, e.id, periodNumber, ctx.user.id);
      where(orgSlug, r.id);
      return ok({ id: r.id });
    } catch (x) {
      return wrap(x) ?? Promise.reject(x);
    }
  });
}

const sections = z.object({ action: z.string().max(8000), results: z.string().max(8000), problems: z.string().max(8000), future: z.string().max(8000) });

export async function saveReviewAction(orgSlug: string, reviewId: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    try {
      await saveReviewSections(reviewId, ctx.org.id, parseForm(sections, formData));
    } catch (x) {
      return wrap(x) ?? Promise.reject(x);
    }
    where(orgSlug, reviewId);
    return okVoid("Saved.");
  });
}

/** AI-07: draft the empty sections from the records, for the operator to edit. */
export async function draftReviewSectionsAction(orgSlug: string, reviewId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    try {
      const r = await draftReviewSections(reviewId, ctx.org.id, ctx.user.id);
      await audit(ctx, { action: "review.ai_draft", entityType: "period_review", entityId: reviewId, summary: `Drafted ${r.filled.join(", ") || "nothing"} from the records${r.isDemo ? " (demo)" : ""}` });
      where(orgSlug, reviewId);
      return okVoid(r.filled.length ? `Drafted ${r.filled.join(", ")}. Edit before finalising.` : "Nothing was drafted.");
    } catch (x) {
      return wrap(x) ?? Promise.reject(x);
    }
  });
}

export async function refreshReviewFiguresAction(orgSlug: string, reviewId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    try {
      await refreshFigures(reviewId, ctx.org.id);
    } catch (x) {
      return wrap(x) ?? Promise.reject(x);
    }
    where(orgSlug, reviewId);
    return okVoid("Figures recomputed from the records.");
  });
}

export async function finaliseReviewAction(orgSlug: string, reviewId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    try {
      const r = await finaliseReview(reviewId, ctx.org.id, ctx.user.id);
      const readers = await prisma.membership.findMany({ where: { orgId: ctx.org.id, status: "active", role: { in: ["client_admin", "client_member"] } }, select: { user: { select: { id: true, email: true, name: true, isActive: true } } } });
      const label = `period ${r.periodNumber}${r.version > 1 ? " (corrected)" : ""}`;
      for (const m of readers.filter((x) => x.user.isActive)) {
        await enqueue(
          "email.send",
          { to: m.user.email, template: "period_review", data: { name: m.user.name.split(" ")[0], workspaceName: ctx.org.name, periodLabel: label, link: `${appUrl()}/app/${ctx.org.slug}/reports/reviews/${r.id}` }, orgId: ctx.org.id },
          { idempotencyKey: `review:${r.id}:v${r.version}:${m.user.id}`, orgId: ctx.org.id },
        );
      }
      await audit(ctx, { action: "review.finalise", entityType: "period_review", entityId: r.id, summary: `Finalised the review of period ${r.periodNumber} (version ${r.version})` });
    } catch (x) {
      return wrap(x) ?? Promise.reject(x);
    }
    where(orgSlug, reviewId);
    return okVoid("Review final and on its way to the client.");
  });
}

export async function reviseReviewAction(orgSlug: string, reviewId: string, _prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    const { reason } = parseForm(z.object({ reason: z.string().trim().min(5, "Say what is being corrected.").max(1000) }), formData);
    try {
      const r = await reviseReview(reviewId, ctx.org.id, ctx.user.id, reason);
      await audit(ctx, { action: "review.revise", entityType: "period_review", entityId: r.id, summary: `Started version ${r.version} of the period ${r.periodNumber} review: ${reason}` });
      where(orgSlug, r.id);
      return ok({ id: r.id });
    } catch (x) {
      return wrap(x) ?? Promise.reject(x);
    }
  });
}
