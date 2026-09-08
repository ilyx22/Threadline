import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, CheckCircle2, FileText, Video } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { approvalQueue, type ApprovalItem } from "@/lib/data/client-surface";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { relativeTime } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Approvals" };

/**
 * Everything waiting on the client, in one place.
 *
 * In the operator surface approvals live where the work does — on the script,
 * on the board, on the package. For the founder that is three places to check,
 * so this is one queue answering one question: what needs me?
 *
 * Oldest first, deliberately. The thing that has been waiting longest is the
 * thing most likely to be holding up a publishing slot.
 */
export default async function ApprovalsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");
  const queue = await approvalQueue(ctx.org.id, slug);

  const canApproveScripts = ctx.can("scripts.approve");
  const canApproveContent = ctx.can("production.approve");
  const canApproveAny = canApproveScripts || canApproveContent;

  const overdue = queue.filter((item) => item.waitingDays >= 3);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Approvals</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Everything waiting on your judgment, oldest first. Nothing goes out without you, and
          nothing on this list moves until you decide — so a short pass here unblocks the whole
          week.
        </p>
      </header>

      {queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing is waiting on you"
          description="No scripts, edits or packaging need a decision right now. Work in progress is on your Home screen."
          action={
            <Link
              href={`/app/${slug}`}
              className="inline-flex items-center gap-1.5 text-[13px] text-accent hover:underline"
            >
              Back to this week
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="accent">
              {queue.length} waiting
            </Badge>
            {overdue.length > 0 ? (
              <span className="text-[12.5px] text-warning">
                {overdue.length} {overdue.length === 1 ? "has" : "have"} been waiting three days or
                more
              </span>
            ) : null}
          </div>

          {!canApproveAny ? (
            <p className="rounded-md border border-line bg-elevated px-4 py-3 text-[12.5px] leading-relaxed text-muted">
              You can read everything here, but approvals are made by a workspace admin. Nothing on
              this list is waiting on you personally.
            </p>
          ) : null}

          <ul className="space-y-2">
            {queue.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <ApprovalRow item={item} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const KIND_META: Record<
  ApprovalItem["kind"],
  { label: string; icon: React.ElementType; tone: "accent" | "info" | "purple" }
> = {
  script: { label: "Script", icon: FileText, tone: "accent" },
  content: { label: "Edit", icon: Video, tone: "info" },
  package: { label: "Packaging", icon: Boxes, tone: "purple" },
};

function ApprovalRow({ item }: { item: ApprovalItem }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const waited = item.waitingDays;

  return (
    <Link href={item.href} className="block">
      <Card interactive className="p-0">
        <CardBody className="pt-4">
          <div className="flex gap-4">
            <span
              className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border ${
                waited >= 3
                  ? "border-warning/35 bg-warning-soft text-warning"
                  : "border-line bg-surface text-faint"
              }`}
            >
              <Icon className="size-4" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {item.context ? (
                  <span className="text-[11.5px] text-ghost">{item.context}</span>
                ) : null}
                <span
                  className={`ml-auto text-[11.5px] ${waited >= 3 ? "text-warning" : "text-ghost"}`}
                >
                  waiting {relativeTime(item.waitingSince).replace(/^/, "")}
                </span>
              </div>

              <p className="mt-2 text-[14.5px] font-medium leading-snug text-ink">{item.title}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
                <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-hidden />
                {item.ask}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
