"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { generateReportNarrative } from "@/lib/ai/generators";
import { stringify } from "@/lib/db/json";
import { appUrl } from "@/lib/app-url";
import { enqueue } from "@/lib/jobs";
import "@/lib/jobs/handlers";
import { computeWeeklyReport, metricsSummaryFor, weekRangeFor } from "@/lib/reports/weekly";
import { err, guarded, ok, okVoid, parseForm, type ActionResult } from "./shared";

/**
 * Weekly reports (REP-01, REP-03).
 *
 * The numbers are computed deterministically and frozen into the payload; the
 * AI narrative is optional and never produces a figure. Drafting and
 * finalising are Threadline's work. A final version is never edited or
 * regenerated: a correction is a new version with a stated reason, and the
 * earlier final stays readable as history. Finalising sends the report once
 * per version to each active client member who can read reports.
 */

async function latestForPeriod(orgId: string, periodStart: Date) {
  return prisma.weeklyReport.findFirst({ where: { orgId, periodStart }, orderBy: { version: "desc" }, select: { id: true, status: true, version: true } });
}

export async function generateWeeklyReportAction(
  orgSlug: string,
  weekOffset = 0,
  withNarrative = true,
): Promise<ActionResult<{ id: string; isDemo: boolean }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.generate");

    const target = new Date();
    target.setDate(target.getDate() + weekOffset * 7);
    const range = weekRangeFor(target);

    // QA-008: a final report is the client's record and is never rewritten.
    const latest = await latestForPeriod(ctx.org.id, range.start);
    if (latest?.status === "final") {
      return err(
        "A final report already exists for this period. It is the client's record and cannot be regenerated. To correct it, open it and start a revision with a reason.",
        "workflow",
      );
    }

    const payload = await computeWeeklyReport(ctx.org.id, range);
    let narrative: string | null = null;
    let isDemo = false;
    if (withNarrative) {
      try {
        const result = await generateReportNarrative({
          orgId: ctx.org.id,
          userId: ctx.user.id,
          periodLabel: payload.periodLabel,
          metricsSummary: metricsSummaryFor(payload),
          demoNumbers: { shipped: payload.shipped.count, views: payload.performance.views, inquiries: payload.commercial.inquiries, calls: payload.commercial.callsBooked, bottleneck: payload.operating.bottleneck ?? undefined },
        });
        narrative = result.narrative;
        isDemo = result.meta.isDemo;
      } catch (error) {
        console.error("[report] narrative generation failed", error);
      }
    }

    const data = { periodEnd: range.end, payload: stringify({ ...payload, isDemoNarrative: isDemo }), generatedAt: new Date(), generatedById: ctx.user.id };
    const report = latest
      ? await prisma.weeklyReport.update({ where: { id: latest.id }, data: { ...data, narrative: narrative ?? undefined } })
      : await prisma.weeklyReport.create({ data: { ...data, orgId: ctx.org.id, periodStart: range.start, status: "draft", narrative, version: 1 } });

    await audit(ctx, { action: "report.generate", entityType: "weekly_report", entityId: report.id, summary: `Generated the weekly report for ${payload.periodLabel} (version ${report.version})`, meta: { shipped: payload.shipped.count, views: payload.performance.views } });
    revalidatePath(`/app/${orgSlug}/reports`);
    revalidatePath(`/app/${orgSlug}/reports/${report.id}`);
    return ok({ id: report.id, isDemo }, narrative ? "Report generated." : "Report generated (numbers only; the narrative could not be produced).");
  });
}

