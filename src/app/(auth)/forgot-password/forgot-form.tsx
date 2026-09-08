"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { requestPasswordResetAction } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/shared";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(requestPasswordResetAction, null);

  if (state?.ok) {
    return (
      <p role="status" className="mt-5 flex items-start gap-2 rounded-md border border-positive/25 bg-positive-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-positive">
        <CheckCircle2 className="mt-px size-3.5 shrink-0" aria-hidden />
        {state.message}
      </p>
    );
  }
  const error = state && !state.ok ? state : null;
  return (
    <form action={formAction} className="mt-5 space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={error?.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus placeholder="you@company.com" />
      </Field>
      {error && !error.fieldErrors ? (
        <p role="alert" className="rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[12.5px] text-negative">{error.error}</p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" fullWidth loading={pending} iconRight={pending ? undefined : ArrowRight}>
        {pending ? "Sending" : "Send reset link"}
      </Button>
    </form>
  );
}
