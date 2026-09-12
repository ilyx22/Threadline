/**
 * THREADLINE — DESIGN TOKENS (single source of truth)
 * ====================================================
 * Every colour, font, size, radius and motion value the site uses lives here.
 * Editing a value here changes it everywhere. Nothing else needs to be touched.
 *
 * These emit CSS custom properties via design-system/css-variables.ts
 * (`npm run tokens:build`, run automatically before dev/build).
 *
 * Identity (see THREADLINE_VISUAL_SYSTEM.md):
 *   high-trust advisory + media intelligence + modern operating system.
 *   - a warm bone page ground, near-black ink type;
 *   - rich cobalt as the system colour — editorial and confident, never
 *     corporate: it is the one large lit object per scene, the primary
 *     action, the root thesis, the authority slab;
 *   - one restrained warm signal — vermilion — for the market talking back
 *     (commercial signals, the actual reading, the conversation);
 *   - cool steel / mist neutrals for secondary states and sunk surfaces;
 *   - night (a near-black cobalt-ink) for the three cinematic full-bleed
 *     moments, so the page moves between light and dark.
 */

export const colors = {
  /** Page ground — warm bone. */
  canvas: '#F3F0E8',
  /** Panels, cards, frames. */
  paper: '#FBFAF6',
  white: '#FFFFFF',
  /** Sunk surfaces: tile grounds, instrument beds. Cool mist. */
  mist: '#E6E6E0',
  /** The 2.5D bottom face of objects; the empty state of a stack. */
  mistDeep: '#C9CBC5',

  /** Ink ladder. */
  ink: '#121316',
  inkSoft: '#3D4046',
  inkFaint: '#6F747C',

  /** The system colour: rich cobalt / ultramarine. */
  cobalt: '#1F3BD6',
  cobaltDeep: '#152A9E',
  cobaltSoft: '#DEE3F8',
  /** Night — the dark surface of the cinematic bands; cobalt-ink, not grey. */
  night: '#0E1330',
  nightRaised: '#18204A',

  /** The one warm signal: vermilion. */
  vermilion: '#E2432A',
  vermilionDeep: '#B32F1B',
  vermilionSoft: '#FAE1DB',

  /** Cool steel for secondary states — the market before it responds. */
  steel: '#66717F',
  steelSoft: '#D6DBE0',
} as const;

export const fonts = {
  /** Display — Fraunces (variable optical size), weight 400–500, never bold. */
  display: "'Fraunces', 'Iowan Old Style', Georgia, serif",
  /** Body and UI — Inter. */
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  /** Labels, evidence, diagnostics — JetBrains Mono. */
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

/** Type scale. Sizes are rem; 1rem = 16px. Strong scale contrast is the point. */
export const type = {
  h1: { desktop: '5.75rem', tablet: '4rem', mobile: '3rem', lineHeight: '0.96', weight: 400 },
  h2: { desktop: '4.25rem', tablet: '3rem', mobile: '2.375rem', lineHeight: '1.0', weight: 400 },
  h3: { desktop: '1.75rem', tablet: '1.625rem', mobile: '1.5rem', lineHeight: '1.1', weight: 400 },
  eyebrow: { desktop: '1.5rem', tablet: '1.5rem', mobile: '1.125rem', lineHeight: '1', weight: 400 },
  label: { desktop: '0.75rem', mobile: '0.6875rem', lineHeight: '1', weight: 500 },
  body: { desktop: '1.1875rem', mobile: '1.0625rem', lineHeight: '1.45', weight: 400 },
} as const;

export const layout = {
  containerMax: '1280px',
  containerPadX: '20px',
  sectionPadX: '30px',
  padHero: '84px 30px 24px',
  padTicker: '28px',
  padSection: '120px',
  padSectionMobile: '64px',
  /** The closing composition overlaps into the footer by this much. */
  padFooterTop: '280px',
  padFooterTopMobile: '200px',
  padPageTop: '150px',
} as const;

export const radii = {
  lg: '40px',
  md: '24px',
  sm: '12px',
  lgMobile: '24px',
  mdMobile: '16px',
} as const;

export const motion = {
  revealDistance: '30px',
  revealDuration: '640ms',
  revealEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  revealThreshold: 0.15,
  hover: '260ms',
  hoverEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  assembleDuration: '900ms',
  assembleEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  assembleStep: '80ms',
  loopSlow: '9000ms',
  underline: '300ms',
  underlineEasing: 'ease-in-out',
  marqueeTickerDuration: '2600ms',
  marqueeFooterDuration: '20000ms',
  marqueeFooterDurationMobile: '10000ms',
} as const;

export const breakpoints = {
  desktop: 992,
  tablet: 768,
  mobile: 480,
} as const;

export const tokens = { colors, fonts, type, layout, radii, motion, breakpoints };
export default tokens;
