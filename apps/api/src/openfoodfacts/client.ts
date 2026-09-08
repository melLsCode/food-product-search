import { env } from '../env.js';
import { NotFoundError, UpstreamError } from '../errors.js';
import { SUPPORTED_LANGUAGES, type Language } from './mapper.js';

/**
 * Thin HTTP adapter for Open Food Facts. It knows about URLs, headers, timeouts
 * and status codes; it knows nothing about our response shapes (see mapper.ts).
 *
 * Two different services are involved, because Open Food Facts has no full-text
 * search in its v2/v3 API: Search-a-licious for searching, the product API for
 * reading a single barcode.
 */
const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';

const NAME_FIELDS = SUPPORTED_LANGUAGES.map((language) => `product_name_${language}`);
const INGREDIENT_FIELDS = SUPPORTED_LANGUAGES.map((language) => `ingredients_text_${language}`);

const SEARCH_FIELDS = [
  'code',
  'product_name',
  ...NAME_FIELDS,
  'brands',
  'image_front_small_url',
  'image_url',
].join(',');

const PRODUCT_FIELDS = [
  'code',
  'product_name',
  ...NAME_FIELDS,
  'brands',
  'quantity',
  'categories',
  'ingredients_text',
  ...INGREDIENT_FIELDS,
  'image_front_small_url',
  'image_url',
  'serving_size',
  'nutriments',
].join(',');

/** Requests JSON and converts every failure mode into a single UpstreamError. */
async function fetchJson(url: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        // Open Food Facts requires a identifying User-Agent and blocks anonymous traffic.
        'User-Agent': env.OFF_USER_AGENT,
      },
      signal: AbortSignal.timeout(env.OFF_TIMEOUT_MS),
    });
  } catch (error) {
    throw new UpstreamError(
      error instanceof Error && error.name === 'TimeoutError'
        ? 'Open Food Facts did not respond in time'
        : 'Open Food Facts could not be reached',
    );
  }

  if (!response.ok) {
    throw new UpstreamError(`Open Food Facts responded with status ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new UpstreamError('Open Food Facts returned an unreadable response');
  }
}

export async function searchProducts(
  query: string,
  language: Language,
  pageSize = 24,
): Promise<unknown> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  // Boosts the selected language's fields, so a Dutch term matches Dutch products.
  url.searchParams.set('langs', language);
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('fields', SEARCH_FIELDS);

  return fetchJson(url.toString());
}

/**
 * Short-lived cache of successful product reads.
 *
 * Viewing one product costs two requests to this module: the detail route and
 * the nutrition route each read the same barcode. Open Food Facts rate-limits by
 * IP and answers 429 once the limit is hit, so the second read is both wasteful
 * and the difference between working and throttled. The TTL is deliberately
 * short: this exists to collapse duplicate reads of one page view, not to serve
 * stale product data.
 */
const PRODUCT_CACHE_TTL_MS = 60_000;
const PRODUCT_CACHE_MAX_ENTRIES = 500;

const productCache = new Map<string, { product: unknown; expiresAt: number }>();

/**
 * Reads that have been started but not yet cached. Without this, the detail and
 * nutrition routes racing on the same barcode both miss the cache and both call
 * Open Food Facts, which is precisely the duplicate the cache exists to remove.
 */
const inFlightReads = new Map<string, Promise<unknown>>();

function cacheProduct(key: string, product: unknown): void {
  // Bounded so a long-running process cannot grow the map without limit. Map
  // preserves insertion order, so the first key is the oldest.
  if (productCache.size >= PRODUCT_CACHE_MAX_ENTRIES) {
    const oldest = productCache.keys().next();
    if (!oldest.done) productCache.delete(oldest.value);
  }

  productCache.set(key, { product, expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS });
}

/** The actual read, with no cache involvement. */
async function readProduct(code: string, language: Language): Promise<unknown> {
  const url = new URL(`${PRODUCT_URL}/${encodeURIComponent(code)}.json`);
  url.searchParams.set('lc', language);
  url.searchParams.set('fields', PRODUCT_FIELDS);

  const body = await fetchJson(url.toString());
  const payload = body as { status?: number; product?: unknown } | null;

  if (!payload || payload.status === 0 || !payload.product) {
    throw new NotFoundError('Product not found');
  }

  return payload.product;
}

/**
 * Reads a single product. Note that Open Food Facts answers an unknown barcode
 * with HTTP 200 and `status: 0`, so a missing product is detected from the body
 * rather than the status code.
 *
 * Only successful reads are cached; a not-found or upstream failure is always
 * retried, so a transient error is never remembered.
 */
export async function getProduct(code: string, language: Language): Promise<unknown> {
  // The language changes which text Open Food Facts returns, so it is part of
  // the key rather than an attribute of the cached value.
  const cacheKey = `${language}:${code}`;
  const cached = productCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.product;
  }

  const alreadyReading = inFlightReads.get(cacheKey);
  if (alreadyReading) return alreadyReading;

  // Caching happens before the entry is dropped, so a caller arriving between
  // the two either joins this read or finds the finished value. A rejection
  // clears the entry without caching, leaving the next caller to retry.
  const read = readProduct(code, language)
    .then((product) => {
      cacheProduct(cacheKey, product);
      return product;
    })
    .finally(() => {
      inFlightReads.delete(cacheKey);
    });

  inFlightReads.set(cacheKey, read);

  return read;
}
