import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { applicationCounts, listApplications } from "@/lib/data/admin";
import { APPLICATION_STATUSES, APPLICATION_STATUS_META } from "@/lib/domain/enums";
import { parseStringArray } from "@/lib/db/json";
import { readFilter, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, MultiFilter } from "@/components/app/filters";
import { EmptyState } from "@/components/ui/feedback";
import { ApplicationList } from "./applications-client";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireInternal("admin.applications");
  const query = await searchParams;

  const [applications, counts] = await Promise.all([
    listApplications(readFilter(query, "status")),
    applicationCounts(),
  ]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const [staffRows, orgs] = await Promise.all([
    prisma.membership.findMany({ where: { role: { in: ["internal_operator", "super_admin"] }, status: "active", org: { kind: "internal" } }, select: { user: { select: { id: true, name: true } } } }),
    prisma.organization.findMany({ where: { id: { in: applications.map((a) => a.orgId).filter((x): x is string => Boolean(x)) } }, select: { id: true, slug: true } }),
  ]);
  const staff = [...new Map(staffRows.map((s) => [s.user.id, s.user])).values()];
  const slugOf = new Map(orgs.map((o) => [o.id, o.slug]));

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Applications</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Inbound from the marketing site. Qualify against the ICP before booking a call — protecting
          delivery capacity is the point of an application process.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-2.5">
        {APPLICATION_STATUSES.map((status) => (
          <div key={status} className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-medium tabular text-ink">{counts[status] ?? 0}</span>
            <span className="text-[12px] text-faint">{APPLICATION_STATUS_META[status].label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <FilterBar>
          <MultiFilter
            name="status"
            label="Status"
            options={APPLICATION_STATUSES.map((s) => ({
              value: s,
              label: APPLICATION_STATUS_META[s].label,
              count: counts[s] ?? 0,
            }))}
          />
        </FilterBar>
        <ActiveFilters labels={{ status: "Status" }} />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={total === 0 ? "No applications yet" : "Nothing matches that filter"}
          description={
            total === 0
              ? "Applications submitted through the marketing site land here."
              : `${total} applications received.`
          }
          compact={total > 0}
        />
      ) : (
        <ApplicationList
          staff={staff}
          applications={applications.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email,
            company: a.company,
            website: a.website,
            whatYouSell: a.whatYouSell,
            revenueRange: a.revenueRange,
            contentProcess: a.contentProcess,
            peopleInvolved: a.peopleInvolved,
            publishCadence: a.publishCadence,
            biggestBottleneck: a.biggestBottleneck,
            founderHours: a.founderHours,
            platforms: parseStringArray(a.platforms),
            successLooksLike: a.successLooksLike,
            urgency: a.urgency,
            extra: a.extra,
            status: a.status,
            reviewNotes: a.reviewNotes,
            createdAt: a.createdAt.toISOString(),
            ownerId: a.ownerId,
            nextAction: a.nextAction,
            nextActionDue: a.nextActionDue ? a.nextActionDue.toISOString().slice(0, 10) : null,
            outcome: a.outcome,
            outcomeReason: a.outcomeReason,
            clientSlug: a.orgId ? (slugOf.get(a.orgId) ?? null) : null,
          }))}
        />
      )}
    </div>
  );
}
