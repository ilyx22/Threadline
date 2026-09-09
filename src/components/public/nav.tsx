"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NAV, SITE } from "@/content/public-site";
import { ThreadWordmark } from "@/components/factory/primitives";

/**
 * Public header. Three destinations, one action. Sticky because the pages are
 * long and narrative; compact on scroll so it never competes with the hero.
 * Mobile: logo + Apply always visible; the three links live in a drawer.
 */
export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [compact, setCompact] = React.useState(false);

  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setCompact(window.scrollY > 24));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className={cn("sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-200", compact ? "border-[color:var(--paper-edge)] bg-[color:var(--canvas)]/95 backdrop-blur-md" : "border-transparent bg-transparent")}>
      <div className="tl-container flex h-[68px] items-center gap-6">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-2" aria-label="Threadline home">
          <ThreadWordmark className="h-6 w-auto" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium transition-colors", active ? "text-[color:var(--ink)] underline decoration-[color:var(--accent)] decoration-2 underline-offset-8" : "text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]")}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="hidden min-h-11 items-center rounded-lg px-3 text-[14px] font-medium text-[color:var(--ink-soft)] hover:text-[color:var(--ink)] sm:inline-flex">
            Sign in
          </Link>
          <Link href={SITE.primaryCta.href} className="tl-btn tl-btn-primary tl-btn-sm">
            {SITE.primaryCta.label}
          </Link>
          <button type="button" aria-expanded={open} aria-controls="public-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)} className="inline-flex size-11 items-center justify-center rounded-lg border-[1.5px] border-[color:var(--ink)] bg-[color:var(--paper)] md:hidden">
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div id="public-menu" hidden={!open} className="border-t border-[color:var(--paper-edge)] bg-[color:var(--canvas)] md:hidden">
        <nav aria-label="Primary, mobile" className="tl-container flex flex-col gap-1 py-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-12 items-center rounded-lg px-3 text-[16px] font-medium text-[color:var(--ink)]">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="inline-flex min-h-12 items-center rounded-lg px-3 text-[16px] font-medium text-[color:var(--ink-soft)]">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
