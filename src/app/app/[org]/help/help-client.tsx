"use client";

import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { raiseSupportRequestAction } from "@/lib/actions/support";

export function HelpForm({ slug }: { slug: string }) {
  const router = useRouter();
  return (
    <ActionForm action={raiseSupportRequestAction.bind(null, slug)} onSuccess={() => router.refresh()} className="space-y-3 rounded-md border border-line p-4">
      {({ error }) => (
        <>
          <FormError error={error} />
          <Field label="What do you need?" htmlFor="helpTitle">
            <Input id="helpTitle" name="title" required maxLength={200} />
          </Field>
          <Field label="Details" htmlFor="helpDetail" optional>
            <Textarea id="helpDetail" name="description" rows={4} />
          </Field>
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            <input type="checkbox" name="blocking" /> This is stopping us from doing something
          </label>
          <SubmitButton variant="primary" pendingLabel="Sending…">
            Send to Threadline
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
