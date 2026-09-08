import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { ideaCounts, ideaPillars, listIdeas } from "@/lib/data/ideas";
import { isLiveAi } from "@/lib/ai";
import {
  COMMERCIAL_INTENT_OPTIONS,
  FORMAT_OPTIONS,
  IDEA_STATUSES,
  IDEA_STATUS_META,
  PLATFORM_OPTIONS,
} from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter, SortFilter } from "@/components/app/filters";
import { EmptyState } from "@/components/ui/feedback";
import { IdeaBoard } from "./idea-board";
import { GenerateIdeasButton, NewIdeaButton } from "./idea-actions";

export const metadata: Metadata = { title: "Ideas" };

export default async function IdeasPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "ideas.view");

  const filters = {
    status: readFilter(query, "status"),
    platform: readFilter(query, "platform"),
    format: readFilter(query, "format"),
    pillar: readFilter(query, "pillar"),
    commercialIntent: readFilter(query, "intent"),
    search: readSingle(query, "q"),
    sort: (readSingle(query, "sort") ?? "priority") as "priority" | "recent" | "title" | "novelty",
  };

  const [ideas, counts, pillars] = await Promise.all([
    listIdeas(ctx.org.id, filters),
    ideaCounts(ctx.org.id),
    ideaPillars(ctx.org.id),
  ]);

  const hasFilters = Boolean(
    filters.status || filters.platform || filters.format || filters.pillar || filters.search,
  );

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Ideas</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Every idea is scored on relevance, novelty, proof strength and format fit, then ranked.
            The job here is to shortlist, not to invent.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ctx.can("ideas.create") ? <NewIdeaButton slug={slug} pillars={pillars} /> : null}
          {ctx.can("ai.generate") ? (
            <GenerateIdeasButton slug={slug} isLive={isLiveAi()} />
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-2.5">
        {IDEA_STATUSES.map((status) => (
          <div key={status} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-medium tabular text-ink">{counts[status] ?? 0}</span>
            <span className="text-[12px] text-faint">{IDEA_STATUS_META[status].label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search ideas" />
          <MultiFilter
            name="status"
            label="Status"
            options={IDEA_STATUSES.map((s) => ({
              value: s,
              label: IDEA_STATUS_META[s].label,
              count: counts[s] ?? 0,
            }))}
          />
          <MultiFilter name="platform" label="Platform" options={PLATFORM_OPTIONS} />
          <MultiFilter name="format" label="Format" options={FORMAT_OPTIONS} />
          {pillars.length > 0 ? (
            <MultiFilter
              name="pillar"
              label="Pillar"
              options={pillars.map((p) => ({ value: p, label: p }))}
            />
          ) : null}
          <MultiFilter name="intent" label="Intent" options={COMMERCIAL_INTENT_OPTIONS} />
          <SortFilter
            defaultValue="priority"
            options={[
              { value: "priority", label: "Priority" },
              { value: "recent", label: "Newest" },
              { value: "novelty", label: "Novelty" },
              { value: "title", label: "Title" },
            ]}
          />
        </FilterBar>

        <ActiveFilters
          labels={{
            status: "Status",
            platform: "Platform",
            format: "Format",
            pillar: "Pillar",
            intent: "Intent",
          }}
        />
      </div>

      {ideas.length === 0 ? (
        total === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No ideas yet"
            description="Ideas are generated from the Brand Brain, market research and what has already performed. Generate a first set, or add one manually."
            action={
              ctx.can("ai.generate") ? <GenerateIdeasButton slug={slug} isLive={isLiveAi()} /> : undefined
            }
            secondaryAction={
              ctx.can("ideas.create") ? <NewIdeaButton slug={slug} pillars={pillars} variant="secondary" /> : undefined
            }
          />
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="Nothing matches those filters"
            description={`${total} ideas exist in this workspace. Try clearing a filter.`}
            compact
          />
        )
      ) : (
        <IdeaBoard
          slug={slug}
          ideas={ideas.map((idea) => ({
            id: idea.id,
            title: idea.title,
            concept: idea.concept,
            angle: idea.angle,
            hookConcept: idea.hookConcept,
            pillar: idea.pillar,
            platform: idea.platform,
            format: idea.format,
            status: idea.status,
            source: idea.source,
            commercialIntent: idea.commercialIntent,
            priorityScore: idea.priorityScore,
            noveltyScore: idea.noveltyScore,
            relevanceScore: idea.relevanceScore,
            proofStrength: idea.proofStrength,
            formatFit: idea.formatFit,
            evidenceCount: idea._count.evidence,
            scriptCount: idea._count.scripts,
            patternTitle: idea.pattern?.title ?? null,
            createdAt: idea.createdAt,
          }))}
          canApprove={ctx.can("ideas.approve")}
          canEdit={ctx.can("ideas.create")}
          filtered={hasFilters}
        />
      )}
    </div>
  );
}
