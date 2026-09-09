"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * One dominant action per viewport. The bar appears after the hero has gone,
 * hides near the closing CTA, and is the only element that persists on
 * mobile. It never covers the primary CTA of a section.
 */
export function StickyApply({ showAfter = 700 }: { showAfter?: number }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const nearBottom = window.innerHeight + y > document.documentElement.scrollHeight - 1100;
        setVisible(y > showAfter && !nearBottom);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [showAfter]);

  return (
    <div aria-hidden={!visible} className={cn("tl-sticky pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 transition-[opacity,transform] duration-300 motion-reduce:transition-none", visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}>
      <div className="tl-container flex justify-center sm:justify-end">
        <Link href="/apply" tabIndex={visible ? undefined : -1} className={cn("tl-btn tl-btn-primary pointer-events-auto", !visible && "pointer-events-none")}>
          Apply for a diagnosis
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
