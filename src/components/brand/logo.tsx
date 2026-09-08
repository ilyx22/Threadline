import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * THREADLINE identity.
 *
 * The mark is a continuous line that passes through four nodes and resolves —
 * one thread running through the stages of an operation, not a decorative icon.
 * Kept as inline SVG so it inherits colour, scales cleanly and costs no request.
 */

export function ThreadMark({
  className,
  size = 24,
  animated = false,
}: {
  className?: string;
  size?: number;
  animated?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Threadline"
    >
      <path
        d="M3 17.5C5.5 17.5 6.2 6.5 9 6.5C11.8 6.5 12.2 17.5 15 17.5C17.8 17.5 18.5 6.5 21 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
        style={
          animated
            ? { strokeDasharray: 44, ["--dash" as string]: 44, animation: "tl-draw 1.4s var(--ease-out-quint) forwards" }
            : undefined
        }
      />
      <circle cx="9" cy="6.5" r="1.9" fill="currentColor" />
      <circle cx="15" cy="17.5" r="1.9" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

export function Wordmark({
  className,
  markClassName,
  size = "md",
  showMark = true,
}: {
  className?: string;
  markClassName?: string;
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
}) {
  const dims = {
    sm: { mark: 18, text: "text-[13px] tracking-[0.2em]" },
    md: { mark: 22, text: "text-[15px] tracking-[0.22em]" },
    lg: { mark: 28, text: "text-[19px] tracking-[0.24em]" },
  }[size];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark ? (
        <ThreadMark size={dims.mark} className={cn("text-accent", markClassName)} />
      ) : null}
      <span className={cn("font-medium uppercase text-ink", dims.text)}>Threadline</span>
    </span>
  );
}

export function LogoLink({
  href = "/",
  className,
  size = "md",
  showMark = true,
  suffix,
}: {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showMark?: boolean;
  suffix?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md transition-opacity hover:opacity-85",
        className,
      )}
      aria-label="Threadline home"
    >
      <Wordmark size={size} showMark={showMark} />
      {suffix ? (
        <span className="text-eyebrow ml-0.5 rounded border border-line px-1.5 py-0.5 text-faint">
          {suffix}
        </span>
      ) : null}
    </Link>
  );
}
