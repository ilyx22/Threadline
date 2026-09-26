"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { acceptInvitationAction } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/shared";

/** `join`: an existing, signed-in account accepts. `create`: a new account with a chosen password. */
export function AcceptInvitationForm({ token, mode }: { token: string; mode: "join" | "create" }) {
  const [state, formAction, pending] = useActionState<ActionResult<{ redirectTo: string }> | null, FormData>(acceptInvitationAction, null);
  const error = state && !state.ok ? state : null;
  return (
    <form action={formAction} className="mt-5 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {mode === "create" ? (
        <>
          <Field label="Password" htmlFor="password" hint="At least 10 characters." error={error?.fieldErrors?.password}>
            <Input id="password" name="password" type="password" autoComplete="new-password" required autoFocus minLength={10} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={error?.fieldErrors?.confirm}>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={10} />
          </Field>
        </>
      ) : null}
      {error && !error.fieldErrors ? (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-negative">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="lg" fullWidth loading={pending} iconRight={pending ? undefined : ArrowRight}>
        {mode === "create" ? "Create account and join" : "Accept invitation"}
      </Button>
    </form>
  );
}
