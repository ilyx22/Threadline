"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { createBlankScriptAction } from "@/lib/actions/scripts";
import { PLATFORM_OPTIONS, SCRIPT_TYPE_OPTIONS } from "@/lib/domain/enums";

/**
 * Blank script creation. The normal path is approving an idea and sending it to
 * scripting — this exists for the case where a founder simply has something to say.
 */
export function NewScriptButton({ slug }: { slug: string }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={Plus} onClick={() => setOpen(true)}>
        New script
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title="New script"
            description="Starts empty. Scripts created this way have no idea behind them, so the lineage view will show no research or signal."
          />
          <ActionForm<{ id: string }>
            action={createBlankScriptAction.bind(null, slug)}
            onSuccess={(data) => {
              setOpen(false);
              router.push(`/app/${slug}/create/scripts/${data.id}`);
            }}
            className="contents"
          >
            {({ fieldErrors, error }) => (
              <>
                <DialogBody className="space-y-4">
                  <FormError error={error} />
                  <Field label="Title" htmlFor="scriptTitle" error={fieldErrors.title}>
                    <Input id="scriptTitle" name="title" required autoFocus />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Type" htmlFor="newScriptType">
                      <NativeSelect id="newScriptType" name="scriptType" defaultValue="founder_pov">
                        {SCRIPT_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label="Platform" htmlFor="newScriptPlatform">
                      <NativeSelect id="newScriptPlatform" name="platform" defaultValue="linkedin">
                        {PLATFORM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <SubmitButton variant="primary">Create script</SubmitButton>
                </DialogFooter>
              </>
            )}
          </ActionForm>
        </DialogContent>
      </Dialog>
    </>
  );
}
