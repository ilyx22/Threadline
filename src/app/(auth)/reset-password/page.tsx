import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { inspectToken } from "@/lib/auth/tokens";
import { PasswordForm } from "@/components/forms/password-form";
import { resetPasswordAction } from "@/lib/actions/account";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const peek = await inspectToken(token, "password_reset");

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark size="lg" />
        </div>
        <div className="rounded-xl border border-line bg-elevated p-6 shadow-lg">
          {peek.ok ? (
            <>
              <h1 className="text-[17px] font-medium text-ink">Choose a new password</h1>
              <p className="mt-1.5 text-[13px] text-muted">At least 10 characters. Every other session on this account will be signed out.</p>
              <PasswordForm token={token} action={resetPasswordAction} submitLabel="Set password" />
            </>
          ) : (
            <>
              <h1 className="text-[17px] font-medium text-ink">This link cannot be used</h1>
              <p className="mt-1.5 text-[13px] text-muted">
                {peek.reason === "expired" ? "It has expired — links last 30 minutes." : peek.reason === "used" ? "It has already been used." : "It is not a valid reset link."}{" "}
                <Link href="/forgot-password" className="text-accent hover:text-accent-bright">Request a new one.</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
