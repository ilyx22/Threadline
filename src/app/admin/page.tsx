import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  Inbox,
  Target,
  Telescope,
} from "lucide-react";
import { requireInternal } from "@/lib/auth/guard";
import { can } from "@/lib/auth/roles";
import { listClients } from "@/lib/data/admin";
import { cockpit } from "@/lib/data/cockpit";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/data";
import { WEDGE_STATE_META, metaOf } from "@/lib/domain/enums";
import { formatTime, greeting, relativeTime } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Today" };

/**
 * The operating cockpit.
 *
 * The founder opens Threadline and this answers one question: what matters now.
 * Everything is a queue of work rather than a chart, ordered by what can still
 * change the commercial outcome today — replies first, then dated commitments,
 * then calls, then the activity the target requires, then delivery.
 *
 * The portfolio view that used to live here is at /admin/clients, which is
 * where managing clients belongs. This page is for deciding what to do next.
 */
export default async function TodayPage() {
  const admin = await requireInternal("admin.view");
  const sees = can(admin.role, "acquisition.view");

  // A role without the acquisition capability sees the delivery side only,
  // rather than an empty version of a page that is not theirs.
  if (!sees) return <DeliveryOnly />;

  const [view, clients] = await Promise.all([cockpit(), listClients()]);
  const { plan, quota } = { plan: view.plan, quota: view.plan.quota };
  const needsAttention = clients.filter((c) => c.alerts.length > 0 || c.health < 70);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-section">{greeting()}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">
            {view.actions.length === 0
              ? "Nothing is waiting on you. That is either a quiet day or an empty pipeline — the acquisition page will tell you which."
              : `${view.actions.length} ${view.actions.length === 1 ? "record needs" : "records need"} you, in the order they are worth doing.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/admin/prospects" variant="secondary" icon={ArrowRight}>
            All prospects
          </ButtonLink>
          <ButtonLink href="/admin/acquisition" variant="accent" icon={Target}>
            Acquisition
          </ButtonLink>
        </div>
      </header>

      {view.breaches.length > 0 ? (
        <Notice tone="warning" title="Records with no next action">
          {view.breaches.length}{" "}
          {view.breaches.length === 1 ? "record is" : "records are"} active without a next action or
          a date, so nothing will surface them again:{" "}
          {view.breaches.slice(0, 4).map((b) => b.label).join(", ")}
          {view.breaches.length > 4 ? ` and ${view.breaches.length - 4} more` : ""}.
        </Notice>
      ) : null}

      {/* The quota. The first thing worth knowing is how much activity today
          actually requires, which is arithmetic rather than ambition. */}
      {quota ? (
        <section className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="First touches today"
              value={quota.remainingToday}
              sublabel={
                quota.perDay
                  ? `${quota.completedToday} of ${quota.perDay} done`
                  : "No pacing available"
              }
              icon={Target}
              emphasis
            />
            <StatCard
              label="Remaining in period"
              value={quota.remaining}
              sublabel={`${quota.completed} of ${quota.required} sent`}
            />
            <StatCard
              label="Workdays left"
              value={quota.workdaysRemaining}
              sublabel={plan.target?.label ?? ""}
            />
            <StatCard
              label="Calls today"
              value={view.callsToday.length}
              sublabel={
                view.callsToday.length === 0
                  ? "nothing scheduled"
                  : view.callsToday.filter((c) => !c.prepared).length > 0
                    ? `${view.callsToday.filter((c) => !c.prepared).length} not prepared`
                    : "all prepared"
              }
              icon={CalendarClock}
            />
          </div>

          {quota.warning ? (
            <Notice tone="warning" title="The arithmetic is telling you something">
              {quota.warning}
            </Notice>
          ) : null}

          {/*
            Where the number came from, on the page that shows the number. A
            quota derived from planning assumptions and one derived from
            measured rates look identical on screen, and only one of them is
            evidence.
          */}
          <p className="text-[12px] leading-relaxed text-faint">
            {plan.measured.ok
              ? plan.measured.containsAssumption
                ? "Derived from recorded rates, one of which is still assumed. A direction, not a forecast."
                : "Derived entirely from Threadline's own recorded rates."
              : "Derived from the target's planning assumptions — there is not enough recorded data to project from yet. Treat it as a starting volume, not a forecast."}
          </p>
        </section>
      ) : (
        <Notice tone="info" title="No acquisition target set">
          Without a target there is no daily number, and without a daily number the honest answer
          to &ldquo;is that enough outreach?&rdquo; is that nobody knows.{" "}
          <Link href="/admin/acquisition" className="underline underline-offset-2">
            Set one
          </Link>
          .
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {view.groups.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No prospect work is due"
              description="Either everything is dated for later, or there is nothing in the pipeline. Both are worth knowing; only one is good."
              action={
                <ButtonLink href="/admin/prospects" variant="secondary">
                  Open prospects
                </ButtonLink>
              }
            />
          ) : (
            view.groups.map((group) => (
              <section key={group.key}>
                <SectionHeading
                  title={`${group.label} · ${group.items.length}`}
                  description={group.reason}
                />
                <div className="overflow-hidden rounded-lg border border-line bg-elevated">
                  <ul className="divide-y divide-line">
                    {group.items.map((row) => (
                      <li key={row.id}>
                        <Link
                          href={row.href}
                          className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-raised/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-ink">{row.title}</p>
                            <p className="mt-0.5 truncate text-[12px] text-muted">{row.detail}</p>
                          </div>
                          {row.dueAt ? (
                            <span
                              className={`shrink-0 text-[11.5px] ${row.overdue ? "text-negative" : "text-faint"}`}
                            >
                              {row.overdue ? "Overdue " : ""}
                              {relativeTime(row.dueAt)}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[11.5px] text-warning">No date</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="space-y-6">
          {view.callsToday.length > 0 ? (
            <Card accent>
              <CardHeader title="Calls today" />
              <CardBody className="space-y-2">
                {view.callsToday.map((call) => (
                  <Link
                    key={call.id}
                    href={`/admin/prospects/${call.prospectId}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 transition-colors hover:bg-raised/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink">{call.company}</p>
                      <p className="text-[11.5px] text-faint">{formatTime(call.scheduledAt)}</p>
                    </div>
                    <Badge tone={call.prepared ? "positive" : "warning"}>
                      {call.prepared ? "Ready" : "Prep"}
                    </Badge>
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Active wedge" />
            <CardBody>
              {view.wedge ? (
                <Link href={`/admin/market/${view.wedge.id}`} className="block space-y-2">
                  <p className="text-[13.5px] text-ink">{view.wedge.label}</p>
                  <div className="flex items-center gap-2">
                    <Badge tone={metaOf(WEDGE_STATE_META, view.wedge.state).tone}>
                      {metaOf(WEDGE_STATE_META, view.wedge.state).label}
                    </Badge>
                    <span className="text-[11.5px] text-faint">
                      {view.wedge.conversations} conversation
                      {view.wedge.conversations === 1 ? "" : "s"}
                    </span>
                  </div>
                  {!view.wedge.frozen ? (
                    <p className="text-[12px] leading-relaxed text-muted">
                      Not frozen. Scaled acquisition against an unfrozen hypothesis produces a
                      result nobody can read.
                    </p>
                  ) : null}
                </Link>
              ) : (
                <div className="space-y-2">
                  <p className="text-[12.5px] leading-relaxed text-muted">
                    No wedge is active. &ldquo;Expert-led B2B&rdquo; is the umbrella category, not
                    a market you can write a first line to.
                  </p>
                  <ButtonLink href="/admin/market" variant="secondary" size="sm" icon={Telescope}>
                    Choose one
                  </ButtonLink>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Delivery"
              action={
                view.delivery.total > 0 ? (
                  <ButtonLink href="/admin/queue" variant="ghost" size="sm">
                    Queue
                  </ButtonLink>
                ) : null
              }
            />
            <CardBody className="space-y-1.5 text-[12.5px]">
              <Row label="Overdue approvals" value={view.delivery.overdueApprovals} />
              <Row label="Blocked production" value={view.delivery.blockedProduction} />
              <Row label="Reports due" value={view.delivery.reportsDue} />
              <Row label="Open issues" value={view.delivery.issues} />
              {needsAttention.length > 0 ? (
                <Link
                  href="/admin/clients"
                  className="mt-2 flex items-center gap-1.5 text-[12px] text-warning hover:underline"
                >
                  <AlertTriangle className="size-3.5" aria-hidden />
                  {needsAttention.length} client{needsAttention.length === 1 ? "" : "s"} need
                  attention
                </Link>
              ) : null}
            </CardBody>
          </Card>

          {view.results.length > 0 ? (
            <Card>
              <CardHeader
                title="Measurement"
                description="Whether the results can prove anything, checked before anyone interprets them."
              />
              <CardBody className="space-y-2.5">
                {view.results.slice(0, 5).map((alert, i) => (
                  <Link
                    key={i}
                    href={`/app/${alert.slug}/performance/proof`}
                    className="block rounded-md border border-line px-3 py-2 transition-colors hover:bg-raised/50"
                  >
                    <p className="text-[12.5px] font-medium text-ink">{alert.name}</p>
                    <p
                      className={`mt-0.5 text-[11.5px] leading-relaxed ${
                        alert.severity === "warning" ? "text-warning" : "text-muted"
                      }`}
                    >
                      {alert.message}
                    </p>
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={value > 0 ? "tabular text-ink" : "tabular text-faint"}>{value}</span>
    </div>
  );
}

/** What an internal role without the acquisition capability sees. */
async function DeliveryOnly() {
  const clients = await listClients();
  const needsAttention = clients.filter((c) => c.alerts.length > 0 || c.health < 70);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-section">{greeting()}</h1>
        <p className="mt-2 text-[14px] text-muted">Client delivery across the portfolio.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clients" value={clients.length} icon={Building2} />
        <StatCard label="Needing attention" value={needsAttention.length} icon={AlertTriangle} />
        <StatCard label="Queue" value={0} icon={Inbox} href="/admin/queue" />
      </section>

      <ButtonLink href="/admin/clients" variant="secondary">
        Open clients
      </ButtonLink>
    </div>
  );
}
