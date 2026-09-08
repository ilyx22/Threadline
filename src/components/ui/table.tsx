import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Table({
  className,
  containerClassName,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-line bg-elevated",
        containerClassName,
      )}
    >
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-line bg-surface/60", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({
  className,
  interactive,
  selected,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean; selected?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors",
        interactive && "cursor-pointer hover:bg-raised/60",
        selected && "bg-accent-soft",
        className,
      )}
      {...props}
    />
  );
}

export function TH({
  className,
  align = "left",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "text-eyebrow whitespace-nowrap px-4 py-2.5 font-medium text-ghost",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  align = "left",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-[13px] text-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

/** Primary cell content — the row's identity. */
export function CellTitle({
  children,
  secondary,
  className,
}: {
  children: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-[13px] font-medium text-ink">{children}</p>
      {secondary ? <p className="mt-0.5 truncate text-[12px] text-faint">{secondary}</p> : null}
    </div>
  );
}
