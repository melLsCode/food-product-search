/**
 * Shared class strings: the small design system this UI is built from.
 *
 * These are plain constants rather than a styling library. Tailwind's scanner
 * reads the literal strings in this file, so the utilities are generated exactly
 * as if they were written inline, and every button, card and input in the app
 * refers back to one definition instead of repeating its own spacing and colour.
 */

/** Page gutter. Every page uses this so content lines up across routes. */
export const CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

/** Narrower measure for reading-heavy pages (billing, errors). */
export const CONTAINER_NARROW = 'mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8';

export const CARD = 'rounded-xl border border-slate-200 bg-white shadow-sm';

/** Card that is itself a link or button. The lift on hover signals it is clickable. */
export const CARD_INTERACTIVE =
  'rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 ' +
  'hover:border-brand-300 hover:shadow-md hover:shadow-slate-200/60';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium ' +
  'transition duration-200 disabled:cursor-not-allowed disabled:opacity-60';

/** Neutral primary action: search, navigation. */
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800 active:bg-slate-950`;

/** Commercial action: subscribing. Distinct from neutral actions on purpose. */
export const BUTTON_BRAND = `${BUTTON_BASE} bg-brand-600 px-5 py-2.5 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800`;

export const BUTTON_SECONDARY = `${BUTTON_BASE} border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:border-slate-400 hover:bg-slate-50`;

/**
 * Form controls opt out of the global focus outline and use a ring instead, which
 * reads as a softer, more deliberate focus state on a large input.
 */
export const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 ' +
  'placeholder:text-slate-400 transition duration-200 ' +
  'focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15';

export const SELECT =
  'rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 ' +
  'transition duration-200 hover:border-slate-400 disabled:opacity-60 ' +
  'focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15';

/** Small uppercase label above a group of content. */
export const EYEBROW = 'text-xs font-semibold uppercase tracking-wider text-slate-500';

export const SECTION_TITLE = 'text-lg font-semibold tracking-tight text-slate-900';

/** Monospace treatment for barcodes, which are data rather than prose. */
export const BARCODE = 'font-mono text-xs tracking-tight text-slate-500';
