import "@/app/public.css";
import "@/app/public-v3.css";
import "@/styles/marketing/marketing.css";
import "@/styles/marketing/marketing-extra.css";
import { MarketingNav } from "@/components/marketing-v4/Navbar";
import { MarketingFooter } from "@/components/marketing-v4/Footer";

/**
 * The public site (v4, 12 September 2026). The homepage is the signature
 * marketing experience ported from the `thebirdhouse/` workspace (tag
 * threadline-marketing-v3); the inner pages keep their components and take the
 * same palette through the `.tl-public` tokens. `marketing.css` is generated
 * from that workspace's stylesheets and scoped here; `marketing-extra.css`
 * holds the production-only additions (navigation drawer, value grid,
 * playbook tools).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tl-public flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <MarketingNav />
      <main id="main" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
