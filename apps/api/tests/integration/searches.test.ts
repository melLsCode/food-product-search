import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/prisma.js';
import { resetDatabase, seedDemoUser } from '../helpers/db.js';

const { searchProducts, getProduct } = vi.hoisted(() => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('../../src/openfoodfacts/client.js', () => ({ searchProducts, getProduct }));

const { createApp } = await import('../../src/app.js');
const app = createApp();

function hits(count: number) {
  return {
    hits: Array.from({ length: count }, (_, index) => ({
      code: String(index + 1),
      product_name: `Product ${index + 1}`,
    })),
  };
}

async function search(term: string, language = 'en') {
  return request(app).get('/api/products/search').query({ q: term, language });
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
  await seedDemoUser();
  searchProducts.mockResolvedValue(hits(2));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('recording searches', () => {
  it('stores the term normalized, with the language and result count', async () => {
    await search('  NuTeLLa  ', 'de');

    const stored = await prisma.recentSearch.findFirstOrThrow();
    expect(stored.term).toBe('nutella');
    expect(stored.language).toBe('de');
    expect(stored.resultCount).toBe(2);
  });

  it('updates the existing row instead of creating a duplicate', async () => {
    await search('nutella');
    searchProducts.mockResolvedValue(hits(5));
    await search('NUTELLA');

    const rows = await prisma.recentSearch.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.resultCount).toBe(5);
  });

  it('treats the same term in another language as a separate search', async () => {
    await search('nutella', 'en');
    await search('nutella', 'fr');

    expect(await prisma.recentSearch.count()).toBe(2);
  });

  it('does not record a search that failed validation', async () => {
    await search('a');

    expect(await prisma.recentSearch.count()).toBe(0);
  });
});

describe('GET /api/searches/recent', () => {
  it('returns the ten most recently updated searches, newest first', async () => {
    for (let index = 0; index < 12; index += 1) {
      await search(`term-${index}`);
    }

    const response = await request(app).get('/api/searches/recent');

    expect(response.status).toBe(200);
    expect(response.body.searches).toHaveLength(10);
    expect(response.body.searches[0].term).toBe('term-11');
    expect(response.body.searches[9].term).toBe('term-2');
  });

  it('moves a repeated search back to the top', async () => {
    await search('first');
    await search('second');
    await search('first');

    const response = await request(app).get('/api/searches/recent');

    expect(response.body.searches.map((entry: { term: string }) => entry.term)).toEqual([
      'first',
      'second',
    ]);
  });

  it('returns an empty list when nothing has been searched', async () => {
    const response = await request(app).get('/api/searches/recent');

    expect(response.status).toBe(200);
    expect(response.body.searches).toEqual([]);
  });

  it('rejects an out-of-range limit', async () => {
    const response = await request(app).get('/api/searches/recent').query({ limit: '500' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
