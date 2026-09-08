import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { corpusSummary, listExamples } from "@/lib/data/corpus";
import { listWedges } from "@/lib/data/acquisition";
import { isLiveAi } from "@/lib/ai";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, SectionHeading } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/data";
import { Progress } from "@/components/ui/controls";
import {
  CORPUS_WORKING_MINIMUM,
  type BaselineConfidence,
  type CommercialStanding,
  type OutlierBand,
} from "@/lib/domain/corpus";
import { UNCALIBRATED_DISCLAIMER } from "@/lib/domain/judge";
import { compactNumber } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import {
  AddExampleButton,
  BulkCaptureButton,
  ExampleActions,
  FillMetricsButton,
  RateControls,
} from "./research-client";

export const metadata: Metadata = { title: "Research corpus" };

type Tone = "positive" | "accent" | "neutral" | "outline" | "warning" | "negative" | "info";

const BAND_TONE: Record<OutlierBand, Tone> = {
  exceptional: "positive",
  strong: "accent",
  typical: "neutral",
  under: "outline",
  unknown: "warning",
};

/**
 * The headline label. Reach alone was never the question.
 *
 * `commercial_outlier` is the only value that means "study this"; everything
 * else is either a warning, baseline material, or a request for the judgement
 * only an operator can supply.
 */
const STANDING: Record<CommercialStanding, { label: string; tone: Tone }> = {
  commercial_outlier: { label: "Commercial outlier", tone: "positive" },
  popular_off_icp: { label: "Popular, wrong audience", tone: "warning" },
  relevant_but_ordinary: { label: "On-target, ordinary", tone: "neutral" },
  ordinary: { label: "Ordinary", tone: "outline" },
  unrated: { label: "Needs rating", tone: "info" },
  unknown: { label: "No comparison yet", tone: "outline" },
};

/** How the descriptive fields arrived. Shown so trust is never assumed. */
const PROVENANCE_LABEL: Record<string, string> = {
  manual: "Entered by hand",
  auto_oembed: "Read from the platform's public oEmbed endpoint",
  auto_page: "Read from the public page",
  url_only: "Derived from the URL only",
};

const CONFIDENCE_LABEL: Record<BaselineConfidence, string> = {
  high: "high confidence",
  moderate: "moderate confidence",
  low: "low confidence",
  none: "no baseline",
};

/**
 * The research corpus.
 *
 * Threadline's own market evidence: real content from the wedge, seeded by hand
 * until automated collection earns its place. It is not tenant data and no
 * client role can reach it.
 *
 * It does two jobs, and the second is the reason it exists now rather than
 * later: every example has a known real-world outcome, which makes this the
 * only material available for checking whether the Judge's opinion is worth
 * anything before that opinion is allowed near a client's content.
 */
