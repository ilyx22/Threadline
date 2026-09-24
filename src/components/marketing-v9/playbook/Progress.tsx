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
