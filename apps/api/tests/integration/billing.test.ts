import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/prisma.js';
import { STRIPE_CUSTOMER_ID, resetDatabase, seedDemoUser } from '../helpers/db.js';

const { createPortalSession } = vi.hoisted(() => ({
  createPortalSession: vi.fn(),
}));

vi.mock('../../src/openfoodfacts/client.js', () => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('../../src/stripe.js', () => ({
  stripe: {
    billingPortal: {
      sessions: { create: createPortalSession },
    },
  },
}));

const { createApp } = await import('../../src/app.js');
const app = createApp();

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/billing/portal', () => {
  it('creates a Customer Portal session for the demo Stripe customer', async () => {
    await seedDemoUser(STRIPE_CUSTOMER_ID);
    createPortalSession.mockResolvedValue({ url: 'https://billing.stripe.com/session/test' });

    const response = await request(app)
      .post('/api/billing/portal')
      .send({ language: 'en' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ url: 'https://billing.stripe.com/session/test' });
    expect(createPortalSession).toHaveBeenCalledWith({
      customer: STRIPE_CUSTOMER_ID,
      return_url: 'http://localhost:3000/billing/success?language=en',
    });
  });

  it('returns 402 when the demo user has no Stripe customer', async () => {
    await seedDemoUser(null);

    const response = await request(app)
      .post('/api/billing/portal')
      .send({ language: 'en' });

    expect(response.status).toBe(402);
    expect(response.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    expect(createPortalSession).not.toHaveBeenCalled();
  });

  it('returns 500 when Stripe rejects the portal request', async () => {
    await seedDemoUser(STRIPE_CUSTOMER_ID);
    createPortalSession.mockRejectedValue(new Error('portal is not configured'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app)
      .post('/api/billing/portal')
      .send({ language: 'en' });

    logged.mockRestore();

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns 502 when Stripe omits the portal URL', async () => {
    await seedDemoUser(STRIPE_CUSTOMER_ID);
    createPortalSession.mockResolvedValue({ url: null });

    const response = await request(app)
      .post('/api/billing/portal')
      .send({ language: 'nl' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('BILLING_UNAVAILABLE');
  });
});
