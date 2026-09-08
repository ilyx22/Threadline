import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Gauge, Minus } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { proofView } from "@/lib/data/proof";
import { PROOF_METRICS, formatMetricValue, type ProofComparison } from "@/lib/domain/proof";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/dates";
import { LockPeriodButton, PeriodEditor } from "./proof-editor";

export const metadata: Metadata = { title: "Proof" };

/**
 * Baseline versus month comparison.
 *
 * The language rules from `src/lib/domain/proof.ts` are enforced in the copy
 * here: changes are *associated with* the engagement, commercial figures are
 * *attributed where trackable*, and nothing on this page claims Threadline
 * caused a number to move.
 */
export default async function ProofPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "proof.view");
  const view = await proofView(ctx.org.id);
  const canEdit = ctx.can("proof.edit");
  const currency = ctx.org.currency;

  const latest = view.months[view.months.length - 1] ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Proof</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            How the operation ran before Threadline, and how it has run each month since. Figures
            the platform can observe are recomputed from this workspace every time you open this
            page; figures only you can know are shown as reported.
          </p>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!view.baseline ? (
              <PeriodEditor slug={slug} kind="baseline" trigger="Record the baseline" />
            ) : null}
            <PeriodEditor slug={slug} kind="period" trigger="Record a period" />
          </div>
        ) : null}
      </header>

      {!view.baseline ? (
        <EmptyState
          icon={Gauge}
          title="No baseline recorded"
          description="Without a baseline there is nothing to compare against, and any later claim about improvement would be unfounded. The baseline is what the founder reports about how content ran before the engagement — nothing before Threadline is observable from inside the product, so it can only be reported, and it is labelled that way everywhere it appears."
          action={
            canEdit ? <PeriodEditor slug={slug} kind="baseline" trigger="Record the baseline" /> : undefined
          }
        />
      ) : (
        <>
          <Notice tone="neutral" title="How to read this">
            {view.disclosure}
          </Notice>

          {latest && latest.verdict ? (
            <Card>
              <CardBody className="pt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-eyebrow text-faint">{latest.record.label}</p>
                  <span className="text-[11.5px] text-ghost">
                    {formatDate(latest.record.periodStart)} – {formatDate(latest.record.periodEnd)}
                  </span>
                </div>
                <p className="mt-3 text-[16px] leading-relaxed text-ink">
                  {latest.verdict.headline}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-ghost">
                  <span className="text-positive">{latest.verdict.favourable} improved</span>
                  <span className="text-negative">{latest.verdict.unfavourable} went the other way</span>
                  <span>{latest.verdict.unchanged} unchanged</span>
                  <span>{latest.verdict.missing} not recorded</span>
                </div>
                {latest.record.qualitativeNotes ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-eyebrow text-faint">Notable this month</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {latest.record.qualitativeNotes}
                    </p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          {/* ------------------------- The comparison table ------------------------ */}
          <section className="space-y-3">
            <h2 className="text-[15px] font-medium text-ink">Baseline and each month</h2>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH className="min-w-[13rem]">Measure</TH>
                    <TH className="min-w-[7rem]">Baseline</TH>
                    {view.months.map((month) => (
                      <TH key={month.record.id} className="min-w-[9rem]">
                        {month.record.label}
                      </TH>
                    ))}
                  </TR>
                </THead>
                <TBody>
                  {PROOF_METRICS.map((metric) => (
                    <TR key={metric.key}>
                      <TD>
                        <p className="text-[13px] font-medium text-ink">{metric.label}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-ghost">
                          {metric.definition}
                        </p>
                      </TD>
                      <TD>
                        <span className="tabular text-[13px] text-muted">
                          {formatMetricValue(
                            view.baseline?.figures[metric.key].value ?? null,
                            metric.format,
                            currency,
                          )}
                        </span>
                        <p className="mt-0.5 text-[10.5px] text-ghost">Reported</p>
                      </TD>
                      {view.months.map((month) => {
                        const figure = month.figures[metric.key];
                        const comparison = month.comparisons.find(
                          (c) => c.metric.key === metric.key,
                        );
                        return (
                          <TD key={month.record.id}>
                            <div className="flex items-baseline gap-1.5">
                              <span className="tabular text-[13px] text-ink">
                                {formatMetricValue(figure.value, metric.format, currency)}
                              </span>
                              {comparison ? <DeltaMark comparison={comparison} /> : null}
                            </div>
                            <p className="mt-0.5 text-[10.5px] text-ghost">
                              {figure.observed ? "Measured" : "Reported"}
                            </p>
                          </TD>
                        );
                      })}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </section>

          {/* ------------------------ Per-month, in sentences ---------------------- */}
          {view.months.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-medium text-ink">Month by month</h2>
              {view.months
                .slice()
                .reverse()
                .map((month) => (
                  <Card key={month.record.id}>
                    <CardBody className="pt-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-medium text-ink">{month.record.label}</p>
                          <p className="mt-0.5 text-[11.5px] text-ghost">
                            {formatDate(month.record.periodStart)} –{" "}
                            {formatDate(month.record.periodEnd)}
                            {month.record.recordedBy
                              ? ` · recorded by ${month.record.recordedBy.name}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {month.record.lockedAt ? (
                            <Badge tone="outline">Locked</Badge>
                          ) : canEdit ? (
                            <>
                              <PeriodEditor
                                slug={slug}
                                kind="period"
                                trigger="Edit"
                                period={serialisePeriod(month.record)}
                              />
                              <LockPeriodButton slug={slug} periodId={month.record.id} />
                            </>
                          ) : null}
                        </div>
                      </div>

                      <ul className="mt-4 space-y-2">
                        {month.comparisons
                          .filter((c) => c.delta !== null && c.delta !== 0)
                          .map((c) => (
                            <li key={c.metric.key} className="flex gap-2.5 text-[12.5px]">
                              <DeltaMark comparison={c} />
                              <div className="min-w-0">
                                <span className="text-ink">{c.metric.label}: </span>
                                <span className="text-muted">{c.statement}</span>
                                {c.metric.caveat ? (
                                  <span className="text-ghost"> {c.metric.caveat}</span>
                                ) : null}
                              </div>
                            </li>
                          ))}
                      </ul>

                      {month.record.attributionNote ? (
                        <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-relaxed text-faint">
                          <span className="text-ghost">How attribution was established: </span>
                          {month.record.attributionNote}
                        </p>
                      ) : null}
                    </CardBody>
                  </Card>
                ))}
            </section>
          ) : (
            <Notice tone="info" title="No months recorded yet">
              Record the first month once it closes. Everything the platform can observe is filled
              in for you; you only supply the figures it cannot see.
            </Notice>
          )}

          {view.baseline && canEdit ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-medium text-ink">Baseline</h2>
              <Card>
                <CardBody className="pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium text-ink">{view.baseline.record.label}</p>
                      <p className="mt-0.5 text-[11.5px] text-ghost">
                        {formatDate(view.baseline.record.periodStart)} –{" "}
                        {formatDate(view.baseline.record.periodEnd)} · every figure reported by the
                        client
                      </p>
                      {view.baseline.record.qualitativeNotes ? (
                        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                          {view.baseline.record.qualitativeNotes}
                        </p>
                      ) : null}
                    </div>
                    {view.baseline.record.lockedAt ? (
                      <Badge tone="outline">Locked</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PeriodEditor
                          slug={slug}
                          kind="baseline"
                          trigger="Edit"
                          period={serialisePeriod(view.baseline.record)}
                        />
                        <LockPeriodButton slug={slug} periodId={view.baseline.record.id} />
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function DeltaMark({ comparison }: { comparison: ProofComparison }) {
  if (comparison.delta === null || comparison.favourable === null) {
    return <Minus className="mt-1 size-3 shrink-0 text-ghost" aria-hidden />;
  }
  const Icon = comparison.delta > 0 ? ArrowUp : ArrowDown;
  return (
    <Icon
      className={`mt-1 size-3 shrink-0 ${comparison.favourable ? "text-positive" : "text-negative"}`}
      aria-hidden
    />
  );
}

type PeriodRecord = {
  id: string;
  kind: string;
  label: string;
  periodStart: Date;
  periodEnd: Date;
  reportedFounderHours: number | null;
  reportedContentOutput: number | null;
  reportedCycleTimeDays: number | null;
  reportedApprovalDays: number | null;
  reportedAudienceSize: number | null;
  reportedEngagementRate: number | null;
  reportedQualifiedInquiries: number | null;
  reportedCallsBooked: number | null;
  reportedAttributableValueMinor: number | null;
  attributionNote: string | null;
  qualitativeNotes: string | null;
};

function serialisePeriod(record: PeriodRecord) {
  const num = (value: number | null) => (value === null ? "" : String(value));
  return {
    id: record.id,
    label: record.label,
    periodStart: record.periodStart.toISOString().slice(0, 10),
    periodEnd: record.periodEnd.toISOString().slice(0, 10),
    reportedFounderHours: num(record.reportedFounderHours),
    reportedContentOutput: num(record.reportedContentOutput),
    reportedCycleTimeDays: num(record.reportedCycleTimeDays),
    reportedApprovalDays: num(record.reportedApprovalDays),
    reportedAudienceSize: num(record.reportedAudienceSize),
    reportedEngagementRate: num(record.reportedEngagementRate),
    reportedQualifiedInquiries: num(record.reportedQualifiedInquiries),
    reportedCallsBooked: num(record.reportedCallsBooked),
    reportedAttributableValue:
      record.reportedAttributableValueMinor === null
        ? ""
        : String(record.reportedAttributableValueMinor / 100),
    attributionNote: record.attributionNote ?? "",
    qualitativeNotes: record.qualitativeNotes ?? "",
  };
}
