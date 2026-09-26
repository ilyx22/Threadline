"use client";

import * as React from "react";

/**
 * The Playbook as one chapter at a time (26 September 2026): the ten chapters
 * stay in the HTML, but with scripting only the current one shows, and one
 * large button at the bottom moves to the next. The rail and the chapter map
 * still work: they set the hash, and the stepper follows it. Without
 * scripting every chapter renders in order, as before.
 */
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="v9-arrow" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Stepper({ children, titles }: { children: React.ReactNode; titles: readonly string[] }) {
  const kids = React.Children.toArray(children);
  const last = kids.length - 1;
  const [current, setCurrent] = React.useState(0);
  const root = React.useRef<HTMLDivElement>(null);

  const scrollToTop = React.useCallback(() => {
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const go = React.useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(last, i));
      setCurrent(next);
      window.history.replaceState(null, "", `#chapter-${next + 1}`);
      scrollToTop();
    },
    [last, scrollToTop],
  );

  React.useEffect(() => {
    const fromHash = () => {
      const m = /^#chapter-(\d+)$/.exec(window.location.hash);
      if (!m) return false;
      setCurrent(Math.max(0, Math.min(last, Number(m[1]) - 1)));
      return true;
    };
    fromHash();
    const onHash = () => {
      if (fromHash()) window.requestAnimationFrame(scrollToTop);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [last, scrollToTop]);

  return (
    <div ref={root} className="pb-stepper">
      {kids.map((kid, i) => (
        <div key={i} className={`pb-step${i === current ? " is-current" : ""}`}>
          {kid}
          <div className="pb-step-nav v9-wrap">
            {i > 0 ? (
              <button type="button" className="v9-btn is-ghost pb-step-back" onClick={() => go(i - 1)}>
                Back
              </button>
            ) : (
              <span />
            )}
            {i < last ? (
              <button type="button" className="v9-btn pb-step-next" onClick={() => go(i + 1)}>
                <span className="pb-step-next-label">Next</span>
                <span className="pb-step-next-title">
                  {String(i + 2).padStart(2, "0")} · {titles[i + 1]}
                </span>
                <Arrow />
              </button>
            ) : (
              <a href="#tools" className="v9-btn pb-step-next">
                <span className="pb-step-next-label">Now use it</span>
                <span className="pb-step-next-title">Two things to do before you apply</span>
                <Arrow />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
