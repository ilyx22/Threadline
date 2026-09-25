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
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const seeAll = () => scenes.forEach((s) => { s.dataset.seen = "true"; s.dataset.inview = "true"; });
    // Reduced motion: every scene is in its finished state at once; nothing waits for a reveal.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      seeAll();
      return;
    }
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
    // Safety net: if the observer is late or never fires, anything near the viewport is revealed within a
    // second, and everything is revealed after ten seconds, so no copy or call to action can stay invisible.
    const near = window.setInterval(() => {
      const limit = window.innerHeight * 1.5;
      scenes.forEach((s) => { if (!s.dataset.seen && s.getBoundingClientRect().top < limit) s.dataset.seen = "true"; });
    }, 1000);
    const all = window.setTimeout(seeAll, 10000);
    return () => { io.disconnect(); window.clearInterval(near); window.clearTimeout(all); };
  }, []);
  return null;
}
