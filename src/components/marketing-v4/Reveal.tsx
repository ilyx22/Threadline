'use client';

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';
import { motion } from '@/content/marketing-tokens';

/**
 * Scroll reveal — the single motion primitive the page is built on.
 *
 * Faithful to the reference's Webflow IX2 behaviour, which is NOT one-shot:
 * an element fades/rises in when it enters the viewport and fades/drops back
 * out when it leaves. Verified against the live site with
 * scripts/diagnose-reveals2.mjs. Making this one-shot would be a visible
 * behavioural regression on scroll-up.
 *
 * Timing and distance come from design-system/tokens.ts (motion.reveal*).
 *
 * Honours `prefers-reduced-motion`: content renders fully visible and static.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  className,
  /** Stagger within a group, in ms. */
  delay = 0,
  /** Reveal once and stay (used where reversing would look wrong). */
  once = false,
  ...rest
}: {
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  once?: boolean;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (reduced) { setShown(true); return; }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setShown(false);
          }
        }
      },
      // Threshold comes from the design system so it stays a real control.
      // rootMargin trims a sliver off the bottom so an element does not flip
      // state while only a hairline is on screen.
      { threshold: motion.revealThreshold, rootMargin: '0px 0px -5% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, once]);

  const common = {
    ref,
    className,
    'data-reveal': shown ? 'shown' : 'hidden',
    style: delay && !reduced ? { transitionDelay: `${delay}ms` } : undefined,
    ...rest,
  };

  // React forbids passing children alongside dangerouslySetInnerHTML, so when a
  // caller supplies raw HTML the element is rendered without children.
  if ('dangerouslySetInnerHTML' in rest) return <Tag {...common} />;

  return <Tag {...common}>{children}</Tag>;
}
