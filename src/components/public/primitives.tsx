import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Section wrapper: consistent vertical rhythm, optional deep band. */
export function Section({ id, band, className, children, ...rest }: { id?: string; band?: boolean; className?: string; children: ReactNode } & ComponentProps<"section">) {
  return (
    <section id={id} className={cn("tl-section", band && "tl-band", className)} {...rest}>
      <div className="tl-container">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("tl-label mb-4 text-[color:var(--accent-deep)]", className)}>{children}</p>;
}

export function Title({ children, className, as: Tag = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return <Tag className={cn("tl-section-title max-w-[18ch]", className)}>{children}</Tag>;
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

export function Card({ children, className, quiet, hover }: { children: ReactNode; className?: string; quiet?: boolean; hover?: boolean }) {
  return <div className={cn(quiet ? "tl-card-quiet" : "tl-card", hover && "tl-card-hover", "p-6 sm:p-8", className)}>{children}</div>;
}

export function Stamp({ children, tone, animate, className }: { children: ReactNode; tone?: "reject" | "signal"; animate?: boolean; className?: string }) {
  return (
    <span className={cn("tl-stamp", tone === "reject" && "tl-stamp-reject", tone === "signal" && "tl-stamp-signal", animate && "tl-stamp-in", className)} aria-label={typeof children === "string" ? `Stamp: ${children}` : undefined}>
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
