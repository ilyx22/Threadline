"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Kept in its own client module so `data.tsx` can stay server-safe — that is
 * what allows Server Components to pass icon components to StatCard and friends.
 */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // The clipboard API is unavailable in insecure contexts and can be denied.
      // Say so rather than appearing to succeed.
      setFailed(true);
      setTimeout(() => setFailed(false), 2600);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-faint transition-colors hover:bg-raised hover:text-ink",
        failed && "text-negative hover:text-negative",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5 text-positive" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {failed ? "Copy blocked — select manually" : copied ? "Copied" : label}
    </button>
  );
}
