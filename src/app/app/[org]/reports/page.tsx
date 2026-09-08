import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { listReports } from "@/lib/data/reports";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { compactNumber } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { GenerateReportButton } from "./report-actions";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "reports.view");
  const reports = await listReports(ctx.org.id);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Reports</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            The weekly executive summary, computed from what actually happened. Every figure comes
            from stored records and is frozen when the report is generated — a report you read in
            three months will show the same numbers it showed the week it was written.
          </p>
        </div>
        {ctx.can("reports.generate") ? <GenerateReportButton slug={slug} /> : null}
      </header>

      {reports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Generate the first weekly report once there is a week of activity to summarise."
          action={ctx.can("reports.generate") ? <GenerateReportButton slug={slug} /> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report.id}>
              <Link href={`/app/${slug}/reports/${report.id}`}>
                <Card interactive>
                  <CardBody className="pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="text-eyebrow text-faint">Week of</p>
                        <h2 className="mt-1 text-[15px] font-medium text-ink">
                          {report.payload.periodLabel || formatDate(report.periodStart)}
                        </h2>
                      </div>
                      <Badge tone={report.status === "final" ? "positive" : "outline"}>
                        {report.status === "final" ? "Final" : "Draft"}
                      </Badge>
                    </div>

                    {report.narrative ? (
                      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">
                        {report.narrative}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px]">
                      <span className="text-muted">
                        <span className="tabular text-ink">{report.payload.shipped.count}</span>{" "}
                        shipped
                      </span>
                      <span className="text-muted">
                        <span className="tabular text-ink">
                          {compactNumber(report.payload.performance.views)}
                        </span>{" "}
                        views
                      </span>
                      <span className="text-muted">
                        <span className="tabular text-ink">
                          {report.payload.commercial.callsBooked}
                        </span>{" "}
                        calls
                      </span>
                      <span className="text-muted">
                        <span className="tabular text-ink">
                          {report.payload.operating.hoursSaved.toFixed(1)}h
                        </span>{" "}
                        released
                      </span>
                      <span className="ml-auto text-ghost">
                        {report.generatedBy ? `${report.generatedBy.name} · ` : ""}
                        {formatDate(report.generatedAt, "short")}
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
