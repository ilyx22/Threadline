import "@/app/public.css";
import Link from "next/link";
import { NOT_FOUND } from "@/content/public-site";
import { ThreadWordmark, InspectorStation } from "@/components/factory/primitives";

export default function NotFound() {
  return (
    <main className="tl-public flex min-h-dvh flex-col items-center justify-center px-5 py-12 text-center">
      <Link href="/" aria-label="Threadline home">
        <ThreadWordmark className="h-7 w-auto" />
      </Link>
      <div className="mt-10">
        <InspectorStation className="mx-auto w-[150px]" stamp="404" reject />
      </div>
      <p className="tl-label mt-8 text-[color:var(--accent-deep)]">Not found</p>
      <h1 className="tl-display mt-3 max-w-[14ch] text-[clamp(2rem,5vw,3.5rem)]">{NOT_FOUND.title}</h1>
      <p className="tl-body mx-auto mt-4 max-w-md text-[15px]">{NOT_FOUND.lead}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="tl-btn tl-btn-primary">
          Go to the homepage
        </Link>
        <Link href="/app" className="tl-btn">
          Your workspace
        </Link>
      </div>
      <p className="mt-10 text-[13px] text-[color:var(--ink-faint)]">
        Need help?{" "}
        <Link href="/apply" className="text-[color:var(--accent-deep)] underline underline-offset-4">
          Get in touch
        </Link>
        .
      </p>
    </main>
  );
}
