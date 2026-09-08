import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpstreamError } from '../../src/errors.js';
import { prisma } from '../../src/prisma.js';
import { resetDatabase, seedDemoUser } from '../helpers/db.js';

// Open Food Facts is mocked at the adapter boundary, so the tests exercise the
// real route, validation, mapping and persistence without any network access.
const { searchProducts, getProduct } = vi.hoisted(() => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('../../src/openfoodfacts/client.js', () => ({ searchProducts, getProduct }));

const { createApp } = await import('../../src/app.js');
const app = createApp();

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
  await seedDemoUser();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/products/search', () => {
  it('returns normalized products for a valid search', async () => {
    searchProducts.mockResolvedValue({
      hits: [
        {
          code: '3017620422003',
          product_name: 'Nutella',
          brands: ['Ferrero'],
          image_front_small_url: 'https://images.openfoodfacts.org/front.jpg',
        },
      ],
    });

    const response = await request(app).get('/api/products/search').query({ q: 'nutella', language: 'nl' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      query: 'nutella',
      language: 'nl',
      products: [
        {
          code: '3017620422003',
          name: 'Nutella',
          brand: 'Ferrero',
          imageUrl: 'https://images.openfoodfacts.org/front.jpg',
        },
      ],
    });
    expect(searchProducts).toHaveBeenCalledWith('nutella', 'nl');
  });

  it('defaults to English when no language is given', async () => {
    searchProducts.mockResolvedValue({ hits: [] });

    const response = await request(app).get('/api/products/search').query({ q: 'water' });

    expect(response.status).toBe(200);
    expect(response.body.language).toBe('en');
  });

  it('rejects an unsupported language', async () => {
    const response = await request(app)
      .get('/api/products/search')
      .query({ q: 'nutella', language: 'es' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it('rejects a query that is too short', async () => {
    const response = await request(app).get('/api/products/search').query({ q: 'a' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 with an empty list when nothing matches', async () => {
    searchProducts.mockResolvedValue({ hits: [] });

    const response = await request(app).get('/api/products/search').query({ q: 'zzzzzzz' });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([]);
  });

  it('skips malformed provider entries instead of failing the request', async () => {
    searchProducts.mockResolvedValue({
      hits: [
        { code: '1', product_name: 'Valid' },
        { product_name: 'Missing barcode' },
        { code: '2' },
        null,
        'garbage',
      ],
    });

    const response = await request(app).get('/api/products/search').query({ q: 'biscuit' });

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([
      { code: '1', name: 'Valid', brand: null, imageUrl: null },
    ]);
  });

  it('returns 502 UPSTREAM_ERROR when the provider fails', async () => {
    searchProducts.mockRejectedValue(new UpstreamError('Open Food Facts could not be reached'));

    const response = await request(app).get('/api/products/search').query({ q: 'nutella' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('UPSTREAM_ERROR');
  });

  it('never exposes nutrition data through search results', async () => {
    searchProducts.mockResolvedValue({
      hits: [
        {
          code: '1',
          product_name: 'Nutella',
          nutriments: { 'energy-kcal_100g': 539, fat_100g: 30.9, sugars_100g: 56.3 },
        },
      ],
    });

    const response = await request(app).get('/api/products/search').query({ q: 'nutella' });

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.products[0])).toEqual(['code', 'name', 'brand', 'imageUrl']);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('nutriments');
    expect(serialized).not.toContain('539');
  });
});

describe('GET /api/products/:code', () => {
  it('returns public detail without any nutrient values', async () => {
    getProduct.mockResolvedValue({
      code: '3017620422003',
      product_name: 'Nutella',
      product_name_de: 'Nutella Creme',
      brands: 'Ferrero',
      quantity: '400 g',
      ingredients_text_de: 'Zucker, Palmöl',
      nutriments: { 'energy-kcal_100g': 539, fat_100g: 30.9 },
    });

    const response = await request(app)
      .get('/api/products/3017620422003')
      .query({ language: 'de' });

    expect(response.status).toBe(200);
    expect(response.body.product.name).toBe('Nutella Creme');
    expect(response.body.product.ingredientsText).toBe('Zucker, Palmöl');
    // The product has nutrition, but only the flag is public.
    expect(response.body.product.nutritionAvailable).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('539');
  });

  it('rejects a non-numeric barcode', async () => {
    const response = await request(app).get('/api/products/not-a-barcode');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(getProduct).not.toHaveBeenCalled();
  });
});
