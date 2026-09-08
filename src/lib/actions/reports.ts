"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/auth/audit";
import { requireOrgAccess } from "@/lib/auth/guard";
import { generateReportNarrative } from "@/lib/ai/generators";
import { stringify } from "@/lib/db/json";
import { computeWeeklyReport, metricsSummaryFor, weekRangeFor } from "@/lib/reports/weekly";
import { err, guarded, ok, okVoid, type ActionResult } from "./shared";

/**
 * Weekly report generation.
 *
 * The numbers are computed deterministically and frozen into the payload. The AI
 * narrative is optional and additive — it never produces a figure. If narrative
 * generation fails, the report is still saved with its numbers intact.
 */

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
          demoNumbers: {
            shipped: payload.shipped.count,
            views: payload.performance.views,
            inquiries: payload.commercial.inquiries,
            calls: payload.commercial.callsBooked,
            bottleneck: payload.operating.bottleneck ?? undefined,
          },
        });
        narrative = result.narrative;
        isDemo = result.meta.isDemo;
      } catch (error) {
        // The report is valuable without a narrative; the numbers are the product.
        console.error("[report] narrative generation failed", error);
      }
    }

    // QA-008: a finalised report is the client's record. Regenerating the same
    // period used to upsert straight over it, silently replacing what the
    // client had already been sent. A final report is never rewritten.
    const existing = await prisma.weeklyReport.findUnique({
      where: { orgId_periodStart: { orgId: ctx.org.id, periodStart: range.start } },
      select: { id: true, status: true },
    });
    if (existing?.status === "final") {
      return err(
        "A final report already exists for this period. It is the client's record and cannot be regenerated — start the next period instead.",
        "workflow",
      );
    }

    const report = await prisma.weeklyReport.upsert({
      where: { orgId_periodStart: { orgId: ctx.org.id, periodStart: range.start } },
      create: {
        orgId: ctx.org.id,
        periodStart: range.start,
        periodEnd: range.end,
        status: "draft",
        payload: stringify({ ...payload, isDemoNarrative: isDemo }),
        narrative,
        generatedById: ctx.user.id,
      },
      update: {
        periodEnd: range.end,
        payload: stringify({ ...payload, isDemoNarrative: isDemo }),
        narrative: narrative ?? undefined,
        generatedAt: new Date(),
        generatedById: ctx.user.id,
      },
    });

    await audit(ctx, {
      action: "report.generate",
      entityType: "weekly_report",
      entityId: report.id,
      summary: `Generated the weekly report for ${payload.periodLabel}`,
      meta: { shipped: payload.shipped.count, views: payload.performance.views },
    });
    revalidatePath(`/app/${orgSlug}/reports`);
    revalidatePath(`/app/${orgSlug}/reports/${report.id}`);

    return ok(
      { id: report.id, isDemo },
      narrative ? "Report generated." : "Report generated (numbers only — the narrative could not be produced).",
    );
  });
}

export async function finaliseReportAction(
  orgSlug: string,
  reportId: string,
): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.generate");
    const report = await prisma.weeklyReport.findFirst({
      where: { id: reportId, orgId: ctx.org.id },
      select: { id: true, status: true },
    });
    if (!report) return err("That report no longer exists.", "not_found");
    if (report.status === "final") return okVoid("This report is already final.");

    await prisma.weeklyReport.update({ where: { id: reportId }, data: { status: "final" } });
    await audit(ctx, {
      action: "report.finalise",
      entityType: "weekly_report",
      entityId: reportId,
      summary: "Marked a weekly report final",
    });
    revalidatePath(`/app/${orgSlug}/reports/${reportId}`);
    revalidatePath(`/app/${orgSlug}/reports`);

    return okVoid("Report marked final.");
  });
}

export async function deleteReportAction(orgSlug: string, reportId: string): Promise<ActionResult> {
  return guarded(async () => {
    const ctx = await requireOrgAccess(orgSlug, "reports.generate");
    const report = await prisma.weeklyReport.findFirst({
      where: { id: reportId, orgId: ctx.org.id },
      select: { id: true, status: true },
    });
    if (!report) return err("That report no longer exists.", "not_found");
    if (report.status === "final") {
      return err("Final reports cannot be deleted — they are the client's record.", "workflow");
    }

    await prisma.weeklyReport.delete({ where: { id: reportId } });
    revalidatePath(`/app/${orgSlug}/reports`);

    return okVoid("Draft report deleted.");
  });
}
