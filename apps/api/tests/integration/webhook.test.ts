import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '../../src/env.js';
import { prisma } from '../../src/prisma.js';
import { stripe } from '../../src/stripe.js';
import { DEMO_EMAIL, STRIPE_CUSTOMER_ID, resetDatabase, seedDemoUser } from '../helpers/db.js';

const { searchProducts, getProduct } = vi.hoisted(() => ({
  searchProducts: vi.fn(),
  getProduct: vi.fn(),
}));

vi.mock('../../src/openfoodfacts/client.js', () => ({ searchProducts, getProduct }));

const { createApp } = await import('../../src/app.js');
const app = createApp();

const PERIOD_END = 1_790_000_000;

/** Stripe reports event.created in Unix seconds; these are offsets from it. */
const EVENT_CREATED = 1_780_000_000;
const OLDER = EVENT_CREATED - 3600;
const NEWER = EVENT_CREATED + 3600;

function subscriptionEvent(
  type: string,
  {
    id = 'evt_test_1',
    created = EVENT_CREATED,
    status = 'active',
    customer = STRIPE_CUSTOMER_ID,
    cancelAtPeriodEnd = false,
  } = {},
) {
  return {
    id,
    object: 'event',
    created,
    type,
    data: {
      object: {
        id: 'sub_test_123',
        object: 'subscription',
        customer,
        status,
        cancel_at_period_end: cancelAtPeriodEnd,
        items: {
          object: 'list',
          data: [
            {
              id: 'si_test_1',
              object: 'subscription_item',
              price: { id: 'price_test_monthly', object: 'price' },
              current_period_end: PERIOD_END,
            },
          ],
        },
      },
    },
  };
}

/** Signs the payload the same way Stripe does, so verification runs for real. */
function postWebhook(payload: object, signature?: string) {
  const body = JSON.stringify(payload);
  const header =
    signature ??
    stripe.webhooks.generateTestHeaderString({ payload: body, secret: env.STRIPE_WEBHOOK_SECRET });

  // The body is sent as a string so the exact signed bytes reach the raw parser.
  return request(app)
    .post('/api/billing/webhook')
    .set('Stripe-Signature', header)
    .set('Content-Type', 'application/json')
    .send(body);
}

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDatabase();
  await seedDemoUser(STRIPE_CUSTOMER_ID);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('signature verification', () => {
  it('rejects a payload signed with the wrong secret and writes nothing', async () => {
    const body = JSON.stringify(subscriptionEvent('customer.subscription.created'));
    const forged = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: 'whsec_an_attackers_secret',
    });

    const response = await postWebhook(
      subscriptionEvent('customer.subscription.created'),
      forged,
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    expect(await prisma.subscription.count()).toBe(0);
    expect(await prisma.processedStripeEvent.count()).toBe(0);
  });

  it('rejects a request without the Stripe-Signature header', async () => {
    const response = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(subscriptionEvent('customer.subscription.created')));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    expect(await prisma.processedStripeEvent.count()).toBe(0);
  });

  it('rejects a body that was modified after signing', async () => {
    const original = JSON.stringify(subscriptionEvent('customer.subscription.created'));
    const header = stripe.webhooks.generateTestHeaderString({
      payload: original,
      secret: env.STRIPE_WEBHOOK_SECRET,
    });

    const response = await request(app)
      .post('/api/billing/webhook')
      .set('Stripe-Signature', header)
      .set('Content-Type', 'application/json')
      .send(original.replace('"status":"active"', '"status":"trialing"'));

    expect(response.status).toBe(400);
    expect(await prisma.subscription.count()).toBe(0);
  });
});

describe('subscription state', () => {
  it('creates the subscription with the fields Stripe reported', async () => {
    const response = await postWebhook(subscriptionEvent('customer.subscription.created'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true, outcome: 'processed' });

    const subscription = await prisma.subscription.findFirstOrThrow();
    expect(subscription).toMatchObject({
      stripeSubscriptionId: 'sub_test_123',
      stripeCustomerId: STRIPE_CUSTOMER_ID,
      stripePriceId: 'price_test_monthly',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
    expect(subscription.currentPeriodEnd?.getTime()).toBe(PERIOD_END * 1000);
  });

  it('updates an existing subscription rather than creating a second one', async () => {
    await postWebhook(subscriptionEvent('customer.subscription.created'));
    await postWebhook(
      subscriptionEvent('customer.subscription.updated', {
        id: 'evt_test_2',
        created: NEWER,
        status: 'past_due',
        cancelAtPeriodEnd: true,
      }),
    );

    const subscriptions = await prisma.subscription.findMany();
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]?.status).toBe('past_due');
    expect(subscriptions[0]?.cancelAtPeriodEnd).toBe(true);
  });

  it('makes nutrition available after activation and unavailable after deletion', async () => {
    getProduct.mockResolvedValue({
      code: '3017620422003',
      product_name: 'Nutella',
      nutriments: { fat_100g: 30.9 },
    });

    await postWebhook(subscriptionEvent('customer.subscription.created'));
    expect((await request(app).get('/api/products/3017620422003/nutrition')).status).toBe(200);

    await postWebhook(
      subscriptionEvent('customer.subscription.deleted', {
        id: 'evt_test_3',
        created: NEWER,
        status: 'canceled',
      }),
    );

    const response = await request(app).get('/api/products/3017620422003/nutrition');
    expect(response.status).toBe(402);
    expect(response.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
  });

  it('acknowledges events for a customer it does not know without failing', async () => {
    const response = await postWebhook(
      subscriptionEvent('customer.subscription.created', { customer: 'cus_someone_else' }),
    );

    expect(response.status).toBe(200);
    expect(response.body.outcome).toBe('unknown_customer');
    expect(await prisma.subscription.count()).toBe(0);
  });

  it('acknowledges event types it does not handle', async () => {
    const response = await postWebhook({
      id: 'evt_test_ignored',
      object: 'event',
      created: EVENT_CREATED,
      type: 'invoice.payment_succeeded',
      data: { object: { id: 'in_test_1', object: 'invoice' } },
    });

    expect(response.status).toBe(200);
    expect(response.body.outcome).toBe('ignored');
    expect(await prisma.subscription.count()).toBe(0);
  });

  it('links the Stripe customer to the user on checkout.session.completed', async () => {
    await prisma.user.updateMany({ data: { stripeCustomerId: null } });
    const user = await prisma.user.findFirstOrThrow();

    const response = await postWebhook({
      id: 'evt_test_checkout',
      object: 'event',
      created: EVENT_CREATED,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          object: 'checkout.session',
          customer: 'cus_from_checkout',
          client_reference_id: user.id,
          subscription: 'sub_test_123',
        },
      },
    });

    expect(response.status).toBe(200);
    const updated = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
    expect(updated.stripeCustomerId).toBe('cus_from_checkout');
  });
});

