import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { getSessionState } from "@/lib/auth/session";
import { safePath } from "@/lib/security/safe-path";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Two-factor code", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Second sign-in step for accounts with two-factor on (SEC-08). */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const state = await getSessionState();
  if (!state) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  if (!state.pendingMfa) redirect(safePath(next) ?? "/app");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark size="lg" />
        </div>
        <div className="rounded-xl border border-line bg-elevated p-6 shadow-lg">
          <h1 className="text-[17px] font-medium text-ink">Enter your code</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Open your authenticator app and enter the six-digit code for Threadline. Lost your phone? Enter one of your recovery codes instead.
          </p>
          <VerifyForm next={next} />
        </div>
      </div>
    </main>
  );
}
