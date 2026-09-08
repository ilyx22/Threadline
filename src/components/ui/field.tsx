"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(function Label({ className, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-[13px] font-medium leading-none text-ink peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

/**
 * Field wraps a control with label, optional/hint/error affordances and wires
 * up the aria relationships so validation is announced, not just coloured.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  htmlFor,
  className,
  children,
  action,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={htmlFor}>
            {label}
            {optional ? (
              <span className="ml-1.5 text-[11px] font-normal text-faint">Optional</span>
            ) : null}
          </Label>
          {action}
        </div>
      ) : null}

      {hint ? (
        <p id={hintId} className="text-[12px] leading-relaxed text-faint">
          {hint}
        </p>
      ) : null}

      <div
        aria-describedby={cn(hint && hintId, error && errorId) || undefined}
        className="contents"
      >
        {children}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-[12px] leading-relaxed text-negative"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Two-column settings row: description on the left, control on the right. */
export function SettingsRow({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-line py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-md">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        {description ? (
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0 sm:min-w-[220px]">{children}</div> : null}
    </div>
  );
}
