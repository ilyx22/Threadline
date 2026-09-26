"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { requeueJobAction, resetMfaAction, retryCrmAction, liftSuppressionAction } from "@/lib/actions/system";
import { ActionForm, FormError, SubmitButton } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";

export function SystemButton({ kind, id }: { kind: "job" | "crm" | "suppression"; id: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="xs"
      variant="secondary"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const r = kind === "job" ? await requeueJobAction(id) : kind === "crm" ? await retryCrmAction(id) : await liftSuppressionAction(id);
          if (r.ok) toast.success(r.message ?? "Done.");
          else toast.error(r.error);
          router.refresh();
        })
      }
    >
      {kind === "job" ? "Requeue" : kind === "crm" ? "Retry" : "Lift"}
    </Button>
  );
}

/** Super admin: reset a colleague's two-factor (they re-enrol at next sign-in). */
export function ResetMfaForm() {
  return (
    <ActionForm action={resetMfaAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      {({ error }) => (
        <>
          <div className="flex-1">
            <FormError error={error} />
            <Input name="email" type="email" placeholder="colleague@threadline.com" aria-label="Email of the person to reset" />
          </div>
          <SubmitButton size="sm" variant="secondary">
            Reset two-factor
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
