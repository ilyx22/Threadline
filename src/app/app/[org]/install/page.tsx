import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, CircleDashed, Loader, TriangleAlert } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { installationView } from "@/lib/data/installation";
import { MILESTONE_STATUS_META, type MilestoneState } from "@/lib/domain/installation";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Progress } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils/dates";
import { MilestoneControls, SignOffButton } from "./install-actions";

export const metadata: Metadata = { title: "Installation" };

/**
 * The first-value view.
 *
 * Two audiences, one page. The client sees a calm account of where the
 * installation is and what happens next; an operator additionally sees the
 * controls for recording blockers and taking the strategy sign-off. Nothing is
 * marked done that is not actually done — every status is derived from real
 * records, and an operator's blocker always overrides a healthy-looking count.
 */
export default async function InstallPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");
  const view = await installationView(ctx.org.id);
  const canManage = ctx.can("install.signoff");

  const done = view.milestones.filter((m) => m.status === "complete").length;

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Installation</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          The first week has a narrow, checkable promise: that Threadline understands your market,
          and has already turned that understanding into creative work you can use. Every step below
          reflects what actually exists in this workspace.
        </p>
      </header>

      <Card>
        <CardBody className="pt-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow text-faint">
                {view.complete
                  ? "Installation complete"
                  : view.day
                    ? `Day ${view.day}`
                    : "Not started"}
              </p>
              <p className="mt-2 text-[28px] font-medium tabular text-ink">
                {done}
                <span className="text-[18px] text-ghost">/{view.milestones.length}</span>
              </p>
              <p className="mt-1 text-[12px] text-ghost">
                {view.startedAt ? `Started ${formatDate(view.startedAt)}` : "Awaiting kickoff"}
              </p>
            </div>

            {view.next && !view.complete ? (
              <div className="max-w-md flex-1">
                <p className="text-eyebrow text-faint">
                  {view.next.status === "blocked" ? "Blocked on" : "Next"}
                </p>
                <p className="mt-1.5 text-[15px] font-medium leading-snug text-ink">
                  {view.next.label}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  {view.next.blockedReason ?? view.next.clientDescription}
                </p>
                <Link
                  href={view.next.href(slug)}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] text-accent hover:underline"
                >
                  Open
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            ) : null}
          </div>

          <Progress value={view.progress} className="mt-5" />
        </CardBody>
      </Card>

      {view.blockers.length > 0 ? (
        <Notice
          tone="warning"
          icon={TriangleAlert}
          title={`${view.blockers.length} step${view.blockers.length === 1 ? " is" : "s are"} blocked`}
        >
          {view.blockers.map((b) => b.label).join(", ")}. A blocker recorded by an operator always
          overrides the progress shown, so this page cannot look healthier than the installation is.
        </Notice>
      ) : null}

      {view.complete ? (
        <Notice tone="positive" title="The installation is complete">
          The operation now runs on its cycle: intelligence, strategy, scripts, recording,
          production, distribution and learning. This page stays as the record of how the first week
          went.
        </Notice>
      ) : null}

      <ol className="space-y-2">
        {view.milestones.map((milestone, index) => (
          <li key={milestone.key}>
            <MilestoneRow
              slug={slug}
              index={index + 1}
              milestone={milestone}
              canManage={canManage}
              isInternal={ctx.isInternal}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function MilestoneRow({
  slug,
  index,
  milestone,
  canManage,
  isInternal,
}: {
  slug: string;
  index: number;
  milestone: MilestoneState;
  canManage: boolean;
  isInternal: boolean;
}) {
  const meta = MILESTONE_STATUS_META[milestone.status];
  const Icon =
    milestone.status === "complete"
      ? Check
      : milestone.status === "blocked"
        ? TriangleAlert
        : milestone.status === "in_progress"
          ? Loader
          : CircleDashed;

  return (
    <Card className={milestone.status === "blocked" ? "border-negative/30 p-0" : "p-0"}>
      <CardBody className="pt-4">
        <div className="flex gap-4">
          <div
            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${
              milestone.status === "complete"
                ? "border-positive/40 bg-positive-soft text-positive"
                : milestone.status === "blocked"
                  ? "border-negative/40 bg-negative-soft text-negative"
                  : milestone.status === "in_progress"
                    ? "border-info/40 bg-info-soft text-info"
                    : "border-line bg-elevated text-ghost"
            }`}
          >
            <Icon className="size-3.5" aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] tabular text-ghost">{index}</span>
              <Link
                href={milestone.href(slug)}
                className="text-[14px] font-medium leading-snug text-ink hover:text-accent"
              >
                {milestone.label}
              </Link>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className="text-[11px] text-ghost">
                {milestone.owner === "client"
                  ? "You"
                  : milestone.owner === "threadline"
                    ? "Threadline"
                    : "Together"}
                {" · day "}
                {milestone.targetDay}
              </span>
            </div>

            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {milestone.clientDescription}
            </p>

            <p className="mt-1.5 text-[12px] text-ghost">{milestone.detail}</p>

            {milestone.blockedReason ? (
              <p className="mt-2 rounded-md border border-negative/25 bg-negative-soft px-3 py-2 text-[12.5px] leading-relaxed text-negative">
                {milestone.blockedReason}
              </p>
            ) : null}

            {milestone.note ? (
              <p className="mt-2 text-[12px] leading-relaxed text-faint">{milestone.note}</p>
            ) : null}

            {/* Operator detail: what has to happen, in operator language. */}
            {isInternal ? (
              <p className="mt-2 border-l-2 border-line pl-2.5 text-[12px] leading-relaxed text-faint">
                <span className="text-ghost">Operator: </span>
                {milestone.operatorAction}
              </p>
            ) : null}

            {milestone.progress > 0 && milestone.progress < 100 ? (
              <Progress value={milestone.progress} className="mt-3" />
            ) : null}

            {canManage ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {milestone.requiresSignOff ? (
                  <SignOffButton
                    slug={slug}
                    milestoneKey={milestone.key}
                    signedOff={Boolean(milestone.signedOffAt)}
                  />
                ) : null}
                <MilestoneControls
                  slug={slug}
                  milestoneKey={milestone.key}
                  label={milestone.label}
                  note={milestone.note ?? ""}
                  blockedReason={milestone.blockedReason ?? ""}
                  targetDate={
                    milestone.targetDate ? milestone.targetDate.toISOString().slice(0, 10) : ""
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
