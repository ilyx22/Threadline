import type { Metadata } from "next";
import { requireInternal } from "@/lib/auth/guard";
import {
  acquisitionPlan,
  channelBreakdown,
  currentWeekStart,
  latestReviews,
  weekCounts,
} from "@/lib/data/acquisition";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/data";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { funnelSteps } from "@/lib/domain/funnel";
import { formatDate, toDateInput } from "@/lib/utils/dates";
import { percent } from "@/lib/utils/format";
import { ReviewForm, TargetButton } from "./acquisition-client";

export const metadata: Metadata = { title: "Acquisition" };

/**
 * Reverse-engineered acquisition.
 *
 *   required first touches = target wins / (booking x show x qualified x close)
 *
 * Not a side calculator. It is the control mechanism that turns "did I work
 * hard today" into a number, and it refuses to produce one when the recorded
 * data cannot support it — which, early on, is the correct answer rather than a
 * gap to be filled with something plausible.
 */
export default async function AcquisitionPage() {
  await requireInternal("acquisition.view");

  const weekStart = currentWeekStart();
  const [plan, channels, reviews, thisWeek] = await Promise.all([
    acquisitionPlan(),
    channelBreakdown({ start: new Date(Date.now() - 90 * 86_400_000), end: new Date() }),
    latestReviews(),
    weekCounts(weekStart),
  ]);

  const projection = plan.measured.ok ? plan.measured : plan.assumed;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section">Acquisition</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            How much activity the target actually requires, derived from Threadline&apos;s own
            recorded rates. Channel-agnostic by construction: a platform is one component of an
            acquisition system, not the system.
          </p>
        </div>
        <TargetButton
          target={
            plan.target
              ? {
                  ...plan.target,
                  periodStart: plan.target.periodStart.toISOString(),
                  periodEnd: plan.target.periodEnd.toISOString(),
                }
              : null
          }
        />
      </header>

      {!plan.target ? (
        <Notice tone="info" title="No target set">
          Without a target there is no arithmetic and no daily number, and the honest answer to
          &ldquo;was that enough outreach?&rdquo; is that nobody knows.
        </Notice>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Target"
              value={`${plan.target.targetWins} wins`}
              sublabel={`by ${formatDate(plan.target.periodEnd)}`}
            />
            <StatCard
              label="First touches required"
              value={projection?.ok ? projection.requiredFirstTouches : "—"}
              sublabel={
                plan.measured.ok
                  ? "from measured rates"
                  : plan.assumed?.ok
                    ? "from assumptions"
                    : "not projectable"
              }
              emphasis
            />
            <StatCard
              label="Sent so far"
              value={plan.counts.firstTouches}
              sublabel={plan.quota ? `${plan.quota.remaining} remaining` : ""}
            />
            <StatCard
              label="Per workday"
              value={plan.quota?.perDay ?? "—"}
              sublabel={plan.quota ? `${plan.quota.workdaysRemaining} days left` : ""}
            />
          </section>

          {plan.quota?.warning ? (
            <Notice tone="warning" title="Diagnose rather than grind">
              {plan.quota.warning}
            </Notice>
          ) : null}

          {/* Measured beside assumed, never instead of. While the sample is
              small, one win or one no-show moves the measured figure enough to
              rewrite the plan, and seeing both is what stops that happening. */}
          <section className="grid gap-4 lg:grid-cols-2">
            <RatesCard
              title="From what actually happened"
              description="Counted from prospect and call records."
              projection={plan.measured}
            />
            <RatesCard
              title="From the planning assumptions"
              description="Used until there is enough real data. Every rate here is a guess and is labelled as one."
              projection={plan.assumed}
            />
          </section>
        </>
      )}

      <section>
        <SectionHeading
          title="The funnel"
          description="Every count derived from records rather than recalled. Steps with too little data to judge are marked, because a rate over three observations is arithmetic rather than evidence. The lowest conversion is flagged as a place to look — whether it is the constraint is a judgement, not arithmetic."
        />
        <div className="overflow-hidden rounded-lg border border-line bg-elevated">
          <Table>
            <THead>
              <TR>
                <TH>Conversion</TH>
                <TH className="text-right">From</TH>
                <TH className="text-right">To</TH>
                <TH className="text-right">Rate</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {plan.steps.map((step) => (
                <TR key={step.key}>
                  <TD>
                    <span className="text-[12.5px] text-ink">{step.label}</span>
                    {plan.weakest?.key === step.key ? (
                      <Badge tone="warning" className="ml-2">
                        Lowest
                      </Badge>
                    ) : null}
                  </TD>
                  <TD className="text-right tabular text-muted">{step.from}</TD>
                  <TD className="text-right tabular text-muted">{step.to}</TD>
                  <TD className="text-right tabular text-ink">
                    {step.rate === null ? "—" : percent(step.rate * 100, 1)}
                  </TD>
                  <TD>
                    {step.thin ? (
                      <span className="text-[11.5px] text-faint">too few to judge</span>
                    ) : null}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </section>

      {channels.length > 0 ? (
        <section>
          <SectionHeading
            title="By channel"
            description="Kept separate rather than blended. Warm referrals, cold outreach and inbound convert differently, and an average describes none of them."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {channels.map((row) => (
              <Card key={row.channel}>
                <CardHeader
                  title={row.channel}
                  description={`${row.counts.firstTouches} first touches · ${row.counts.booked} booked · ${row.counts.won} won`}
                />
                <CardBody className="space-y-1.5">
                  {row.steps.map((step) => (
                    <div key={step.key} className="flex items-center justify-between text-[12px]">
                      <span className="text-muted">{step.label}</span>
                      <span className={step.thin ? "tabular text-faint" : "tabular text-ink"}>
                        {step.rate === null ? "—" : percent(step.rate * 100, 1)}
                      </span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <Card>
          <CardHeader
            title="Weekly control loop"
            description="Freeze the counts, find the first broken conversion, change one meaningful variable, and write down what you expect. Then leave it alone for a week."
          />
          <CardBody>
            <ReviewForm
              weekStart={toDateInput(weekStart)}
              counts={JSON.stringify(thisWeek)}
              steps={funnelSteps(thisWeek).map((s) => ({ key: s.key, label: s.label }))}
              suggested={plan.weakest?.key ?? null}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Previous weeks" />
          <CardBody>
            {reviews.length === 0 ? (
              <EmptyState
                compact
                title="No reviews yet"
                description="The first one is worth writing even when the counts are small — it is the baseline everything after is compared to."
              />
            ) : (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-md border border-line px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[12.5px] font-medium text-ink">
                        {formatDate(review.weekStart)}
                      </p>
                      {review.brokenStep ? (
                        <Badge tone="warning">{review.brokenStep}</Badge>
                      ) : null}
                    </div>
                    {review.variableChanged ? (
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">
                        Changed: {review.variableChanged}
                      </p>
                    ) : null}
                    {review.learning ? (
                      <p className="mt-1 text-[12px] leading-relaxed text-faint">
                        {review.learning}
                      </p>
                    ) : null}
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

function RatesCard({
  title,
  description,
  projection,
}: {
  title: string;
  description: string;
  projection: Awaited<ReturnType<typeof acquisitionPlan>>["measured"] | null;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-3">
        {!projection ? (
          <p className="text-[12.5px] text-muted">No target set.</p>
        ) : (
          <>
            {!projection.ok ? (
              <p className="rounded-md border border-line bg-raised/40 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                {projection.reason}
              </p>
            ) : (
              <p className="text-[13px] text-ink">
                {projection.requiredFirstTouches.toLocaleString("en-GB")} first touches, at a
                compound conversion of {percent(projection.conversion * 100, 2)}.
              </p>
            )}

            <ul className="space-y-1.5">
              {projection.rates.map((rate) => (
                <li key={rate.key} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-ink">
                      {rate.label}
                      {!rate.measured ? (
                        <span className="ml-1.5 text-[11px] text-warning">assumed</span>
                      ) : null}
                    </p>
                    <p className="text-[11.5px] leading-relaxed text-faint">{rate.basis}</p>
                  </div>
                  <span className="shrink-0 tabular text-[12.5px] text-ink">
                    {rate.value === null ? "—" : percent(rate.value * 100, 1)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardBody>
    </Card>
  );
}
