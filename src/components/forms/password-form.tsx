"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/shared";

type Action = (prev: ActionResult<{ redirectTo: string }> | null, formData: FormData) => Promise<ActionResult<{ redirectTo: string }>>;

/** Shared by password reset and invitation acceptance: token + new password, twice. */
export function PasswordForm({ token, action, submitLabel }: { token: string; action: Action; submitLabel: string }) {
  const [state, formAction, pending] = useActionState<ActionResult<{ redirectTo: string }> | null, FormData>(action, null);
  const error = state && !state.ok ? state : null;
  return (
    <form action={formAction} className="mt-5 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field label="New password" htmlFor="password" error={error?.fieldErrors?.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required autoFocus minLength={10} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={error?.fieldErrors?.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      {error && !error.fieldErrors ? (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-negative">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" fullWidth loading={pending} iconRight={pending ? undefined : ArrowRight}>
        {pending ? "Saving" : submitLabel}
      </Button>
    </form>
  );
}
