import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-center">
      <Wordmark size="md" />
      <p className="text-eyebrow mt-10 text-accent">404</p>
      <h1 className="mt-3 text-hero">That page does not exist</h1>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted">
        The link may be out of date, or the record may belong to a workspace you do not have access
        to.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <ButtonLink href="/" variant="primary">
          Go to the homepage
        </ButtonLink>
        <ButtonLink href="/app" variant="ghost">
          Your workspace
        </ButtonLink>
      </div>
      <p className="mt-10 text-[12px] text-ghost">
        Need help?{" "}
        <Link href="/apply" className="text-accent hover:underline">
          Get in touch
        </Link>
        .
      </p>
    </main>
  );
}
