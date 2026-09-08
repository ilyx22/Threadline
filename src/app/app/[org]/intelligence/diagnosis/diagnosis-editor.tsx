"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/controls";
import { Notice } from "@/components/ui/feedback";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, ActionButton, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  CONSTRAINT_DIMENSIONS,
  CONSTRAINT_DIMENSION_META,
  CONSTRAINT_DIMENSION_OPTIONS,
  SEVERITIES,
  SEVERITY_META,
  type ConstraintDimension,
} from "@/lib/domain/enums";
import {
  DIMENSION_QUESTION,
  RATING_LABELS,
  VOLUME_HELPS,
  suggestedSeverity,
  volumeVerdict,
  weakestDimension,
} from "@/lib/domain/diagnosis";
import {
  activateDiagnosisAction,
  reviewDiagnosisAction,
  saveDiagnosisAction,
} from "@/lib/actions/diagnosis";

/**
 * Diagnosis editor.
 *
 * The ratings are entered first and the primary constraint is derived from them
 * live, so the operator sees the answer the evidence gives before choosing one.
 * Overriding it is allowed — the point is that the override is visible.
 */

type DiagnosisDefaults = {
  id: string;
  primaryConstraint: string;
  severity: string;
  confidence: number;
  evidence: string;
  commercialImpact: string;
  recommendedAction: string;
  experiment: string;
  reviewDate: string;
  assessments: { dimension: string; rating: number; note: string }[];
};

