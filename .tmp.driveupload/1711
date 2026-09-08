"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, ActionButton, FormError, SubmitButton } from "@/components/forms/action-form";
import {
  clearSignOffAction,
  signOffMilestoneAction,
  updateMilestoneAction,
} from "@/lib/actions/installation";

/**
 * Installation controls.
 *
 * There is deliberately no "mark as done" here. A milestone completes because
 * the work behind it exists in the workspace, not because someone ticked it.
 * The only exception is the strategy sign-off, which is a client decision
 * rather than a record, and so has an explicit control.
 */

export function SignOffButton({
  slug,
  milestoneKey,
  signedOff,
}: {
  slug: string;
  milestoneKey: string;
  signedOff: boolean;
}) {
  const router = useRouter();

  if (signedOff) {
    return (
      <ActionButton
        size="sm"
        variant="ghost"
        action={() => clearSignOffAction(slug, milestoneKey)}
        confirm="Withdraw the sign-off on the 30-day strategy?"
        onDone={() => router.refresh()}
      >
        Withdraw sign-off
      </ActionButton>
    );
  }

  return (
    <ActionButton
      size="sm"
      variant="accent"
      action={() => signOffMilestoneAction(slug, milestoneKey)}
      onDone={() => router.refresh()}
    >
      Sign off the strategy
    </ActionButton>
  );
}

export function MilestoneControls({
  slug,
  milestoneKey,
  label,
  note,
  blockedReason,
  targetDate,
}: {
  slug: string;
  milestoneKey: string;
  label: string;
  note: string;
  blockedReason: string;
  targetDate: string;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {blockedReason ? "Edit blocker" : "Add note or blocker"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title={label}
            description="A blocker overrides the derived status everywhere this milestone appears, including the client's view."
          />
          <ActionForm
            action={updateMilestoneAction.bind(null, slug, milestoneKey)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field
                    label="Blocker"
                    optional
                    hint="Leave blank to clear it. Say what is actually stopping this, in plain language."
                    error={fieldErrors.blockedReason}
                  >
                    <Textarea
                      name="blockedReason"
                      rows={3}
                      defaultValue={blockedReason}
                      placeholder="Waiting on the founder to send the two sales-call recordings from last week."
                    />
                  </Field>
                  <Field label="Note" optional error={fieldErrors.note}>
                    <Textarea name="note" rows={3} defaultValue={note} />
                  </Field>
                  <Field label="Target date" optional error={fieldErrors.targetDate}>
                    <Input type="date" name="targetDate" defaultValue={targetDate} />
                  </Field>
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
