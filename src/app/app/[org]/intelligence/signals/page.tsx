import type { Metadata } from "next";
import Link from "next/link";
import { Signal } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { listPatterns, patternCounts } from "@/lib/data/patterns";
import { isLiveAi } from "@/lib/ai";
import {
  PATTERN_KINDS,
  PATTERN_KIND_META,
  PATTERN_STATUS_OPTIONS,
} from "@/lib/domain/enums";
import { patternBand } from "@/lib/domain/scoring";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PatternKindBadge, PatternStatusBadge } from "@/components/ui/status";
import { relativeTime } from "@/lib/utils/dates";
import { DeriveLearningsButton, NewSignalButton } from "./signal-actions";

export const metadata: Metadata = { title: "Signals" };

export default async function SignalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "signals.view");

  const filters = {
    kind: readFilter(query, "kind"),
    status: readFilter(query, "status"),
    search: readSingle(query, "q"),
  };

  const [patterns, counts] = await Promise.all([
    listPatterns(ctx.org.id, filters),
    patternCounts(ctx.org.id),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const canEdit = ctx.can("signals.edit");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Signals</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Research on its own is not valuable. This is where observations become patterns,
            patterns become hypotheses, and hypotheses become learnings that change what gets made
            next.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? <NewSignalButton slug={slug} /> : null}
          {canEdit ? <DeriveLearningsButton slug={slug} isLive={isLiveAi()} /> : null}
        </div>
      </header>

      {/* The lifecycle, made explicit */}
      <div className="flex flex-wrap items-stretch gap-2">
        {PATTERN_KINDS.map((kind, i) => (
          <div
            key={kind}
            className="flex min-w-[9rem] flex-1 items-center gap-3 rounded-lg border border-line bg-elevated px-3.5 py-2.5"
          >
            <span className="text-[19px] font-medium tabular text-ink">{counts[kind] ?? 0}</span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-ink">{PATTERN_KIND_META[kind].label}</p>
              <p className="truncate text-[11px] text-ghost">
                {i === 0
                  ? "Not yet a pattern"
                  : i === 1
                    ? "Repeated"
                    : i === 2
                      ? "Worth testing"
                      : i === 3
                        ? "Running"
                        : "Changes what we make"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search signals" />
          <MultiFilter
            name="kind"
            label="Kind"
            options={PATTERN_KINDS.map((k) => ({
              value: k,
              label: PATTERN_KIND_META[k].label,
              count: counts[k] ?? 0,
            }))}
          />
          <MultiFilter name="status" label="Status" options={PATTERN_STATUS_OPTIONS} />
        </FilterBar>
        <ActiveFilters labels={{ kind: "Kind", status: "Status" }} />
      </div>

      {patterns.length === 0 ? (
        <EmptyState
          icon={Signal}
          title={total === 0 ? "No signals yet" : "Nothing matches those filters"}
          description={
            total === 0
              ? "Signals are created manually from an observation, or derived automatically once there is enough published performance data to support a conclusion."
              : `${total} signals exist in this workspace.`
          }
          action={total === 0 && canEdit ? <NewSignalButton slug={slug} /> : undefined}
          secondaryAction={
            total === 0 && canEdit ? <DeriveLearningsButton slug={slug} isLive={isLiveAi()} /> : undefined
          }
          compact={total > 0}
        />
      ) : (
        <ul className="space-y-2">
          {patterns.map((pattern) => {
            const band = patternBand(pattern.score);
            return (
              <li key={pattern.id}>
                <Link href={`/app/${slug}/intelligence/signals/${pattern.id}`} className="block">
                  <Card interactive className="p-0">
                    <CardBody className="pt-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <PatternKindBadge kind={pattern.kind} />
                          <PatternStatusBadge status={pattern.status} />
                          {pattern.detectedBy === "performance_loop" ? (
                            <Badge tone="outline">Derived from performance</Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={band.tone}>{band.label}</Badge>
                          <span className="text-[13px] font-medium tabular text-ink">
                            {pattern.score.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[14px] font-medium leading-snug text-ink">
                        {pattern.title}
                      </p>
                      {pattern.description ? (
                        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                          {pattern.description}
                        </p>
                      ) : null}

                      {pattern.nextExperiment ? (
                        <p className="mt-2.5 border-l-2 border-accent-line pl-2.5 text-[12.5px] leading-relaxed text-faint">
                          <span className="text-accent">Next:</span> {pattern.nextExperiment}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ghost">
                        <span>Confidence {pattern.confidence}%</span>
                        <span>Impact {pattern.impact}/5</span>
                        <span>Effort {pattern.effort}/5</span>
                        <span>{pattern._count.evidence} evidence</span>
                        {pattern._count.ideas > 0 ? <span>{pattern._count.ideas} ideas</span> : null}
                        <span className="ml-auto">{relativeTime(pattern.updatedAt)}</span>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
