"use client";

import * as React from "react";
import { PLAYBOOK } from "@/content/public-site";

/**
 * Reading progress for the Playbook, kept in this browser only. A sticky
 * rail of ten chapter marks under the nav, and a "mark as read" control in
 * each chapter. Nothing here is required to read the page.
 */
const KEY = "tl-playbook-read";
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}
function write(next: string[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: keep it in memory */
  }
  listeners.forEach((l) => l());
}
const EMPTY: string[] = [];
function useRead() {
  return React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}

export function ProgressRail() {
  const done = useRead();
  const total = PLAYBOOK.chapters.length;
  return (
    <nav className="pb-rail" aria-label="Chapters">
      <ol className="pb-rail-marks">
        {PLAYBOOK.chapters.map((c, i) => (
          <li key={c.slug}>
            <a href={`#chapter-${i + 1}`} className={`pb-rail-mark${done.includes(c.slug) ? " is-done" : ""}`} aria-label={`Chapter ${i + 1}: ${c.title}${done.includes(c.slug) ? " (read)" : ""}`}>
              {i + 1}
            </a>
          </li>
        ))}
      </ol>
      <p className="pb-rail-count" aria-live="polite">
        {done.length} of {total} read
        {done.length > 0 ? (
          <button type="button" className="pb-rail-reset" onClick={() => write([])}>
            Reset
          </button>
        ) : null}
      </p>
    </nav>
  );
}

/**
 * Marks a chapter read once its object has been in view for a while, the way
 * a reader would expect progress to move as they scroll. The manual control
 * still works and can un-mark.
 */
export function AutoRead({ slug, target }: { slug: string; target: string }) {
  React.useEffect(() => {
    const el = document.getElementById(target);
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timer: number | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((e) => e.isIntersecting);
        if (seen && timer === null) {
          timer = window.setTimeout(() => {
            const done = read();
            if (!done.includes(slug)) write([...done, slug]);
          }, 2500);
        } else if (!seen && timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: 0 }, /* the chapter crosses the middle third of the screen: works for chapters taller than the viewport */
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [slug, target]);
  return null;
}

export function MarkRead({ slug }: { slug: string }) {
  const done = useRead();
  const on = done.includes(slug);
  return (
    <button type="button" className={`pb-mark${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => write(on ? done.filter((s) => s !== slug) : [...done, slug])}>
      <span className="pb-mark-box" aria-hidden="true" />
      {on ? "Read" : "Mark as read"}
    </button>
  );
}
