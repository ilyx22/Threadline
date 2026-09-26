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
import { OpenReviewButton } from "./open-review-button";
import { prisma } from "@/lib/db/client";
import { seesOperatorSurface } from "@/lib/domain/visibility";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "reports.view");
  const reports = await listReports(ctx.org.id, ctx.role);
  // REP-02: four-week reviews. Clients see the latest final version of each;
  // staff see every period that has started, with its review state.
  const staff = seesOperatorSurface(ctx.role);
  const engagement = await prisma.engagement.findFirst({ where: { orgId: ctx.org.id, status: { not: "draft" } }, orderBy: { createdAt: "desc" }, include: { periods: { orderBy: { number: "asc" } } } });
  const reviews = engagement ? await prisma.periodReview.findMany({ where: { engagementId: engagement.id, ...(staff ? {} : { status: "final", supersededAt: null }) }, orderBy: [{ periodNumber: "asc" }, { version: "desc" }] }) : [];
  const latestReview = (n: number) => reviews.find((r) => r.periodNumber === n);
  const periodsShown = engagement ? engagement.periods.filter((p) => (staff ? p.status === "current" || p.status === "complete" : Boolean(latestReview(p.number)))) : [];

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

      {periodsShown.length ? (
        <section className="space-y-2">
          <h2 className="text-[15px] font-medium text-ink">Four-week reviews</h2>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {periodsShown.map((p) => {
              const r = latestReview(p.number);
              return (
                <li key={p.number} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[13.5px] text-ink">Period {p.number}</p>
                    <p className="text-[12px] text-ghost">
                      {p.startDate.toISOString().slice(0, 10)} to {new Date(p.endDate.getTime() - 86_400_000).toISOString().slice(0, 10)} · {p.status}
                    </p>
                  </div>
                  {r ? (
                    <Link href={`/app/${slug}/reports/reviews/${r.id}`} className="text-[13px] text-accent hover:text-accent-bright">
                      {r.status === "final" ? "Read the review" : "Continue the draft"}
                    </Link>
                  ) : staff && ctx.can("reports.finalise") ? (
                    <OpenReviewButton slug={slug} periodNumber={p.number} />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

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
