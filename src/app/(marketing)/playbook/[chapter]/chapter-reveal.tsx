"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The chapter's interactive reveal: a card that turns over. Native
 * `<details>` underneath, so it works without JavaScript, with a keyboard,
 * and with a screen reader; the flip is a transform the reduced-motion
 * setting removes.
 */
export function ChapterReveal({ prompt, answer }: { prompt: string; answer: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <details className="tl-card group p-6 open:bg-[color:var(--stamp-soft)] sm:p-8" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="tl-label block text-[color:var(--ink-faint)]">Turn the card</span>
          <span className="tl-sub-title mt-2 block text-[1.25rem] text-[color:var(--ink)]">{prompt}</span>
        </span>
        <ChevronDown className={cn("size-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </summary>
      <p className="mt-5 text-[16px] leading-relaxed text-[color:var(--ink)]">{answer}</p>
    </details>
  );
}
