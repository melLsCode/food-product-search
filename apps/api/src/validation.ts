import { z, type ZodType } from 'zod';

import { ValidationError } from './errors.js';
import { SUPPORTED_LANGUAGES } from './openfoodfacts/mapper.js';

/**
 * Parses untrusted request input, converting a Zod failure into the standard
 * ValidationError. Routes call this explicitly instead of using a middleware
 * that attaches results to the request, which keeps the parsed value fully typed
 * at the point of use.
 */
export function parseInput<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Invalid request parameters', z.flattenError(result.error).fieldErrors);
  }

  return result.data;
}

export const languageSchema = z.enum(SUPPORTED_LANGUAGES).default('en');

/** Barcodes are digits only. This also prevents path manipulation of the provider URL. */
export const barcodeSchema = z
  .string()
  .regex(/^\d{4,20}$/, 'Barcode must be between 4 and 20 digits');

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Search term must be at least 2 characters').max(100),
  language: languageSchema,
});

export const recentSearchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
