import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Lightbulb, Mic, Target, TrendingUp } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { getReport } from "@/lib/data/reports";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/tabs";
import { Wordmark } from "@/components/brand/logo";
import { compactNumber, hours, minutes, money, percent } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { ReportDetailActions } from "../report-actions";

export const metadata: Metadata = { title: "Weekly report" };

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "reports.view");
  const report = await getReport(ctx.org.id, id);
  if (!report) notFound();

  const p = report.payload;
  const currency = report.org.currency;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="no-print">
        <Breadcrumbs
          items={[
            { label: "Reports", href: `/app/${slug}/reports` },
            { label: p.periodLabel || formatDate(report.periodStart) },
          ]}
        />
      </div>

      {/* ---------------------------------- Header --------------------------------- */}
      <header className="print-surface flex flex-col gap-4 rounded-xl border border-line bg-elevated p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-4">
            <Wordmark size="sm" />
          </div>
          <p className="text-eyebrow text-faint">Weekly report · {report.org.name}</p>
          <h1 className="mt-2 text-hero print-ink">{p.periodLabel}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={report.status === "final" ? "positive" : "outline"}>
              {report.status === "final" ? "Final" : "Draft"}
            </Badge>
            <span className="text-[12px] text-faint print-muted">
              Generated {formatDate(report.generatedAt)}
              {report.generatedBy ? ` by ${report.generatedBy.name}` : ""}
            </span>
          </div>
        </div>
        <ReportDetailActions
          slug={slug}
          reportId={report.id}
          status={report.status}
          canManage={ctx.can("reports.generate")}
        />
      </header>

      {/* ----------------------------- Executive summary --------------------------- */}
      {report.narrative ? (
        <Card className="print-surface print-break border-accent-line">
          <CardHeader title="Executive summary" eyebrow="Section 01" />
          <CardBody className="pt-0">
            <p className="text-[15px] leading-relaxed text-ink print-ink">{report.narrative}</p>
            {p.isDemoNarrative ? (
              <p className="mt-3 text-[11.5px] text-ghost print-muted">
                Composed in demo mode from the figures below. The numbers themselves are computed
                from records, not generated.
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {/* --------------------------------- Shipped --------------------------------- */}
      <Card className="print-surface print-break">
        <CardHeader
          title="Shipped"
          eyebrow="Section 02"
          action={
            <span className="text-[12px] text-faint print-muted">
              Target {p.shipped.target}
            </span>
          }
        />
        <CardBody className="pt-0">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <p className="text-[34px] font-medium leading-none tabular text-accent">
              {p.shipped.count}
            </p>
            <span className="text-[13px] text-muted print-muted">
              {p.shipped.count >= p.shipped.target
                ? "at or above target"
                : `${p.shipped.target - p.shipped.count} below target`}
            </span>
            {p.performance.publishedDelta != null ? (
              <span
                className={
                  p.performance.publishedDelta >= 0
                    ? "text-[13px] text-positive"
                    : "text-[13px] text-negative"
                }
              >
                {p.performance.publishedDelta > 0 ? "+" : ""}
                {p.performance.publishedDelta}% vs previous week
              </span>
            ) : null}
          </div>

          {p.shipped.byPlatform.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.shipped.byPlatform.map((row) => (
                <span
                  key={row.platform}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-muted print-surface"
                >
                  {row.platform.replace(/_/g, " ")}
                  <span className="tabular text-ink print-ink">{row.count}</span>
                </span>
              ))}
            </div>
          ) : null}

          {p.shipped.titles.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {p.shipped.titles.map((title) => (
                <li key={title.id} className="flex items-center gap-3 py-2">
                  <Link
                    href={`/app/${slug}/production/${title.id}`}
                    className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent print-ink"
                  >
                    {title.title}
                  </Link>
                  <span className="shrink-0 text-[11.5px] text-ghost print-muted">
                    {title.platform.replace(/_/g, " ")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-faint print-muted">Nothing published this week.</p>
          )}
        </CardBody>
      </Card>

      {/* -------------------------------- Performance ------------------------------ */}
      <Card className="print-surface print-break">
        <CardHeader title="Performance" eyebrow="Section 03" />
        <CardBody className="pt-0">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Views"
              value={compactNumber(p.performance.views)}
              delta={p.performance.viewsDelta}
              emphasis
            />
            <Metric label="Impressions" value={compactNumber(p.performance.impressions)} />
            <Metric label="Engagements" value={compactNumber(p.performance.engagements)} />
            <Metric
              label="Avg retention"
              value={p.performance.avgRetention > 0 ? percent(p.performance.avgRetention, 1) : "—"}
            />
          </div>
        </CardBody>
      </Card>

      {/* ----------------------------------- Wins ---------------------------------- */}
      <Card className="print-surface print-break">
        <CardHeader title="Wins" eyebrow="Section 04" />
        <CardBody className="pt-0">
          {p.wins.length === 0 ? (
            <p className="text-[13px] text-faint print-muted">
              Nothing rose above the median this week.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {p.wins.map((win, i) => (
                <li key={i} className="flex gap-3">
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-ink print-ink">
                      {win.contentItemId ? (
                        <Link
                          href={`/app/${slug}/production/${win.contentItemId}`}
                          className="transition-colors hover:text-accent"
                        >
                          {win.title}
                        </Link>
                      ) : (
                        win.title
                      )}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted print-muted">
                      {win.detail}
                      {win.metric ? ` · ${win.metric}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---------------------------------- Misses --------------------------------- */}
      <Card className="print-surface print-break">
        <CardHeader title="Misses" eyebrow="Section 05" />
        <CardBody className="pt-0">
          {p.misses.length === 0 ? (
            <p className="text-[13px] text-faint print-muted">
              Nothing significant went wrong this week.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {p.misses.map((miss, i) => (
                <li key={i} className="flex gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-ink print-ink">{miss.title}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted print-muted">{miss.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* --------------------------------- Learnings ------------------------------- */}
      <Card className="print-surface print-break">
        <CardHeader title="Learnings" eyebrow="Section 06" />
        <CardBody className="pt-0">
          {p.learnings.length === 0 ? (
            <p className="text-[13px] text-faint print-muted">
              Not enough evidence to draw a conclusion this week.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {p.learnings.map((learning, i) => (
                <li key={i} className="flex gap-3">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium text-ink print-ink">
                        {learning.title}
                      </p>
                      <Badge tone="outline">{learning.confidence}% confidence</Badge>
                    </div>
                    {learning.detail ? (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted print-muted">
                        {learning.detail}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* --------------------------------- Next week ------------------------------- */}
      <Card className="print-surface print-break">
        <CardHeader title="Next week" eyebrow="Section 07" />
        <CardBody className="space-y-5 pt-0">
          {p.nextWeek.priorities.length > 0 ? (
            <div>
              <p className="text-eyebrow mb-2 text-faint">Priorities</p>
              <ul className="space-y-1.5">
                {p.nextWeek.priorities.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-muted print-muted">
                    <Target className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {p.nextWeek.tests.length > 0 ? (
            <div>
              <p className="text-eyebrow mb-2 text-faint">Tests</p>
              <ul className="space-y-1.5">
                {p.nextWeek.tests.map((test, i) => (
                  <li key={i} className="text-[13px] leading-relaxed text-muted print-muted">
                    {test}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {p.nextWeek.recordingPlan.length > 0 ? (
            <div>
              <p className="text-eyebrow mb-2 text-faint">
                Recording plan · {minutes(p.nextWeek.recordingMinutes)}
              </p>
              <ul className="divide-y divide-line">
                {p.nextWeek.recordingPlan.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-2">
                    <Mic className="size-3.5 shrink-0 text-faint" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink print-ink">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[11.5px] tabular text-ghost print-muted">
                      ~{item.estimateMin} min
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* ------------------------------ Client actions ----------------------------- */}
      <Card className="print-surface print-break border-accent-line">
        <CardHeader
          title="What needs you"
          eyebrow="Section 08"
          description="Everything else is handled."
        />
        <CardBody className="pt-0">
          {p.clientActions.length === 0 ? (
            <p className="flex items-center gap-2 text-[13px] text-positive">
              <CheckCircle2 className="size-4" aria-hidden />
              Nothing. The queue is clear.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {p.clientActions.map((action, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Badge tone="accent">{action.kind}</Badge>
                  <span className="min-w-0 flex-1 text-[13px] text-ink print-ink">
                    {action.title}
                  </span>
                  <span className="shrink-0 text-[12px] tabular text-faint print-muted">
                    ~{minutes(action.estimateMin)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* --------------------------- Operating + commercial ------------------------ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="print-surface print-break">
          <CardHeader title="Operating metrics" eyebrow="Section 09" />
          <CardBody className="pt-0">
            <dl className="grid grid-cols-2 gap-4">
              <Metric label="Founder time" value={hours(p.operating.founderHours)} />
              <Metric
                label="Time released"
                value={hours(p.operating.hoursSaved)}
                emphasis={p.operating.hoursSaved > 0}
              />
              <Metric
                label="Cycle time"
                value={p.operating.cycleTimeHours > 0 ? `${Math.round(p.operating.cycleTimeHours)}h` : "—"}
              />
              <Metric
                label="Approval turnaround"
                value={p.operating.approvalHours > 0 ? `${p.operating.approvalHours.toFixed(1)}h` : "—"}
              />
            </dl>
            {p.operating.bottleneck ? (
              <p className="mt-4 border-t border-line pt-3 text-[12.5px] text-muted print-muted">
                Constraint this week:{" "}
                <span className="capitalize text-ink print-ink">{p.operating.bottleneck}</span>
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card className="print-surface print-break">
          <CardHeader title="Commercial signal" eyebrow="Section 10" />
          <CardBody className="pt-0">
            <dl className="grid grid-cols-2 gap-4">
              <Metric label="Inquiries" value={String(p.commercial.inquiries)} />
              <Metric label="Qualified" value={String(p.commercial.qualified)} />
              <Metric
                label="Calls booked"
                value={String(p.commercial.callsBooked)}
                emphasis={p.commercial.callsBooked > 0}
              />
              <Metric
                label="Closed value"
                value={
                  p.commercial.valueMinor > 0
                    ? money(p.commercial.valueMinor, currency, { compact: true })
                    : "—"
                }
              />
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[12px] text-ghost print-muted">
              {p.commercial.attributedToContent} of {p.commercial.inquiries} inquiries were
              attributed to a specific published piece.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* ------------------------------- Attribution ------------------------------ */}
      {/*
        What the commercial figures above are entitled to claim. Kept as its own
        section rather than a footnote, because the difference between "produced
        by this content" and "happened during the same period" is the difference
        between a report and a sales document.
      */}
      <Card className="print-block">
        <CardHeader title="How strongly this is evidenced" eyebrow="Section 11" />
        <CardBody className="space-y-3">
          {p.attribution.claims.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-muted">
              No commercial signals were recorded against content this period.
              {p.attribution.trackedClicks > 0
                ? ` ${p.attribution.trackedClicks} tracked ${p.attribution.trackedClicks === 1 ? "click was" : "clicks were"} recorded, so the measurement is working; what has not happened yet is anything downstream of them.`
                : ""}
            </p>
          ) : (
            <ul className="space-y-2">
              {p.attribution.claims.map((claim) => (
                <li key={claim.evidence} className="text-[13px] leading-relaxed text-ink">
                  {claim.sentence}
                </li>
              ))}
            </ul>
          )}

          {!p.attribution.monetaryAllowed && p.attribution.claims.length > 0 ? (
            <p className="text-[12px] leading-relaxed text-muted">
              Revenue per asset is not shown for this period: too few of the commercial events are
              traceable to content for the figure to mean anything.
            </p>
          ) : null}

          <p className="border-t border-line pt-3 text-[12px] text-ghost print-muted">
            {p.attribution.dataQualityNote} Missing tracking is missing data, not zero commercial
            value.
          </p>
        </CardBody>
      </Card>

      <p className="pb-4 text-center text-[11px] text-ghost print-muted">
        Generated by Threadline from {report.org.name}&apos;s own records. Figures are frozen at
        generation time.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  delta,
  emphasis,
}: {
  label: string;
  value: string;
  delta?: number | null;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="text-eyebrow text-faint print-muted">{label}</dt>
      <dd
        className={
          emphasis
            ? "mt-1.5 text-[22px] font-medium leading-none tabular text-accent"
            : "mt-1.5 text-[22px] font-medium leading-none tabular text-ink print-ink"
        }
      >
        {value}
        {delta != null ? (
          <span
            className={
              delta >= 0
                ? "ml-2 text-[12px] font-normal text-positive"
                : "ml-2 text-[12px] font-normal text-negative"
            }
          >
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        ) : null}
      </dd>
    </div>
  );
}
