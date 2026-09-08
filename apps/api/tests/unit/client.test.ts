import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The product cache is module state, so each test imports a fresh copy of the
 * client rather than reaching into it to reset it. Errors are asserted on their
 * `code` instead of with instanceof, because resetModules gives every import its
 * own copy of the error classes too.
 */
async function loadClient() {
  vi.resetModules();
  return import('../../src/openfoodfacts/client.js');
}

const CODE = '3017620422003';
const PRODUCT = { code: CODE, product_name: 'Nutella' };

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function found(product: unknown = PRODUCT) {
  return jsonResponse({ status: 1, product });
}

let fetchMock: ReturnType<typeof vi.fn>;

/** The URL of the nth fetch the client made. */
function requestedUrl(call: number): string {
  return String(fetchMock.mock.calls[call]?.[0]);
}

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(found());
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getProduct caching', () => {
  it('calls Open Food Facts once for repeated reads of the same code and language', async () => {
    const { getProduct } = await loadClient();

    const first = await getProduct(CODE, 'en');
    const second = await getProduct(CODE, 'en');

    // This is the detail route and the nutrition route reading the same product.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(second).toEqual(PRODUCT);
  });

  it('treats each language as its own entry', async () => {
    const { getProduct } = await loadClient();

    await getProduct(CODE, 'en');
    await getProduct(CODE, 'nl');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestedUrl(0)).toContain('lc=en');
    expect(requestedUrl(1)).toContain('lc=nl');
  });

  it('treats each barcode as its own entry', async () => {
    const { getProduct } = await loadClient();

    await getProduct(CODE, 'en');
    await getProduct('5000112637922', 'en');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reads again once the entry has expired', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { getProduct } = await loadClient();

    await getProduct(CODE, 'en');
    vi.setSystemTime(Date.now() + 61_000);
    await getProduct(CODE, 'en');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache a barcode Open Food Facts does not know', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 0 }));
    const { getProduct } = await loadClient();

    await expect(getProduct(CODE, 'en')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(getProduct(CODE, 'en')).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache an upstream failure, so a rate-limited read is retried', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'too many requests' }, 429));
    const { getProduct } = await loadClient();

    await expect(getProduct(CODE, 'en')).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
    await expect(getProduct(CODE, 'en')).resolves.toEqual(PRODUCT);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares one Open Food Facts request between concurrent reads', async () => {
    // Held open so both calls are genuinely in flight at the same time, which is
    // the detail and nutrition routes racing on the same barcode.
    let release: (response: Response) => void = () => {};
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );

    const { getProduct } = await loadClient();

    const first = getProduct(CODE, 'en');
    const second = getProduct(CODE, 'en');
    release(found());

    await expect(Promise.all([first, second])).resolves.toEqual([PRODUCT, PRODUCT]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not leave a failed read stuck in flight', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'too many requests' }, 429));
    const { getProduct } = await loadClient();

    const first = getProduct(CODE, 'en');
    const second = getProduct(CODE, 'en');

    await expect(first).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
    await expect(second).rejects.toMatchObject({ code: 'UPSTREAM_ERROR' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The key was released, so a later read is not permanently poisoned.
    await expect(getProduct(CODE, 'en')).resolves.toEqual(PRODUCT);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not share a request across languages', async () => {
    const { getProduct } = await loadClient();

    await Promise.all([getProduct(CODE, 'en'), getProduct(CODE, 'nl')]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache search results', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ hits: [] }));
    const { searchProducts } = await loadClient();

    await searchProducts('nutella', 'en');
    await searchProducts('nutella', 'en');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
