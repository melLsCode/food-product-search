import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '../../src/errors.js';
import { prisma } from '../../src/prisma.js';
import { giveSubscription, resetDatabase, seedDemoUser } from '../helpers/db.js';

const { searchProducts, getProduct } = vi.hoisted(() => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('../../src/openfoodfacts/client.js', () => ({ searchProducts, getProduct }));

const { createApp } = await import('../../src/app.js');
const app = createApp();

const NUTELLA = {
  code: '3017620422003',
  product_name: 'Nutella',
  serving_size: '15 g',
  nutriments: {
    'energy-kcal_100g': 539,
    'energy-kcal_unit': 'kcal',
    fat_100g: 30.9,
    fat_unit: 'g',
    sugars_100g: 56.3,
  },
};

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
  await seedDemoUser();
  getProduct.mockResolvedValue(NUTELLA);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/products/:code/nutrition without an active subscription', () => {
  it('returns 402 and no nutrition data when there is no subscription at all', async () => {
    const response = await request(app).get('/api/products/3017620422003/nutrition');

    expect(response.status).toBe(402);
    expect(response.body).toEqual({
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'An active subscription is required to view nutrition details',
      },
    });
    // The provider is not even contacted for an unauthorized request.
    expect(getProduct).not.toHaveBeenCalled();
  });

  it.each(['canceled', 'past_due', 'unpaid', 'incomplete'])(
    'returns 402 for a %s subscription',
    async (status) => {
      const user = await prisma.user.findFirstOrThrow();
      await giveSubscription(user.id, status);

      const response = await request(app).get('/api/products/3017620422003/nutrition');

      expect(response.status).toBe(402);
      expect(response.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    },
  );
});

describe('GET /api/products/:code/nutrition with an active subscription', () => {
  it.each(['active', 'trialing'])('returns nutrition for a %s subscription', async (status) => {
    const user = await prisma.user.findFirstOrThrow();
    await giveSubscription(user.id, status);

    const response = await request(app).get('/api/products/3017620422003/nutrition');

    expect(response.status).toBe(200);
    expect(response.body.nutrition).toMatchObject({
      code: '3017620422003',
      available: true,
      per: '100g',
      servingSize: '15 g',
    });
    expect(response.body.nutrition.nutrients.energyKcal).toEqual({ value: 539, unit: 'kcal' });
  });

  it('reports missing nutrients as null rather than failing', async () => {
    const user = await prisma.user.findFirstOrThrow();
    await giveSubscription(user.id, 'active');
    getProduct.mockResolvedValue({ code: '1234', product_name: 'Sparse product' });

    const response = await request(app).get('/api/products/1234/nutrition');

    expect(response.status).toBe(200);
    expect(response.body.nutrition.available).toBe(false);
    expect(response.body.nutrition.nutrients.proteins).toEqual({ value: null, unit: null });
  });

  it('returns 404 when the product does not exist', async () => {
    const user = await prisma.user.findFirstOrThrow();
    await giveSubscription(user.id, 'active');
    getProduct.mockRejectedValue(new NotFoundError('Product not found'));

    const response = await request(app).get('/api/products/9999999999999/nutrition');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('stops returning nutrition as soon as the subscription is no longer active', async () => {
    const user = await prisma.user.findFirstOrThrow();
    await giveSubscription(user.id, 'active');

    expect((await request(app).get('/api/products/3017620422003/nutrition')).status).toBe(200);

    // Simulates what the customer.subscription.deleted webhook writes.
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { status: 'canceled' },
    });

    expect((await request(app).get('/api/products/3017620422003/nutrition')).status).toBe(402);
  });
});
