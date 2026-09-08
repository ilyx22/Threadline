"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/shared";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ redirectTo: string }> | null,
    FormData
  >(loginAction, null);

  const error = state && !state.ok ? state : null;

  return (
    <form action={formAction} className="mt-5 space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field label="Email" htmlFor="email" error={error?.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="you@company.com"
          aria-invalid={Boolean(error?.fieldErrors?.email)}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={error?.fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••••"
          aria-invalid={Boolean(error?.fieldErrors?.password)}
        />
      </Field>

      {error && !error.fieldErrors ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-negative"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error.error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
        iconRight={pending ? undefined : ArrowRight}
      >
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
