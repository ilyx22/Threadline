"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/content/marketing-v5";
import { ThreadMark } from "@/components/brand/logo";

/**
 * The Threadline identity, shared with the product: the thread mark (one line
 * through the stages, resolving at the second node) beside the tracked wordmark.
 */
export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`v5-wordmark${light ? " is-light" : ""}`}>
      <ThreadMark size={24} className="v5-wordmark-mark" />
      <span>Threadline</span>
    </span>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="v5-nav">
      <div className="v5-wrap v5-nav-row">
        <Link href="/" className="v5-brand" aria-label="Threadline home">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="v5-nav-links">
          {nav.links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} href={l.href} className="v5-nav-link" aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
          <Link href={nav.signIn.href} className="v5-nav-link is-quiet" prefetch={false}>
            {nav.signIn.label}
          </Link>
        </nav>
        <div className="v5-nav-actions">
          <Link href={nav.cta.href} className="v5-btn is-sm">
            <span className="is-full">{nav.cta.label}</span>
            <span className="is-short">{nav.cta.short}</span>
          </Link>
          <button type="button" className="v5-menu" aria-expanded={open} aria-controls="v5-drawer" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
            <span />
            <span />
          </button>
        </div>
      </div>
      <div id="v5-drawer" className="v5-drawer" hidden={!open}>
        <nav aria-label="Primary, mobile" className="v5-wrap">
          {nav.links.map((l) => (
            <Link key={l.href} href={l.href} className="v5-drawer-link">
              {l.label}
            </Link>
          ))}
          <Link href={nav.signIn.href} className="v5-drawer-link is-quiet" prefetch={false}>
            Client sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