export async function finaliseReportAction(orgSlug: string, reportId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    const report = await prisma.weeklyReport.findFirst({ where: { id: reportId, orgId: ctx.org.id }, select: { id: true, status: true, version: true, periodStart: true, payload: true } });
    if (!report) return err("That report no longer exists.", "not_found");
    if (report.status === "final") return okVoid("This report is already final.");

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.weeklyReport.updateMany({ where: { id: report.id, status: "draft" }, data: { status: "final", finalisedAt: new Date(), finalisedById: ctx.user.id } });
      if (claimed.count !== 1) return;
      // The version this corrects is kept, marked as superseded.
      await tx.weeklyReport.updateMany({ where: { orgId: ctx.org.id, periodStart: report.periodStart, status: "final", version: { lt: report.version }, supersededAt: null }, data: { supersededAt: new Date() } });
    });

    // REP-03: one email per version per reader.
    const readers = await prisma.membership.findMany({
      where: { orgId: ctx.org.id, status: "active", role: { in: ["client_admin", "client_member"] } },
      select: { user: { select: { id: true, email: true, name: true, isActive: true } } },
    });
    const periodLabel = (JSON.parse(report.payload) as { periodLabel?: string }).periodLabel ?? "this week";
    for (const r of readers.filter((x) => x.user.isActive)) {
      await enqueue(
        "email.send",
        { to: r.user.email, template: "weekly_report", data: { name: r.user.name.split(" ")[0], workspaceName: ctx.org.name, periodLabel: report.version > 1 ? `${periodLabel} (corrected)` : periodLabel, link: `${appUrl()}/app/${ctx.org.slug}/reports/${report.id}` }, orgId: ctx.org.id },
        { idempotencyKey: `report:${report.id}:v${report.version}:${r.user.id}`, orgId: ctx.org.id },
      );
    }

    await audit(ctx, { action: "report.finalise", entityType: "weekly_report", entityId: reportId, summary: `Finalised the weekly report (version ${report.version}) and sent it to ${readers.length} reader(s)` });
    revalidatePath(`/app/${orgSlug}/reports/${reportId}`);
    revalidatePath(`/app/${orgSlug}/reports`);
    return okVoid("Report final and on its way to the client.");
  });
}

const reviseSchema = z.object({ reason: z.string().trim().min(5, "Say what is being corrected.").max(1000) });

/** Start a correction of a final report as a new draft version (REP-01). */
export async function reviseReportAction(orgSlug: string, reportId: string, _prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.finalise");
    const { reason } = parseForm(reviseSchema, formData);
    const report = await prisma.weeklyReport.findFirst({ where: { id: reportId, orgId: ctx.org.id } });
    if (!report) return err("That report no longer exists.", "not_found");
    if (report.status !== "final") return err("Only a final report is revised; a draft can simply be edited or regenerated.", "workflow");
    const latest = await latestForPeriod(ctx.org.id, report.periodStart);
    if (latest && latest.id !== report.id) return err("A newer version of this report already exists.", "workflow");
    const payload = await computeWeeklyReport(ctx.org.id, weekRangeFor(report.periodStart));
    const revision = await prisma.weeklyReport.create({
      data: { orgId: ctx.org.id, periodStart: report.periodStart, periodEnd: report.periodEnd, status: "draft", payload: stringify(payload), narrative: report.narrative, generatedById: ctx.user.id, version: report.version + 1, supersedesId: report.id, revisionReason: reason },
    });
    await audit(ctx, { action: "report.revise", entityType: "weekly_report", entityId: revision.id, summary: `Started version ${revision.version} of a final report: ${reason}` });
    revalidatePath(`/app/${orgSlug}/reports`);
    return ok({ id: revision.id }, "Revision started. The client keeps seeing the current final version until this one is finalised.");
  });
}

export async function deleteReportAction(orgSlug: string, reportId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.generate");
    const report = await prisma.weeklyReport.findFirst({ where: { id: reportId, orgId: ctx.org.id }, select: { id: true, status: true } });
    if (!report) return err("That report no longer exists.", "not_found");
    if (report.status === "final") return err("Final reports cannot be deleted; they are the client's record.", "workflow");
    await prisma.weeklyReport.delete({ where: { id: reportId } });
    revalidatePath(`/app/${orgSlug}/reports`);
    return okVoid("Draft report deleted.");
  });
}
