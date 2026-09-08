"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { NativeSelect, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { recordTestFeedbackAction } from "@/lib/actions/runs";
import { QueueTestDialog } from "../../runs/run-actions";

/**
 * Test controls on the signal detail screen.
 *
 * Recording a result is where the loop closes: a measured outcome moves the
 * confidence of the test and, in the same bounded step, of the signal it came
 * from. The note is required, because a confidence number nobody can explain is
 * not evidence of anything.
 */

export function QueueTestButton({
  slug,
  patternId,
  title,
}: {
  slug: string;
  patternId: string;
  title: string;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" variant="secondary" icon={FlaskConical} onClick={() => setOpen(true)}>
        Queue a test
      </Button>
      <QueueTestDialog
        slug={slug}
        patternId={patternId}
        title={title}
        open={open}
        onOpenChange={setOpen}
        onDone={() => router.refresh()}
      />
    </>
  );
}

export function RecordResultButton({
  slug,
  patternId,
  title,
  hasParent,
}: {
  slug: string;
  patternId: string;
  title: string;
  hasParent: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Record the result
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="Record what happened"
            description={
              hasParent
                ? "This moves the confidence of both this test and the signal it came from, by one bounded step each."
                : "This moves the confidence of this test by one bounded step."
            }
          />
          <ActionForm
            action={recordTestFeedbackAction.bind(null, slug, patternId)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <p className="text-[12.5px] leading-relaxed text-muted">{title}</p>
                  <Field label="Outcome" error={fieldErrors.outcome}>
                    <NativeSelect name="outcome" defaultValue="mixed">
                      <option value="supported">The result supported it</option>
                      <option value="mixed">Mixed or inconclusive</option>
                      <option value="contradicted">The result contradicted it</option>
                    </NativeSelect>
                  </Field>
                  <Field
                    label="What did the numbers show?"
                    hint="Be specific enough that someone reading this in three months can judge it for themselves."
                    error={fieldErrors.note}
                  >
                    <Textarea
                      name="note"
                      rows={5}
                      required
                      placeholder="Three pieces published against this. Views were flat against the median, but two of the four qualified inquiries this month named one of them, which is the measure this test was set on."
                    />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="accent">Record result</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
