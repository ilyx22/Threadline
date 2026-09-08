import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileSearch, ShieldCheck } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { getRun, runEvidence, readSourceMeta } from "@/lib/data/runs";
import { listCompetitors } from "@/lib/data/research";
import {
  CANDIDATE_KIND_META,
  COLLECTION_MODE_META,
  RUN_SOURCE_KIND_META,
  RUN_SOURCE_STATUS_META,
  RUN_STATUS_META,
  type CandidateKind,
  type RunSourceKind,
  type RunSourceStatus,
  type RunStatus,
} from "@/lib/domain/enums";
import { SOURCE_COLLECTION, nextRunStatuses } from "@/lib/domain/intelligence";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Separator } from "@/components/ui/controls";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { formatDate, formatDateTime, relativeTime } from "@/lib/utils/dates";
import {
  AdvanceRunButton,
  BriefSummaryPanel,
  CandidateCard,
  NewSourceButton,
  SourceRow,
  SynthesiseButton,
} from "../run-actions";

export const metadata: Metadata = { title: "Intelligence run" };

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: slug, id } = await params;
  // Deliberately workspace.view rather than research.view: a client reads
  // published briefs here. getRun narrows to published for them, so an
  // unpublished cycle is a 404 rather than a redirect — the existence of
  // Threadline's working state is not something to disclose by URL probing.
  const ctx = await requireOrgPage(slug, "workspace.view");

  const run = await getRun(ctx.org.id, id, ctx.role);
  if (!run) notFound();

  const canManage = ctx.can("runs.manage");
  const canDecide = ctx.can("signals.edit");
  const status = run.status as RunStatus;
  const statusMeta = RUN_STATUS_META[status] ?? RUN_STATUS_META.scoping;

  const [evidence, competitors] = await Promise.all([
    // Raw evidence is operator-only; the client sees the items a signal cites.
    canManage ? runEvidence(ctx.org.id, id) : Promise.resolve([]),
    canManage ? listCompetitors(ctx.org.id) : Promise.resolve([]),
  ]);

  const pending = run.candidates.filter((c) => c.decision === "pending");
  const approved = run.candidates.filter((c) => c.decision === "approved");
  const rejected = run.candidates.filter((c) => c.decision === "rejected");
  const unavailableSources = run.sources.filter((s) => s.status === "unavailable");
  const collectedSources = run.sources.filter((s) => s.status === "collected");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/${slug}/intelligence/runs`}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All cycles
        </Link>
      </div>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            <span className="text-[11.5px] text-ghost">
              {formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
            </span>
            {run.publishedAt ? (
              <span className="text-[11.5px] text-ghost">
                · published {formatDateTime(run.publishedAt)}
              </span>
            ) : null}
          </div>
          <h1 className="text-section mt-3">{run.label}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{statusMeta.description}</p>
          {run.focus ? (
            <p className="mt-3 border-l-2 border-accent-line pl-3 text-[13px] leading-relaxed text-faint">
              <span className="text-accent">Focus:</span> {run.focus}
            </p>
          ) : null}
        </div>

        {canManage && status !== "published" && status !== "archived" ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {nextRunStatuses(status)
              .filter((next) => next !== "archived")
              .map((next) => (
                <AdvanceRunButton key={next} slug={slug} runId={run.id} target={next} />
              ))}
            <AdvanceRunButton slug={slug} runId={run.id} target="archived" variant="ghost" />
          </div>
        ) : null}
      </header>

      {/* --------------------------- The published brief -------------------------- */}
      {status === "published" ? (
        <PublishedBrief slug={slug} run={run} />
      ) : (
        <>
          {/* ------------------------------- 1. Sources ---------------------------- */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-medium text-ink">1 · Sources</h2>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
                  What this cycle reads. Public pages are fetched from a URL you supply; call notes
                  and customer language are pasted in; your own content, performance and pipeline
                  are read from this workspace. There is no background scraping and no platform is
                  connected.
                </p>
              </div>
              {canManage ? (
                <NewSourceButton
                  slug={slug}
                  runId={run.id}
                  competitors={competitors.map((c) => ({ id: c.id, name: c.name }))}
                />
              ) : null}
            </div>

            {run.sources.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                compact
                title="No sources declared"
                description="A cycle with no declared sources cannot produce evidence anyone can check."
              />
            ) : (
              <ul className="space-y-2">
                {run.sources.map((source) => (
                  <SourceRow
                    key={source.id}
                    slug={slug}
                    canManage={canManage}
                    source={{
                      id: source.id,
                      kind: source.kind,
                      label: source.label,
                      url: source.url,
                      status: source.status,
                      statusNote: source.statusNote,
                      content: source.content,
                      itemsCollected: source.itemsCollected,
                      collectedAt: source.collectedAt ? source.collectedAt.toISOString() : null,
                      competitorName: source.competitor?.name ?? null,
                      kindLabel:
                        RUN_SOURCE_KIND_META[source.kind as RunSourceKind]?.label ?? source.kind,
                      statusLabel:
                        RUN_SOURCE_STATUS_META[source.status as RunSourceStatus]?.label ??
                        source.status,
                      statusTone:
                        RUN_SOURCE_STATUS_META[source.status as RunSourceStatus]?.tone ?? "neutral",
                      modeLabel:
                        COLLECTION_MODE_META[
                          source.collectionMode as keyof typeof COLLECTION_MODE_META
                        ]?.label ?? source.collectionMode,
                      guidance:
                        SOURCE_COLLECTION[source.kind as RunSourceKind]?.guidance ??
                        "Supplied by hand.",
                      internal:
                        SOURCE_COLLECTION[source.kind as RunSourceKind]?.mode === "internal",
                    }}
                  />
                ))}
              </ul>
            )}

            {unavailableSources.length > 0 ? (
              <Notice tone="warning" title={`${unavailableSources.length} source(s) not collectable`}>
                This is recorded in the brief so the client can see exactly what was and was not
                read. It is never presented as if the source had been covered.
              </Notice>
            ) : null}
          </section>

          <Separator />

          {/* ------------------------------ 2. Evidence ---------------------------- */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-medium text-ink">
                  2 · Evidence{" "}
                  <span className="text-[13px] font-normal text-ghost">({evidence.length})</span>
                </h2>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
                  Every item keeps its source, URL and timestamp, and is fingerprinted — so an item
                  collected twice is reused rather than duplicated, and &ldquo;three sources say
                  this&rdquo; stays a true statement.
                </p>
              </div>
              {canManage && evidence.length > 0 ? (
                <SynthesiseButton slug={slug} runId={run.id} count={evidence.length} />
              ) : null}
            </div>

            {evidence.length === 0 ? (
              <EmptyState
                icon={FileSearch}
                compact
                title="Nothing collected yet"
                description="Collect a source above to gather evidence."
              />
            ) : (
              <ul className="grid gap-2 lg:grid-cols-2">
                {evidence.slice(0, 24).map((item) => {
                  const meta = readSourceMeta(item.sourceMeta);
                  return (
                    <li key={item.id}>
                      <Card className="h-full p-0">
                        <CardBody className="pt-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[13px] font-medium leading-snug text-ink">
                              {item.title}
                            </p>
                            <Badge tone="outline">{item.kind.replace(/_/g, " ")}</Badge>
                          </div>
                          {item.body ? (
                            <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-muted">
                              {item.body}
                            </p>
                          ) : null}
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ghost">
                            {item.sourceName ? <span>{item.sourceName}</span> : null}
                            <span>{formatDate(item.capturedAt)}</span>
                            {typeof meta.collectionMode === "string" ? (
                              <span>via {String(meta.collectionMode)}</span>
                            ) : null}
                            {item.url ? (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="ml-auto inline-flex items-center gap-1 text-muted hover:text-accent"
                              >
                                Source <ExternalLink className="size-3" aria-hidden />
                              </a>
                            ) : null}
                          </div>
                        </CardBody>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
            {evidence.length > 24 ? (
              <p className="text-[11.5px] text-ghost">
                Showing 24 of {evidence.length}. All of it is in{" "}
                <Link
                  href={`/app/${slug}/intelligence/radar`}
                  className="text-muted underline underline-offset-2 hover:text-ink"
                >
                  Market Radar
                </Link>
                .
              </p>
            ) : null}
          </section>

          <Separator />

          {/* ----------------------------- 3. Candidates --------------------------- */}
          <section className="space-y-3">
            <div>
              <h2 className="text-[15px] font-medium text-ink">3 · Candidate signals</h2>
              <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
                Proposed, not adopted. Each one cites the evidence behind it, and none of them
                influence strategy or reach the client until approved here.
              </p>
            </div>

            {run.candidates.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                compact
                title="Nothing proposed yet"
                description="Run synthesis once there is evidence to read across."
              />
            ) : (
              <div className="space-y-4">
                {pending.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-eyebrow text-warning">
                      Awaiting your decision ({pending.length})
                    </p>
                    {pending.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        slug={slug}
                        canDecide={canDecide}
                        candidate={serialiseCandidate(candidate)}
                      />
                    ))}
                  </div>
                ) : null}

                {approved.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-eyebrow text-positive">Approved ({approved.length})</p>
                    {approved.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        slug={slug}
                        canDecide={canDecide}
                        candidate={serialiseCandidate(candidate)}
                      />
                    ))}
                  </div>
                ) : null}

                {rejected.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-eyebrow text-faint">Rejected ({rejected.length})</p>
                    {rejected.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        slug={slug}
                        canDecide={false}
                        candidate={serialiseCandidate(candidate)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {run.patterns.length > 0 ? (
            <>
              <Separator />
              <section className="space-y-3">
                <div>
                  <h2 className="text-[15px] font-medium text-ink">4 · Ranked tests</h2>
                  <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">
                    What we are doing because of the approved signals, ranked by confidence, impact,
                    effort and how much independent evidence stands behind each one.
                  </p>
                </div>
                <ol className="space-y-2">
                  {run.patterns.map((test, index) => (
                    <li key={test.id}>
                      <Link href={`/app/${slug}/intelligence/signals/${test.id}`} className="block">
                        <Card interactive className="p-0">
                          <CardBody className="pt-3.5">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 text-[13px] tabular text-ghost">
                                {index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-medium leading-snug text-ink">
                                  {test.title}
                                </p>
                                <p className="mt-1 text-[11.5px] text-ghost">
                                  {test.successMetric
                                    ? `Read on: ${test.successMetric}`
                                    : "No read defined"}
                                  {test._count.ideas > 0
                                    ? ` · ${test._count.ideas} idea${test._count.ideas === 1 ? "" : "s"}`
                                    : ""}
                                </p>
                                {test.feedbackNote ? (
                                  <p className="mt-1.5 text-[12px] leading-relaxed text-faint">
                                    Result: {test.feedbackNote}
                                  </p>
                                ) : null}
                              </div>
                              <Badge tone="outline">{test.score.toFixed(0)}</Badge>
                            </div>
                          </CardBody>
                        </Card>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          ) : null}

          {canManage ? (
            <>
              <Separator />
              <BriefSummaryPanel
                slug={slug}
                runId={run.id}
                summary={run.summary ?? ""}
                label={run.label}
                focus={run.focus ?? ""}
                periodStart={run.periodStart.toISOString().slice(0, 10)}
                periodEnd={run.periodEnd.toISOString().slice(0, 10)}
                approvedCount={approved.length}
                pendingCount={pending.length}
                sourcesRead={collectedSources.length}
                sourcesUnavailable={unavailableSources.length}
              />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

type RunCandidate = Awaited<ReturnType<typeof getRun>> extends infer T
  ? T extends { candidates: (infer C)[] }
    ? C
    : never
  : never;

function serialiseCandidate(candidate: RunCandidate) {
  const kindMeta = CANDIDATE_KIND_META[candidate.kind as CandidateKind];
  return {
    id: candidate.id,
    kind: candidate.kind,
    kindLabel: kindMeta?.label ?? candidate.kind,
    kindTone: kindMeta?.tone ?? ("neutral" as const),
    title: candidate.title,
    rationale: candidate.rationale,
    soWhat: candidate.soWhat,
    confidence: candidate.confidence,
    decision: candidate.decision,
    decisionNote: candidate.decisionNote,
    decidedBy: candidate.decidedBy?.name ?? null,
    decidedAt: candidate.decidedAt ? relativeTime(candidate.decidedAt) : null,
    editedByHuman: candidate.editedByHuman,
    generatedBy: candidate.generatedBy,
    patternId: candidate.patternId,
    evidence: candidate.evidence.map((e) => ({
      id: e.researchItem.id,
      title: e.researchItem.title,
      url: e.researchItem.url,
      sourceName: e.researchItem.sourceName,
      kind: e.researchItem.kind,
      capturedAt: formatDate(e.researchItem.capturedAt),
      excerpt: (e.researchItem.body ?? "").slice(0, 320),
    })),
  };
}

/* --------------------------- The client-facing brief ------------------------ */

/**
 * The published brief renders from the frozen payload, not a live query, so a
 * brief read months later shows what the client was actually sent.
 */
function PublishedBrief({
  slug,
  run,
}: {
  slug: string;
  run: NonNullable<Awaited<ReturnType<typeof getRun>>>;
}) {
  const brief = parseBrief(run.brief);
  const signals = brief?.signals ?? [];
  const tests = brief?.tests ?? [];
  const sources = brief?.sources ?? [];
  const summary = brief?.summary ?? run.summary;
  const unavailable = sources.filter((s) => s.status === "unavailable");

  return (
    <div className="space-y-8">
      {summary ? (
        <Card>
          <CardBody className="pt-5">
            <p className="text-eyebrow text-accent">This cycle</p>
            <div className="mt-3 space-y-3">
              {summary.split(/\n{2,}/).map((paragraph, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-ink">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-[15px] font-medium text-ink">What we found</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Every signal below was reviewed and approved by a person, and shows the evidence behind
            it.
          </p>
        </div>

        {signals.length === 0 ? (
          <Notice tone="neutral" title="No signals were approved this cycle">
            Nothing repeated clearly enough to justify changing what gets made next. Recorded as it
            happened rather than filled in.
          </Notice>
        ) : (
          <ul className="space-y-3">
            {signals.map((signal) => {
              const meta = CANDIDATE_KIND_META[signal.kind as CandidateKind];
              return (
                <li key={signal.id}>
                  <Card>
                    <CardBody className="pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? signal.kind}</Badge>
                        <span className="text-[11.5px] text-ghost">
                          Confidence {signal.confidence}%
                        </span>
                        {signal.editedByHuman ? (
                          <span className="text-[11.5px] text-ghost">· edited by an operator</span>
                        ) : null}
                      </div>

                      <p className="mt-2.5 text-[15px] font-medium leading-snug text-ink">
                        {signal.title}
                      </p>
                      {signal.rationale ? (
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                          {signal.rationale}
                        </p>
                      ) : null}
                      {signal.soWhat ? (
                        <p className="mt-3 border-l-2 border-accent-line pl-3 text-[13.5px] leading-relaxed text-ink">
                          <span className="text-accent">Why it matters: </span>
                          {signal.soWhat}
                        </p>
                      ) : null}

                      {signal.evidence.length > 0 ? (
                        <details className="mt-4 group">
                          <summary className="cursor-pointer text-[12px] text-muted hover:text-ink">
                            {signal.evidence.length} supporting item
                            {signal.evidence.length === 1 ? "" : "s"}
                          </summary>
                          <ul className="mt-2.5 space-y-1.5 border-l border-line pl-3">
                            {signal.evidence.map((item) => (
                              <li key={item.id} className="text-[12px] leading-relaxed text-faint">
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="text-muted underline underline-offset-2 hover:text-accent"
                                  >
                                    {item.title}
                                  </a>
                                ) : (
                                  <span className="text-muted">{item.title}</span>
                                )}
                                <span className="text-ghost">
                                  {" "}
                                  — {item.sourceName ?? item.kind.replace(/_/g, " ")},{" "}
                                  {formatDate(item.capturedAt)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {tests.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-[15px] font-medium text-ink">What we are doing about it</h2>
            <p className="mt-1 text-[12.5px] text-muted">
              Ranked by how much evidence stands behind each one, weighed against effort.
            </p>
          </div>
          <ol className="space-y-2">
            {tests.map((test, index) => (
              <li key={test.id}>
                <Link href={`/app/${slug}/intelligence/signals/${test.id}`} className="block">
                  <Card interactive className="p-0">
                    <CardBody className="pt-3.5">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-[13px] tabular text-ghost">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium leading-snug text-ink">
                            {test.title}
                          </p>
                          {test.successMetric ? (
                            <p className="mt-1 text-[11.5px] text-ghost">
                              Read on: {test.successMetric}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[15px] font-medium text-ink">What this drew on</h2>
        <Card>
          <CardBody className="pt-4">
            <ul className="space-y-2">
              {sources.map((source, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12.5px]">
                  <span className="text-muted">{source.label}</span>
                  <span className="text-ghost">
                    {RUN_SOURCE_KIND_META[source.kind as RunSourceKind]?.label ?? source.kind}
                  </span>
                  <span className="ml-auto text-ghost">
                    {source.status === "collected"
                      ? `${source.itemsCollected} item${source.itemsCollected === 1 ? "" : "s"}`
                      : RUN_SOURCE_STATUS_META[source.status as RunSourceStatus]?.label ??
                        source.status}
                  </span>
                </li>
              ))}
            </ul>
            {unavailable.length > 0 ? (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[12px] font-medium text-warning">
                  Not collectable this cycle
                </p>
                <ul className="mt-1.5 space-y-1">
                  {unavailable.map((source, i) => (
                    <li key={i} className="text-[12px] leading-relaxed text-faint">
                      <span className="text-muted">{source.label}</span>
                      {source.statusNote ? ` — ${source.statusNote}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

type BriefPayload = {
  summary?: string | null;
  sources?: {
    kind: string;
    label: string;
    status: string;
    statusNote: string | null;
    itemsCollected: number;
  }[];
  signals?: {
    id: string;
    kind: string;
    title: string;
    rationale: string | null;
    soWhat: string | null;
    confidence: number;
    editedByHuman: boolean;
    evidence: {
      id: string;
      title: string;
      url: string | null;
      sourceName: string | null;
      kind: string;
      capturedAt: string;
    }[];
  }[];
  tests?: { id: string; title: string; successMetric: string | null }[];
};

function parseBrief(value: string): BriefPayload | null {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as BriefPayload;
  } catch {
    return null;
  }
}
