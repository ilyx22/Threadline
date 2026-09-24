import "@/app/public.css";
import "@/styles/marketing-v5/index.css";
import "@/styles/marketing-v9/index.css";
import Link from "next/link";
import { NOT_FOUND } from "@/content/public-site";
import { Wordmark } from "@/components/marketing-v5/Nav";

/** Not found, in the homepage's system: one white panel on the canvas. */
export default function NotFound() {
  return (
    <main className="tl-public v5 v9 nf-page">
      <div className="v9-panel nf-panel">
        <Link href="/" aria-label="Threadline home" className="v5-brand">
          <Wordmark />
        </Link>
        <p className="v9-eyebrow">Not found</p>
        <h1 className="v9-h1">{NOT_FOUND.title}</h1>
        <p className="v9-lead">{NOT_FOUND.lead}</p>
        <div className="v9-actions">
          <Link href="/" className="v9-btn">
            Go to the homepage
          </Link>
          <Link href="/app" className="v9-btn is-ghost">
            Your workspace
          </Link>
        </div>
        <p className="v9-note">
          Need help? <Link href="/apply" className="v9-link">Get in touch</Link>
        </p>
      </div>
    </main>
  );
}
