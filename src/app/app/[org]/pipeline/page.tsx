import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import {
  attributableContent,
  contentAttribution,
  ctaPerformance,
  inquiryCounts,
  listInquiries,
} from "@/lib/data/pipeline";
import { lastNDays, pipelineSummary } from "@/lib/data/metrics";
import { INQUIRY_STAGES, INQUIRY_STAGE_META } from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { StatCard } from "@/components/ui/data";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StageFunnel } from "@/components/charts";
import { money } from "@/lib/utils/format";
import { PipelineTable, NewInquiryButton } from "./pipeline-client";
import { AttributionTable } from "./attribution-table";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "pipeline.view");

  const filters = {
    stage: readFilter(query, "stage"),
    source: readFilter(query, "source"),
    search: readSingle(query, "q"),
  };

  const [inquiries, counts, summary, attribution, ctas, content] = await Promise.all([
    listInquiries(ctx.org.id, filters),
    inquiryCounts(ctx.org.id),
    pipelineSummary(ctx.org.id, lastNDays(90)),
    contentAttribution(ctx.org.id),
    ctaPerformance(ctx.org.id),
    attributableContent(ctx.org.id),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const canEdit = ctx.can("pipeline.edit");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Pipeline</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Deliberately lightweight — this is not a CRM. It exists to answer one question: what
            content is actually creating qualified conversations?
          </p>
        </div>
        {canEdit ? <NewInquiryButton slug={slug} content={content.map((c) => ({ id: c.id, title: c.title }))} /> : null}
      </header>

      <Notice tone="neutral">
        Records are entered manually. CRM adapters exist but need credentials — see{" "}
        <a href={`/app/${slug}/settings/integrations`} className="text-accent hover:underline">
          Settings, Integrations
        </a>
        .
      </Notice>

      {total === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No pipeline records yet"
          description="When someone gets in touch after seeing a piece of content, log it here and link it to that piece. A handful of records is enough to see which topics produce conversations."
          action={
            canEdit ? (
              <NewInquiryButton slug={slug} content={content.map((c) => ({ id: c.id, title: c.title }))} />
            ) : undefined
          }
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Inquiries" value={summary.inquiries} sublabel="last 90 days" />
            <StatCard label="Qualified" value={summary.qualified} sublabel="fit the ICP" />
            <StatCard
              label="Calls booked"
              value={summary.callsBooked}
              sublabel={`${summary.attributedToContent} attributed to content`}
              emphasis
            />
            <StatCard
              label="Closed value"
              value={money(summary.valueMinor, ctx.org.currency, { compact: true })}
              sublabel={`${summary.won} won`}
            />
          </section>

          <Card>
            <CardHeader
              title="Conversion"
              eyebrow="Last 90 days"
              description="Percentages show the carry-through from the previous stage."
            />
            <CardBody className="pt-0">
              <StageFunnel
                stages={INQUIRY_STAGES.filter((s) => s !== "lost").map((stage) => ({
                  label: INQUIRY_STAGE_META[stage].label,
                  value:
                    stage === "inquiry"
                      ? summary.inquiries
                      : stage === "qualified"
                        ? summary.qualified
                        : stage === "call_booked"
                          ? summary.callsBooked
                          : summary.won,
                }))}
              />
            </CardBody>
          </Card>

          <section>
            <SectionHeading
              title="What content produced conversations"
              description="The whole point of this layer. Ranked by calls booked, not by reach."
            />
            <AttributionTable
              slug={slug}
              rows={attribution.map((row) => ({
                contentItemId: row.contentItemId,
                title: row.title,
                platform: row.platform,
                pillar: row.pillar,
                cta: row.cta,
                views: row.views,
                inquiries: row.inquiries,
                qualified: row.qualified,
                calls: row.calls,
                won: row.won,
                valueMinor: row.valueMinor,
              }))}
              currency={ctx.org.currency}
            />
          </section>

          {ctas.length > 0 ? (
            <Card>
              <CardHeader
                title="CTA performance"
                eyebrow="What actually converts"
                description="Which closing line produced the conversation."
              />
              <CardBody className="pt-0">
                <ul className="divide-y divide-line">
                  {ctas.map((cta) => (
                    <li key={cta.cta} className="flex items-center gap-4 py-3">
                      <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink">{cta.cta}</p>
                      <span className="shrink-0 text-[12px] tabular text-muted">
                        {cta.count} {cta.count === 1 ? "inquiry" : "inquiries"}
                      </span>
                      <span className="w-24 shrink-0 text-right text-[12px] tabular text-accent">
                        {cta.calls} {cta.calls === 1 ? "call" : "calls"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          <section className="space-y-3">
            <SectionHeading title="All records" />
            <FilterBar>
              <FilterSearch placeholder="Search by name or company" />
              <MultiFilter
                name="stage"
                label="Stage"
                options={INQUIRY_STAGES.map((s) => ({
                  value: s,
                  label: INQUIRY_STAGE_META[s].label,
                  count: counts[s] ?? 0,
                }))}
              />
              <MultiFilter
                name="source"
                label="Source"
                options={[
                  { value: "content", label: "Content" },
                  { value: "referral", label: "Referral" },
                  { value: "outbound", label: "Outbound" },
                  { value: "other", label: "Other" },
                ]}
              />
            </FilterBar>
            <ActiveFilters labels={{ stage: "Stage", source: "Source" }} />

            <PipelineTable
              slug={slug}
              canEdit={canEdit}
              currency={ctx.org.currency}
              content={content.map((c) => ({ id: c.id, title: c.title }))}
              inquiries={inquiries.map((i) => ({
                id: i.id,
                name: i.name,
                company: i.company,
                email: i.email,
                stage: i.stage,
                source: i.source,
                contentItemId: i.contentItemId,
                contentTitle: i.contentItem?.title ?? null,
                cta: i.cta,
                leadMagnet: i.leadMagnet,
                link: i.link,
                valueMinor: i.valueMinor,
                occurredAt: i.occurredAt.toISOString(),
                notes: i.notes,
                attribution: i.attribution,
                evidenceBasis: i.evidenceBasis,
                evidenceSource: i.evidenceSource,
              }))}
            />
          </section>
        </>
      )}
    </div>
  );
}
