"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/controls";
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
import { logDeliveryLoadAction } from "@/lib/actions/attribution";
import { WORK_CLASS_OPTIONS } from "@/lib/domain/enums";

/**
 * Delivery Load on one task.
 *
 * Deliberately small. The purpose is to find out what delivery actually costs
 * before there is a client to find out on — and a heavyweight timesheet would
 * not get filled in, which would tell us nothing at all.
 *
 * Active and waiting minutes are separate fields because they have completely
 * different fixes: active time comes down with better tooling or delegation,
 * waiting time comes down by changing what the client is asked for and when.
 * Adding them together hides which problem you have.
 */
export function DeliveryLoadButton({
  slug,
  task,
}: {
  slug: string;
  task: {
    id: string;
    title: string;
    activeMinutes: number | null;
    waitingMinutes: number | null;
    costMinor: number;
    workClass: string | null;
    loadNote: string | null;
    done: boolean;
  };
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const logged = task.activeMinutes !== null;

  return (
    <>
      <Button
        size="xs"
        variant="ghost"
        icon={Timer}
        onClick={() => setOpen(true)}
        title={logged ? `${task.activeMinutes} min logged` : "Log delivery load"}
      >
        <span className="sr-only">Log delivery load</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Delivery load"
            description={task.title}
          />
          <ActionForm
            action={logDeliveryLoadAction.bind(null, slug, task.id)}
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

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Active minutes"
                      htmlFor="activeMinutes"
                      hint="Attention actually spent."
                      error={fieldErrors.activeMinutes}
                    >
                      <Input
                        id="activeMinutes"
                        name="activeMinutes"
                        type="number"
                        min={0}
                        defaultValue={task.activeMinutes ?? undefined}
                      />
                    </Field>
                    <Field
                      label="Waiting minutes"
                      htmlFor="waitingMinutes"
                      hint="Time lost waiting on somebody else."
                    >
                      <Input
                        id="waitingMinutes"
                        name="waitingMinutes"
                        type="number"
                        min={0}
                        defaultValue={task.waitingMinutes ?? undefined}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Cash cost" htmlFor="cost" optional>
                      <Input
                        id="cost"
                        name="cost"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={task.costMinor / 100}
                      />
                    </Field>
                    <Field
                      label="What this work is"
                      htmlFor="workClass"
                      hint="Decided afterwards, from how it actually went."
                    >
                      <NativeSelect
                        id="workClass"
                        name="workClass"
                        defaultValue={task.workClass ?? ""}
                      >
                        <option value="">Not classified</option>
                        {WORK_CLASS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <Field label="What made it take that long" htmlFor="loadNote" optional>
                    <Textarea id="loadNote" name="loadNote" rows={3} defaultValue={task.loadNote ?? ""} />
                  </Field>

                  {!task.done ? (
                    <CheckboxField
                      id={`done-${task.id}`}
                      name="done"
                      label="Mark the task done"
                      description="Load is usually logged at the point the work finishes."
                    />
                  ) : null}
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Log</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * What the logged work adds up to.
 *
 * Labelled synthetic wherever the workspace is, because a load estimate from a
 * dry run describes how long the dry run took — not what a client will cost.
 */
export function DeliveryLoadSummary({
  activeMinutes,
  waitingMinutes,
  costMinor,
  logged,
  total,
  synthetic,
  currency,
}: {
  activeMinutes: number;
  waitingMinutes: number;
  costMinor: number;
  logged: number;
  total: number;
  synthetic: boolean;
  currency: string;
}) {
  if (logged === 0) return null;

  const hours = (activeMinutes / 60).toFixed(1);
  const waiting = (waitingMinutes / 60).toFixed(1);

  return (
    <div className="rounded-lg border border-line bg-elevated px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-[12.5px] font-medium text-ink">
          Delivery load{synthetic ? " — synthetic, unvalidated" : ""}
        </p>
        <p className="text-[11.5px] text-faint">
          {logged} of {total} tasks logged
        </p>
      </div>
      {/* Built as one string so the full stop lands against the last word
          rather than after a conditional that rendered nothing. */}
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        {[
          `${hours} hours of attention`,
          `${waiting} hours waiting`,
          costMinor > 0
            ? `${new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(costMinor / 100)} in cash cost`
            : null,
        ]
          .filter(Boolean)
          .join(", ")}
        .
        {logged < total
          ? " Partial: the untimed tasks are not zero, they are unmeasured."
          : ""}
      </p>
    </div>
  );
}
