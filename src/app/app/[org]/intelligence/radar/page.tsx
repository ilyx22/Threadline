import type { Metadata } from "next";
import { Radar } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { listCompetitors, listResearch, listTags, researchCounts } from "@/lib/data/research";
import { RESEARCH_KINDS, RESEARCH_KIND_META } from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter, SortFilter } from "@/components/app/filters";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompetitorPanel, ResearchList, NewResearchButton } from "./radar-client";

export const metadata: Metadata = { title: "Market Radar" };

export default async function RadarPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "research.view");

  const filters = {
    kind: readFilter(query, "kind"),
    tagIds: readFilter(query, "tag"),
    search: readSingle(query, "q"),
    sort: (readSingle(query, "sort") ?? "recent") as "recent" | "oldest" | "title",
  };

  const [items, competitors, tags, counts] = await Promise.all([
    listResearch(ctx.org.id, filters),
    listCompetitors(ctx.org.id),
    listTags(ctx.org.id),
    researchCounts(ctx.org.id),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const canEdit = ctx.can("research.edit");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Market Radar</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Competitor content, customer language, recurring questions and objections. Everything
            here is tagged, so any idea can be traced back to the evidence that justified it.
          </p>
        </div>
        {canEdit ? <NewResearchButton slug={slug} competitors={competitors} /> : null}
      </header>

      <Notice tone="neutral">
        Research is captured manually and from URLs. Automated collection adapters are defined but
        not connected in this version — see Settings, Integrations for what is and is not available.
      </Notice>

      <Tabs defaultValue="research">
        <TabsList>
          <TabsTrigger value="research" count={total}>
            Research
          </TabsTrigger>
          <TabsTrigger value="competitors" count={competitors.length}>
            Competitors
          </TabsTrigger>
          <TabsTrigger value="tags" count={tags.length}>
            Tags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-4 pt-6">
          <FilterBar>
            <FilterSearch placeholder="Search research" />
            <MultiFilter
              name="kind"
              label="Type"
              options={RESEARCH_KINDS.map((k) => ({
                value: k,
                label: RESEARCH_KIND_META[k].label,
                count: counts[k] ?? 0,
              }))}
            />
            {tags.length > 0 ? (
              <MultiFilter
                name="tag"
                label="Tag"
                options={tags.map((t) => ({ value: t.id, label: t.name, count: t.usage }))}
              />
            ) : null}
            <SortFilter
              defaultValue="recent"
              options={[
                { value: "recent", label: "Newest" },
                { value: "oldest", label: "Oldest" },
                { value: "title", label: "Title" },
              ]}
            />
          </FilterBar>
          <ActiveFilters labels={{ kind: "Type", tag: "Tag" }} />

          {items.length === 0 ? (
            <EmptyState
              icon={Radar}
              title={total === 0 ? "No research captured yet" : "Nothing matches those filters"}
              description={
                total === 0
                  ? "Capture what competitors publish, what customers actually say, the questions you keep being asked, and the objections you keep hearing. Twenty specific items beat a hundred generic ones."
                  : `${total} research items exist in this workspace.`
              }
              action={
                total === 0 && canEdit ? (
                  <NewResearchButton slug={slug} competitors={competitors} />
                ) : undefined
              }
              compact={total > 0}
            />
          ) : (
            <ResearchList
              slug={slug}
              canEdit={canEdit}
              competitors={competitors.map((c) => ({ id: c.id, name: c.name }))}
              items={items.map((item) => ({
                id: item.id,
                kind: item.kind,
                title: item.title,
                body: item.body,
                url: item.url,
                sourceName: item.sourceName,
                author: item.author,
                platform: item.platform,
                competitorId: item.competitorId,
                competitorName: item.competitor?.name ?? null,
                tags: item.tagList.map((t) => t.name),
                metrics: item.metricValues,
                capturedAt: item.capturedAt.toISOString(),
                usedByIdeas: item._count.ideaLinks,
                usedBySignals: item._count.evidenceFor,
              }))}
            />
          )}
        </TabsContent>

        <TabsContent value="competitors" className="pt-6">
          <CompetitorPanel
            slug={slug}
            canEdit={canEdit}
            competitors={competitors.map((c) => ({
              id: c.id,
              name: c.name,
              url: c.url,
              positioning: c.positioning,
              notes: c.notes,
              threatLevel: c.threatLevel,
              itemCount: c._count.researchItems,
            }))}
          />
        </TabsContent>

        <TabsContent value="tags" className="pt-6">
          {tags.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="No tags yet"
              description="Tags are created automatically when you tag a research item."
              compact
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-elevated px-3 py-1.5 text-[12.5px] text-muted"
                >
                  {tag.name}
                  <span className="tabular text-ghost">{tag.usage}</span>
                </span>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
