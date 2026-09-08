"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-line-strong bg-surface transition-colors",
        "hover:border-[#3c454f]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-[color:var(--color-base)]",
        "data-[state=indeterminate]:border-accent data-[state=indeterminate]:bg-accent data-[state=indeterminate]:text-[color:var(--color-base)]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" strokeWidth={3} />
        ) : (
          <Check className="size-3" strokeWidth={3.5} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

export function CheckboxField({
  label,
  description,
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  id: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} className="mt-0.5" {...props} />
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-[13px] font-medium leading-tight text-ink">{label}</span>
        {description ? (
          <span className="mt-1 block text-[12px] leading-relaxed text-muted">{description}</span>
        ) : null}
      </label>
    </div>
  );
}

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-raised transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "data-[state=checked]:border-accent/60 data-[state=checked]:bg-accent",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-muted shadow-sm transition-transform",
          "data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-base",
        )}
      />
    </SwitchPrimitive.Root>
  );
});

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider({ className, ...props }, ref) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-raised">
        <SliderPrimitive.Range className="absolute h-full bg-accent" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block size-3.5 rounded-full border border-accent bg-ink shadow-sm transition-transform",
          "hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        )}
      />
    </SliderPrimitive.Root>
  );
});

export const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(function Separator({ className, orientation = "horizontal", ...props }, ref) {
  return (
    <SeparatorPrimitive.Root
      ref={ref}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});

export function Progress({
  value,
  className,
  tone = "accent",
}: {
  value: number;
  className?: string;
  tone?: "accent" | "positive" | "muted";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const bar =
    tone === "positive" ? "bg-positive" : tone === "muted" ? "bg-muted" : "bg-accent";
  return (
    <ProgressPrimitive.Root
      value={clamped}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-raised", className)}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full transition-transform duration-500 ease-out", bar)}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

/** Segmented control for mutually exclusive view switches. */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ElementType }[];
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-line bg-surface p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] font-medium transition-colors",
              size === "sm" ? "h-6.5 px-2 text-[12px]" : "h-7.5 px-3 text-[13px]",
              active
                ? "bg-raised text-ink shadow-sm"
                : "text-faint hover:text-muted",
            )}
          >
            {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
