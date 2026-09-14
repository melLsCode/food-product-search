import type { Language } from './i18n';

/**
 * Formats a nutrient number for display.
 *
 * Open Food Facts returns raw floats, so values arrive as 539, 30.9 and 0.107 in
 * the same table. Intl gives locale-correct decimal separators, which matters
 * here: German and French readers expect "0,107" rather than "0.107".
 *
 * The cap of three fraction digits keeps small values such as salt meaningful
 * without printing floating-point noise on larger ones.
 */
export function formatNutrientValue(value: number, language: Language): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 3 }).format(value);
}

/**
 * Formats an ISO date from the API as a plain localized date. Returns null for
 * anything unparseable, so a caller can simply omit the line.
 */
export function formatDate(iso: string | null, language: Language): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(date);
}
