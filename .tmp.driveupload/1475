import type { Metadata } from "next";
import { LifeBuoy } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { listClients, listSupportIssues } from "@/lib/data/admin";
import { prisma } from "@/lib/db/client";
import { ISSUE_STATUSES, ISSUE_STATUS_META, SEVERITY_OPTIONS } from "@/lib/domain/enums";
import { readFilter, type RawSearchParams } from "@/lib/utils/search-params";
import { ActiveFilters, FilterBar, MultiFilter } from "@/components/app/filters";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { IssueBoard, NewIssueButton } from "./support-client";

export const metadata: Metadata = { title: "Support" };

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireInternal("admin.support");
  const query = await searchParams;

  const [issues, clients, staff] = await Promise.all([
    listSupportIssues({
      status: readFilter(query, "status"),
      severity: readFilter(query, "severity"),
    }),
    listClients(),
    prisma.membership.findMany({
      where: { role: { in: ["internal_operator", "super_admin"] } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const owners = [...new Map(staff.map((s) => [s.user.id, s.user])).values()];
  const openCount = issues.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Support</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            Every issue, who owns it, and what it became. The flags matter: an issue solved twice
            should become an SOP or a product fix, not a third manual fix.
          </p>
        </div>
        <NewIssueButton
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          owners={owners}
        />
      </header>

      <div className="space-y-3">
        <FilterBar>
          <MultiFilter
            name="status"
            label="Status"
            options={ISSUE_STATUSES.map((s) => ({ value: s, label: ISSUE_STATUS_META[s].label }))}
          />
          <MultiFilter name="severity" label="Severity" options={SEVERITY_OPTIONS} />
        </FilterBar>
        <ActiveFilters labels={{ status: "Status", severity: "Severity" }} />
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No issues logged"
          description="Log anything that cost a client or an operator time. The pattern across issues is what tells you where the product is weak."
        />
      ) : (
        <>
          {openCount > 0 ? (
            <Notice tone="neutral">
              {openCount} open {openCount === 1 ? "issue" : "issues"}. Anything flagged as an SOP or
              product fix should have a follow-up created before it is resolved.
            </Notice>
          ) : null}
          <IssueBoard
            issues={issues.map((issue) => ({
              id: issue.id,
              title: issue.title,
              description: issue.description,
              severity: issue.severity,
              status: issue.status,
              orgId: issue.orgId,
              orgName: issue.org?.name ?? null,
              ownerId: issue.ownerId,
              ownerName: issue.owner?.name ?? null,
              resolution: issue.resolution,
              becomesSop: issue.becomesSop,
              becomesFix: issue.becomesFix,
              createdAt: issue.createdAt.toISOString(),
              resolvedAt: issue.resolvedAt ? issue.resolvedAt.toISOString() : null,
            }))}
            clients={clients.map((c) => ({ id: c.id, name: c.name }))}
            owners={owners}
          />
        </>
      )}
    </div>
  );
}
