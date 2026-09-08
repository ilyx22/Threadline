import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; session?: string }>;
}) {
  const { next, session } = await searchParams;
  const expired = session === "expired";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="hero-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Wordmark size="lg" />
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            Expertise in. Content people want to watch out.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-elevated p-6 shadow-lg">
          <h1 className="text-[17px] font-medium text-ink">Sign in</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {expired
              ? "Your session ended. Sign in again and you will land back where you were."
              : "Use the credentials from your Threadline installation."}
          </p>
          <LoginForm next={next} />
        </div>

        <div className="mt-6 flex items-center justify-between text-[12px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-faint transition-colors hover:text-muted"
          >
            <ArrowLeft className="size-3" aria-hidden />
            Back to threadline.com
          </Link>
          <Link href="/apply" className="text-accent transition-colors hover:text-accent-bright">
            Apply for a diagnosis
          </Link>
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-ghost">
          Threadline is installed, not signed up for. Access is provisioned by your operator
          during onboarding.
        </p>
      </div>
    </main>
  );
}
