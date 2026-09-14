import { Router } from 'express';
import { z } from 'zod';

import { getDemoUser } from '../demoUser.js';
import { env } from '../env.js';
import { BillingUnavailableError, ConflictError, SubscriptionRequiredError, UpstreamError } from '../errors.js';
import { prisma } from '../prisma.js';
import { stripe } from '../stripe.js';
import { getSubscriptionState } from '../subscription.js';
import { languageSchema, parseInput } from '../validation.js';

export const billingRouter = Router();

const checkoutBodySchema = z.object({ language: languageSchema });

/**
 * Returns the demo user's Stripe customer id, creating the customer on first use.
 * Creating it here rather than at seed time keeps the seed offline, and gives the
 * webhook a reliable customer -> user mapping before any event can arrive.
 */
async function getOrCreateCustomerId(userId: string, email: string, name: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/** Creates a Stripe-hosted Checkout Session for the monthly subscription price. */
billingRouter.post('/checkout', async (req, res) => {
  const { language } = parseInput(checkoutBodySchema, req.body ?? {});
  const user = await getDemoUser();

  // Subscribing twice would create a second subscription and charge twice.
  const state = await getSubscriptionState(user.id);
  if (state.active) {
    throw new ConflictError('This user already has an active subscription');
  }

  const customerId = await getOrCreateCustomerId(user.id, user.email, user.name);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${env.WEB_ORIGIN}/billing/success?language=${language}`,
    cancel_url: `${env.WEB_ORIGIN}/billing/cancel?language=${language}`,
  });

  if (!session.url) {
    throw new UpstreamError('Stripe did not return a checkout URL');
  }

  res.status(201).json({ url: session.url });
});

/**
 * Opens Stripe's hosted Customer Portal so the demo user can cancel (or
 * otherwise manage) the subscription. Local entitlement still changes only when
 * the resulting customer.subscription.* webhook arrives.
 */
billingRouter.post('/portal', async (req, res) => {
  const { language } = parseInput(checkoutBodySchema, req.body ?? {});
  const user = await getDemoUser();

  if (!user.stripeCustomerId) {
    throw new SubscriptionRequiredError();
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${env.WEB_ORIGIN}/billing/success?language=${language}`,
  });

  if (!session.url) {
    throw new BillingUnavailableError('Stripe did not return a billing portal URL');
  }

  res.status(201).json({ url: session.url });
});

/**
 * Entitlement as stored in our database. Stripe webhooks are the only writer, so
 * this is a read of local state and never calls Stripe.
 */
billingRouter.get('/status', async (_req, res) => {
  const user = await getDemoUser();
  const state = await getSubscriptionState(user.id);

  res.json({ subscription: state });
});
