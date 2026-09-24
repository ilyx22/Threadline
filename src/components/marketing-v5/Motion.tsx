"use client";

import * as React from "react";

/**
 * The one observer for the page. Every `[data-scene]` gets `data-inview`
 * as it enters and leaves the viewport: entering draws its thread and lets
 * its loops run; leaving pauses them. Nothing is hidden before it enters , 
 * the HTML is complete and readable without this component.
 */
export default function Motion() {
  React.useEffect(() => {
    document.documentElement.dataset.js = "1";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            el.dataset.inview = "true";
            el.dataset.seen = "true";
          } else el.dataset.inview = "false";
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );
    scenes.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return null;
}
