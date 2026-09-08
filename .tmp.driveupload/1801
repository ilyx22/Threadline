"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const FIELD_BASE =
  "w-full rounded-md border border-line-strong bg-surface text-ink placeholder:text-ghost " +
  "transition-colors duration-150 " +
  "hover:border-[#3c454f] " +
  "focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[invalid=true]:border-negative/60 aria-[invalid=true]:ring-negative/20";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: React.ElementType;
  suffix?: React.ReactNode;
  inputSize?: "sm" | "md";
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon: Icon, suffix, inputSize = "md", ...props },
  ref,
) {
  const height = inputSize === "sm" ? "h-8 text-[13px]" : "h-9.5 text-sm";
  const input = (
    <input
      ref={ref}
      className={cn(
        FIELD_BASE,
        height,
        "px-3",
        Icon && "pl-9",
        suffix && "pr-10",
        className,
      )}
      {...props}
    />
  );
  if (!Icon && !suffix) return input;
  return (
    <div className="relative">
      {Icon ? (
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
          aria-hidden
        />
      ) : null}
      {input}
      {suffix ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-faint">
          {suffix}
        </div>
      ) : null}
    </div>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { autoGrow?: boolean }
>(function Textarea({ className, autoGrow, onChange, ...props }, ref) {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el || !autoGrow) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [autoGrow]);

  React.useEffect(() => {
    resize();
  }, [resize, props.value]);

  return (
    <textarea
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      className={cn(
        FIELD_BASE,
        "min-h-[88px] resize-y px-3 py-2.5 text-sm leading-relaxed",
        autoGrow && "resize-none overflow-hidden",
        className,
      )}
      {...props}
    />
  );
});

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { selectSize?: "sm" | "md" }
>(function NativeSelect({ className, selectSize = "md", children, ...props }, ref) {
  const height = selectSize === "sm" ? "h-8 text-[13px]" : "h-9.5 text-sm";
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          FIELD_BASE,
          height,
          "cursor-pointer appearance-none pl-3 pr-8",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

export function SearchInput({
  value,
  onValueChange,
  placeholder = "Search",
  className,
  autoFocus,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(FIELD_BASE, "h-8 pl-8.5 pr-8 text-[13px] [&::-webkit-search-cancel-button]:hidden")}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint transition-colors hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
