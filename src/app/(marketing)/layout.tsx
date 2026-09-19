import "@/app/public.css";
import "@/app/public-v3.css";
import "@/styles/marketing-v5/index.css";
import Nav from "@/components/marketing-v5/Nav";
import Footer from "@/components/marketing-v5/Footer";

/**
 * The public site (v5, 19 September 2026): the illustrated Threadline world.
 * `src/styles/marketing-v5/` is the hand-authored design system; `public.css`
 * keeps the shared primitives the inner pages use, retokened to the same
 * palette through the `.tl-public` variables.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tl-public v5 flex min-h-dvh flex-col">
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
