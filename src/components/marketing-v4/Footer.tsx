import Link from "next/link";
import { FOOTER, SITE } from "@/content/public-site";
import { footer } from "@/content/marketing-site";
import { motion } from "@/content/marketing-tokens";
import { Thread } from "./Icons";
import Marquee from "./Marquee";

/**
 * Footer: the dark ink band the closing panel overlaps into; link columns;
 * then the giant scrolling wordmark — set in type, not an image.
 */
export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="padding-vertical padding-footer">
        <div className="mk-container">
          <div className="footer-wrapper">
            <div className="footer-top">
              <div className="footer-brand">
                <Link href="/" className="navbar-brand" aria-label={`${SITE.name} home`} style={{ color: "var(--color-paper)" }}>
                  <span className="wordmark">{SITE.name}</span>
                  <Thread />
                </Link>
                <p className="footer-line">{FOOTER.line}</p>
                <p className="footer-small">{FOOTER.small}</p>
              </div>
              {FOOTER.columns.map((col) => (
                <div className="footer-col" key={col.title}>
                  <span className="label">{col.title}</span>
                  {col.links.map((l) => (
                    <Link key={l.href} href={l.href} className="footer-link">
                      {l.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <Marquee msPerSlide={parseInt(motion.marqueeFooterDuration, 10)} msPerSlideMobile={parseInt(motion.marqueeFooterDurationMobile, 10)} gap={0} containerClass="swiper-footer" ariaLabel={SITE.name}>
            {[0, 1, 2].map((i) => (
              <div className="swiper-slide footer-slide" key={i} aria-hidden={i > 0}>
                <span className="footer-slide-word">{footer.wordmark}</span>
              </div>
            ))}
          </Marquee>
          <div className="footer-bottom-text">
            <span>
              © {new Date().getFullYear()} {SITE.name}. Founding client programme.
            </span>
            <span>{footer.line}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
