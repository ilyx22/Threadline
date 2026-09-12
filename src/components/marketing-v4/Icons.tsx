/** Inline glyphs — no icon font, no third-party artwork. */
export function Arrow({ className = 'cta-arrow' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 14" aria-hidden="true" preserveAspectRatio="none">
      <line x1="1" y1="7" x2="28" y2="7" />
      <polyline points="22,1 28,7 22,13" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ArrowLeft() {
  return (
    <svg viewBox="0 0 30 14" aria-hidden="true">
      <line x1="29" y1="7" x2="2" y2="7" />
      <polyline points="8,1 2,7 8,13" />
    </svg>
  );
}

export function ArrowRight() {
  return (
    <svg viewBox="0 0 30 14" aria-hidden="true">
      <line x1="1" y1="7" x2="28" y2="7" />
      <polyline points="22,1 28,7 22,13" />
    </svg>
  );
}

/** The wordmark's thread — one ember stroke that ends where the name ends. */
export function Thread() {
  return (
    <svg className="wordmark-thread" viewBox="0 0 44 10" aria-hidden="true">
      <path d="M1 7 C 8 1, 14 9, 21 5 S 34 1, 43 6" />
    </svg>
  );
}
