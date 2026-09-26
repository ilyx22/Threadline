import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Flag,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FlaskConical,
  Gauge,
  Lightbulb,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Stethoscope,
  Telescope,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/client";
import { cadenceTarget, loadDashboard, sortActions } from "@/lib/data/dashboard";
import { installationView } from "@/lib/data/installation";
import { diagnosisSummary } from "@/lib/data/diagnosis";
import { latestPublishedRun } from "@/lib/data/runs";
import { waitingOnColleagues, workingOn } from "@/lib/data/client-surface";
import { recordingReadinessSummary } from "@/lib/data/readiness";
import { needsClientAction, READINESS_STATUS_META, type ReadinessStatus } from "@/lib/domain/readiness";
import { CONSTRAINT_DIMENSION_META, type ConstraintDimension } from "@/lib/domain/enums";
import { volumeVerdict } from "@/lib/domain/diagnosis";
import { Progress } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import { compactNumber, hours, minutes, money, pluralise } from "@/lib/utils/format";
import { dueLabel, greeting, relativeTime } from "@/lib/utils/dates";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatCard } from "@/components/ui/data";
import { EmptyState } from "@/components/ui/feedback";
import { StageBadge } from "@/components/ui/status";
import { AreaTrend } from "@/components/charts";
import { viewsTrend } from "@/lib/data/metrics";
import { publishedAssets } from "@/lib/data/metrics";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "workspace.view");

  const canApprove = ctx.can("production.approve") || ctx.can("scripts.approve");
  const [data, target, assets, installation, diagnosis, brief, working, readiness, colleagues] =
    await Promise.all([
      loadDashboard(ctx.org.id, slug),
      cadenceTarget(ctx.org.id),
      publishedAssets(ctx.org.id),
      installationView(ctx.org.id),
      diagnosisSummary(ctx.org.id, ctx.role),
      latestPublishedRun(ctx.org.id),
      workingOn(ctx.org.id, slug),
      recordingReadinessSummary(ctx.org.id),
      waitingOnColleagues(ctx.org.id, slug, ctx.user.id, canApprove),
    ]);

  // OFF-01: an ending engagement tells the client where their export is and when access ends.
  const ending = await prisma.organization.findUnique({ where: { id: ctx.org.id }, select: { offboardedAt: true, accessEndsAt: true } });
  const exportFile = ending?.offboardedAt
    ? await prisma.offboardingRecord.findUnique({ where: { orgId: ctx.org.id }, select: { exportAssetId: true } }).then((r) => (r?.exportAssetId ? prisma.asset.findUnique({ where: { id: r.exportAssetId }, select: { storagePath: true } }) : null))
    : null;

  const trend = viewsTrend(
    assets.filter(
      (a) => a.publishedAt >= data.range.start && a.publishedAt <= data.range.end,
    ),
    data.range,
    12,
  );

  const firstName = ctx.user.name.split(" ")[0] ?? ctx.user.name;
  // CX-01: approvals only "need you" if you can give them; otherwise they are
  // shown as waiting on a colleague below.
  const today = canApprove ? data.today : { ...data.today, approve: [], approveMinutes: 0 };
  const attentionCount = data.attentionCount - (!canApprove && data.today.approve.length > 0 ? 1 : 0);
  const nothingToday =
    today.record.length === 0 &&
    today.approve.length === 0 &&
    today.decide.length === 0 &&
    today.upload.length === 0;

  return (
    <div className="space-y-8">
      {/* ---------------------------------- Header --------------------------------- */}
      <header>
        <p className="text-eyebrow text-faint">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-2 text-hero">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-3 text-[15px] text-muted">
          {nothingToday ? (
            <>Nothing needs you today. The system is running.</>
          ) : (
            <>
              <span className="font-medium text-ink">
                {pluralise(attentionCount, "thing")}
              </span>{" "}
              {attentionCount === 1 ? "needs" : "need"} you today.
            </>
          )}
        </p>
      </header>

      {ending?.offboardedAt ? (
        <Notice tone="info" title="This engagement has ended">
          Your full export is ready
          {exportFile?.storagePath ? (
            <>
              {" "}
              <a href={`/api/files/${exportFile.storagePath}`} className="text-accent underline">to download here</a>
            </>
          ) : null}
          . Access to this workspace ends on {ending.accessEndsAt ? ending.accessEndsAt.toISOString().slice(0, 10) : "the date we agreed"}.
        </Notice>
      ) : null}

      {/* --------------------------- Recording readiness --------------------------- */}
      {/*
        Above everything else on purpose. A recording queue is a lie when the
        setup cannot produce usable footage, so the blocker outranks the queue.
      */}
      {readiness && needsClientAction(readiness.status as ReadinessStatus) ? (
        <Notice
          tone={readiness.status === "blocked" ? "warning" : "info"}
          icon={Mic}
          title={`Recording setup: ${READINESS_STATUS_META[readiness.status as ReadinessStatus].label.toLowerCase()}`}
          action={
            <ButtonLink href={`/app/${slug}/install/recording`} variant="ghost" size="sm">
              Open setup
            </ButtonLink>
          }
        >
          {readiness.clientAction ??
            READINESS_STATUS_META[readiness.status as ReadinessStatus].description}
        </Notice>
      ) : null}

      {/* ------------------------------ Installation ------------------------------- */}
      {/*
        Shown only while the installation is still running. Once every milestone
        is genuinely complete this disappears rather than sitting there green —
        a permanent "all done" banner stops meaning anything within a week.
      */}
      {!installation.complete ? (
        <Card>
          <CardBody className="pt-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Flag className="size-3.5 text-accent" aria-hidden />
                  <p className="text-eyebrow text-faint">
                    Installation{installation.day ? ` · day ${installation.day}` : ""}
                  </p>
                </div>
                {installation.next ? (
                  <>
                    <p className="mt-2 text-[15px] font-medium leading-snug text-ink">
                      {installation.next.status === "blocked" ? "Blocked: " : "Next: "}
                      {installation.next.label}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">
                      {installation.next.blockedReason ?? installation.next.clientDescription}
                    </p>
                  </>
                ) : null}
                <Progress value={installation.progress} className="mt-3 max-w-md" />
              </div>
              <ButtonLink
                href={`/app/${slug}/install`}
                variant="secondary"
                iconRight={ArrowRight}
                className="shrink-0"
              >
                Installation
              </ButtonLink>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* --------------------------- The current constraint ------------------------ */}
      {diagnosis?.status === "active" ? (
        <Notice
          tone={
            diagnosis.severity === "critical" || diagnosis.severity === "high"
              ? "warning"
              : "neutral"
          }
          icon={Stethoscope}
          title={`Primary constraint: ${
            CONSTRAINT_DIMENSION_META[diagnosis.primaryConstraint as ConstraintDimension]?.label ??
            diagnosis.primaryConstraint
          }`}
          action={
            <ButtonLink href={`/app/${slug}/intelligence/diagnosis`} variant="ghost" size="sm">
              Diagnosis
            </ButtonLink>
          }
        >
          {volumeVerdict(diagnosis.primaryConstraint as ConstraintDimension)}
          {diagnosis.recommendedAction ? ` ${diagnosis.recommendedAction}` : ""}
        </Notice>
      ) : null}

      {/* ------------------------ Latest intelligence brief ------------------------ */}
      {brief ? (
        <Card>
          <CardBody className="pt-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Telescope className="size-3.5 text-accent" aria-hidden />
                  <p className="text-eyebrow text-faint">
                    Latest intelligence brief
                    {brief.publishedAt ? ` · ${relativeTime(brief.publishedAt)}` : ""}
                  </p>
                </div>
                <p className="mt-2 text-[15px] font-medium leading-snug text-ink">{brief.label}</p>
                {brief.summary ? (
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">
                    {brief.summary}
                  </p>
                ) : null}
                <p className="mt-2 text-[11.5px] text-ghost">
                  {brief.candidates.length} approved signal
                  {brief.candidates.length === 1 ? "" : "s"} · {brief.evidenceCount} evidence item
                  {brief.evidenceCount === 1 ? "" : "s"} · {brief.testCount} test
                  {brief.testCount === 1 ? "" : "s"} queued
                </p>
              </div>
              <ButtonLink
                href={`/app/${slug}/intelligence/runs/${brief.id}`}
                variant="secondary"
                iconRight={ArrowRight}
                className="shrink-0"
              >
                Read the brief
              </ButtonLink>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* ---------------------------------- Today ---------------------------------- */}
      {nothingToday ? (
        <EmptyState
          icon={CheckCircle2}
          title="Your queue is clear"
          description="Nothing is waiting on you. New recordings and approvals will appear here as production moves."
          action={
            <ButtonLink href={`/app/${slug}/create`} variant="secondary" icon={Lightbulb}>
              Review the idea backlog
            </ButtonLink>
          }
          compact
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <ActionBlock
            tone="accent"
            icon={Mic}
            label="Record"
            count={today.record.length}
            estimate={today.recordMinutes}
            href={`/app/${slug}/production/recording`}
            cta="Open Recording Room"
            items={sortActions(today.record).slice(0, 4)}
            emptyText="Nothing to record"
          />
          <ActionBlock
            tone="positive"
            icon={BadgeCheck}
            label="Approve"
            count={today.approve.length}
            estimate={today.approveMinutes}
            href={`/app/${slug}/production?stage=in_review`}
            cta="Review edits"
            items={sortActions(today.approve).slice(0, 4)}
            emptyText="Nothing to approve"
          />
          <ActionBlock
            tone="warning"
            icon={FlaskConical}
            label="Decide"
            count={today.decide.length + today.upload.length}
            estimate={[...today.decide, ...today.upload].reduce((a, i) => a + i.estimateMin, 0)}
            href={`/app/${slug}/tasks`}
            cta="Open tasks"
            items={sortActions([...today.decide, ...today.upload]).slice(0, 4)}
            emptyText="No decisions pending"
          />
        </div>
      )}

      {/* ------------------------ Waiting on your colleagues ------------------------ */}
      {colleagues.length ? (
        <section>
          <SectionHeading title="Waiting on your colleagues" description="Things in your team's hands, not yours." />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {colleagues.map((c) => (
              <li key={`${c.who}-${c.what}`}>
                <Link href={c.href} className="block rounded-lg border border-line bg-elevated px-4 py-3 text-[13.5px] text-muted transition-colors hover:text-ink">
                  <span className="font-medium text-ink">{c.who}</span> · {pluralise(c.count, c.what === "tasks" ? "open task" : "item")} {c.what === "approvals" ? "to approve" : ""}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* -------------------------- Threadline is working on ----------------------- */}
      <section>
        <SectionHeading
          title="Threadline is working on"
          description="Everything moving right now, counted from real records. If a week is quiet, this says so."
        />
        {working.idle ? (
          <Card className="mt-4">
            <CardBody className="pt-4">
              <p className="text-[13.5px] leading-relaxed text-muted">
                Nothing is in flight at the moment. That is either between cycles or a genuine gap
                — if it is the second, it is worth asking about rather than assuming.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {working.stages
              .filter((stage) => stage.count > 0)
              .map((stage) => {
                const body = (
                  <Card className="h-full p-0" interactive={Boolean(stage.href)}>
                    <CardBody className="pt-3.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[12px] font-medium text-ink">{stage.label}</p>
                        <span className="text-[19px] font-medium leading-none tabular text-accent">
                          {stage.count}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-ghost">
                        {stage.detail}
                      </p>
                    </CardBody>
                  </Card>
                );
                return stage.href ? (
                  <Link key={stage.key} href={stage.href} className="block">
                    {body}
                  </Link>
                ) : (
                  <div key={stage.key}>{body}</div>
                );
              })}
          </div>
        )}
      </section>

      {/* -------------------------------- This week -------------------------------- */}
      <section>
        <SectionHeading
          title="This week"
          description={`Target cadence is ${pluralise(target, "piece")} per week.`}
          action={
            <ButtonLink href={`/app/${slug}/production`} variant="ghost" size="sm" iconRight={ArrowRight}>
              Production board
            </ButtonLink>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="In production"
            value={data.week.inProduction}
            sublabel="across all stages"
            icon={Video}
            href={`/app/${slug}/production`}
          />
          <StatCard
            label="Scheduled"
            value={data.week.scheduled}
            sublabel="this week"
            icon={CalendarClock}
            href={`/app/${slug}/distribution`}
          />
          <StatCard
            label="Live this week"
            value={data.week.liveThisWeek}
            sublabel={`target ${target}`}
            icon={Send}
            emphasis={data.week.liveThisWeek >= target}
            href={`/app/${slug}/distribution`}
          />
          <StatCard
            label="Overdue"
            value={data.week.overdue.length}
            sublabel={data.week.overdue.length === 0 ? "nothing late" : "needs attention"}
            icon={Clock}
            href={`/app/${slug}/production?overdue=1`}
          />
        </div>

        {data.week.upcoming.length > 0 || data.week.overdue.length > 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {data.week.upcoming.length > 0 ? (
              <Card>
                <CardHeader title="Scheduled next" eyebrow="Distribution" />
                <CardBody className="space-y-0 pt-0">
                  <ul className="divide-y divide-line">
                    {data.week.upcoming.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-2.5">
                        <Link
                          href={`/app/${slug}/production/${item.contentItemId}`}
                          className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                        >
                          {item.title}
                        </Link>
                        <Badge tone="outline">{item.platform.replace(/_/g, " ")}</Badge>
                        <span className="w-20 shrink-0 text-right text-[12px] text-faint">
                          {item.scheduledFor ? dueLabel(item.scheduledFor) : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}

            {data.week.overdue.length > 0 ? (
              <Card className="border-warning/25">
                <CardHeader title="Overdue" eyebrow="Needs attention" />
                <CardBody className="pt-0">
                  <ul className="divide-y divide-line">
                    {data.week.overdue.slice(0, 6).map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-2.5">
                        <Link
                          href={`/app/${slug}/production/${item.id}`}
                          className="min-w-0 flex-1 truncate text-[13px] text-ink transition-colors hover:text-accent"
                        >
                          {item.title}
                        </Link>
                        <StageBadge stage={item.stage} />
                        <span className="w-24 shrink-0 text-right text-[12px] text-negative">
                          {dueLabel(item.dueDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ------------------------------- Performance ------------------------------- */}
      <section>
        <SectionHeading
          title="Performance"
          description="Last 30 days, compared with the previous 30."
          action={
            <ButtonLink href={`/app/${slug}/performance`} variant="ghost" size="sm" iconRight={ArrowRight}>
              Full breakdown
            </ButtonLink>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Views"
            value={compactNumber(data.performance.views)}
            delta={data.performance.deltas.views}
            deltaLabel="vs previous 30 days"
            icon={Eye}
            emphasis
          />
          <StatCard
            label="Published"
            value={data.performance.published}
            delta={data.performance.deltas.published}
            icon={Send}
          />
          <StatCard
            label="Qualified inquiries"
            value={data.pipeline.qualified}
            sublabel={`${data.pipeline.inquiries} total`}
            icon={Users}
            href={`/app/${slug}/pipeline`}
          />
          <StatCard
            label="Calls booked"
            value={data.pipeline.callsBooked}
            sublabel={
              data.pipeline.valueMinor > 0
                ? `${money(data.pipeline.valueMinor, ctx.org.currency, { compact: true })} closed`
                : "from content"
            }
            icon={TrendingUp}
            href={`/app/${slug}/pipeline`}
          />
        </div>

        <Card className="mt-4">
          <CardHeader
            title="Views over time"
            eyebrow="Last 30 days"
            action={
              <span className="text-[12px] text-faint">
                {data.performance.avgRetention > 0
                  ? `${data.performance.avgRetention}% average retention`
                  : "Retention not recorded"}
              </span>
            }
          />
          <CardBody className="pt-1">
            <AreaTrend
              data={trend.map((t) => ({ label: t.label, value: t.views }))}
              tone="accent"
              height={200}
              emptyMessage="No published content in this period yet"
            />
          </CardBody>
        </Card>
      </section>

      {/* --------------------------- Operating metrics ---------------------------- */}
      <section>
        <SectionHeading
          title="Operating metrics"
          description="What the system is doing to your week."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Founder time"
            value={hours(data.operating.founderHours)}
            sublabel="last 30 days"
            icon={Clock}
          />
          <StatCard
            label="Estimated time released"
            value={hours(data.operating.hoursSaved)}
            sublabel="vs prior workflow"
            icon={Sparkles}
            emphasis={data.operating.hoursSaved > 0}
          />
          <StatCard
            label="Cycle time"
            value={
              data.operating.cycleTimeHours > 0
                ? `${Math.round(data.operating.cycleTimeHours)}h`
                : "—"
            }
            sublabel="idea to live"
            icon={Gauge}
          />
          <StatCard
            label="Approval turnaround"
            value={
              data.operating.approvalHours > 0
                ? `${data.operating.approvalHours.toFixed(1)}h`
                : "—"
            }
            sublabel="review to approved"
            icon={BadgeCheck}
          />
          <StatCard
            label="Bottleneck"
            value={
              data.operating.bottleneck ? (
                <span className="text-[17px] capitalize">{data.operating.bottleneck.label}</span>
              ) : (
                <span className="text-[17px]">None</span>
              )
            }
            sublabel={
              data.operating.bottleneck
                ? `${data.operating.bottleneck.count} pieces held`
                : "nothing blocked"
            }
            icon={Clock}
          />
        </div>
      </section>

      {/* --------------------------------- Insights -------------------------------- */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="What the system learned"
            eyebrow="Derived from your data"
            description="Computed from stored performance records, not generated."
          />
          <CardBody className="pt-0">
            {data.insights.length === 0 ? (
              <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-[13px] text-faint">
                Not enough published content yet to draw a reliable conclusion. Insights appear once
                a few pieces have performance data.
              </p>
            ) : (
              <ul className="space-y-3.5">
                {data.insights.map((insight) => (
                  <li key={insight.id} className="flex gap-3">
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        insight.tone === "positive"
                          ? "bg-positive"
                          : insight.tone === "negative"
                            ? "bg-negative"
                            : "bg-faint",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[13.5px] leading-relaxed text-ink">{insight.text}</p>
                      {insight.evidence ? (
                        <p className="mt-1 text-[12px] text-faint">{insight.evidence}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card accent={Boolean(data.nextTest)}>
          <CardHeader title="Next test" eyebrow="Signal engine" />
          <CardBody className="pt-0">
            {data.nextTest ? (
              <>
                <p className="text-[13.5px] leading-relaxed text-ink">{data.nextTest.experiment}</p>
                <p className="mt-2 text-[12px] text-faint">From: {data.nextTest.title}</p>
                <ButtonLink
                  href={`/app/${slug}/intelligence/signals/${data.nextTest.id}`}
                  variant="ghost"
                  size="sm"
                  iconRight={ArrowRight}
                  className="mt-3 -ml-3"
                >
                  Open signal
                </ButtonLink>
              </>
            ) : (
              <p className="text-[13px] leading-relaxed text-faint">
                No experiment queued. Signals turn into tests once there is enough evidence behind
                them.
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      {/* ------------------------------- Winners + feed ---------------------------- */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Winning content"
            eyebrow="Last 30 days"
            action={
              <ButtonLink href={`/app/${slug}/performance`} variant="ghost" size="xs">
                All
              </ButtonLink>
            }
          />
          <CardBody className="pt-0">
            {data.winners.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-faint">
                Nothing published in this period yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {data.winners.map((asset) => (
                  <li key={asset.publishRecordId} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/${slug}/production/${asset.contentItemId}`}
                        className="block truncate text-[13px] font-medium text-ink transition-colors hover:text-accent"
                      >
                        {asset.title}
                      </Link>
                      <p className="mt-0.5 text-[11.5px] text-faint">
                        {asset.platform.replace(/_/g, " ")}
                        {asset.ratio > 0 ? ` · ${asset.ratio}x median` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium tabular text-accent">
                      {compactNumber(asset.views)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" eyebrow="Workspace" />
          <CardBody className="pt-0">
            {data.activity.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-faint">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.activity.map((event) => (
                  <li key={event.id} className="flex items-start gap-2.5">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-ghost" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] leading-snug text-muted">
                        <span className="text-ink">{event.actorName}</span>{" "}
                        {describeEvent(event.type, event.toStage)}{" "}
                        <Link
                          href={`/app/${slug}/production/${event.contentId}`}
                          className="text-ink underline-offset-2 hover:underline"
                        >
                          {event.contentTitle}
                        </Link>
                      </p>
                      <p className="mt-0.5 text-[11px] text-ghost">
                        {relativeTime(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function describeEvent(type: string, toStage: string | null) {
  switch (type) {
    case "stage_change":
      return `moved to ${toStage?.replace(/_/g, " ") ?? "a new stage"} —`;
    case "revision_requested":
      return "requested changes on";
    case "approved":
      return "approved";
    case "recorded":
      return "recorded";
    case "published":
      return "published";
    case "asset_added":
      return "added a file to";
    case "metric_added":
      return "recorded performance for";
    default:
      return "commented on";
  }
}

function ActionBlock({
  tone,
  icon: Icon,
  label,
  count,
  estimate,
  href,
  cta,
  items,
  emptyText,
}: {
  tone: "accent" | "positive" | "warning";
  icon: React.ElementType;
  label: string;
  count: number;
  estimate: number;
  href: string;
  cta: string;
  items: { id: string; title: string; subtitle?: string; overdue: boolean }[];
  emptyText: string;
}) {
  const tones = {
    accent: { border: "border-accent-line", text: "text-accent", bg: "bg-accent-soft" },
    positive: { border: "border-positive/25", text: "text-positive", bg: "bg-positive-soft" },
    warning: { border: "border-warning/25", text: "text-warning", bg: "bg-warning-soft" },
  }[tone];

  const empty = count === 0;

  return (
    <Card className={cn("flex flex-col", empty ? "border-line" : tones.border)}>
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div>
          <p className="text-eyebrow flex items-center gap-2 text-faint">
            <Icon className={cn("size-3.5", empty ? "text-ghost" : tones.text)} aria-hidden />
            {label}
          </p>
          <p className={cn("text-metric mt-2.5", empty ? "text-faint" : "text-ink")}>{count}</p>
          <p className="mt-1 text-[12px] text-faint">
            {empty ? emptyText : `~${minutes(estimate)}`}
          </p>
        </div>
      </div>

      {!empty ? (
        <>
          <ul className="flex-1 space-y-2 border-t border-line px-5 py-3">
            {items.map((item) => (
              <li key={item.id} className="min-w-0">
                <p className="truncate text-[12.5px] text-ink">{item.title}</p>
                {item.subtitle ? (
                  <p className="mt-0.5 truncate text-[11.5px] text-faint">{item.subtitle}</p>
                ) : null}
              </li>
            ))}
            {count > items.length ? (
              <li className="text-[11.5px] text-ghost">+{count - items.length} more</li>
            ) : null}
          </ul>
          <div className="border-t border-line px-5 py-2.5">
            <ButtonLink href={href} variant="ghost" size="sm" iconRight={ArrowRight} className="-ml-3">
              {cta}
            </ButtonLink>
          </div>
        </>
      ) : null}
    </Card>
  );
}
