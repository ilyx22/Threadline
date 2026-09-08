import type { Metadata } from "next";
import { GitBranch } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { learningTrajectory, listCorrections, listRoots } from "@/lib/data/content-learning";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, SectionHeading } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { StatCard } from "@/components/ui/data";
import { can } from "@/lib/auth/roles";
import { FAILURE_LABELS, type FailureClass } from "@/lib/domain/content-diagnosis";
import { formatDate } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "What we are learning" };

/**
 * The learning surface.
 *
 * The ordering is the argument. **What we learned comes before the numbers**,
 * because a client who can see the decisions getting better will tolerate a
 * period where the metrics have not — and a client shown only rising metrics
 * learns nothing and leaves the moment they stop rising.
 *
 * A declining trajectory is printed exactly as it happened. There is no branch
 * in this file that softens it.
 */
export default async function LearningPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "learning.view");

  const engagementStart = ctx.org.startedAt ?? ctx.org.createdAt;
  const [{ periods, reading }, roots, corrections] = await Promise.all([
    learningTrajectory(ctx.org.id, engagementStart),
    listRoots(ctx.org.id),
    listCorrections(ctx.org.id, 25),
  ]);

  const isOperator = can(ctx.role, "learning.manage");
  const scored = periods.filter((p) => p.meanScore !== null);
  const open = roots.filter((r) => r.status === "open");

  const tone =
    reading.direction === "declining"
      ? "warning"
      : reading.direction === "improving"
        ? "positive"
        : "info";

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-section">What we are learning</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          What we expected, what the market actually did, what we changed as a result, and whether
          the change worked.
        </p>
      </header>

      {/* The headline first, whatever it says. */}
      <Notice tone={tone} title={reading.headline}>
        {reading.reading}
      </Notice>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Service period"
          value={periods.length || 1}
          sublabel={periods.length > 0 ? periods[periods.length - 1].period === periods.length ? "four-week cycles" : "" : "four-week cycles"}
          emphasis
        />
        <StatCard
          label="Test families"
          value={open.length}
          sublabel={`${roots.length - open.length} closed`}
        />
        <StatCard
          label="Corrections made"
          value={corrections.length}
          sublabel={`${reading.correctionsPending} still untested`}
        />
        <StatCard
          label="Corrections that worked"
          value={
            reading.correctionHitRate === null
              ? "—"
              : `${Math.round(reading.correctionHitRate * 100)}%`
          }
          sublabel="of those retested"
        />
      </section>

      {reading.limitations.length > 0 ? (
        <Card>
          <CardHeader
            title="What this cannot tell you yet"
            description="Worth reading before any of the numbers above get quoted."
          />
          <CardBody className="space-y-1.5 pt-0">
            {reading.limitations.map((l) => (
              <p key={l} className="text-[12.5px] leading-relaxed text-muted">
                {l}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {/* Period by period. */}
      <section>
        <SectionHeading
          title="Period by period"
          description="Four-week service periods, not calendar months. Each one has a job, and the job changes as the system learns more about this market."
        />
        <div className="space-y-3">
          {periods.map((p) => {
            const phase = periodPhase(p.period);
            return (
              <Card key={p.period}>
                <CardBody className="space-y-3 pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-ink">
                        Period {p.period} · {phase.label}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-faint">
                        {formatDate(p.start)} – {formatDate(p.end)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.meanScore !== null ? (
                        <Badge tone="neutral">{p.meanScore.toFixed(1)} / 5 mean score</Badge>
                      ) : (
                        <Badge tone="outline">No scored work</Badge>
                      )}
                      {p.qualifiedActions > 0 ? (
                        <Badge tone="positive">
                          {p.qualifiedActions} qualified action{p.qualifiedActions === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-[12.5px] leading-relaxed text-muted">{phase.intent}</p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-faint">
                    <span>{p.published} published</span>
                    <span>{p.diagnosed} diagnosed</span>
                    <span>{p.corrections} corrections</span>
                    {p.correctionsWorked > 0 ? <span>{p.correctionsWorked} worked</span> : null}
                    {p.correctionsFailed > 0 ? <span>{p.correctionsFailed} did not</span> : null}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
        {scored.length >= 2 ? (
          <p className="mt-3 text-[12px] leading-relaxed text-ghost">
            Trajectory: {scored.map((p) => p.meanScore!.toFixed(1)).join(" → ")}. Reported as it
            happened — this figure is never smoothed.
          </p>
        ) : null}
      </section>

      {/* Test families. */}
      <section>
        <SectionHeading
          title="Test families"
          description="One claim, tested more than once. A new hook on the same claim stays in the same family so the results remain comparable; a genuinely new claim starts a new one."
        />
        {roots.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No test families yet"
            description="A test family is the claim being made, not the content that makes it. Group the first pieces into one and the system can start telling you which claims are earning attention."
          />
        ) : (
          <div className="space-y-3">
            {roots.map((root) => {
              const latest = root.diagnoses[0];
              const pending = root.corrections.filter((c) => c.worked === null).length;
              return (
                <Card key={root.id}>
                  <CardBody className="space-y-3 pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 max-w-2xl">
                        <p className="text-[14px] font-medium text-ink">{root.label}</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{root.thesis}</p>
                      </div>
                      <Badge tone={root.status === "open" ? "accent" : root.status === "abandoned" ? "outline" : "positive"}>
                        {root.status}
                      </Badge>
                    </div>

                    {root.closedReason ? (
                      <p className="rounded-md border border-line bg-raised/40 px-3 py-2 text-[12px] leading-relaxed text-muted">
                        {root.closedReason}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-faint">
                      <span>{root.sourceCount} original</span>
                      <span>{root.retestCount} retest{root.retestCount === 1 ? "" : "s"}</span>
                      <span>{root.derivativeCount} derivative{root.derivativeCount === 1 ? "" : "s"}</span>
                      {pending > 0 ? <span>{pending} correction{pending === 1 ? "" : "s"} untested</span> : null}
                    </div>

                    {latest ? (
                      <div className="rounded-md border border-line bg-raised/40 px-3 py-2.5">
                        <p className="text-[10.5px] font-medium uppercase tracking-wide text-faint">
                          Latest reading · {FAILURE_LABELS[latest.failureClass as FailureClass] ?? latest.failureClass}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink">
                          {latest.explanation}
                        </p>
                        {latest.prescription ? (
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-accent">
                            {latest.prescription}
                          </p>
                        ) : null}
                        {isOperator && latest.approvalState !== "approved" ? (
                          <Badge tone="warning" className="mt-2">
                            Draft — not yet approved
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Corrections. */}
      <section>
        <SectionHeading
          title="What we changed"
          description="Every correction records what we believed, what happened instead, which assumption was wrong, and what we did about it. A correction with no verdict has not been retested yet — that is a real state, not a failure."
        />
        {corrections.length === 0 ? (
          <EmptyState
            title="No corrections recorded yet"
            description="These appear once a diagnosis names something specific enough to change."
          />
        ) : (
          <div className="space-y-3">
            {corrections.map((c) => (
              <Card key={c.id}>
                <CardBody className="space-y-2.5 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11.5px] text-faint">
                      {formatDate(c.createdAt)}
                      {c.root ? ` · ${c.root.label}` : ""} · {c.lever}
                    </p>
                    <Badge
                      tone={c.worked === null ? "outline" : c.worked ? "positive" : "warning"}
                    >
                      {c.worked === null ? "Not retested yet" : c.worked ? "Worked" : "Did not work"}
                    </Badge>
                  </div>

                  <Line label="We believed" value={c.believed} />
                  <Line label="What happened" value={c.actual} />
                  <Line label="The assumption that was wrong" value={c.failedAssumption} />
                  <Line label="What we changed" value={c.correction} accent />
                  {c.verdictNote ? <Line label="How we know" value={c.verdictNote} /> : null}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-0.5 text-[12.5px] leading-relaxed ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

/** Local copy of the phase lookup so the page need not import the whole module. */
function periodPhase(period: number): { label: string; intent: string } {
  if (period <= 1)
    return {
      label: "Establish and calibrate",
      intent:
        "Get real work in front of a real audience and find out what this market responds to, rather than what we assumed it would.",
    };
  if (period === 2)
    return {
      label: "Refine and correct",
      intent:
        "Act on what the first period taught us, and check whether those specific changes moved anything.",
    };
  if (period === 3)
    return {
      label: "Concentrate and compound",
      intent:
        "Put the effort behind what has been shown to earn commercially valuable attention, and stop paying for what has not.",
    };
  return {
    label: "Compound harder",
    intent:
      "Keep pressing the patterns that hold, retire the ones that stop paying, and keep the founder's specific voice and evidence accumulating.",
  };
}