describe('idempotency', () => {
  it('applies a redelivered event only once', async () => {
    const event = subscriptionEvent('customer.subscription.created');

    const first = await postWebhook(event);
    const second = await postWebhook(event);

    expect(first.body.outcome).toBe('processed');
    expect(second.status).toBe(200);
    expect(second.body.outcome).toBe('duplicate');
    expect(await prisma.processedStripeEvent.count()).toBe(1);
    expect(await prisma.subscription.count()).toBe(1);
  });

  it('lets a real fault surface instead of reporting it as a duplicate', async () => {
    // Another user already owns sub_test_123, so writing the demo user's row
    // violates Subscription.stripeSubscriptionId rather than the event id.
    const other = await prisma.user.create({
      data: { email: 'other@example.test', name: 'Other', stripeCustomerId: 'cus_other' },
    });
    await prisma.subscription.create({
      data: {
        userId: other.id,
        stripeSubscriptionId: 'sub_test_123',
        stripeCustomerId: 'cus_other',
        stripePriceId: 'price_test_monthly',
        status: 'active',
      },
    });

    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await postWebhook(subscriptionEvent('customer.subscription.created'));
    logged.mockRestore();

    // A 500 is what makes Stripe retry; a 200 "duplicate" would drop the event.
    expect(response.status).toBe(500);
    expect(await prisma.processedStripeEvent.count()).toBe(0);
  });
});

describe('event ordering', () => {
  it('records the event timestamp on the first subscription event', async () => {
    await postWebhook(subscriptionEvent('customer.subscription.created'));

    const subscription = await prisma.subscription.findFirstOrThrow();
    expect(subscription.lastStripeEventCreated?.getTime()).toBe(EVENT_CREATED * 1000);
  });

  it('applies a newer event and moves the timestamp forward', async () => {
    await postWebhook(subscriptionEvent('customer.subscription.created'));
    const response = await postWebhook(
      subscriptionEvent('customer.subscription.deleted', {
        id: 'evt_newer',
        created: NEWER,
        status: 'canceled',
      }),
    );

    expect(response.body.outcome).toBe('processed');
    const subscription = await prisma.subscription.findFirstOrThrow();
    expect(subscription.status).toBe('canceled');
    expect(subscription.lastStripeEventCreated?.getTime()).toBe(NEWER * 1000);
  });

  it('ignores a distinct older event that arrives after a newer one', async () => {
    // Two different events, delivered in the wrong order: only the created
    // timestamps distinguish them, so duplicate suppression cannot help here.
    await postWebhook(
      subscriptionEvent('customer.subscription.deleted', {
        id: 'evt_newer',
        created: NEWER,
        status: 'canceled',
      }),
    );

    const response = await postWebhook(
      subscriptionEvent('customer.subscription.updated', {
        id: 'evt_older',
        created: OLDER,
        status: 'active',
      }),
    );

    expect(response.status).toBe(200);
    expect(response.body.outcome).toBe('stale');

    const subscription = await prisma.subscription.findFirstOrThrow();
    expect(subscription.status).toBe('canceled');
    expect(subscription.lastStripeEventCreated?.getTime()).toBe(NEWER * 1000);

    // The stale event is still recorded, so a retry of it is not reprocessed.
    expect(await prisma.processedStripeEvent.count()).toBe(2);
  });

  it('keeps a cancellation from being undone by an older reactivation', async () => {
    getProduct.mockResolvedValue({
      code: '3017620422003',
      product_name: 'Nutella',
      nutriments: { fat_100g: 30.9 },
    });

    await postWebhook(subscriptionEvent('customer.subscription.created'));
    await postWebhook(
      subscriptionEvent('customer.subscription.deleted', {
        id: 'evt_cancel',
        created: NEWER,
        status: 'canceled',
      }),
    );
    await postWebhook(
      subscriptionEvent('customer.subscription.updated', {
        id: 'evt_late_activation',
        created: OLDER,
        status: 'active',
      }),
    );

    const response = await request(app).get('/api/products/3017620422003/nutrition');
    expect(response.status).toBe(402);
  });

  it('applies an event that shares the stored timestamp', async () => {
    // created has one-second resolution, so consecutive events often collide.
    // Ties are applied rather than dropped; only strictly older is stale.
    await postWebhook(subscriptionEvent('customer.subscription.created'));
    const response = await postWebhook(
      subscriptionEvent('customer.subscription.updated', {
        id: 'evt_same_second',
        created: EVENT_CREATED,
        status: 'past_due',
      }),
    );

    expect(response.body.outcome).toBe('processed');
    const subscription = await prisma.subscription.findFirstOrThrow();
    expect(subscription.status).toBe('past_due');
  });
});
