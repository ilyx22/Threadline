import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Section wrapper: consistent vertical rhythm, optional sunk band, optional hairline above. */
export function Section({ id, band, rule, tight, className, children, ...rest }: { id?: string; band?: boolean; rule?: boolean; tight?: boolean; className?: string; children: ReactNode } & ComponentProps<"section">) {
  return (
    <section id={id} className={cn(tight ? "tl-section-tight" : "tl-section", band && "tl-band", rule && !band && "tl-rule", className)} {...rest}>
      <div className="tl-container">{children}</div>
    </section>
  );
}

/** Mono eyebrow. Quiet by default (ink-faint); pass a colour class for the one accent a section is allowed. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("tl-label mb-4", className)}>{children}</p>;
}

export function Title({ children, className, as: Tag = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return <Tag className={cn("tl-section-title max-w-[20ch]", className)}>{children}</Tag>;
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("tl-lead mt-6", className)}>{children}</p>;
}

export function Mark({ children }: { children: ReactNode }) {
  return <span className="tl-mark">{children}</span>;
}

export function PublicButton({ href, children, primary, size, className, ...rest }: { href: string; children: ReactNode; primary?: boolean; size?: "lg" | "sm"; className?: string } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link href={href} className={cn("tl-btn", primary && "tl-btn-primary", size === "lg" && "tl-btn-lg", size === "sm" && "tl-btn-sm", className)} {...rest}>
      {children}
    </Link>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("tl-textlink", className)}>
      {children}
      <span className="tl-arrow" aria-hidden>
        →
      </span>
    </Link>
  );
}

export function Card({ children, className, quiet, hover }: { children: ReactNode; className?: string; quiet?: boolean; hover?: boolean }) {
  return <div className={cn(quiet ? "tl-card-quiet" : "tl-card", hover && "tl-card-hover", "p-6 sm:p-8", className)}>{children}</div>;
}

/** A verdict label. Never rotated; one per moment. */
export function Stamp({ children, tone, animate, className }: { children: ReactNode; tone?: "reject" | "signal" | "ink"; animate?: boolean; className?: string }) {
  return (
    <span className={cn("tl-stamp", tone === "reject" && "tl-stamp-reject", tone === "signal" && "tl-stamp-signal", tone === "ink" && "tl-stamp-ink", animate && "tl-stamp-in", className)} aria-label={typeof children === "string" ? `Stamp: ${children}` : undefined}>
      {children}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("tl-chip", className)}>{children}</span>;
}

export function SyntheticLabel({ children = "Synthetic demonstration" }: { children?: ReactNode }) {
  return (
    <span className="tl-synthetic" role="note">
      <span aria-hidden>◌</span>
      {children}
    </span>
  );
}

/** A hairline ledger row: label on the left, content on the right. */
export function LedgerRow({ label, children, tone, className }: { label: ReactNode; children: ReactNode; tone?: "signal" | "accent"; className?: string }) {
  return (
    <div className={cn("grid gap-1 py-4 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6", className)}>
      <dt className={cn("tl-label pt-0.5", tone === "signal" && "text-[color:var(--signal)]", tone === "accent" && "text-[color:var(--accent-deep)]")}>{label}</dt>
      <dd className="text-[15.5px] leading-relaxed text-[color:var(--ink)]">{children}</dd>
    </div>
  );
}
