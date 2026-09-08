"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import type { ActionResult } from "@/lib/actions/shared";

/**
 * Standard form plumbing.
 *
 * Every mutating form in the product uses this: it wires `useActionState`,
 * surfaces field errors, fires a toast on success or failure, and exposes the
 * pending state to nested submit buttons. Consistent behaviour everywhere means
 * a user learns the interaction once.
 */

/**
 * Action signature accepted by ActionForm.
 *
 * The previous-state parameter is typed `never` deliberately. Server actions
 * declare it as `ActionResult<T> | null`, and because function parameters are
 * contravariant, inferring T from that position makes TypeScript give up and
 * widen to `unknown` — which then breaks every `onSuccess(data)` callback and
 * any call site that passes a union of two actions. Typing it `never` lets T be
 * inferred purely from the return type, which is what callers actually care about.
 */
type ActionFn<T> = (prev: never, formData: FormData) => Promise<ActionResult<T>>;

/** The shape `useActionState` requires internally. */
type StatefulAction<T> = (
  prev: ActionResult<T> | null,
  formData: FormData,
) => Promise<ActionResult<T>>;

/**
 * What to say when the action never returned a result at all.
 *
 * `guarded()` turns every *expected* failure into a structured `ActionResult`,
 * so anything that throws past it is transport-level: the action failed to
 * resolve, the deploy is mid-swap, the request was refused, the network died.
 *
 * These used to surface as nothing whatsoever. The click registered, the
 * spinner cleared, and the operator was left looking at a screen that had
 * quietly not done the thing — which is the single worst failure mode in an
 * operations tool, because it is indistinguishable from success. Browser QA on
 * 2026-09-07 caught a server action returning 503 this way.
 */
function transportError(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  return detail
    ? `That did not reach the server: ${detail}. Nothing was saved — try again.`
    : "That did not reach the server. Nothing was saved — try again.";
}

/** Next.js signals control flow by throwing; those must not be reported as errors. */
function isControlFlowSignal(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_") || digest === "DYNAMIC_SERVER_USAGE");
}

export type ActionFormRenderProps = {
  pending: boolean;
  fieldErrors: Record<string, string>;
  error: string | null;
};

export function ActionForm<T>({
  action,
  children,
  className,
  onSuccess,
  successMessage,
  resetOnSuccess,
  id,
}: {
  action: ActionFn<T>;
  children: React.ReactNode | ((props: ActionFormRenderProps) => React.ReactNode);
  className?: string;
  onSuccess?: (data: T) => void;
  /** Overrides the message returned by the action. */
  successMessage?: string;
  resetOnSuccess?: boolean;
  id?: string;
}) {
  // Wrapped so a transport-level failure becomes a visible result rather than
  // an unchanged state that renders as silence. See transportError above.
  const guardedAction = React.useCallback<StatefulAction<T>>(
    async (prev, formData) => {
      try {
        return await (action as unknown as StatefulAction<T>)(prev, formData);
      } catch (error) {
        if (isControlFlowSignal(error)) throw error;
        return { ok: false, error: transportError(error), code: "unknown" } as ActionResult<T>;
      }
    },
    [action],
  );

  const [state, formAction, pending] = useActionState<ActionResult<T> | null, FormData>(
    guardedAction,
    null,
  );
  const formRef = React.useRef<HTMLFormElement>(null);
  const handled = React.useRef<ActionResult<T> | null>(null);

  React.useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;

    if (state.ok) {
      const message = successMessage ?? state.message;
      if (message) toast.success(message);
      onSuccess?.(state.data);
      if (resetOnSuccess) formRef.current?.reset();
    } else if (!state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, onSuccess, successMessage, resetOnSuccess]);

  const fieldErrors = (state && !state.ok && state.fieldErrors) || {};
  const error = state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <form ref={formRef} id={id} action={formAction} className={className} noValidate>
      {typeof children === "function" ? children({ pending, fieldErrors, error }) : children}
    </form>
  );
}

/** Inline error banner for form-level failures. */
export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-negative/25 bg-negative-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-negative"
    >
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
      {error}
    </p>
  );
}

/** Submit button that reads the enclosing form's pending state. */
export function SubmitButton({
  children = "Save",
  pendingLabel,
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

/**
 * Button that invokes a non-form server action with confirmation-free semantics,
 * handling pending state and toasts identically to ActionForm.
 */
export function ActionButton({
  action,
  children,
  confirm,
  successMessage,
  onDone,
  ...props
}: Omit<ButtonProps, "onClick"> & {
  action: () => Promise<ActionResult<never>> | Promise<ActionResult<unknown>>;
  confirm?: string;
  successMessage?: string;
  onDone?: () => void;
}) {
  const [pending, startTransition] = React.useTransition();

  const run = () => {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      let result: ActionResult<unknown>;
      try {
        result = await action();
      } catch (error) {
        if (isControlFlowSignal(error)) throw error;
        // Without this the failure was completely invisible: the spinner
        // cleared and nothing else happened. See transportError above.
        toast.error(transportError(error));
        return;
      }
      if (result.ok) {
        const message = successMessage ?? result.message;
        if (message) toast.success(message);
        onDone?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button loading={pending} onClick={run} {...props}>
      {children}
    </Button>
  );
}

/** Small labelled section used to group fields inside long forms. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title ? (
        <div>
          <h3 className="text-[13px] font-medium text-ink">{title}</h3>
          {description ? (
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
