"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { saveWedgeAction, setActiveWedgeAction } from "@/lib/actions/validation";
import type { ActionResult } from "@/lib/actions/shared";

/** See the note on the equivalent type in prospects-client.tsx. */
type CreateWedge = (prev: never, formData: FormData) => Promise<ActionResult<{ id: string }>>;

export function AddWedgeButton() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Add a candidate
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Add a candidate wedge"
            description="Two or three candidates, scored against each other. Then one is chosen and the rest wait."
          />
          <ActionForm
            action={saveWedgeAction.bind(null, null) as CreateWedge}
            onSuccess={(data) => {
              setOpen(false);
              router.push(`/admin/market/${data.id}`);
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field
                    label="Wedge"
                    htmlFor="label"
                    hint="Specific enough to write a first line to. Not a category."
                    error={fieldErrors.label}
                  >
                    <Input
                      id="label"
                      name="label"
                      required
                      autoFocus
                      placeholder="e.g. independent M&A advisors, 5–20 people"
                    />
                  </Field>
                  <Field label="Who they are" htmlFor="summary" optional>
                    <Textarea id="summary" name="summary" rows={3} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Add</SubmitButton>
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
 * Making a wedge the active one.
 *
 * Exactly one at a time. Immersing in two markets simultaneously produces
 * shallow knowledge of both and a message specific to neither.
 */
export function ActivateWedgeButton({ wedgeId, label }: { wedgeId: string; label: string }) {
  const router = useRouter();
  return (
    <ActionButton
      variant="secondary"
      size="sm"
      action={() => setActiveWedgeAction(wedgeId, null)}
      confirm={`Make "${label}" the active wedge? Any other active wedge is set aside.`}
      onDone={() => router.refresh()}
    >
      Make active
    </ActionButton>
  );
}