export default async function ResearchPage() {
  await requireInternal("corpus.manage");

  const [summary, examples, wedges] = await Promise.all([
    corpusSummary(),
    listExamples(),
    listWedges(),
  ]);

  const live = isLiveAi();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Research corpus</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Real content from the wedge&apos;s market, captured by hand. It is the signal source for
            what earns attention here — and the test set the Judge is checked against.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/admin/research/calibration" variant="secondary">
            Calibration
          </ButtonLink>
          <BulkCaptureButton />
          <AddExampleButton wedges={wedges.map((w) => ({ id: w.id, label: w.label }))} />
        </div>
      </header>

      {!live ? (
        <Notice tone="warning" title="No model configured">
          Analysis and Judge runs will use the offline provider, which returns clearly-labelled
          placeholder output. Set <code>ANTHROPIC_API_KEY</code> before drawing any conclusion from
          either.
        </Notice>
      ) : null}

      <Notice tone="info" title="The Judge is uncalibrated">
        {UNCALIBRATED_DISCLAIMER}
      </Notice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Examples"
          value={summary.total}
          sublabel={`${CORPUS_WORKING_MINIMUM} to a working corpus`}
          emphasis
        />
        <StatCard
          label="Commercial outliers"
          value={summary.commercialOutliers}
          sublabel="outperformed, in front of a buyer"
          emphasis
        />
        <StatCard
          label="Can be banded"
          value={summary.bandable}
          sublabel={`${summary.weakBaselines} on a cross-creator comparison`}
        />
        <StatCard
          label="Needs detail"
          value={summary.needsMetrics}
          sublabel={`${summary.unrated} still unrated`}
        />
      </section>

      <div className="space-y-2">
        <Progress
          value={Math.min(100, Math.round((summary.total / CORPUS_WORKING_MINIMUM) * 100))}
          tone={summary.usable ? "positive" : "accent"}
        />
        <p className="text-[12.5px] leading-relaxed text-muted">{summary.reading}</p>
      </div>

      <section>
        <SectionHeading
          title="Examples"
          description="Banded against the strongest comparison available — the same creator in the same format first, falling back through their wider work, a size-matched cohort, then the platform. Never against raw views, and the weaker the comparison the higher the bar."
        />

        {examples.length === 0 ? (
          <EmptyState
            icon={Library}
            title="The corpus is empty"
            description="Seed it by hand: 100 to 300 genuinely strong pieces from the wedge, plus ordinary content from the same creators so their baselines exist."
          />
        ) : (
          <div className="space-y-3">
            {examples.map((example) => (
              <Card key={example.id}>
                <CardBody className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a
                        href={example.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-[14px] font-medium leading-snug text-ink hover:underline"
                      >
                        {example.title}
                      </a>
                      <p className="mt-0.5 text-[11.5px] text-faint">
                        {example.creatorName ?? example.creatorHandle} · {example.platform}
                        {example.publishedAt ? ` · ${formatDate(example.publishedAt)}` : ""}
                        {example.wedge ? ` · ${example.wedge.label}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {example.illustrative ? <Badge tone="warning">Illustrative</Badge> : null}
                      <Badge tone={STANDING[example.outlier.commercialStanding].tone}>
                        {STANDING[example.outlier.commercialStanding].label}
                      </Badge>
                      <Badge tone={BAND_TONE[example.outlier.band]}>{example.outlier.band}</Badge>
                      {example.outlier.stillMoving ? <Badge tone="outline">Still moving</Badge> : null}
                      {example.needsMetrics ? <Badge tone="warning">Needs numbers</Badge> : null}
                      {example.verdicts[0] ? (
                        <Badge tone="outline">
                          Judge {example.verdicts[0].overall}/100 · uncalibrated
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-muted">
                    <span>{compactNumber(example.views)} views</span>
                    {example.followers > 0 ? (
                      <span>{compactNumber(example.followers)} followers</span>
                    ) : null}
                    {example.outlier.engagementRate !== null ? (
                      <span>{(example.outlier.engagementRate * 100).toFixed(1)}% engagement</span>
                    ) : null}
                    {example.outlier.reachRatio !== null ? (
                      <span>{example.outlier.reachRatio.toFixed(1)}x followers reached</span>
                    ) : null}
                    {example.outlier.viewsPerDay !== null ? (
                      <span>{compactNumber(example.outlier.viewsPerDay)} views/day</span>
                    ) : null}
                    {example.outlier.ageDays !== null ? (
                      <span>{Math.round(example.outlier.ageDays)} days old</span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[12px] leading-relaxed text-faint">{example.outlier.reason}</p>
                    <p className="text-[11.5px] leading-relaxed text-ghost">
                      Compared against {example.outlier.baselineLabel} ·{" "}
                      {CONFIDENCE_LABEL[example.outlier.confidence]}
                    </p>
                    <p className="text-[12px] leading-relaxed text-muted">
                      {example.outlier.commercialReason}
                    </p>
                  </div>

                  {example.analysis ? (
                    <div className="grid gap-2 rounded-md border border-line bg-raised/40 px-3 py-2.5 sm:grid-cols-2">
                      <Extracted label="Hook" value={example.analysis.hook} />
                      <Extracted label="Thesis" value={example.analysis.thesis} />
                      <Extracted label="Buyer pain" value={example.analysis.buyerPain} />
                      <Extracted label="Why it worked" value={example.analysis.whyItWorked} />
                      <div className="sm:col-span-2">
                        <Badge
                          tone={
                            example.analysis.commercialRelevance === "commercial"
                              ? "positive"
                              : example.analysis.commercialRelevance === "entertainment"
                                ? "neutral"
                                : "outline"
                          }
                        >
                          {example.analysis.commercialRelevance} attention
                        </Badge>
                      </div>
                    </div>
                  ) : null}

                  <p className="text-[11px] leading-relaxed text-ghost">
                    {PROVENANCE_LABEL[example.provenance] ?? "Entered by hand"} · numbers{" "}
                    {example.metricsProvenance === "api" ? "from the platform API" : "entered by hand"}
                    {example.enrichmentNote ? ` · ${example.enrichmentNote}` : ""}
                  </p>

                  <RateControls
                    exampleId={example.id}
                    format={example.format}
                    buyerRelevance={example.buyerRelevance}
                    commercialIntent={example.commercialIntent}
                    suggested={example.analysis?.commercialRelevance ?? null}
                  />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <FillMetricsButton
                      exampleId={example.id}
                      title={example.title}
                      creatorHandle={example.creatorHandle}
                      needsMetrics={example.needsMetrics}
                    />
                  </div>

                  <ExampleActions
                    exampleId={example.id}
                    analysed={Boolean(example.analysis)}
                    judged={example.verdicts.length > 0}
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      <p className="text-[11.5px] leading-relaxed text-ghost">
        Automated collection is not built. Every row here was captured by hand, which is what the
        product claims and all it claims — see{" "}
        <Link href="/admin/research/calibration" className="underline underline-offset-2">
          calibration
        </Link>{" "}
        for whether the Judge&apos;s opinion of them is worth anything yet.
      </p>
    </div>
  );
}

function Extracted({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-ink">{value}</p>
    </div>
  );
}
