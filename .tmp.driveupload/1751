"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Sticky call to action.
 *
 * Appears once the hero has scrolled away, so there is exactly one dominant
 * action in view at any point on the page — and disappears again near the
 * footer, where the full closing CTA takes over. Two competing CTAs on screen
 * at once is the most common way a page like this loses people.
 */
export function StickyCta({
  label = "Apply for a content growth diagnosis",
  href = "/apply",
  showAfter = 620,
}: {
  label?: string;
  href?: string;
  showAfter?: number;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const nearBottom =
        window.innerHeight + scrolled > document.documentElement.scrollHeight - 900;
      setVisible(scrolled > showAfter && !nearBottom);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [showAfter]);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      <div className="mx-auto flex max-w-6xl justify-center sm:justify-end">
        <Link
          href={href}
          tabIndex={visible ? undefined : -1}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full border border-accent-line bg-accent px-5 py-3 text-[13.5px] font-medium text-[color:var(--color-base)] shadow-lg",
            "transition-colors hover:bg-accent-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            !visible && "pointer-events-none",
          )}
        >
          {label}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
