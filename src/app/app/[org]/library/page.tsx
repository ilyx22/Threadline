import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { contentScope } from "@/lib/team/scope";
import { assetCounts, listAssets } from "@/lib/data/workspace";
import { listContent } from "@/lib/data/content";
import { ASSET_CATEGORIES, ASSET_CATEGORY_META } from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { EmptyState } from "@/components/ui/feedback";
import { LibraryGrid, LibraryUploadButtons } from "./library-client";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "library.view");

  const filters = {
    category: readFilter(query, "category"),
    search: readSingle(query, "q"),
  };

  const scope = await contentScope(ctx.org.id, ctx.user.id, ctx.role);
  const [assets, counts, content] = await Promise.all([
    listAssets(ctx.org.id, { ...filters, scope: scope ? { ids: scope, userId: ctx.user.id } : undefined }),
    assetCounts(ctx.org.id),
    listContent(ctx.org.id, { ids: scope ?? undefined }),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const canUpload = ctx.can("library.upload");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Library</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Every asset and document in one searchable place — raw media, edits, transcripts,
            research, proof, brand assets and reports.
          </p>
        </div>
        {canUpload ? (
          <LibraryUploadButtons
            slug={slug}
            content={content.map((c) => ({ id: c.id, title: c.title }))}
          />
        ) : null}
      </header>

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search the library" />
          <MultiFilter
            name="category"
            label="Category"
            options={ASSET_CATEGORIES.filter((c) => (counts[c] ?? 0) > 0).map((c) => ({
              value: c,
              label: ASSET_CATEGORY_META[c].label,
              count: counts[c] ?? 0,
            }))}
          />
        </FilterBar>
        <ActiveFilters labels={{ category: "Category" }} />
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={total === 0 ? "The library is empty" : "Nothing matches those filters"}
          description={
            total === 0
              ? "Files uploaded against content appear here automatically. You can also add documents and links directly — testimonials, case studies, brand assets and offer docs all strengthen what the system produces."
              : `${total} items exist in this library.`
          }
          action={
            total === 0 && canUpload ? (
              <LibraryUploadButtons
                slug={slug}
                content={content.map((c) => ({ id: c.id, title: c.title }))}
              />
            ) : undefined
          }
          compact={total > 0}
        />
      ) : (
        <LibraryGrid
          slug={slug}
          canManage={canUpload}
          assets={assets.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            category: a.category,
            fileName: a.fileName,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            storagePath: a.storagePath,
            processingState: a.processingState,
            externalUrl: a.externalUrl,
            version: a.version,
            tags: a.tagList,
            uploadedBy: a.uploadedBy?.name ?? null,
            contentItemId: a.contentItemId,
            contentTitle: a.contentItem?.title ?? null,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
