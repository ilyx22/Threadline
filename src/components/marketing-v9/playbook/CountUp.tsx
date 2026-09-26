"use client";

import * as React from "react";

/**
 * A figure that counts up from zero the first time it is seen, keeping any
 * prefix and suffix ("100m+", "10,000+"). Renders the final value on the
 * server and under reduced motion, so nothing depends on it.
 */
export function CountUp({ value }: { value: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [shown, setShown] = React.useState(value);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    const m = /^([^\d]*)([\d,]+)(.*)$/.exec(value);
    if (!m) return;
    const [, pre, digits, post] = m;
    const target = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(target) || target === 0) return;
    const grouped = digits.includes(",");
    const fmt = (n: number) => (grouped ? Math.round(n).toLocaleString("en-GB") : String(Math.round(n)));
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(`${pre}${fmt(target * eased)}${post}`);
        if (k < 1) raf = window.requestAnimationFrame(tick);
      };
      setShown(`${pre}${fmt(0)}${post}`);
      raf = window.requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [value]);
  return <span ref={ref}>{shown}</span>;
}
