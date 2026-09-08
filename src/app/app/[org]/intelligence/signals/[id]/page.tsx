import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FlaskConical, Lightbulb, Video } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { getPattern } from "@/lib/data/patterns";
import { patternBand } from "@/lib/domain/scoring";
import { RESEARCH_KIND_META, metaOf } from "@/lib/domain/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/tabs";
import { DefinitionList, ScoreBar } from "@/components/ui/data";
import { IdeaStatusBadge, PatternKindBadge, PatternStatusBadge } from "@/components/ui/status";
import { compactNumber } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { SignalDetailActions } from "./signal-detail-actions";
import { QueueTestButton, RecordResultButton } from "./test-actions";
import { testOutcomes } from "@/lib/data/runs";

export const metadata: Metadata = { title: "Signal" };

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: slug, id } = await params;
  const ctx = await requireOrgPage(slug, "signals.view");
  const pattern = await getPattern(ctx.org.id, id);
  if (!pattern) notFound();

  const band = patternBand(pattern.score);
  // Real numbers for anything this signal has produced. The chain is foreign
  // keys the whole way, so this is a query with a definite answer.
  const outcomes = await testOutcomes(ctx.org.id, pattern.id);
  const canEditSignals = ctx.can("signals.edit");
  const researchEvidence = pattern.evidence.filter((e) => e.researchItem);
  const contentEvidence = pattern.evidence.filter((e) => e.contentItem);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Intelligence", href: `/app/${slug}/intelligence` },
          { label: "Signals", href: `/app/${slug}/intelligence/signals` },
          { label: pattern.title },
        ]}
      />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <PatternKindBadge kind={pattern.kind} />
            <PatternStatusBadge status={pattern.status} />
            <Badge tone={band.tone}>{band.label}</Badge>
            {pattern.detectedBy === "performance_loop" ? (
              <Badge tone="outline">Derived from performance</Badge>
            ) : null}
            {pattern.detectedBy === "intelligence_run" ? (
              <Badge tone="outline">From an intelligence cycle</Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-hero">{pattern.title}</h1>
          {pattern.description ? (
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{pattern.description}</p>
          ) : null}
        </div>

        <SignalDetailActions
          slug={slug}
          patternId={pattern.id}
          status={pattern.status}
          canEdit={ctx.can("signals.edit")}
          canCreateIdea={ctx.can("ideas.create")}
          defaults={{
            id: pattern.id,
            kind: pattern.kind,
            title: pattern.title,
            description: pattern.description ?? "",
            status: pattern.status,
            confidence: pattern.confidence,
            impact: pattern.impact,
            effort: pattern.effort,
            nextExperiment: pattern.nextExperiment ?? "",
          }}
        />
      </header>

      {/* Where this came from, and what it produced. */}
      {pattern.derivedFrom || pattern.run ? (
        <p className="text-[12.5px] text-muted">
          {pattern.derivedFrom ? (
            <>
              Derived from{" "}
              <Link
                href={`/app/${slug}/intelligence/signals/${pattern.derivedFrom.id}`}
                className="text-accent underline underline-offset-2"
              >
                {pattern.derivedFrom.title}
              </Link>
            </>
          ) : null}
          {pattern.derivedFrom && pattern.run ? " · " : null}
          {pattern.run ? (
            <>
              Cycle:{" "}
              <Link
                href={`/app/${slug}/intelligence/runs/${pattern.run.id}`}
                className="text-accent underline underline-offset-2"
              >
                {pattern.run.label}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ------------------------- Test read and result ---------------------- */}
          {pattern.kind === "test" ? (
            <Card accent>
              <CardHeader
                title="How this is read"
                eyebrow="The defined outcome"
                description="A test without a defined read produces an opinion, not an answer."
                action={
                  canEditSignals ? (
                    <RecordResultButton
                      slug={slug}
                      patternId={pattern.id}
                      title={pattern.title}
                      hasParent={Boolean(pattern.derivedFromId)}
                    />
                  ) : undefined
                }
              />
              <CardBody className="pt-0">
                <p className="text-[14px] leading-relaxed text-ink">
                  {pattern.successMetric ?? "No read has been defined for this test yet."}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-eyebrow text-faint">Published</dt>
                    <dd className="mt-1 text-[17px] tabular text-ink">{outcomes.published}</dd>
                  </div>
                  <div>
                    <dt className="text-eyebrow text-faint">Views</dt>
                    <dd className="mt-1 text-[17px] tabular text-ink">
                      {compactNumber(outcomes.views)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-eyebrow text-faint">Engagements</dt>
                    <dd className="mt-1 text-[17px] tabular text-ink">
                      {compactNumber(outcomes.engagements)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-eyebrow text-faint">Inquiries</dt>
                    <dd className="mt-1 text-[17px] tabular text-ink">{outcomes.inquiries}</dd>
                  </div>
                </dl>
                {outcomes.published === 0 ? (
                  <p className="mt-3 text-[12px] leading-relaxed text-ghost">
                    Nothing descended from this test has been published yet, so there is no result
                    to read.
                  </p>
                ) : null}

                {pattern.feedbackNote ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-eyebrow text-faint">
                      Recorded result
                      {pattern.lastFeedbackAt ? ` · ${formatDate(pattern.lastFeedbackAt)}` : ""}
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                      {pattern.feedbackNote}
                    </p>
                    <p className="mt-2 text-[11.5px] text-ghost">
                      Confidence moves by one bounded step per read, so a signal needs several
                      consistent results before the system treats it as settled.
                    </p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          {/* --------------------------- Tests from this ------------------------- */}
          {pattern.kind !== "test" ? (
            <Card>
              <CardHeader
                title="Tests from this signal"
                eyebrow={`${pattern.derived.length} queued`}
                description="What we are doing because of it."
                action={
                  canEditSignals ? (
                    <QueueTestButton slug={slug} patternId={pattern.id} title={pattern.title} />
                  ) : undefined
                }
              />
              <CardBody className="pt-0">
                {pattern.derived.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
                    No test queued yet. A signal that never becomes a test never gets to be right or
                    wrong.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {pattern.derived.map((test) => (
                      <li key={test.id}>
                        <Link
                          href={`/app/${slug}/intelligence/signals/${test.id}`}
                          className="block rounded-md border border-line bg-elevated px-3.5 py-2.5 hover:border-line-strong"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium leading-snug text-ink">
                                {test.title}
                              </p>
                              {test.successMetric ? (
                                <p className="mt-0.5 text-[11.5px] text-ghost">
                                  Read on: {test.successMetric}
                                </p>
                              ) : null}
                              {test.feedbackNote ? (
                                <p className="mt-1 text-[12px] leading-relaxed text-faint">
                                  {test.feedbackNote}
                                </p>
                              ) : null}
                            </div>
                            <PatternStatusBadge status={test.status} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ) : null}

          {pattern.nextExperiment ? (
            <Card accent>
              <CardHeader title="Next experiment" eyebrow="What would test this" />
              <CardBody className="pt-0">
                <p className="text-[14px] leading-relaxed text-ink">{pattern.nextExperiment}</p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Evidence"
              eyebrow={`${pattern.evidence.length} linked records`}
              description="What this conclusion actually rests on."
            />
            <CardBody className="pt-0">
              {pattern.evidence.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
                  No evidence linked. A signal without evidence is an opinion — link the research or
                  content it came from.
                </p>
              ) : (
                <div className="space-y-5">
                  {researchEvidence.length > 0 ? (
                    <div>
                      <p className="text-eyebrow mb-2.5 text-faint">Research</p>
                      <ul className="divide-y divide-line">
                        {researchEvidence.map((e) => {
                          const item = e.researchItem;
                          if (!item) return null;
                          const kind = metaOf(RESEARCH_KIND_META, item.kind);
                          return (
                            <li key={e.id} className="flex items-start gap-3 py-2.5 first:pt-0">
                              <Badge tone={kind.tone} className="mt-0.5 shrink-0">
                                {kind.label}
                              </Badge>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] leading-snug text-ink">{item.title}</p>
                                {item.body ? (
                                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                                    {item.body}
                                  </p>
                                ) : null}
                              </div>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="shrink-0 p-1 text-ghost transition-colors hover:text-muted"
                                  aria-label="Open source"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {contentEvidence.length > 0 ? (
                    <div>
                      <p className="text-eyebrow mb-2.5 text-faint">Published content</p>
                      <ul className="divide-y divide-line">
                        {contentEvidence.map((e) => {
                          const item = e.contentItem;
                          if (!item) return null;
                          const record = item.publishRecords[0];
                          const views = record?.snapshots[0]?.views ?? 0;
                          return (
                            <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                              <Video className="size-3.5 shrink-0 text-faint" aria-hidden />
                              <Link
                                href={`/app/${slug}/production/${item.id}`}
                                className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                              >
                                {item.title}
                              </Link>
                              {views > 0 ? (
                                <span className="shrink-0 text-[12px] tabular text-muted">
                                  {compactNumber(views)} views
                                </span>
                              ) : null}
                              {e.note ? (
                                <span className="shrink-0 text-[11.5px] text-ghost">{e.note}</span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Ideas from this signal"
              eyebrow="Downstream"
              description="Where this signal has already changed what gets made."
            />
            <CardBody className="pt-0">
              {pattern.ideas.length === 0 ? (
                <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[12.5px] text-faint">
                  Nothing yet. Promoting a signal into an idea carries its evidence forward
                  automatically.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {pattern.ideas.map((idea) => (
                    <li key={idea.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <Lightbulb className="size-3.5 shrink-0 text-faint" aria-hidden />
                      <Link
                        href={`/app/${slug}/create/ideas/${idea.id}`}
                        className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                      >
                        {idea.title}
                      </Link>
                      <span className="shrink-0 text-[12px] tabular text-accent">
                        {Math.round(idea.priorityScore)}
                      </span>
                      <IdeaStatusBadge status={idea.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Prioritisation" eyebrow="Score" />
            <CardBody className="pt-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[32px] font-medium leading-none tabular text-accent">
                  {pattern.score.toFixed(1)}
                </span>
                <span className="text-[12px] text-faint">of 25</span>
              </div>
              <div className="mt-5 space-y-3.5">
                <ScoreBar label="Confidence" value={pattern.confidence} tone="accent" />
                <ScoreBar label="Impact" value={pattern.impact} max={5} showValue={false} />
                <ScoreBar label="Effort" value={pattern.effort} max={5} showValue={false} tone="warning" />
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ghost">
                Confidence scales impact; effort discounts it. Computed, not entered.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody className="pt-0">
              <DefinitionList
                columns={1}
                items={[
                  { label: "Detected by", value: pattern.detectedBy.replace(/_/g, " ") },
                  { label: "Created", value: formatDate(pattern.createdAt) },
                  { label: "Last updated", value: formatDate(pattern.updatedAt) },
                  { label: "Impact", value: `${pattern.impact} of 5` },
                  { label: "Effort", value: `${pattern.effort} of 5` },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lifecycle" eyebrow="How signals progress" />
            <CardBody className="pt-0">
              <ol className="space-y-2.5 text-[12px] leading-relaxed text-muted">
                <li className="flex gap-2.5">
                  <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-ghost" aria-hidden />
                  <span>
                    <strong className="text-ink">Outlier</strong> — one result far from the median.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-ghost" aria-hidden />
                  <span>
                    <strong className="text-ink">Pattern</strong> — repeated across pieces or sources.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-ghost" aria-hidden />
                  <span>
                    <strong className="text-ink">Hypothesis</strong> — a causal explanation worth
                    testing.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-ghost" aria-hidden />
                  <span>
                    <strong className="text-ink">Test</strong> — live, with a defined read.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-ghost" aria-hidden />
                  <span>
                    <strong className="text-ink">Learning</strong> — validated, and now shapes the
                    next cycle.
                  </span>
                </li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
