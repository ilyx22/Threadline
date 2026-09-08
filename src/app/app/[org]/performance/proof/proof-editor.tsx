"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/feedback";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, ActionButton, FormError, SubmitButton } from "@/components/forms/action-form";
import { lockProofPeriodAction, saveProofPeriodAction } from "@/lib/actions/proof";

/**
 * Proof period editor.
 *
 * Only client-reported figures are collected here. Everything the platform can
 * observe — pieces published, cycle time, approval time, inquiries, calls
 * booked, attributable value — is recomputed from the workspace at read time
 * and is not editable, so nobody can quietly improve a month by typing over it.
 */

type PeriodDefaults = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  reportedFounderHours: string;
  reportedContentOutput: string;
  reportedCycleTimeDays: string;
  reportedApprovalDays: string;
  reportedAudienceSize: string;
  reportedEngagementRate: string;
  reportedQualifiedInquiries: string;
  reportedCallsBooked: string;
  reportedAttributableValue: string;
  attributionNote: string;
  qualitativeNotes: string;
};

export function PeriodEditor({
  slug,
  kind,
  trigger,
  period,
}: {
  slug: string;
  kind: "baseline" | "period";
  trigger: string;
  period?: PeriodDefaults;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const isBaseline = kind === "baseline";

  const today = new Date();
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const defaultStart = new Date(defaultEnd.getFullYear(), defaultEnd.getMonth(), 1);
  const baselineEnd = new Date(today.getFullYear(), today.getMonth(), 1);
  const baselineStart = new Date(baselineEnd);
  baselineStart.setMonth(baselineStart.getMonth() - 3);

  return (
    <>
      <Button
        size={period ? "sm" : undefined}
        icon={period ? undefined : Plus}
        variant={period ? "ghost" : isBaseline ? "accent" : "secondary"}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="xl">
          <DialogHeader
            title={
              period
                ? `Edit ${isBaseline ? "the baseline" : "this month"}`
                : isBaseline
                  ? "Record the baseline"
                  : "Record a month"
            }
            description={
              isBaseline
                ? "How content ran before Threadline. Nothing before the engagement is observable from inside the product, so every figure here is what the founder reports — and it is labelled that way wherever it appears."
                : "Only the figures the platform cannot see. Pieces published, cycle time, approval time, inquiries, calls booked and attributable value are recomputed from this workspace."
            }
          />
          <ActionForm
            action={saveProofPeriodAction.bind(null, slug, period?.id ?? null)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-5">
                  <FormError error={error} />
                  <input type="hidden" name="kind" value={kind} />

                  <Field label="Label" error={fieldErrors.label}>
                    <Input
                      name="label"
                      required
                      defaultValue={
                        period?.label ??
                        (isBaseline
                          ? "Before Threadline"
                          : defaultStart.toLocaleDateString("en-GB", {
                              month: "long",
                              year: "numeric",
                            }))
                      }
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Period start" error={fieldErrors.periodStart}>
                      <Input
                        type="date"
                        name="periodStart"
                        required
                        defaultValue={
                          period?.periodStart ??
                          (isBaseline ? baselineStart : defaultStart).toISOString().slice(0, 10)
                        }
                      />
                    </Field>
                    <Field label="Period end" error={fieldErrors.periodEnd}>
                      <Input
                        type="date"
                        name="periodEnd"
                        required
                        defaultValue={
                          period?.periodEnd ??
                          (isBaseline ? baselineEnd : defaultEnd).toISOString().slice(0, 10)
                        }
                      />
                    </Field>
                  </div>

                  <section className="space-y-4 border-t border-line pt-5">
                    <div>
                      <h3 className="text-[13px] font-medium text-ink">
                        {isBaseline ? "Reported figures" : "What only you can tell us"}
                      </h3>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted">
                        Leave anything you do not know blank. A blank is honest; a guess becomes a
                        comparison that means nothing.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Founder hours on content, per week"
                        hint="Thinking, writing, recording, reviewing and chasing."
                      >
                        <Input
                          name="reportedFounderHours"
                          inputMode="decimal"
                          defaultValue={period?.reportedFounderHours ?? ""}
                        />
                      </Field>
                      <Field label="Audience size at the end of the period">
                        <Input
                          name="reportedAudienceSize"
                          inputMode="numeric"
                          defaultValue={period?.reportedAudienceSize ?? ""}
                        />
                      </Field>
                    </div>
                  </section>

                  {isBaseline ? (
                    <section className="space-y-4 border-t border-line pt-5">
                      <div>
                        <h3 className="text-[13px] font-medium text-ink">
                          The rest of the baseline
                        </h3>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">
                          These would normally be measured, but the engagement had not started, so
                          the founder reports them.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Pieces published in the period">
                          <Input
                            name="reportedContentOutput"
                            inputMode="numeric"
                            defaultValue={period?.reportedContentOutput ?? ""}
                          />
                        </Field>
                        <Field label="Typical production cycle, in days">
                          <Input
                            name="reportedCycleTimeDays"
                            inputMode="decimal"
                            defaultValue={period?.reportedCycleTimeDays ?? ""}
                          />
                        </Field>
                        <Field label="Typical approval wait, in days">
                          <Input
                            name="reportedApprovalDays"
                            inputMode="decimal"
                            defaultValue={period?.reportedApprovalDays ?? ""}
                          />
                        </Field>
                        <Field label="Engagement rate, %">
                          <Input
                            name="reportedEngagementRate"
                            inputMode="decimal"
                            defaultValue={period?.reportedEngagementRate ?? ""}
                          />
                        </Field>
                        <Field label="Qualified inquiries in the period">
                          <Input
                            name="reportedQualifiedInquiries"
                            inputMode="numeric"
                            defaultValue={period?.reportedQualifiedInquiries ?? ""}
                          />
                        </Field>
                        <Field label="Calls booked in the period">
                          <Input
                            name="reportedCallsBooked"
                            inputMode="numeric"
                            defaultValue={period?.reportedCallsBooked ?? ""}
                          />
                        </Field>
                      </div>
                      <Field
                        label="Value attributable to content"
                        hint="Only where a buyer named a piece of content. Leave blank if that was never tracked — which is usually the honest answer for a baseline."
                      >
                        <Input
                          name="reportedAttributableValueMinor"
                          inputMode="decimal"
                          defaultValue={period?.reportedAttributableValue ?? ""}
                        />
                      </Field>
                    </section>
                  ) : (
                    <Notice tone="info" title="The rest is measured, not entered">
                      Pieces published, cycle time, approval time, qualified inquiries, calls booked
                      and attributable value are recomputed from this workspace whenever the page is
                      opened, so a comparison can never drift away from the records behind it.
                    </Notice>
                  )}

                  <section className="space-y-4 border-t border-line pt-5">
                    <Field
                      label="How attribution was established"
                      optional
                      hint="In your own words. This is shown next to any commercial figure."
                      error={fieldErrors.attributionNote}
                    >
                      <Textarea
                        name="attributionNote"
                        rows={2}
                        defaultValue={period?.attributionNote ?? ""}
                        placeholder="Both closed engagements named a specific post on the discovery call; recorded against that piece in the pipeline."
                      />
                    </Field>
                    <Field
                      label="Notable qualitative outcomes"
                      optional
                      hint="A named inbound, a partnership, a speaking invitation, a competitor changing their messaging."
                      error={fieldErrors.qualitativeNotes}
                    >
                      <Textarea
                        name="qualitativeNotes"
                        rows={3}
                        defaultValue={period?.qualitativeNotes ?? ""}
                      />
                    </Field>
                  </section>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent">Save</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LockPeriodButton({ slug, periodId }: { slug: string; periodId: string }) {
  const router = useRouter();
  return (
    <ActionButton
      size="sm"
      variant="ghost"
      action={() => lockProofPeriodAction(slug, periodId)}
      confirm="Lock these figures? Once a period has been shown to a client, changing it later rewrites what was said."
      onDone={() => router.refresh()}
    >
      Lock
    </ActionButton>
  );
}
