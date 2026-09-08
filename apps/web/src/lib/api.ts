import type {
  Nutrition,
  ProductDetail,
  RecentSearch,
  SearchResponse,
  SubscriptionState,
} from './types';

/**
 * The single place the frontend talks to the backend. Open Food Facts and Stripe
 * are never called from here: the browser only ever sees our own API.
 *
 * Server Components use API_INTERNAL_URL; the browser uses NEXT_PUBLIC_API_URL.
 */
const SERVER_BASE_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export const BROWSER_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * A failed request is a normal outcome here - an unsubscribed user asking for
 * nutrition, or Open Food Facts being down - so the result is returned rather
 * than thrown. Callers must handle both branches, and pages can render a
 * translated message instead of an error boundary.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; code: string };

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(`${SERVER_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, code: 'NETWORK_ERROR' };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    return { ok: false, code: body.error?.code ?? 'INTERNAL_ERROR' };
  }

  return { ok: true, data: (await response.json()) as T };
}

export function searchProducts(query: string, language: string) {
  const params = new URLSearchParams({ q: query, language });
  return apiGet<SearchResponse>(`/api/products/search?${params.toString()}`);
}

export function getProduct(code: string, language: string) {
  const params = new URLSearchParams({ language });
  return apiGet<{ product: ProductDetail }>(`/api/products/${code}?${params.toString()}`);
}

export function getNutrition(code: string, language: string) {
  const params = new URLSearchParams({ language });
  return apiGet<{ nutrition: Nutrition }>(`/api/products/${code}/nutrition?${params.toString()}`);
}

export function getRecentSearches() {
  return apiGet<{ searches: RecentSearch[] }>('/api/searches/recent');
}

export function getSubscriptionStatus() {
  return apiGet<{ subscription: SubscriptionState }>('/api/billing/status');
}
