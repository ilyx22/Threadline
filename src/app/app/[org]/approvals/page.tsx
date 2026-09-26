import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { approvalQueue } from "@/lib/data/client-surface";
import { fingerprint } from "@/lib/delivery/approvals";
import { ApprovalQueue, type QueueItem } from "./approvals-client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

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
  // Each item carries the fingerprint of the version shown, so a bulk approval
  // can skip anything that changes before the reviewer presses the button.
  const TYPE = { script: "script", content: "content_item", package: "platform_package" } as const;
  const versioned: QueueItem[] = await Promise.all(
    queue.map(async (item) => {
      const fp = await fingerprint(ctx.org.id, { type: TYPE[item.kind], id: item.id });
      return { ...item, waitingSince: item.waitingSince.toISOString(), hash: fp?.hash ?? null, versionLabel: fp?.label ?? null };
    }),
  );

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

          <ApprovalQueue
            slug={slug}
            items={versioned}
            canApprove={{ script: canApproveScripts, content: canApproveContent, package: ctx.can("distribution.publish") }}
          />
        </>
      )}
    </div>
  );
}
