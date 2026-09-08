import type { Metadata } from "next";
import { requireInternal } from "@/lib/auth/guard";
import { internalMetrics, portfolioSummary } from "@/lib/data/admin";
import { parseNumberRecord } from "@/lib/db/json";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/data";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/feedback";
import { AreaTrend, HorizontalRank } from "@/components/charts";
import { money, percent } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { MetricEntryButton } from "./metrics-client";
import { FunnelPanel } from "./funnel-panel";

export const metadata: Metadata = { title: "Business metrics" };

export default async function MetricsPage() {
  await requireInternal("admin.metrics");

  const [metrics, portfolio] = await Promise.all([internalMetrics(12), portfolioSummary()]);
  const ordered = [...metrics].reverse();

  const latest = metrics[0];
  const leadSources = latest ? parseNumberRecord(latest.leadsBySource) : {};

  const totals = metrics.reduce(
    (acc, m) => ({
      cash: acc.cash + m.cashCollectedMinor,
      calls: acc.calls + m.salesCalls,
      implementation: acc.implementation + m.implementationHours,
      support: acc.support + m.supportHours,
    }),
    { cash: 0, calls: 0, implementation: 0, support: 0 },
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Business metrics</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Threadline&apos;s own numbers, not a client&apos;s. Entered monthly — the point is to see
            whether delivery hours per client are falling as the product absorbs more of the work.
          </p>
        </div>
        <MetricEntryButton />
      </header>

      {/*
        Funnel maths from Threadline's own recorded rates. Channel-agnostic:
        which channel delivers a first touch is an operating choice, and the
        formula is the same either way.
      */}
      <FunnelPanel
        firstTouches={Object.values(leadSources).reduce((a, b) => a + b, 0)}
        callsBooked={latest?.salesCalls ?? 0}
        showRatePct={latest?.showRatePct ?? 0}
        closeRatePct={latest?.closeRatePct ?? 0}
        periodLabel={latest ? formatDate(latest.periodStart) : "No period recorded"}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recurring per period"
          value={money(portfolio.recurringPerPeriodMinor, "GBP", { compact: true })}
          sublabel={`${portfolio.activeClients} active clients`}
          emphasis
        />
        <StatCard
          label="Cash collected"
          value={money(totals.cash, "GBP", { compact: true })}
          sublabel={`across ${metrics.length} recorded months`}
        />
        <StatCard label="Sales calls" value={totals.calls} sublabel="recorded" />
        <StatCard
          label="Delivery hours"
          value={`${(totals.implementation + totals.support).toFixed(0)}h`}
          sublabel={`${totals.implementation.toFixed(0)}h build · ${totals.support.toFixed(0)}h support`}
        />
      </section>

      {metrics.length === 0 ? (
        <EmptyState
          title="No metrics recorded"
          description="Record a month to start tracking lead sources, conversion and delivery cost per client."
          action={<MetricEntryButton />}
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Cash collected" eyebrow="By month" />
              <CardBody className="pt-1">
                <AreaTrend
                  data={ordered.map((m) => ({
                    label: new Date(m.periodStart).toLocaleDateString("en-GB", { month: "short" }),
                    value: m.cashCollectedMinor / 100,
                  }))}
                  tone="accent"
                  height={200}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Lead sources" eyebrow="Most recent month" />
              <CardBody className="pt-0">
                <HorizontalRank
                  data={Object.entries(leadSources).map(([label, value]) => ({
                    label: label.replace(/_/g, " "),
                    value,
                  }))}
                  format="number"
                  emptyMessage="No lead sources recorded for the latest month."
                />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Monthly detail" eyebrow="Recorded" />
            <Table containerClassName="border-0 rounded-none">
              <THead>
                <TR>
                  <TH>Month</TH>
                  <TH align="right">Calls</TH>
                  <TH align="right">Show rate</TH>
                  <TH align="right">Close rate</TH>
                  <TH align="right">Cash</TH>
                  <TH align="right">Setup fees</TH>
                  <TH align="right">MRR</TH>
                  <TH align="right">Build hrs</TH>
                  <TH align="right">Support hrs</TH>
                </TR>
              </THead>
              <TBody>
                {metrics.map((m) => (
                  <TR key={m.id}>
                    <TD>{formatDate(m.periodStart, "medium")}</TD>
                    <TD align="right" className="tabular">
                      {m.salesCalls}
                    </TD>
                    <TD align="right" className="tabular">
                      {percent(m.showRatePct, 1)}
                    </TD>
                    <TD align="right" className="tabular">
                      {percent(m.closeRatePct, 1)}
                    </TD>
                    <TD align="right" className="tabular">
                      {money(m.cashCollectedMinor, "GBP", { compact: true })}
                    </TD>
                    <TD align="right" className="tabular">
                      {money(m.setupFeesMinor, "GBP", { compact: true })}
                    </TD>
                    <TD align="right" className="tabular">
                      {money(m.mrrMinor, "GBP", { compact: true })}
                    </TD>
                    <TD align="right" className="tabular">
                      {m.implementationHours.toFixed(0)}
                    </TD>
                    <TD align="right" className="tabular">
                      {m.supportHours.toFixed(0)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
