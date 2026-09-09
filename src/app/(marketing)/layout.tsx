import "@/app/public.css";
import { PublicNav } from "@/components/public/nav";
import { PublicFooter } from "@/components/public/footer";

/**
 * The public site. Light, illustrated, narrative — one brand at its most
 * expressive intensity. The `.tl-public` scope remaps the shared tokens so
 * every primitive inside renders on paper.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tl-public flex min-h-dvh flex-col">
      <a href="#main" className="tl-skip">
        Skip to content
      </a>
      <PublicNav />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
