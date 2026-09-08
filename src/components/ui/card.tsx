import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  interactive,
  accent,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-elevated",
        interactive &&
          "transition-colors duration-150 hover:border-line-strong hover:bg-[#181d23]",
        accent && "border-accent-line",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  description,
  action,
  eyebrow,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  eyebrow?: React.ReactNode;
}) {
  const hasHeading = title || description || eyebrow;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 pt-4",
        hasHeading ? "pb-3" : "pb-0",
        className,
      )}
      {...props}
    >
      {hasHeading ? (
        <div className="min-w-0">
          {eyebrow ? <p className="text-eyebrow mb-1.5 text-faint">{eyebrow}</p> : null}
          {title ? (
            <h3 className="truncate text-[15px] font-medium leading-tight text-ink">{title}</h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
      ) : (
        props.children
      )}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-line px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

/** Section heading used outside cards, e.g. between dashboard blocks. */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
