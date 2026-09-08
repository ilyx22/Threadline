import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { requireOrgPage } from "@/lib/auth/guard";
import { currentDiagnosis, diagnosisHistory, toRatings } from "@/lib/data/diagnosis";
import {
  CONSTRAINT_DIMENSIONS,
  CONSTRAINT_DIMENSION_META,
  SEVERITY_META,
  type ConstraintDimension,
  type Severity,
} from "@/lib/domain/enums";
import {
  DIMENSION_QUESTION,
  RATING_LABELS,
  constrainedDimensions,
  diagnosisAverage,
  isComplete,
  isReviewOverdue,
  volumeVerdict,
  weakestDimension,
} from "@/lib/domain/diagnosis";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { formatDate, relativeTime } from "@/lib/utils/dates";
import { DiagnosisEditor, ActivateDiagnosis, ReviewDiagnosis } from "./diagnosis-editor";

export const metadata: Metadata = { title: "Constraint diagnosis" };

export default async function DiagnosisPage({ params }: { params: Promise<{ org: string }> }) {
  const { org: slug } = await params;
  const ctx = await requireOrgPage(slug, "diagnosis.view");

  const [diagnosis, history] = await Promise.all([
    currentDiagnosis(ctx.org.id, ctx.role),
    // The trail of superseded diagnoses is operator context, not client reading.
    ctx.isInternal ? diagnosisHistory(ctx.org.id, 8) : Promise.resolve([]),
  ]);

  const canEdit = ctx.can("diagnosis.edit");
  const ratings = diagnosis ? toRatings(diagnosis.assessments) : [];
  const complete = isComplete(ratings);
  const average = diagnosisAverage(ratings);
  const weakest = weakestDimension(ratings);
  const constrained = constrainedDimensions(ratings);
  const primary = (diagnosis?.primaryConstraint ?? weakest) as ConstraintDimension | null;
  const overdue = isReviewOverdue(diagnosis?.reviewDate ?? null);

  const ratingByDimension = new Map(diagnosis?.assessments.map((a) => [a.dimension, a]) ?? []);

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="text-section">Constraint diagnosis</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Nine dimensions, rated from evidence. The weakest one is what is actually limiting demand
          — and on five of the nine, publishing more content makes the problem more expensive
          rather than smaller. This exists so that answer has to be argued for rather than assumed.
        </p>
      </header>

      {!diagnosis ? (
        <EmptyState
          icon={Stethoscope}
          title="No diagnosis yet"
          description="Rate each dimension against what you can actually see: the website, the offer, the content already published, the conversations that stalled, and the numbers in this workspace."
          action={canEdit ? <DiagnosisEditor slug={slug} trigger="Start the diagnosis" /> : undefined}
        />
      ) : (
        <>
          {/* ----------------------------- The verdict ---------------------------- */}
          <Card>
            <CardBody className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={diagnosis.status === "active" ? "accent" : "outline"}>
                      {diagnosis.status === "active" ? "Current diagnosis" : "Draft"}
                    </Badge>
                    <Badge tone={SEVERITY_META[diagnosis.severity as Severity]?.tone ?? "neutral"}>
                      {SEVERITY_META[diagnosis.severity as Severity]?.label ?? diagnosis.severity}
                    </Badge>
                    <span className="text-[11.5px] text-ghost">
                      Confidence {diagnosis.confidence}%
                    </span>
                    {diagnosis.createdBy ? (
                      <span className="text-[11.5px] text-ghost">
                        · set by {diagnosis.createdBy.name}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-eyebrow mt-4 text-faint">Primary constraint</p>
                  <h2 className="mt-1.5 text-[24px] font-medium tracking-tight text-ink">
                    {primary ? CONSTRAINT_DIMENSION_META[primary].label : "Not set"}
                  </h2>
                  {primary ? (
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                      {CONSTRAINT_DIMENSION_META[primary].description}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-eyebrow text-faint">Average rating</p>
                  <p className="mt-1 text-[28px] font-medium tabular text-ink">
                    {average.toFixed(1)}
                    <span className="text-[16px] text-ghost">/5</span>
                  </p>
                  <p className="mt-1 text-[11.5px] text-ghost">
                    {ratings.length} of 9 rated
                  </p>
                </div>
              </div>

              {primary ? (
                <p className="mt-5 rounded-md border border-line bg-elevated px-4 py-3 text-[13.5px] leading-relaxed text-ink">
                  {volumeVerdict(primary)}
                </p>
              ) : null}

              <dl className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                {diagnosis.commercialImpact ? (
                  <div>
                    <dt className="text-eyebrow text-faint">What it costs</dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {diagnosis.commercialImpact}
                    </dd>
                  </div>
                ) : null}
                {diagnosis.recommendedAction ? (
                  <div>
                    <dt className="text-eyebrow text-faint">Recommended next action</dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {diagnosis.recommendedAction}
                    </dd>
                  </div>
                ) : null}
                {diagnosis.experiment ? (
                  <div>
                    <dt className="text-eyebrow text-faint">Experiment</dt>
                    <dd className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {diagnosis.experiment}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-eyebrow text-faint">Next review</dt>
                  <dd
                    className={`mt-1.5 text-[13px] ${overdue ? "text-warning" : "text-muted"}`}
                  >
                    {diagnosis.reviewDate ? formatDate(diagnosis.reviewDate) : "Not scheduled"}
                    {overdue ? " — overdue" : ""}
                    {diagnosis.reviewedAt ? (
                      <span className="text-ghost">
                        {" "}
                        · last reviewed {relativeTime(diagnosis.reviewedAt)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              </dl>

              {canEdit ? (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                  <DiagnosisEditor
                    slug={slug}
                    trigger="Edit diagnosis"
                    diagnosis={{
                      id: diagnosis.id,
                      primaryConstraint: diagnosis.primaryConstraint,
                      severity: diagnosis.severity,
                      confidence: diagnosis.confidence,
                      evidence: diagnosis.evidence ?? "",
                      commercialImpact: diagnosis.commercialImpact ?? "",
                      recommendedAction: diagnosis.recommendedAction ?? "",
                      experiment: diagnosis.experiment ?? "",
                      reviewDate: diagnosis.reviewDate
                        ? diagnosis.reviewDate.toISOString().slice(0, 10)
                        : "",
                      assessments: diagnosis.assessments.map((a) => ({
                        dimension: a.dimension,
                        rating: a.rating,
                        note: a.note ?? "",
                      })),
                    }}
                  />
                  {diagnosis.status !== "active" ? (
                    <ActivateDiagnosis slug={slug} diagnosisId={diagnosis.id} />
                  ) : (
                    <ReviewDiagnosis slug={slug} diagnosisId={diagnosis.id} />
                  )}
                </div>
              ) : null}
            </CardBody>
          </Card>

          {!complete ? (
            <Notice tone="warning" icon={Stethoscope} title="Not all nine dimensions are rated">
              A diagnosis can only become current once every dimension has been rated. Rating a
              subset makes it possible to name the constraint you had already decided on.
            </Notice>
          ) : null}

          {overdue && diagnosis.status === "active" ? (
            <Notice tone="warning" title="This diagnosis is due a review">
              A constraint that is never revisited quietly turns into an assumption. Record the
              monthly review even when nothing has changed.
            </Notice>
          ) : null}

          {/* --------------------------- The nine dimensions --------------------- */}
          <section className="space-y-3">
            <h2 className="text-[15px] font-medium text-ink">The nine dimensions</h2>
            <ul className="grid gap-2 lg:grid-cols-2">
              {CONSTRAINT_DIMENSIONS.map((dimension) => {
                const assessment = ratingByDimension.get(dimension);
                const rating = assessment?.rating;
                const isPrimary = dimension === primary;
                return (
                  <li key={dimension}>
                    <Card
                      className={`h-full p-0 ${isPrimary ? "border-accent-line" : ""}`}
                    >
                      <CardBody className="pt-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[13.5px] font-medium text-ink">
                              {CONSTRAINT_DIMENSION_META[dimension].label}
                              {isPrimary ? (
                                <span className="ml-2 text-[11px] text-accent">
                                  Primary constraint
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-muted">
                              {DIMENSION_QUESTION[dimension]}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-[18px] font-medium tabular ${
                                rating === undefined
                                  ? "text-ghost"
                                  : rating <= 2
                                    ? "text-negative"
                                    : rating === 3
                                      ? "text-warning"
                                      : "text-positive"
                              }`}
                            >
                              {rating ?? "—"}
                            </p>
                            <p className="text-[10.5px] text-ghost">
                              {rating ? RATING_LABELS[rating] : "Unrated"}
                            </p>
                          </div>
                        </div>
                        {assessment?.note ? (
                          <p className="mt-2.5 border-t border-line pt-2.5 text-[12px] leading-relaxed text-faint">
                            {assessment.note}
                          </p>
                        ) : null}
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>

          {constrained.length > 1 ? (
            <Notice tone="neutral" title={`${constrained.length} dimensions are weak`}>
              {constrained
                .map((c) => CONSTRAINT_DIMENSION_META[c.dimension].label)
                .join(", ")}
              . Only one can be the primary constraint at a time; the rest are recorded so they are
              not forgotten when this one moves.
            </Notice>
          ) : null}

          {diagnosis.evidence ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-medium text-ink">Evidence and review history</h2>
              <Card>
                <CardBody className="pt-4">
                  <div className="space-y-3">
                    {diagnosis.evidence.split(/\n{2,}/).map((block, i) => (
                      <p key={i} className="text-[13px] leading-relaxed text-muted">
                        {block}
                      </p>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </section>
          ) : null}

          {history.length > 1 ? (
            <section className="space-y-3">
              <h2 className="text-[15px] font-medium text-ink">Previous diagnoses</h2>
              <ul className="space-y-2">
                {history
                  .filter((h) => h.id !== diagnosis.id)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md border border-line bg-elevated px-3.5 py-2.5 text-[12.5px]"
                    >
                      <span className="text-ink">
                        {CONSTRAINT_DIMENSION_META[item.primaryConstraint as ConstraintDimension]
                          ?.label ?? item.primaryConstraint}
                      </span>
                      <Badge tone="outline">{item.status}</Badge>
                      <span className="ml-auto text-ghost">{relativeTime(item.createdAt)}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
