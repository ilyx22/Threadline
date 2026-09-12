"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SITE } from "@/content/public-site";
import { nav } from "@/content/marketing-site";
import { Arrow, Thread } from "./Icons";

/**
 * Fixed top bar on the page ground; the hero panel scrolls underneath it.
 * Three destinations, a client sign-in, one action. Below 992px the text links
 * move into a drawer behind a single control so no destination is lost on a
 * phone; the CTA shortens.
 */
export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="navbar" aria-label="Primary">
      <div className="padding-vertical padding-navbar">
        <div className="mk-container">
          <div className="navbar-wrapper">
            <Link href="/" className="navbar-brand" aria-label={`${SITE.name} home`}>
              <span className="wordmark">{SITE.name}</span>
              <Thread />
            </Link>
            <div className="navbar-links-wrapper">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href} className="navbar-link" aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                );
              })}
              <Link href="/login" className="navbar-link is-quiet">
                Sign in
              </Link>
              <div className="cta-flex">
                <Link href={nav.cta.href} className="button-primary is-sm">
                  <span className="nav-cta-full">{nav.cta.label}</span>
                  <span className="nav-cta-short">{nav.cta.short}</span>
                  <Arrow />
                </Link>
              </div>
              <button type="button" className="navbar-menu" aria-expanded={open} aria-controls="marketing-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
                <span className="navbar-menu-bar" aria-hidden="true" />
                <span className="navbar-menu-bar" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="marketing-menu" className="navbar-drawer" hidden={!open}>
        <div className="mk-container">
          <nav aria-label="Primary, mobile" className="navbar-drawer-links">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="navbar-drawer-link">
                {item.label}
                <Arrow />
              </Link>
            ))}
            <Link href="/login" className="navbar-drawer-link is-quiet">
              Client sign in
            </Link>
          </nav>
        </div>
      </div>
    </nav>
  );
}
