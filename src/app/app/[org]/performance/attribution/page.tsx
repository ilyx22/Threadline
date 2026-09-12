import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import {
  assetAttribution,
  byDimension,
  commercialFunnel,
  listTrackedLinks,
  recentJourneys,
  trackingHealth,
} from "@/lib/data/attribution";
import { lastNDays } from "@/lib/data/metrics";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/data";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import {
  ATTRIBUTION_CLASS_META,
  ATTRIBUTION_MODEL_META,
  ATTRIBUTION_MODEL_OPTIONS,
  COMMERCIAL_EVENT_KIND_META,
  TOUCHPOINT_KIND_META,
  attributionModelSchema,
  metaOf,
  type AttributionModel,
} from "@/lib/domain/enums";
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/domain/attribution";
import { SYNTHETIC_EXPLANATION } from "@/lib/domain/synthetic";
import { money, percent } from "@/lib/utils/format";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { LinkRow, ModelSwitch, NewLinkButton, RecordEventButton } from "./attribution-client";
import { appUrl } from "@/lib/app-url";

export const metadata: Metadata = { title: "Attribution" };

/**
 * The operator's attribution surface — the plumbing.
 *
 * The client sees answers on Results. This is where the answers come from: the
 * tracked links, the raw journeys, the three models side by side, and an honest
 * account of what the measurement can and cannot support. It is deliberately
 * not curated, because the operator's job is to notice when the data is too
 * thin to say anything and to fix that before a report is written.
 */
