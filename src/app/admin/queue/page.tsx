import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, FileText, LifeBuoy, Mic, Radar, RotateCcw } from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { operatorQueue } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { SeverityBadge, IssueStatusBadge } from "@/components/ui/status";
import { dueLabel, relativeTime } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Operator queue" };

export default async function QueuePage() {
  await requireInternal("admin.view");
  const queue = await operatorQueue();

  if (queue.total === 0) {
    return (
      <div className="space-y-6">
        <header className="max-w-2xl">
          <h1 className="text-section">Operator queue</h1>
          <p className="mt-2 text-[14px] text-muted">
            Everything needing a Threadline operator, across every client.
          </p>
        </header>
        <EmptyState
          icon={CheckCircle2}
          title="The queue is clear"
          description="Nothing is overdue, blocked or waiting across any client workspace."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Operator queue</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Everything needing a Threadline operator, across every client. Ordered by how long it has
          been waiting.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Overdue approvals */}
        <Card className={queue.overdueApprovals.length > 0 ? "border-negative/25" : undefined}>
          <CardHeader
            title="Overdue approvals"
            eyebrow={`${queue.overdueApprovals.length}`}
            description="Waiting on the founder past their due date."
          />
          <CardBody className="pt-0">
            {queue.overdueApprovals.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-faint">Nothing overdue.</p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.overdueApprovals.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <Clock className="size-3.5 shrink-0 text-negative" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/${item.org.slug}/production/${item.id}`}
                        className="block truncate text-[13px] text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ghost">{item.org.name}</p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-negative">
                      {dueLabel(item.dueDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Blocked production */}
        <Card>
          <CardHeader
            title="Blocked production"
            eyebrow={`${queue.blockedProduction.length}`}
            description="Changes requested more than three days ago and not yet actioned."
          />
          <CardBody className="pt-0">
            {queue.blockedProduction.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-faint">Nothing blocked.</p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.blockedProduction.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <RotateCcw className="size-3.5 shrink-0 text-warning" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/${item.org.slug}/production/${item.id}`}
                        className="block truncate text-[13px] text-ink transition-colors hover:text-accent"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ghost">
                        {item.org.name}
                        {item.editor ? ` · ${item.editor.name}` : " · unassigned"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-ghost">
                      {relativeTime(item.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Missing recordings */}
        <Card>
          <CardHeader
            title="Missing recordings"
            eyebrow={`${queue.missingRecordings.length}`}
            description="Approved scripts the founder has not recorded in over five days."
          />
          <CardBody className="pt-0">
            {queue.missingRecordings.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-faint">Recording queue is moving.</p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.missingRecordings.map((script) => (
                  <li key={script.id} className="flex items-center gap-3 py-2.5">
                    <Mic className="size-3.5 shrink-0 text-warning" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/${script.org.slug}/create/scripts/${script.id}`}
                        className="block truncate text-[13px] text-ink transition-colors hover:text-accent"
                      >
                        {script.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ghost">{script.org.name}</p>
                    </div>
                    <span className="shrink-0 text-[11.5px] text-ghost">
                      {relativeTime(script.updatedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Reports due */}
        <Card>
          <CardHeader
            title="Reports due"
            eyebrow={`${queue.reportsDue.length}`}
            description="Active clients with no report in the last seven days."
          />
          <CardBody className="pt-0">
            {queue.reportsDue.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-faint">All reports are current.</p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.reportsDue.map((org) => (
                  <li key={org.id} className="flex items-center gap-3 py-2.5">
                    <FileText className="size-3.5 shrink-0 text-faint" aria-hidden />
                    <Link
                      href={`/app/${org.slug}/reports`}
                      className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                    >
                      {org.name}
                    </Link>
                    <Badge tone="outline">
                      {org.weeklyReports[0]
                        ? `last ${relativeTime(org.weeklyReports[0].periodStart)}`
                        : "never"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Stale research */}
        <Card>
          <CardHeader
            title="Research going stale"
            eyebrow={`${queue.staleResearch.length}`}
            description="No new research captured in three weeks. Output quality degrades from here."
          />
          <CardBody className="pt-0">
            {queue.staleResearch.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-faint">Research is current.</p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.staleResearch.map((org) => (
                  <li key={org.id} className="flex items-center gap-3 py-2.5">
                    <Radar className="size-3.5 shrink-0 text-warning" aria-hidden />
                    <Link
                      href={`/app/${org.slug}/intelligence/radar`}
                      className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                    >
                      {org.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Support issues */}
        <Card>
          <CardHeader
            title="Open support issues"
            eyebrow={`${queue.issues.length}`}
            description="Most severe first."
          />
          <CardBody className="pt-0">
            {queue.issues.length === 0 ? (
              <p className="py-4 text-center text-[12.5px] text-faint">No open issues.</p>
            ) : (
              <ul className="divide-y divide-line">
                {queue.issues.map((issue) => (
                  <li key={issue.id} className="flex items-center gap-3 py-2.5">
                    <LifeBuoy className="size-3.5 shrink-0 text-faint" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link
                        href="/admin/support"
                        className="block truncate text-[13px] text-ink transition-colors hover:text-accent"
                      >
                        {issue.title}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-ghost">
                        {issue.org?.name ?? "Platform"}
                        {issue.owner ? ` · ${issue.owner.name}` : " · unowned"}
                      </p>
                    </div>
                    <SeverityBadge severity={issue.severity} />
                    <IssueStatusBadge status={issue.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
