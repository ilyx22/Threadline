"use client";

import * as React from "react";

/**
 * The site intro: the thread mark draws, the wordmark settles, the canvas
 * lifts. Plays once per browser session (the layout's inline script marks the
 * document `data-intro-seen` before first paint on later pages), never
 * captures the pointer, and is removed from the DOM when its exit animation
 * ends. Reduced motion hides it entirely in CSS.
 */
export default function Intro() {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    try {
      sessionStorage.setItem("tl-intro", "1");
    } catch {
      /* private mode: the intro simply plays again on the next page */
    }
    const t = window.setTimeout(() => setDone(true), 2600);
    return () => window.clearTimeout(t);
  }, []);
  if (done) return null;
  return (
    <div
      className="tl-intro"
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.animationName === "tl-intro-out") setDone(true);
      }}
    >
      <div className="tl-intro-lockup">
        <svg className="tl-intro-mark" viewBox="0 0 24 24" fill="none" width={72} height={72}>
          <path d="M3 17.5C5.5 17.5 6.2 6.5 9 6.5C11.8 6.5 12.2 17.5 15 17.5C17.8 17.5 18.5 6.5 21 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="6.5" r="1.9" fill="currentColor" />
          <circle cx="15" cy="17.5" r="1.9" fill="currentColor" opacity="0.55" />
        </svg>
        <span className="tl-intro-word">Threadline</span>
      </div>
    </div>
  );
}
