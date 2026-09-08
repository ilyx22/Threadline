import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Marketing layout primitives.
 *
 * The editorial serif appears here and nowhere else in the product — sparingly,
 * on section openers only, never in dense UI.
 */

export function Section({
  children,
  className,
  id,
  bordered,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("px-5 py-20 lg:px-8 lg:py-28", bordered && "border-t border-line", className)}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <p className="text-eyebrow mb-4 text-accent">{eyebrow}</p> : null}
      <h2 className="text-section">{title}</h2>
      {lead ? (
        <p className="mt-5 text-[16px] leading-relaxed text-muted">{lead}</p>
      ) : null}
    </div>
  );
}

/** Quiet numbered marker used down the left of the operating-model sections. */
export function StepMarker({ index }: { index: number }) {
  return (
    <span className="text-eyebrow inline-flex size-7 items-center justify-center rounded-full border border-line text-faint">
      {String(index).padStart(2, "0")}
    </span>
  );
}

/**
 * The one place an editorial serif is allowed: a pulled-out statement inside a
 * marketing section.
 */
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-serif text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.3] text-ink">
      {children}
    </p>
  );
}

export function FeatureGrid({
  items,
  columns = 3,
}: {
  items: { icon?: React.ElementType; title: string; body: string }[];
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        "grid gap-6",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="rounded-lg border border-line bg-elevated p-6">
            {Icon ? (
              <span className="mb-4 grid size-9 place-items-center rounded-md border border-line bg-surface">
                <Icon className="size-4 text-accent" aria-hidden />
              </span>
            ) : null}
            <h3 className="text-[15px] font-medium text-ink">{item.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A framed mock of a product surface.
 *
 * Built from the same design tokens as the app rather than a screenshot, so it
 * stays accurate as the product changes and renders crisply at any size.
 */
export function ProductFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-lg",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-line bg-surface px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="text-eyebrow ml-2 text-ghost">{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
