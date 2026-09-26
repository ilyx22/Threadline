"use client";

import * as React from "react";

/**
 * The site intro (26 September 2026, second version): a full-screen canvas,
 * a marigold thread drawn in from the left edge to the mark, the mark's line
 * drawing through its two nodes, the wordmark rising in, then the whole panel
 * lifts away. Scroll is held while it plays (about 1.9s). Plays once per
 * browser session (an inline script in the layout marks later pages before
 * first paint), never captures the pointer, and is skipped under reduced
 * motion. Removed from the DOM when its exit ends or at 3s, whichever is first.
 */
export default function Intro() {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    const root = document.documentElement;
    const skip = root.hasAttribute("data-intro-seen") || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      sessionStorage.setItem("tl-intro", "1");
    } catch {
      /* private mode: the intro simply plays again on the next page */
    }
    if (skip) {
      setDone(true);
      return;
    }
    root.classList.add("tl-intro-lock");
    const t = window.setTimeout(() => setDone(true), 3000);
    return () => {
      window.clearTimeout(t);
      root.classList.remove("tl-intro-lock");
    };
  }, []);
  React.useEffect(() => {
    if (done) document.documentElement.classList.remove("tl-intro-lock");
  }, [done]);
  if (done) return null;
  return (
    <div
      className="tl-intro"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.animationName === "tl-intro-lift") setDone(true);
      }}
    >
      <span className="tl-intro-lead" />
      <div className="tl-intro-lockup">
        <svg className="tl-intro-mark" viewBox="0 0 24 24" fill="none">
          <path d="M3 17.5C5.5 17.5 6.2 6.5 9 6.5C11.8 6.5 12.2 17.5 15 17.5C17.8 17.5 18.5 6.5 21 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="6.5" r="1.9" fill="currentColor" />
          <circle cx="15" cy="17.5" r="1.9" fill="currentColor" opacity="0.55" />
        </svg>
        <span className="tl-intro-word">
          {"Threadline".split("").map((ch, i) => (
            <span key={i} style={{ ["--i" as string]: i }}>
              {ch}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
