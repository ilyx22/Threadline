import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Eye, MessageSquare, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import {
  breakdowns,
  classifyAssets,
  comparedPerformance,
  deriveInsights,
  lastNDays,
  operatingSnapshot,
  pipelineSummary,
  publishedAssets,
  topPerformers,
  underPerformers,
  viewsTrend,
} from "@/lib/data/metrics";
import { listPublishRecords } from "@/lib/data/distribution";
import { isLiveAi } from "@/lib/ai";
import { readNumber, type RawSearchParams } from "@/lib/utils/search-params";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { clientAttributionSummary } from "@/lib/data/attribution";
import { ATTRIBUTION_CLASS_META, metaOf } from "@/lib/domain/enums";
import { StatCard } from "@/components/ui/data";
import { EmptyState } from "@/components/ui/feedback";
import { AreaTrend, DonutSplit, HorizontalRank } from "@/components/charts";
import { compactNumber, money, percent } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { PerformanceControls } from "./performance-controls";

export const metadata: Metadata = { title: "Performance" };

export default async function PerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "performance.view");

  const days = readNumber(query, "days", 30);
  const range = lastNDays(days);

  const [assets, compared, operating, pipeline, publishRecords, attribution] = await Promise.all([
    publishedAssets(ctx.org.id, range),
    comparedPerformance(ctx.org.id, range),
    operatingSnapshot(ctx.org.id, range),
    pipelineSummary(ctx.org.id, range),
    listPublishRecords(ctx.org.id, { status: ["published"] }),
    clientAttributionSummary(ctx.org.id, range, (minor) => money(minor, ctx.org.currency)),
  ]);

  const b = breakdowns(assets);
  const classified = classifyAssets(assets);
  const winners = topPerformers(assets, 5);
  const losers = underPerformers(assets, 5);
  const trend = viewsTrend(assets, range, 14);
  const insights = deriveInsights({ assets, breakdowns: b, operating, pipeline });

  if (assets.length === 0) {
    return (
      <div className="space-y-6">
        <header className="max-w-2xl">
          <h1 className="text-section">Performance</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            What worked, why, and what it produced commercially.
          </p>
        </header>
        <EmptyState
          icon={BarChart3}
          title="No published content in this period"
          description="Performance is recorded per published asset. Mark content live in Distribution with its URL, then enter the figures here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Performance</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            What worked, broken down by the things you can actually change: topic, format, hook
            structure and CTA. Learnings from here write back into Signals and shape the next cycle.
          </p>
        </div>
        <PerformanceControls
          slug={slug}
          days={days}
          isLive={isLiveAi()}
          canEdit={ctx.can("performance.edit")}
          canDerive={ctx.can("signals.edit")}
          records={publishRecords.map((r) => ({
            id: r.id,
            title: r.contentItem.title,
            platform: r.platform,
            publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
          }))}
        />
      </header>

      {/* -------------------------------- Headline -------------------------------- */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Views"
          value={compactNumber(compared.views)}
          delta={compared.deltas.views}
          deltaLabel={`vs previous ${days} days`}
          icon={Eye}
          emphasis
        />
        <StatCard
          label="Published"
          value={compared.published}
          delta={compared.deltas.published}
          icon={Target}
        />
        <StatCard
          label="Engagements"
          value={compactNumber(compared.engagements)}
          delta={compared.deltas.engagements}
          sublabel={`${percent(compared.avgEngagementRate, 1)} rate`}
          icon={MessageSquare}
        />
        <StatCard
          label="Qualified inquiries"
          value={pipeline.qualified}
          sublabel={`${pipeline.callsBooked} calls booked`}
          icon={Users}
          href={`/app/${slug}/pipeline`}
        />
      </section>

      <Card>
        <CardHeader
          title="Views over time"
          eyebrow={`Last ${days} days`}
          action={
            compared.avgRetention > 0 ? (
              <span className="text-[12px] text-faint">
                {percent(compared.avgRetention, 1)} average retention
              </span>
            ) : null
          }
        />
        <CardBody className="pt-1">
          <AreaTrend
            data={trend.map((t) => ({ label: t.label, value: t.views }))}
            tone="accent"
            height={220}
          />
        </CardBody>
      </Card>

      {/* ------------------------------ What it produced -------------------------- */}
      {/*
        Grouped by how well each figure is evidenced, never summed into one
        number. "Pipeline that is directly tracked to content" and "pipeline
        that moved during the period" are different claims, and only one of them
        is usually true — collapsing them is the single most tempting dishonesty
        available to a reporting screen.
      */}
      <section>
        <SectionHeading
          title="What the content produced"
          description="Every figure carries how strongly it is actually connected to the content, because that is the part that decides what it means."
        />

        {attribution.claims.length === 0 ? (
          <Card>
            <CardBody className="py-6">
              <p className="text-[13px] leading-relaxed text-muted">
                No commercial signals have been recorded for this period yet.{" "}
                {attribution.clicks > 0
                  ? `${attribution.clicks} tracked ${attribution.clicks === 1 ? "click" : "clicks"} were recorded, so the measurement is working — what has not happened yet is anything downstream of them.`
                  : "Nothing has been measured yet, which is not the same as nothing having happened."}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-faint">{attribution.measurement}</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {attribution.claims.map((claim) => {
                const meta = metaOf(ATTRIBUTION_CLASS_META, claim.evidence);
                return (
                  <div
                    key={claim.evidence}
                    className="rounded-lg border border-line bg-elevated px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <span className="text-[11.5px] text-faint">
                        {claim.events} {claim.events === 1 ? "event" : "events"}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink">{claim.sentence}</p>
                  </div>
                );
              })}
            </div>

            {attribution.topAssets.length > 0 ? (
              <Card>
                <CardHeader
                  title="Worth repeating"
                  description="The assets that produced those signals. Credit split evenly across everything a buyer touched."
                />
                <CardBody className="space-y-1.5">
                  {attribution.topAssets.map((asset) => (
                    <div
                      key={asset.contentItemId}
                      className="flex items-center justify-between gap-3 text-[12.5px]"
                    >
                      <span className="min-w-0 truncate text-ink">{asset.title}</span>
                      <Badge tone={metaOf(ATTRIBUTION_CLASS_META, asset.evidence).tone}>
                        {metaOf(ATTRIBUTION_CLASS_META, asset.evidence).label}
                      </Badge>
                    </div>
                  ))}
                </CardBody>
              </Card>
            ) : null}

            <p className="text-[12px] leading-relaxed text-faint">{attribution.measurement}</p>
          </div>
        )}
      </section>

      {/* ------------------------------- Breakdowns ------------------------------- */}
      <section>
        <SectionHeading
          title="What is working"
          description="Ranked by average views per piece, so a single viral outlier does not distort the read."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="By topic" eyebrow="Content pillar" />
            <CardBody className="pt-0">
              <HorizontalRank
                data={b.byTopic.map((t) => ({
                  label: t.label,
                  value: t.avgViews,
                  meta: `${t.count} ${t.count === 1 ? "piece" : "pieces"}`,
                }))}
                emptyMessage="Assign pillars to ideas to see this breakdown."
                limit={8}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="By hook structure"
              eyebrow="Opening"
              description="Hooks grouped by shape, since verbatim hooks never repeat."
            />
            <CardBody className="pt-0">
              <HorizontalRank
                data={b.byHookShape.map((h) => ({
                  label: h.label,
                  value: h.avgViews,
                  meta: `${h.count}`,
                }))}
                emptyMessage="No hooks recorded on published pieces yet."
                limit={8}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="By format" eyebrow="Production type" />
            <CardBody className="pt-0">
              <HorizontalRank
                data={b.byFormat.map((f) => ({
                  label: f.label.replace(/_/g, " "),
                  value: f.avgViews,
                  meta: `${f.count}`,
                }))}
                limit={8}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="By CTA"
              eyebrow="Commercial"
              description="Ranked by leads produced, not reach."
            />
            <CardBody className="pt-0">
              <HorizontalRank
                data={b.byCta.map((c) => ({
                  label: c.label,
                  value: c.leads,
                  meta: `${c.count} ${c.count === 1 ? "piece" : "pieces"}`,
                }))}
                format="leads"
                emptyMessage="No CTAs recorded against published content."
                limit={6}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="By platform" eyebrow="Distribution" />
            <CardBody className="pt-0">
              <DonutSplit
                data={b.byPlatform.map((p) => ({
                  label: p.label.replace(/_/g, " "),
                  value: p.count,
                }))}
                centerValue={String(assets.length)}
                centerLabel="published in period"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Verdict spread"
              eyebrow="Against the median"
              description="A winner reaches 1.6x the median; an underperformer falls below 0.55x."
            />
            <CardBody className="pt-0">
              <DonutSplit
                data={[
                  {
                    label: "Winners",
                    value: classified.filter((c) => c.verdict === "winner").length,
                  },
                  {
                    label: "Typical",
                    value: classified.filter((c) => c.verdict === "typical").length,
                  },
                  {
                    label: "Underperformers",
                    value: classified.filter((c) => c.verdict === "loser").length,
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* --------------------------- Winners and losers --------------------------- */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top performers" eyebrow="Winners" />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {winners.map((asset) => (
                <li key={asset.publishRecordId} className="flex items-center gap-3 py-3">
                  <TrendingUp className="size-3.5 shrink-0 text-positive" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/${slug}/production/${asset.contentItemId}`}
                      className="block truncate text-[13px] font-medium text-ink transition-colors hover:text-accent"
                    >
                      {asset.title}
                    </Link>
                    <p className="mt-0.5 text-[11.5px] text-faint">
                      {asset.platform.replace(/_/g, " ")} · {formatDate(asset.publishedAt, "short")}
                      {asset.ratio > 0 ? ` · ${asset.ratio}x median` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-medium tabular text-accent">
                      {compactNumber(asset.views)}
                    </p>
                    {asset.leads > 0 ? (
                      <p className="text-[11px] text-positive">{asset.leads} leads</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Underperformers"
            eyebrow="Worth reviewing"
            description="Usually a hook problem before it is a topic problem."
          />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {losers.map((asset) => (
                <li key={asset.publishRecordId} className="flex items-center gap-3 py-3">
                  <TrendingDown className="size-3.5 shrink-0 text-negative" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/${slug}/production/${asset.contentItemId}`}
                      className="block truncate text-[13px] font-medium text-ink transition-colors hover:text-accent"
                    >
                      {asset.title}
                    </Link>
                    <p className="mt-0.5 text-[11.5px] text-faint">
                      {asset.platform.replace(/_/g, " ")} · {formatDate(asset.publishedAt, "short")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-medium tabular text-muted">
                      {compactNumber(asset.views)}
                    </p>
                    {asset.verdict === "loser" ? (
                      <Badge tone="negative" className="mt-0.5">
                        {asset.ratio}x
                      </Badge>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      {/* --------------------------------- Learnings ------------------------------- */}
      <Card>
        <CardHeader
          title="What the data supports"
          eyebrow="Derived"
          description="Computed comparisons against your own records — not model output."
        />
        <CardBody className="pt-0">
          {insights.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-faint">
              Not enough published content in this period to support a conclusion. Widen the range
              or publish more before drawing one.
            </p>
          ) : (
            <ul className="space-y-3.5">
              {insights.map((insight) => (
                <li key={insight.id} className="flex gap-3">
                  <span
                    className={
                      insight.tone === "positive"
                        ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-positive"
                        : insight.tone === "negative"
                          ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-negative"
                          : "mt-1.5 size-1.5 shrink-0 rounded-full bg-faint"
                    }
                    aria-hidden
                  />
                  <div>
                    <p className="text-[13.5px] leading-relaxed text-ink">{insight.text}</p>
                    {insight.evidence ? (
                      <p className="mt-1 text-[12px] text-faint">{insight.evidence}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
