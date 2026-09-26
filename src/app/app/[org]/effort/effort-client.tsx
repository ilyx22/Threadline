"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionButton, ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { deleteEffortAction, recordEffortAction } from "@/lib/actions/effort";
import { KIND_LABEL, STEP_LABEL } from "@/lib/effort/labels";


export function RecordTimeButton({ slug, kinds, today, content }: { slug: string; kinds: string[]; today: string; content: { id: string; title: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  return (
    <>
      <Button icon={Clock} onClick={() => setOpen(true)}>
        Record time
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader title="Record time" description="Minutes actually spent. A week with no entries shows as not recorded, never as zero." />
          <ActionForm
            action={recordEffortAction.bind(null, slug)}
            onSuccess={() => {
              setOpen(false);
              router.refresh();
            }}
            className="contents"
          >
            {({ error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Whose time" htmlFor="effortKind">
                    <NativeSelect id="effortKind" name="actorKind" defaultValue={kinds[0]}>
                      {kinds.map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Step" htmlFor="effortStep">
                    <NativeSelect id="effortStep" name="step" defaultValue="recording">
                      {Object.entries(STEP_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Minutes" htmlFor="effortMinutes">
                      <Input id="effortMinutes" name="minutes" type="number" min={1} max={1440} required />
                    </Field>
                    <Field label="Day" htmlFor="effortDate">
                      <Input id="effortDate" name="workDate" type="date" defaultValue={today} max={today} required />
                    </Field>
                  </div>
                  {content.length ? (
                    <Field label="Piece" htmlFor="effortContent" optional>
                      <NativeSelect id="effortContent" name="contentItemId" defaultValue="">
                        <option value="">Not for one piece</option>
                        {content.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}
                  <Field label="Note" htmlFor="effortNote" optional>
                    <Input id="effortNote" name="note" maxLength={500} />
                  </Field>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary" pendingLabel="Saving…">
                    Record
                  </SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteEntryButton({ slug, id }: { slug: string; id: string }) {
  return (
    <ActionButton size="xs" variant="ghost" icon={Trash2} action={() => deleteEffortAction(slug, id)} confirm="Remove this entry?">
      <span className="sr-only">Remove</span>
    </ActionButton>
  );
}
