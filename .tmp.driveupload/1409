"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { saveInternalMetricAction } from "@/lib/actions/admin";
import { toDateInput } from "@/lib/utils/dates";

export function MetricEntryButton() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Record a month
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Record monthly metrics"
            description="Recording the same month again updates it rather than duplicating."
          />
          <ActionForm
            action={saveInternalMetricAction}
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

                  <Field
                    label="Month"
                    htmlFor="periodStart"
                    hint="Any date in the month; it is stored as the first."
                    error={fieldErrors.periodStart}
                  >
                    <Input
                      id="periodStart"
                      name="periodStart"
                      type="date"
                      defaultValue={toDateInput(firstOfMonth)}
                      required
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Sales calls" htmlFor="salesCalls">
                      <Input id="salesCalls" name="salesCalls" type="number" min={0} defaultValue={0} />
                    </Field>
                    <Field label="Show rate %" htmlFor="showRatePct">
                      <Input
                        id="showRatePct"
                        name="showRatePct"
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        defaultValue={0}
                      />
                    </Field>
                    <Field label="Close rate %" htmlFor="closeRatePct">
                      <Input
                        id="closeRatePct"
                        name="closeRatePct"
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        defaultValue={0}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Cash collected" htmlFor="cashCollected">
                      <Input
                        id="cashCollected"
                        name="cashCollected"
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={0}
                      />
                    </Field>
                    <Field label="Setup fees" htmlFor="setupFees">
                      <Input id="setupFees" name="setupFees" type="number" min={0} step="0.01" defaultValue={0} />
                    </Field>
                    <Field label="MRR" htmlFor="mrr">
                      <Input id="mrr" name="mrr" type="number" min={0} step="0.01" defaultValue={0} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Implementation hours"
                      htmlFor="implementationHours"
                      hint="Time spent installing systems this month."
                    >
                      <Input
                        id="implementationHours"
                        name="implementationHours"
                        type="number"
                        min={0}
                        step="0.5"
                        defaultValue={0}
                      />
                    </Field>
                    <Field
                      label="Support hours"
                      htmlFor="supportHours"
                      hint="Ongoing operation and support."
                    >
                      <Input
                        id="supportHours"
                        name="supportHours"
                        type="number"
                        min={0}
                        step="0.5"
                        defaultValue={0}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Leads by source"
                    htmlFor="leadsBySource"
                    hint="Format: linkedin: 12, referral: 3, podcast: 1"
                    optional
                  >
                    <Input id="leadsBySource" name="leadsBySource" placeholder="linkedin: 12, referral: 3" />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Save month</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
