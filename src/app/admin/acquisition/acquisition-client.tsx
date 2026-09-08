"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { saveFunnelReviewAction, saveTargetAction } from "@/lib/actions/acquisition";
import { toDateInput } from "@/lib/utils/dates";

export function TargetButton({
  target,
}: {
  target: {
    id: string;
    label: string;
    targetWins: number;
    periodStart: string;
    periodEnd: string;
    assumed: { booking: number; show: number; qualified: number; close: number };
    notes: string | null;
  } | null;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Target} onClick={() => setOpen(true)} variant={target ? "secondary" : "primary"}>
        {target ? "Edit target" : "Set a target"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title={target ? "Edit the target" : "Set the acquisition target"}
            description="The quota is a maths output, not a motivational number. Setting a new target closes the current one."
          />
          <ActionForm
            action={saveTargetAction.bind(null, target?.id ?? null)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  <Field label="Name" htmlFor="label" error={fieldErrors.label}>
                    <Input
                      id="label"
                      name="label"
                      required
                      defaultValue={target?.label ?? ""}
                      placeholder="e.g. First two retained clients"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Wins" htmlFor="targetWins" error={fieldErrors.targetWins}>
                      <Input
                        id="targetWins"
                        name="targetWins"
                        type="number"
                        min={1}
                        defaultValue={target?.targetWins ?? 2}
                      />
                    </Field>
                    <Field label="From" htmlFor="periodStart">
                      <Input
                        id="periodStart"
                        name="periodStart"
                        type="date"
                        defaultValue={toDateInput(target?.periodStart ?? new Date())}
                      />
                    </Field>
                    <Field label="Until" htmlFor="periodEnd">
                      <Input
                        id="periodEnd"
                        name="periodEnd"
                        type="date"
                        defaultValue={toDateInput(target?.periodEnd ?? null)}
                      />
                    </Field>
                  </div>

                  <div className="rounded-md border border-line bg-raised/40 px-3 py-2.5">
                    <p className="text-[12.5px] leading-relaxed text-muted">
                      The rates below are used only until Threadline has enough of its own data.
                      They are always shown as assumptions. Do not borrow another business&apos;s
                      conversion rates and treat them as ours — their numbers can illustrate the
                      chain, but only our data can set our quota.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Rate name="assumedBookingRatePct" label="Booking %" value={target?.assumed.booking} />
                    <Rate name="assumedShowRatePct" label="Show %" value={target?.assumed.show} />
                    <Rate
                      name="assumedQualifiedRatePct"
                      label="Qualified %"
                      value={target?.assumed.qualified}
                    />
                    <Rate name="assumedCloseRatePct" label="Close %" value={target?.assumed.close} />
                  </div>

                  <Field label="Notes" htmlFor="notes" optional>
                    <Textarea id="notes" name="notes" rows={2} defaultValue={target?.notes ?? ""} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Save target</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Rate({ name, label, value }: { name: string; label: string; value?: number }) {
  return (
    <Field label={label} htmlFor={name}>
      <Input
        id={name}
        name={name}
        type="number"
        min={0}
        max={100}
        step="0.1"
        inputSize="sm"
        defaultValue={value ?? 0}
      />
    </Field>
  );
}

/**
 * The Friday control loop.
 *
 * Counts are frozen before anything changes, so next week's comparison is
 * legible. One variable per week — the form refuses several, because changing
 * five things at once produces a result nobody can attribute to any of them.
 */
export function ReviewForm({
  weekStart,
  counts,
  steps,
  suggested,
}: {
  weekStart: string;
  counts: string;
  steps: { key: string; label: string }[];
  suggested: string | null;
}) {
  const router = useRouter();

  return (
    <ActionForm
      action={saveFunnelReviewAction}
      className="space-y-4"
      onSuccess={() => router.refresh()}
    >
      {({ fieldErrors, error }) => (
        <>
          <FormError error={error} />
          <input type="hidden" name="counts" value={counts} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Week beginning" htmlFor="weekStart" error={fieldErrors.weekStart}>
              <Input id="weekStart" name="weekStart" type="date" defaultValue={weekStart} />
            </Field>
            <Field
              label="First broken conversion"
              htmlFor="brokenStep"
              hint="Pre-filled with the lowest recorded conversion. Funnel steps are not comparable to one another, so treat it as a place to look rather than a verdict — walk forward and pick the one you believe is constraining the rest."
            >
              <NativeSelect id="brokenStep" name="brokenStep" defaultValue={suggested ?? ""}>
                <option value="">Not yet clear</option>
                {steps.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field
            label="The one variable being changed"
            htmlFor="variableChanged"
            hint="One. Several at once and next week you will not know which one worked."
          >
            <Input
              id="variableChanged"
              name="variableChanged"
              placeholder="e.g. the opening line of the first touch"
            />
          </Field>

          <Field label="What we expect to happen" htmlFor="hypothesis" optional>
            <Textarea id="hypothesis" name="hypothesis" rows={2} />
          </Field>

          <Field label="What last week actually taught us" htmlFor="learning" optional>
            <Textarea id="learning" name="learning" rows={3} />
          </Field>

          <SubmitButton variant="accent">Freeze the week</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
