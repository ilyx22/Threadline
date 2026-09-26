import Link from "next/link";
import { FOOTER, SITE } from "@/content/public-site";
import { burden } from "@/content/marketing-v5";
import { Wordmark } from "./Nav";

/** The end of the line: a quiet ink footer, the thread tied off at the wordmark. */
export default function Footer() {
  return (
    <footer className="v5-footer">
      <div className="v5-wrap">
        <div className="v5-footer-grid">
          <div className="v5-footer-brand">
            <Wordmark light />
            <p className="v5-footer-line">{FOOTER.line}</p>
          </div>
          {FOOTER.columns.map((col) => (
            <div key={col.title} className="v5-footer-col">
              <p className="v5-tag is-on-dark">{col.title}</p>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="v5-footer-link">
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="v5-footer-end">
          <span>
            © {new Date().getFullYear()} {SITE.name}
          </span>
          <span>{burden.relief}</span>
        </div>
      </div>
    </footer>
  );
}
