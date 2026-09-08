import type { Metadata } from "next";
import { Video } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { assignableEditors, contentBoard, contentCounts } from "@/lib/data/content";
import { CONTENT_STAGES, CONTENT_STAGE_META, PLATFORM_OPTIONS, PRIORITY_OPTIONS } from "@/lib/domain/enums";
import { readBool, readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { EmptyState } from "@/components/ui/feedback";
import { ProductionBoard } from "./production-board";

export const metadata: Metadata = { title: "Production" };

export default async function ProductionPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "production.view");

  const filters = {
    stage: readFilter(query, "stage"),
    platform: readFilter(query, "platform"),
    priority: readFilter(query, "priority"),
    editorId: readSingle(query, "editor"),
    search: readSingle(query, "q"),
    overdue: readBool(query, "overdue"),
  };

  const [board, counts, editors] = await Promise.all([
    contentBoard(ctx.org.id, filters),
    contentCounts(ctx.org.id),
    assignableEditors(ctx.org.id),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Production</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Raw footage through to live. Every stage change is recorded with who did it and when, and
          a revision request always carries a reason.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-2.5">
        {CONTENT_STAGES.map((stage) => (
          <div key={stage} className="flex items-baseline gap-1.5">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: CONTENT_STAGE_META[stage].color }}
              aria-hidden
            />
            <span className="text-[15px] font-medium tabular text-ink">{counts[stage] ?? 0}</span>
            <span className="text-[12px] text-faint">{CONTENT_STAGE_META[stage].label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search content" />
          <MultiFilter
            name="stage"
            label="Stage"
            options={CONTENT_STAGES.map((s) => ({
              value: s,
              label: CONTENT_STAGE_META[s].label,
              count: counts[s] ?? 0,
            }))}
          />
          <MultiFilter name="platform" label="Platform" options={PLATFORM_OPTIONS} />
          <MultiFilter name="priority" label="Priority" options={PRIORITY_OPTIONS} />
        </FilterBar>
        <ActiveFilters labels={{ stage: "Stage", platform: "Platform", priority: "Priority" }} />
      </div>

      {board.total === 0 ? (
        <EmptyState
          icon={Video}
          title={total === 0 ? "Nothing in production" : "Nothing matches those filters"}
          description={
            total === 0
              ? "Content enters production when an approved script is sent to the recording queue and the founder records it."
              : `${total} pieces exist in this workspace.`
          }
          compact={total > 0}
        />
      ) : (
        <ProductionBoard
          slug={slug}
          canEdit={ctx.can("production.edit")}
          canApprove={ctx.can("production.approve")}
          canAssign={ctx.can("production.assign")}
          editors={editors.map((e) => ({ id: e.id, name: e.name, avatarHue: e.avatarHue }))}
          columns={board.columns.map((column) => ({
            stage: column.stage,
            items: column.items.map((item) => ({
              id: item.id,
              title: item.title,
              stage: item.stage,
              platform: item.platform,
              format: item.format,
              priority: item.priority,
              dueDate: item.dueDate ? item.dueDate.toISOString() : null,
              revisionCount: item.revisionCount,
              editorName: item.editor?.name ?? null,
              editorId: item.editorId,
              editorHue: item.editor?.avatarHue ?? 210,
              assetCount: item._count.assets,
              packageCount: item._count.packages,
              publishCount: item._count.publishRecords,
              pillar: item.idea?.pillar ?? null,
              hasScript: Boolean(item.scriptId),
            })),
          }))}
        />
      )}
    </div>
  );
}
