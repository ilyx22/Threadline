import type { Metadata } from "next";
import { Send } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import {
  distributionCalendar,
  distributionCounts,
  listPublishRecords,
  listSocialAccounts,
  schedulingQueue,
} from "@/lib/data/distribution";
import { PLATFORM_OPTIONS, PUBLISH_STATUSES, PUBLISH_STATUS_META } from "@/lib/domain/enums";
import { readFilter, readSingle, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, FilterSearch, MultiFilter } from "@/components/app/filters";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { DistributionView } from "./distribution-view";

export const metadata: Metadata = { title: "Distribution" };

export default async function DistributionPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { org: slug } = await params;
  const query = await searchParams;
  const ctx = await requireOrgPage(slug, "distribution.view");

  const monthParam = readSingle(query, "month");
  const month = monthParam ? new Date(`${monthParam}-01T12:00:00`) : new Date();
  const safeMonth = Number.isNaN(month.getTime()) ? new Date() : month;

  const filters = {
    status: readFilter(query, "status"),
    platform: readFilter(query, "platform"),
    search: readSingle(query, "q"),
  };

  const [records, calendar, counts, accounts, queue] = await Promise.all([
    listPublishRecords(ctx.org.id, filters),
    distributionCalendar(ctx.org.id, safeMonth),
    distributionCounts(ctx.org.id),
    listSocialAccounts(ctx.org.id),
    schedulingQueue(ctx.org.id),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Distribution</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          What goes out, where and when. Publishing is manual in this version — Threadline prepares
          everything and records the live URL, which is what makes performance tracking and
          attribution possible.
        </p>
      </header>

      <Notice tone="neutral">
        No social platform is connected. Every publishing API requires credentials or platform
        approval that only you can obtain, so Threadline does not pretend to have them. See{" "}
        <a href={`/app/${slug}/settings/integrations`} className="text-accent hover:underline">
          Settings, Integrations
        </a>{" "}
        for what each provider needs.
      </Notice>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-2.5">
        {PUBLISH_STATUSES.map((status) => (
          <div key={status} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-medium tabular text-ink">{counts[status] ?? 0}</span>
            <span className="text-[12px] text-faint">{PUBLISH_STATUS_META[status].label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <FilterBar>
          <FilterSearch placeholder="Search content" />
          <MultiFilter
            name="status"
            label="Status"
            options={PUBLISH_STATUSES.map((s) => ({
              value: s,
              label: PUBLISH_STATUS_META[s].label,
              count: counts[s] ?? 0,
            }))}
          />
          <MultiFilter name="platform" label="Platform" options={PLATFORM_OPTIONS} />
        </FilterBar>
        <ActiveFilters labels={{ status: "Status", platform: "Platform" }} />
      </div>

      {total === 0 && queue.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Nothing scheduled"
          description="Approved content becomes schedulable once it has been packaged for a destination."
        />
      ) : (
        <DistributionView
          slug={slug}
          canEdit={ctx.can("distribution.edit")}
          canPublish={ctx.can("distribution.publish")}
          month={`${safeMonth.getFullYear()}-${String(safeMonth.getMonth() + 1).padStart(2, "0")}`}
          monthLabel={safeMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          calendar={calendar.cells.map((cell) => ({
            date: cell.date.toISOString(),
            inMonth: cell.inMonth,
            records: cell.records.map((r) => ({
              id: r.id,
              title: r.contentItem.title,
              contentItemId: r.contentItem.id,
              platform: r.platform,
              status: r.status,
            })),
          }))}
          records={records.map((r) => ({
            id: r.id,
            contentItemId: r.contentItem.id,
            title: r.contentItem.title,
            platform: r.platform,
            status: r.status,
            method: r.method,
            scheduledFor: r.scheduledFor ? r.scheduledFor.toISOString() : null,
            publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
            url: r.url,
            accountHandle: r.account?.handle ?? null,
            hasPackage: Boolean(r.package),
            providerStatus: r.providerStatus,
            failureReason: r.failureReason,
            views: r.snapshots[0]?.views ?? null,
          }))}
          queue={queue.map((item) => ({
            id: item.id,
            title: item.title,
            platform: item.platform,
            packages: item.packages.map((p) => p.platform),
          }))}
          accounts={accounts.map((a) => ({
            id: a.id,
            platform: a.platform,
            handle: a.handle,
            isConnected: a.isConnected,
          }))}
        />
      )}
    </div>
  );
}
