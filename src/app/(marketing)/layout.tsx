import "@/app/public.css";
import "@/app/public-v3.css";
import "@/styles/marketing-v5/index.css";
import "@/styles/home/home.css";
import Nav from "@/components/marketing-v5/Nav";
import Footer from "@/components/marketing-v5/Footer";

/**
 * The public site. The homepage (24 September 2026) is `src/components/home`
 * with `src/styles/home/home.css`; the inner pages keep the v5 primitives in
 * `src/styles/marketing-v5/` and `public.css`. The `v8` class restyles the
 * shared nav and footer to the homepage's paper-and-ink system.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tl-public v5 v8 flex min-h-dvh flex-col">
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
