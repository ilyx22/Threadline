import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark size="lg" />
        </div>
        <div className="rounded-xl border border-line bg-elevated p-6 shadow-lg">
          <h1 className="text-[17px] font-medium text-ink">Reset your password</h1>
          <p className="mt-1.5 text-[13px] text-muted">Enter the address you sign in with. If it belongs to an account, a single-use link arrives within a minute.</p>
          <ForgotPasswordForm />
        </div>
        <div className="mt-6 text-[12px]">
          <Link href="/login" className="inline-flex min-h-6 items-center gap-1.5 text-faint transition-colors hover:text-muted">
            <ArrowLeft className="size-3" aria-hidden />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
