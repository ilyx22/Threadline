"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Recoverable error boundary for the client portal.
 *
 * Next.js scrubs error messages in production, so this deliberately does not try
 * to explain the specific fault — it offers a retry and a way out, and surfaces
 * the digest so a support conversation can find the server log.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[app] render error", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-lg border border-negative/25 bg-negative-soft px-6 py-16 text-center"
    >
      <div className="mb-5 grid size-11 place-items-center rounded-lg border border-negative/25 bg-elevated">
        <AlertTriangle className="size-5 text-negative" aria-hidden />
      </div>

      <h1 className="text-[17px] font-medium text-ink">This screen did not load</h1>
      <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
        Something failed while loading your data. Nothing was changed — retrying is safe.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" icon={RefreshCw} onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/app" variant="ghost">
          Back to your workspace
        </ButtonLink>
      </div>

      {error.digest ? (
        <p className="mt-6 font-mono text-[11px] text-ghost">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
