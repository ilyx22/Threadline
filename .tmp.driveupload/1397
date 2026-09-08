"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { saveProspectAction } from "@/lib/actions/acquisition";
import type { ActionResult } from "@/lib/actions/shared";
import { PROSPECT_TIER_OPTIONS } from "@/lib/domain/enums";

/**
 * Binding drops the generic: a bound action declares its previous-state
 * parameter as `ActionResult<T> | null`, and parameter contravariance then makes
 * TypeScript widen T to unknown (see the note on ActionFn in action-form.tsx).
 * Restating the return type is what keeps `onSuccess(data)` typed.
 */
type CreateProspect = (prev: never, formData: FormData) => Promise<ActionResult<{ id: string }>>;

/**
 * Adding a prospect.
 *
 * Deliberately short. The qualification questions live on the record's own
 * checklist, where they are gated, rather than in an intake form that can be
 * clicked through — a long form here would collect the same answers with none
 * of the enforcement.
 */
export function AddProspectButton({
  wedges,
}: {
  wedges: { id: string; label: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        Add prospect
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader
            title="Add a prospect"
            description="They start unqualified. The qualification gate is the first state on the record."
          />
          <ActionForm
            action={saveProspectAction.bind(null, null) as CreateProspect}
            onSuccess={(data) => {
              setOpen(false);
              router.push(`/admin/prospects/${data.id}`);
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />

                  <Field label="Company" htmlFor="company" error={fieldErrors.company}>
                    <Input id="company" name="company" required autoFocus />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contact" htmlFor="contactName" optional>
                      <Input id="contactName" name="contactName" placeholder="Who decides" />
                    </Field>
                    <Field label="Role" htmlFor="contactRole" optional>
                      <Input id="contactRole" name="contactRole" />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Website" htmlFor="website" optional>
                      <Input id="website" name="website" placeholder="example.com" />
                    </Field>
                    <Field
                      label="Tier"
                      htmlFor="tier"
                      hint="A earns deep work. B earns specific work. C earns nothing yet."
                    >
                      <NativeSelect id="tier" name="tier" defaultValue="b">
                        {PROSPECT_TIER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Wedge" htmlFor="wedgeId" optional>
                      <NativeSelect id="wedgeId" name="wedgeId" defaultValue="">
                        <option value="">Not assigned</option>
                        {wedges.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field
                      label="Channel"
                      htmlFor="channel"
                      optional
                      hint="However you actually reach them. Free text — no channel is doctrine."
                    >
                      <Input id="channel" name="channel" placeholder="e.g. email, referral, event" />
                    </Field>
                  </div>

                  <Field
                    label="External CRM record"
                    htmlFor="crmRecordUrl"
                    optional
                    hint="Threadline links to the CRM rather than duplicating it. Contacts, companies and conversation history live there."
                  >
                    <Input id="crmRecordUrl" name="crmRecordUrl" placeholder="https://…" />
                  </Field>

                  <Field label="Why them" htmlFor="sourceNote" optional>
                    <Textarea
                      id="sourceNote"
                      name="sourceNote"
                      rows={2}
                      placeholder="What made this company worth the time"
                    />
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