export default async function AttributionPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ model?: string }>;
}) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "attribution.manage");
  const query = await searchParams;

  const parsed = attributionModelSchema.safeParse(query.model);
  const model: AttributionModel = parsed.success ? parsed.data : "linear";
  const range = lastNDays(90);

  const [attribution, funnel, health, links, journeys, content, inquiries] = await Promise.all([
    assetAttribution(ctx.org.id, range, model),
    commercialFunnel(ctx.org.id, range),
    trackingHealth(ctx.org.id),
    listTrackedLinks(ctx.org.id),
    recentJourneys(ctx.org.id, 6),
    prisma.contentItem.findMany({
      where: { orgId: ctx.org.id },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.inquiry.findMany({
      where: { orgId: ctx.org.id },
      select: { id: true, name: true, company: true },
      orderBy: { occurredAt: "desc" },
      take: 100,
    }),
  ]);

  const origin = appUrl();
  const modelMeta = metaOf(ATTRIBUTION_MODEL_META, model);
  const totalCredited = attribution.assets.reduce((sum, a) => sum + a.valueMinor, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Attribution</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Which content created commercially valuable attention, and how well the connection
            actually holds up. Last 90 days.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RecordEventButton
            slug={slug}
            inquiries={inquiries.map((i) => ({
              id: i.id,
              label: [i.name, i.company].filter(Boolean).join(" · "),
            }))}
          />
          <NewLinkButton slug={slug} content={content} />
        </div>
      </header>

      {ctx.org.synthetic ? (
        <Notice tone="warning" title="Synthetic workspace">
          {SYNTHETIC_EXPLANATION}
        </Notice>
      ) : null}

      {/* Measurement health first. Interpreting a number before knowing whether
          the measurement could have seen anything is how a working engagement
          gets cancelled over a reporting gap. */}
      <section>
        <SectionHeading
          title={`Measurement · ${health.score}%`}
          description={health.summary}
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {health.checks.map((check) => (
            <div
              key={check.key}
              className={`rounded-lg border px-3 py-2.5 ${
                check.ok ? "border-line bg-elevated" : "border-warning/25 bg-warning-soft/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] font-medium text-ink">{check.label}</p>
                <Badge tone={check.ok ? "positive" : "warning"}>{check.ok ? "OK" : "Gap"}</Badge>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{check.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked clicks" value={funnel.clicks} sublabel="last 90 days" />
        <StatCard label="Commercial events" value={attribution.outcomes} sublabel="with a value" />
        <StatCard
          label="Traceable to content"
          value={
            attribution.coverage.share === null
              ? "—"
              : percent(attribution.coverage.share * 100, 0)
          }
          sublabel={`${attribution.coverage.defensible} of ${attribution.coverage.events}`}
          emphasis
        />
        <StatCard
          label="Credited value"
          value={
            attribution.coverage.monetaryAllowed
              ? money(totalCredited, ctx.org.currency, { compact: true })
              : "Withheld"
          }
          sublabel={attribution.coverage.monetaryAllowed ? modelMeta.label : "coverage too low"}
        />
      </section>

      {!attribution.coverage.monetaryAllowed && attribution.coverage.reason ? (
        <Notice tone="warning" title="Money per asset is withheld">
          {attribution.coverage.reason}
        </Notice>
      ) : null}

      <section>
        <SectionHeading
          title="Credit by asset"
          description={`${modelMeta.description} Touches more than ${ATTRIBUTION_WINDOW_DAYS} days before an event are not counted.`}
          action={
            <ModelSwitch slug={slug} current={model} options={[...ATTRIBUTION_MODEL_OPTIONS]} />
          }
        />
        {attribution.assets.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Nothing has been credited yet"
            description="Credit needs three things: a tracked link on an asset, a click, and a commercial event recorded against the visitor who clicked."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-elevated">
            <Table>
              <THead>
                <TR>
                  <TH>Asset</TH>
                  <TH>Pillar</TH>
                  <TH className="text-right">Touches</TH>
                  <TH className="text-right">Events</TH>
                  <TH className="text-right">Value</TH>
                  <TH>Best evidence</TH>
                </TR>
              </THead>
              <TBody>
                {attribution.assets.map((asset) => {
                  const evidence = metaOf(ATTRIBUTION_CLASS_META, asset.bestEvidence);
                  return (
                    <TR key={asset.contentItemId}>
                      <TD className="max-w-[280px]">
                        <span className="block truncate text-[13px] text-ink">{asset.title}</span>
                        {asset.cta ? (
                          <span className="block truncate text-[11.5px] text-faint">
                            CTA: {asset.cta}
                          </span>
                        ) : null}
                      </TD>
                      <TD className="text-[12.5px] text-muted">{asset.pillar ?? "—"}</TD>
                      <TD className="text-right tabular text-muted">{asset.touches}</TD>
                      <TD className="text-right tabular text-muted">{asset.events}</TD>
                      <TD className="text-right tabular text-ink">
                        {attribution.coverage.monetaryAllowed
                          ? money(asset.valueMinor, ctx.org.currency)
                          : "—"}
                      </TD>
                      <TD>
                        <Badge tone={evidence.tone}>{evidence.label}</Badge>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        )}
      </section>

      {attribution.assets.length > 0 ? (
        <section>
          <SectionHeading
            title="By dimension"
            description="Assets missing a dimension are grouped rather than dropped — a pillar breakdown that silently omits half the output looks complete and is not."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <DimensionCard
              title="Pillar"
              rows={byDimension(attribution.assets, (a) => a.pillar)}
              currency={ctx.org.currency}
              showMoney={attribution.coverage.monetaryAllowed}
            />
            <DimensionCard
              title="CTA"
              rows={byDimension(attribution.assets, (a) => a.cta)}
              currency={ctx.org.currency}
              showMoney={attribution.coverage.monetaryAllowed}
            />
            <DimensionCard
              title="Platform"
              rows={byDimension(attribution.assets, (a) => a.platform)}
              currency={ctx.org.currency}
              showMoney={attribution.coverage.monetaryAllowed}
            />
          </div>
        </section>
      ) : null}

      {funnel.stages.length > 0 ? (
        <section>
          <SectionHeading
            title="Content to commercial"
            description={
              funnel.complete
                ? "Every stage has recorded events, so the steps between them mean something."
                : "Only the stages with recorded events are shown. A missing stage usually means it was not recorded, not that it did not happen."
            }
          />
          <div className="flex flex-wrap gap-3">
            <Stage label="Clicks" count={funnel.clicks} />
            {funnel.stages.map((stage) => (
              <Stage
                key={stage.kind}
                label={metaOf(COMMERCIAL_EVENT_KIND_META, stage.kind).label}
                count={stage.count}
                value={
                  stage.valueMinor > 0 ? money(stage.valueMinor, ctx.org.currency, { compact: true }) : null
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading
          title="Journeys"
          description="What was actually recorded, in order. Gaps are shown as gaps."
        />
        {journeys.length === 0 ? (
          <EmptyState title="No journeys yet" description="A journey starts with a click on a tracked link." />
        ) : (
          <div className="space-y-4">
            {journeys.map((journey) => (
              <Card key={journey.inquiryId ?? journey.visitorId ?? "unknown"}>
                <CardHeader
                  title={journey.personLabel || "Anonymous visitor"}
                  description={
                    journey.evidence
                      ? metaOf(ATTRIBUTION_CLASS_META, journey.evidence).description
                      : "No commercial event recorded for this person yet."
                  }
                  action={
                    journey.evidence ? (
                      <Badge tone={metaOf(ATTRIBUTION_CLASS_META, journey.evidence).tone}>
                        {metaOf(ATTRIBUTION_CLASS_META, journey.evidence).label}
                      </Badge>
                    ) : null
                  }
                />
                <CardBody className="space-y-4">
                  <ol className="space-y-2">
                    {journey.steps.map((step) => (
                      <li
                        key={step.id}
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-line pl-3 text-[12.5px]"
                      >
                        <span className="w-32 shrink-0 text-[11.5px] text-faint">
                          {formatDateTime(step.occurredAt)}
                        </span>
                        {step.type === "touch" ? (
                          <>
                            <Badge tone={metaOf(TOUCHPOINT_KIND_META, step.kind).tone}>
                              {metaOf(TOUCHPOINT_KIND_META, step.kind).label}
                            </Badge>
                            <span className="text-ink">
                              {step.contentTitle ?? "Asset not recorded"}
                            </span>
                            {step.platform ? (
                              <span className="text-faint">{step.platform}</span>
                            ) : null}
                            {step.note ? <span className="text-muted">{step.note}</span> : null}
                          </>
                        ) : (
                          <>
                            <Badge tone={metaOf(COMMERCIAL_EVENT_KIND_META, step.kind).tone}>
                              {metaOf(COMMERCIAL_EVENT_KIND_META, step.kind).label}
                            </Badge>
                            {step.valueMinor > 0 ? (
                              <span className="tabular text-ink">
                                {money(step.valueMinor, step.currency)}
                              </span>
                            ) : null}
                            <span className="text-faint">
                              via {step.source.replace(/_/g, " ")}
                              {step.recordedBy ? ` · ${step.recordedBy}` : ""}
                            </span>
                            {step.note ? <span className="text-muted">{step.note}</span> : null}
                          </>
                        )}
                      </li>
                    ))}
                  </ol>

                  {journey.models.length > 0 ? (
                    <div className="grid gap-2 rounded-md border border-line bg-raised/40 px-3 py-2.5 sm:grid-cols-3">
                      {journey.models.map((m) => (
                        <div key={m.model}>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
                            {metaOf(ATTRIBUTION_MODEL_META, m.model).label}
                          </p>
                          <p className="mt-0.5 text-[12px] leading-snug text-ink">
                            {m.title ?? m.reason ?? "No credit"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeading
          title="Tracked links"
          description="Threadline owns the URL and records the click. This is what makes attribution work for content Threadline did not publish."
        />
        {links.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No tracked links"
            description="Without one, a click on a post is invisible and no journey can start."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-elevated">
            {links.map((link) => (
              <LinkRow
                key={link.id}
                slug={slug}
                origin={origin}
                link={{
                  id: link.id,
                  slug: link.slug,
                  label: link.label,
                  destinationUrl: link.destinationUrl,
                  active: link.active,
                  clicks: link._count.touchpoints,
                  contentTitle: link.contentItem?.title ?? null,
                  platform: link.platform,
                }}
              />
            ))}
          </div>
        )}
      </section>

      <p className="text-[11.5px] leading-relaxed text-ghost">
        Identity here is a first-party cookie and nothing more. It records that clicks came from the
        same browser; it cannot say who, and it is never used to link a person across devices.
        Period: {formatDate(range.start)} to {formatDate(range.end)}.
      </p>
    </div>
  );
}

function Stage({ label, count, value }: { label: string; count: number; value?: string | null }) {
  return (
    <div className="min-w-[120px] flex-1 rounded-lg border border-line bg-elevated px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-1 text-[18px] tabular text-ink">{count}</p>
      {value ? <p className="text-[11.5px] text-muted">{value}</p> : null}
    </div>
  );
}

function DimensionCard({
  title,
  rows,
  currency,
  showMoney,
}: {
  title: string;
  rows: { key: string; label: string; assets: number; events: number; valueMinor: number; eventsPer10k: number | null }[];
  currency: string;
  showMoney: boolean;
}) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="min-w-0 truncate text-muted">{row.label}</span>
            <span className="shrink-0 tabular text-ink">
              {showMoney && row.valueMinor > 0
                ? money(row.valueMinor, currency, { compact: true })
                : `${row.events} ${row.events === 1 ? "event" : "events"}`}
              {row.eventsPer10k !== null ? (
                <span className="ml-2 text-[11px] text-faint">{row.eventsPer10k}/10k</span>
              ) : null}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
