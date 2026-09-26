import "@/app/public.css";
import "@/app/public-v3.css";
import "@/styles/marketing-v5/index.css";
import "@/styles/marketing-v9/index.css";
import Nav from "@/components/marketing-v5/Nav";
import Footer from "@/components/marketing-v5/Footer";
import Intro from "@/components/marketing-v9/Intro";

/**
 * The public site. The homepage (24 September 2026, second pass) is
 * `src/components/marketing-v9` with `src/styles/marketing-v9/index.css`; the
 * illustrated scenes and the inner pages' primitives are in `marketing-v5`.
 * The `v9` class retones the illustration kit and restyles the shared nav and
 * footer to the pale-canvas, white-panel composition.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tl-public v5 v9 flex min-h-dvh flex-col">
      <Intro />
      <a href="#main" className="v5-skip">
        Skip to content
      </a>
      <Nav />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
