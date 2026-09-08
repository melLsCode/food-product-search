import express, { Router } from 'express';
import { Prisma, type PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';

import { env } from '../env.js';
import { prisma } from '../prisma.js';
import { stripe } from '../stripe.js';

/** Transaction-scoped Prisma client, as handed to prisma.$transaction callbacks. */
type PrismaTransaction = Omit<PrismaClient, '$transaction' | '$connect' | '$disconnect' | '$on' | '$use' | '$extends'>;

export type WebhookOutcome = 'processed' | 'duplicate' | 'stale' | 'ignored' | 'unknown_customer';

function customerIdOf(customer: string | { id: string } | null): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

/**
 * Flattens a Stripe subscription into our columns.
 *
 * Note: since API version 2025-03-31 the billing period lives on the subscription
 * *item*, not on the subscription itself, which is why current_period_end is read
 * from the first item.
 */
function toSubscriptionRecord(subscription: Stripe.Subscription, eventCreatedAt: Date) {
  const item = subscription.items.data[0];

  return {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerIdOf(subscription.customer) ?? '',
    stripePriceId: item?.price.id ?? '',
    status: subscription.status,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    lastStripeEventCreated: eventCreatedAt,
  };
}

/**
 * Applies a subscription event. The user is found by Stripe customer id, which we
 * store when the Checkout Session is created, so events are matched to our user
 * regardless of the order they arrive in.
 *
 * Ordering: Stripe does not guarantee delivery order, so the state written last
 * is not necessarily the newest. Each row therefore remembers the `created` of
 * the event it came from, and an event older than that is discarded as stale.
 * Equal timestamps are applied, because Stripe's `created` has one-second
 * resolution and genuinely consecutive events (created then updated during
 * checkout) routinely share a second; discarding those would drop real
 * transitions far more often than it would prevent a same-second reordering.
 */
async function applySubscriptionEvent(
  tx: PrismaTransaction,
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
): Promise<WebhookOutcome> {
  const record = toSubscriptionRecord(subscription, eventCreatedAt);
  const user = await tx.user.findUnique({
    where: { stripeCustomerId: record.stripeCustomerId },
  });

  if (!user) return 'unknown_customer';

  const existing = await tx.subscription.findUnique({
    where: { userId: user.id },
    select: { lastStripeEventCreated: true },
  });

  if (!existing) {
    await tx.subscription.create({ data: { userId: user.id, ...record } });
    return 'processed';
  }

  const applied = existing.lastStripeEventCreated;
  if (applied !== null && applied.getTime() > eventCreatedAt.getTime()) {
    return 'stale';
  }

  await tx.subscription.update({ where: { userId: user.id }, data: record });

  return 'processed';
}

/**
 * Links the Stripe customer to our user. The subscription state itself is written
 * by the customer.subscription.* events, so this handler stays a pure linking
 * step and there is only ever one writer of subscription columns.
 */
async function applyCheckoutCompleted(
  tx: PrismaTransaction,
  session: Stripe.Checkout.Session,
): Promise<WebhookOutcome> {
  const customerId = customerIdOf(session.customer);
  const userId = session.client_reference_id;

  if (!customerId || !userId) return 'ignored';

  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) return 'unknown_customer';

  if (user.stripeCustomerId !== customerId) {
    await tx.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  return 'processed';
}

/**
 * Records the event id, returning false if it was already recorded.
 *
 * The try/catch is deliberately wrapped around this single statement: the only
 * unique constraint it can violate is ProcessedStripeEvent's primary key, so a
 * P2002 here always means "already delivered" without having to inspect the
 * error's target. A unique violation from any later statement is a real fault
 * and stays unhandled, which is what makes Stripe retry.
 */
async function claimEvent(tx: PrismaTransaction, event: Stripe.Event): Promise<boolean> {
  try {
    await tx.processedStripeEvent.create({
      data: { eventId: event.id, type: event.type },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return false;
    }
    throw error;
  }
}

/**
 * Handles one verified event.
 *
 * Idempotency: the event id is claimed as the first statement of the
 * transaction, so the effect is applied exactly once no matter how often Stripe
 * retries. That is deduplication only; ordering between distinct events is
 * handled separately in applySubscriptionEvent.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  // Stripe reports event.created in Unix seconds.
  const eventCreatedAt = new Date(event.created * 1000);

  return prisma.$transaction(async (tx) => {
    if (!(await claimEvent(tx, event))) return 'duplicate';

    switch (event.type) {
      case 'checkout.session.completed':
        return applyCheckoutCompleted(tx, event.data.object);

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return applySubscriptionEvent(tx, event.data.object, eventCreatedAt);

      default:
        // Stripe sends more event types than we subscribe to; acknowledge them.
        return 'ignored';
    }
  });
}

export const webhookRouter = Router();

/**
 * Stripe signature verification runs against the exact bytes Stripe signed, so
 * this route uses a raw body parser and is mounted before express.json() in
 * app.ts. Parsing to JSON first and re-serialising would break verification.
 */
webhookRouter.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (typeof signature !== 'string') {
    res.status(400).json({
      error: { code: 'INVALID_SIGNATURE', message: 'Missing Stripe-Signature header' },
    });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    // Deliberately vague: an unverified payload is never described back to the caller.
    res.status(400).json({
      error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' },
    });
    return;
  }

  // A thrown error here becomes a 500, which is what makes Stripe retry delivery.
  const outcome = await handleStripeEvent(event);

  res.json({ received: true, outcome });
});