export function DiagnosisEditor({
  slug,
  trigger,
  diagnosis,
}: {
  slug: string;
  trigger: string;
  diagnosis?: DiagnosisDefaults;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        icon={diagnosis ? undefined : Stethoscope}
        variant={diagnosis ? "secondary" : "accent"}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      {open ? (
        <DiagnosisDialog
          slug={slug}
          diagnosis={diagnosis}
          onClose={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function DiagnosisDialog({
  slug,
  diagnosis,
  onClose,
}: {
  slug: string;
  diagnosis?: DiagnosisDefaults;
  onClose: () => void;
}) {
  const initial = React.useMemo(() => {
    const map: Record<string, { rating: number; note: string }> = {};
    for (const dimension of CONSTRAINT_DIMENSIONS) {
      const existing = diagnosis?.assessments.find((a) => a.dimension === dimension);
      map[dimension] = { rating: existing?.rating ?? 3, note: existing?.note ?? "" };
    }
    return map;
  }, [diagnosis]);

  const [ratings, setRatings] = React.useState(initial);
  const [override, setOverride] = React.useState(diagnosis?.primaryConstraint ?? "");
  const [confidence, setConfidence] = React.useState(diagnosis?.confidence ?? 50);

  const ratingList = CONSTRAINT_DIMENSIONS.map((dimension) => ({
    dimension,
    rating: ratings[dimension]?.rating ?? 3,
  }));
  const suggested = weakestDimension(ratingList);
  const effective = (override || suggested) as ConstraintDimension | null;
  const effectiveRating = effective ? (ratings[effective]?.rating ?? 3) : 3;

  const setRating = (dimension: string, rating: number) =>
    setRatings((prev) => ({ ...prev, [dimension]: { ...prev[dimension]!, rating } }));
  const setNote = (dimension: string, note: string) =>
    setRatings((prev) => ({ ...prev, [dimension]: { ...prev[dimension]!, note } }));

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent size="xl">
        <DialogHeader
          title={diagnosis ? "Edit the diagnosis" : "Constraint diagnosis"}
          description="Rate each dimension against what you can actually see. 1 is severely constrained, 5 is strong."
        />
        <ActionForm
          action={saveDiagnosisAction.bind(null, slug, diagnosis?.id ?? null)}
          onSuccess={onClose}
        >
          {({ fieldErrors, error }) => (
            <>
              <DialogBody className="space-y-6">
                <FormError error={error} />

                <div className="space-y-4">
                  {CONSTRAINT_DIMENSIONS.map((dimension) => {
                    const value = ratings[dimension]?.rating ?? 3;
                    return (
                      <div
                        key={dimension}
                        className="rounded-lg border border-line bg-elevated px-4 py-3.5"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-[13.5px] font-medium text-ink">
                            {CONSTRAINT_DIMENSION_META[dimension].label}
                          </p>
                          <span
                            className={`text-[12px] tabular ${
                              value <= 2
                                ? "text-negative"
                                : value === 3
                                  ? "text-warning"
                                  : "text-positive"
                            }`}
                          >
                            {value} · {RATING_LABELS[value]}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">
                          {DIMENSION_QUESTION[dimension]}
                        </p>
                        <Slider
                          className="mt-2"
                          min={1}
                          max={5}
                          step={1}
                          value={[value]}
                          onValueChange={([v]) => setRating(dimension, v ?? 3)}
                        />
                        <input type="hidden" name={`rating_${dimension}`} value={value} />
                        <Textarea
                          className="mt-2"
                          name={`note_${dimension}`}
                          rows={2}
                          placeholder="What did you see that supports this rating?"
                          value={ratings[dimension]?.note ?? ""}
                          onChange={(e) => setNote(dimension, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 border-t border-line pt-5">
                  {suggested ? (
                    <Notice
                      tone={VOLUME_HELPS[suggested] ? "info" : "warning"}
                      title={`The ratings point at: ${CONSTRAINT_DIMENSION_META[suggested].label}`}
                    >
                      {volumeVerdict(suggested)}
                    </Notice>
                  ) : null}

                  <Field
                    label="Primary constraint"
                    hint="Defaults to the weakest dimension. Override it only if you can say why."
                    error={fieldErrors.primaryConstraint}
                  >
                    <NativeSelect
                      name="primaryConstraint"
                      value={effective ?? ""}
                      onChange={(e) => setOverride(e.target.value)}
                    >
                      {CONSTRAINT_DIMENSION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                          {option.value === suggested ? " (weakest)" : ""}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Severity" error={fieldErrors.severity}>
                      <NativeSelect
                        name="severity"
                        defaultValue={diagnosis?.severity ?? suggestedSeverity(effectiveRating)}
                      >
                        {SEVERITIES.map((value) => (
                          <option key={value} value={value}>
                            {SEVERITY_META[value].label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label={`Confidence — ${confidence}%`}>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[confidence]}
                        onValueChange={([v]) => setConfidence(v ?? 50)}
                      />
                      <input type="hidden" name="confidence" value={confidence} />
                    </Field>
                  </div>

                  <Field
                    label="What this constraint costs the business"
                    hint="Required before this can become the current diagnosis. A constraint with no commercial consequence is an observation."
                    error={fieldErrors.commercialImpact}
                  >
                    <Textarea
                      name="commercialImpact"
                      rows={3}
                      defaultValue={diagnosis?.commercialImpact ?? ""}
                      placeholder="Roughly half the qualified conversations stall before pricing, because the offer is understood as advice rather than an operational change."
                    />
                  </Field>

                  <Field label="Recommended next action" error={fieldErrors.recommendedAction}>
                    <Textarea
                      name="recommendedAction"
                      rows={2}
                      defaultValue={diagnosis?.recommendedAction ?? ""}
                    />
                  </Field>

                  <Field label="Experiment that would move it" optional error={fieldErrors.experiment}>
                    <Textarea
                      name="experiment"
                      rows={2}
                      defaultValue={diagnosis?.experiment ?? ""}
                    />
                  </Field>

                  <Field
                    label="Next review"
                    hint="Defaults to a month out. A constraint nobody revisits becomes an assumption."
                    error={fieldErrors.reviewDate}
                  >
                    <Input type="date" name="reviewDate" defaultValue={diagnosis?.reviewDate ?? ""} />
                  </Field>

                  <Field label="Supporting evidence" optional error={fieldErrors.evidence}>
                    <Textarea name="evidence" rows={4} defaultValue={diagnosis?.evidence ?? ""} />
                  </Field>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <SubmitButton variant="accent">Save diagnosis</SubmitButton>
              </DialogFooter>
            </>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function ActivateDiagnosis({ slug, diagnosisId }: { slug: string; diagnosisId: string }) {
  const router = useRouter();
  return (
    <ActionButton
      variant="accent"
      action={() => activateDiagnosisAction(slug, diagnosisId)}
      onDone={() => router.refresh()}
    >
      Make this the current diagnosis
    </ActionButton>
  );
}

export function ReviewDiagnosis({ slug, diagnosisId }: { slug: string; diagnosisId: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Record a review
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Monthly strategy review"
            description="Appended to the record, never overwritten — the history of what was believed and when is the thing that makes a diagnosis worth keeping."
          />
          <ActionForm
            action={reviewDiagnosisAction.bind(null, slug, diagnosisId)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="What did this review conclude?" error={fieldErrors.note}>
                    <Textarea
                      name="note"
                      rows={5}
                      required
                      placeholder="Still positioning. Two of the three tests moved engagement but not qualified conversations, which is what we would expect if the problem is what people think we do rather than how much we publish."
                    />
                  </Field>
                  <Field label="Next review" error={fieldErrors.reviewDate}>
                    <Input
                      type="date"
                      name="reviewDate"
                      defaultValue={nextMonth.toISOString().slice(0, 10)}
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent">Record review</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
