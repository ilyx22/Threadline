import { NextResponse, type NextRequest } from "next/server";
import { requireOrgAccess } from "@/lib/auth/guard";
import { getReport } from "@/lib/data/reports";
import { renderPdf } from "@/lib/reports/pdf";
import { weeklyReportBlocks } from "@/lib/reports/report-pdf";

export const dynamic = "force-dynamic";

/**
 * GET /app/{org}/reports/{id}/pdf (REP-03): the report as a PDF, rendered on
 * the server from the frozen payload. The same visibility rules as the page:
 * clients only ever receive final versions.
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ org: string; id: string }> }) {
  const { org: slug, id } = await context.params;
  const ctx = await requireOrgAccess(slug, "reports.view");
  const report = await getReport(ctx.org.id, id, ctx.role);
  if (!report) return new NextResponse("Not found", { status: 404 });
  const pdf = renderPdf(
    weeklyReportBlocks({ orgName: report.org.name, payload: report.payload, narrative: report.narrative, status: report.status, version: report.version, finalisedAt: report.finalisedAt, currency: report.org.currency }),
    { title: `${report.org.name} weekly report, ${report.payload.periodLabel}`, footer: `${report.org.name} · ${report.payload.periodLabel} · v${report.version}${report.status === "final" ? "" : " DRAFT"}` },
  );
  const name = `${slug}-report-${report.periodStart.toISOString().slice(0, 10)}-v${report.version}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${name}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
  });
}
