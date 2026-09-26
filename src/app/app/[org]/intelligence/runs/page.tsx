import type { Metadata } from "next";
import Link from "next/link";
import { Telescope } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { SchedulesPanel } from "./schedules-panel";
import { prisma } from "@/lib/db/client";
import { listRuns, rankedTests, runCounts } from "@/lib/data/runs";
import { RUN_STATUS_META, RUN_STATUS_OPTIONS, type RunStatus } from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { formatDate, relativeTime } from "@/lib/utils/dates";
import { NewRunButton } from "./run-actions";

export const metadata: Metadata = { title: "Intelligence" };

export default async function RunsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  // A client reads briefs here; the repository narrows to published for them.
  const ctx = await requireOrgPage(slug, "workspace.view");

  const filters = { status: readFilter(query, "status"), search: readSingle(query, "q") };
  const [runs, counts, tests] = await Promise.all([
    listRuns(ctx.org.id, ctx.role, filters),
    ctx.isInternal ? runCounts(ctx.org.id) : Promise.resolve({} as Record<string, number>),
    rankedTests(ctx.org.id, ctx.role, 5),
  ]);

  const canManage = ctx.can("runs.manage");
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const open = runs.find((r) => r.status !== "published" && r.status !== "archived");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Intelligence</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Each cycle reads your market from declared sources, proposes signals with the evidence
            behind them, and turns the ones you approve into ranked tests. Nothing here reaches your
            strategy until a person decides on it.
          </p>
        </div>
        {canManage ? <NewRunButton slug={slug} disabled={Boolean(open)} /> : null}
      </header>

      {open && canManage ? (
        <Notice tone="info" icon={Telescope} title={`"${open.label}" is open`}>
          One cycle runs at a time, so it stays clear which view of the market the plan came from.{" "}
          <Link
            href={`/app/${slug}/intelligence/runs/${open.id}`}
            className="text-accent underline underline-offset-2"
          >
            Continue it
          </Link>
          .
        </Notice>
      ) : null}

      {tests.length > 0 ? (
        <Card>
          <CardBody className="pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-eyebrow text-faint">What we are doing because of it</p>
              <Link
                href={`/app/${slug}/intelligence/signals?kind=test`}
                className="text-[12px] text-muted hover:text-ink"
              >
                All tests
              </Link>
            </div>
            <ol className="mt-3 space-y-2">
              {tests.map((test, index) => (
                <li key={test.id} className="flex items-start gap-3">
                  <span className="mt-px w-4 shrink-0 text-[12px] tabular text-ghost">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/app/${slug}/intelligence/signals/${test.id}`}
                      className="text-[13.5px] font-medium leading-snug text-ink hover:text-accent"
                    >
                      {test.title}
                    </Link>
                    <p className="mt-0.5 text-[11.5px] text-ghost">
                      {test.successMetric ? `Read on: ${test.successMetric}` : "No read defined"}
                      {test.derivedFrom ? ` · from "${test.derivedFrom.title}"` : ""}
                      {test._count.ideas > 0
                        ? ` · ${test._count.ideas} idea${test._count.ideas === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                  <Badge tone="outline">{test.score.toFixed(0)}</Badge>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ) : null}

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search runs" />
          <MultiFilter
            name="status"
            label="Status"
            options={RUN_STATUS_OPTIONS.map((o) => ({ ...o, count: counts[o.value] ?? 0 }))}
          />
        </FilterBar>
        <ActiveFilters labels={{ status: "Status" }} />
      </div>

      {runs.length === 0 ? (
        <EmptyState
          icon={Telescope}
          title={total === 0 ? "No intelligence cycles yet" : "Nothing matches those filters"}
          description={
            total === 0
              ? "A cycle starts by declaring what it will read: competitors, creators, categories, sales-call notes, customer language, your own published content and your own results. Nothing is scraped in the background — every source is either supplied by a person or already in this workspace."
              : `${total} run${total === 1 ? "" : "s"} exist in this workspace.`
          }
          action={total === 0 && canManage ? <NewRunButton slug={slug} /> : undefined}
          compact={total > 0}
        />
      ) : (
        <ul className="space-y-2">
          {runs.map((run) => {
            const meta = RUN_STATUS_META[run.status as RunStatus] ?? RUN_STATUS_META.scoping;
            const isBrief = run.status === "published";
            return (
              <li key={run.id}>
                <Link href={`/app/${slug}/intelligence/runs/${run.id}`} className="block">
                  <Card interactive className="p-0">
                    <CardBody className="pt-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          <span className="text-[11.5px] text-ghost">
                            {formatDate(run.periodStart)} – {formatDate(run.periodEnd)}
                          </span>
                        </div>
                        <span className="text-[11.5px] text-ghost">
                          {isBrief && run.publishedAt
                            ? `Published ${relativeTime(run.publishedAt)}`
                            : relativeTime(run.updatedAt)}
                        </span>
                      </div>

                      <p className="mt-2.5 text-[15px] font-medium leading-snug text-ink">
                        {run.label}
                      </p>
                      {run.summary ? (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                          {run.summary}
                        </p>
                      ) : run.focus ? (
                        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-faint">
                          Focus: {run.focus}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ghost">
                        <span>{run._count.sources} sources</span>
                        <span>{run._count.research} evidence</span>
                        <span>{run._count.candidates} candidates</span>
                        <span className="text-positive">{run.approvedCount} approved</span>
                        {run.testCount > 0 ? <span>{run.testCount} tests</span> : null}
                        {run.createdBy ? (
                          <span className="ml-auto">Run by {run.createdBy.name}</span>
                        ) : null}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {ctx.can("runs.manage") ? (
        <SchedulesPanel
          slug={slug}
          rows={(await prisma.researchSchedule.findMany({ where: { orgId: ctx.org.id }, orderBy: { createdAt: "desc" }, take: 20 })).map((r) => ({ id: r.id, label: r.label, cadenceDays: r.cadenceDays, active: r.active, nextRunAt: r.nextRunAt.toISOString(), lastOutcome: r.lastOutcome }))}
        />
      ) : null}
    </div>
  );
}
