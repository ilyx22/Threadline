'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';

/**
 * Continuous logo marquee.
 *
 * The reference drives these with Swiper 8 in `loop` mode with
 * `autoplay.delay = 0` and a linear timing function, which is simply constant
 * scrolling: one slide advances per `speed` ms. Reimplemented as a CSS
 * animation so the site does not ship a carousel library to render two strips.
 *
 * The DOM deliberately keeps the reference's class names
 * (`.swiper > .swiper-wrapper > .swiper-slide`) so the reference's own layout
 * rules still apply and the geometry audit can match elements by signature.
 *
 * Speed is expressed the way the reference expresses it — milliseconds per
 * slide — and converted to a whole-track duration, so on-screen px/s stays
 * constant however many logos are supplied:
 *
 *   px/s = (slideWidth + gap) / (msPerSlide / 1000)
 *
 * The track holds two copies and translates by exactly -50%, so the loop is
 * seamless. Hover pauses it, matching Swiper's `pauseOnMouseEnter: true`.
 */
/**
 * Forwards a ref to the mk-container and spreads unknown props onto it, so
 * <Reveal as={Marquee}> can attach its observer and data-reveal attribute
 * directly to the marquee element — which is where the reference puts the
 * reveal, rather than on an extra wrapper div.
 */
interface MarqueeProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'children'> {
  children: ReactNode;
  /** Milliseconds for one slide to advance — the reference's Swiper `speed`. */
  msPerSlide: number;
  /** Speed below `breakpoint`, if the reference changes it there. */
  msPerSlideMobile?: number;
  /** Gap between slides in px — the reference's Swiper `spaceBetween`. */
  gap?: number;
  /** Spacing below `breakpoint`, if the reference changes it there. */
  gapMobile?: number;
  /** Width at which the mobile values stop applying. */
  breakpoint?: number;
  /** e.g. "swiper-logos" or "swiper-footer". */
  containerClass: string;
  ariaLabel?: string;
}

const Marquee = forwardRef<HTMLDivElement, MarqueeProps>(function Marquee({
  children,
  msPerSlide,
  msPerSlideMobile,
  gap = 0,
  gapMobile,
  breakpoint = 992,
  containerClass,
  ariaLabel,
  className,
  style,
  ...rest
}, forwardedRef) {
  const hostRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(forwardedRef, () => hostRef.current as HTMLDivElement);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [hostWidth, setHostWidth] = useState<number | null>(null);

  /**
   * The footer strip changes speed AND spacing at 992px — the reference's
   * Swiper config is `speed: 10000, spaceBetween: 40` with a
   * `breakpoints: { 992: { speed: 20000, spaceBetween: 120 } }` override, so
   * the narrow values are the base and the wide ones are the override.
   * Without this the strip ran at the desktop speed on every screen.
   */
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (msPerSlideMobile == null && gapMobile == null) return;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [msPerSlideMobile, gapMobile, breakpoint]);

  const activeMs = isNarrow && msPerSlideMobile != null ? msPerSlideMobile : msPerSlide;
  const activeGap = isNarrow && gapMobile != null ? gapMobile : gap;

  useEffect(() => {
    const track = trackRef.current;
    const host = hostRef.current;
    if (!track || !host) return;

    const measure = () => {
      // Exposed as --marquee-host-w so a slide can be exactly one screen wide.
      // The footer wordmark relies on this: the reference sizes each slide to
      // the mk-container and scales the SVG into it, rather than letting the SVG's
      // intrinsic 1773px width decide.
      setHostWidth(host.clientWidth);

      // Count real slides rather than child nodes: the duplicate copy sits
      // inside a display:contents wrapper, so children.length is not 2N.
      const slideCount = track.querySelectorAll('.swiper-slide').length;
      const half = track.scrollWidth / 2;     // one copy of the content
      if (!half || slideCount < 2) return;
      const perSlide = half / (slideCount / 2); // advance per slide, incl. gap
      const pxPerSecond = perSlide / (activeMs / 1000);
      if (pxPerSecond > 0) setDuration(half / pxPerSecond);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(host);
    return () => ro.disconnect();
  }, [activeMs, children]);

  return (
    <div
      ref={hostRef}
      className={`swiper ${containerClass}${className ? ' ' + className : ''}`}
      aria-label={ariaLabel}
      {...rest}
      style={{
        ...(style as React.CSSProperties),
        // Spacing is applied as margin-right on each slide (which is what
        // Swiper's spaceBetween does) rather than column-gap. With column-gap
        // the two halves of the track are unequal by one gap and the -50% loop
        // visibly jumps at the seam.
        ['--marquee-gap' as string]: `${activeGap}px`,
        ...(hostWidth ? { ['--marquee-host-w' as string]: `${hostWidth}px` } : null),
      }}
    >
      <div
        ref={trackRef}
        className="swiper-wrapper"
        data-marquee-track=""
        style={duration ? { animationDuration: `${duration}s` } : undefined}
      >
        {children}
        {/* Duplicate copy — hidden from assistive tech so logos are not read twice. */}
        <div style={{ display: 'contents' }} aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Marquee;
