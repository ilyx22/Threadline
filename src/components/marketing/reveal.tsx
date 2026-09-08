"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Scroll reveal.
 *
 * A single, quiet transition — a short rise and fade as a block enters view.
 * Deliberately restrained: on a page selling calm operations, motion that draws
 * attention to itself works against the argument.
 *
 * The important detail is that content starts VISIBLE. The server renders it
 * shown, and on mount we only hide a block if it is currently below the fold,
 * where hiding it cannot be seen. That gives three properties worth having:
 *
 *   - with JavaScript disabled, or before hydration, the whole page reads
 *   - nothing above the fold flashes in
 *   - `prefers-reduced-motion` skips the effect entirely
 *
 * Each block animates once, then its observer detaches.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds. Use sparingly — staggering more than three items reads as slow. */
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(true);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    // Only arm the animation for content the reader has not reached yet.
    const rect = node.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight * 0.9;
    if (!belowFold) return;

    setShown(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // The ref type varies by tag; the runtime element is always an HTMLElement.
      ref={ref as React.Ref<never>}
      data-shown={shown ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
        "data-[shown=false]:translate-y-3 data-[shown=false]:opacity-0",
        "data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
