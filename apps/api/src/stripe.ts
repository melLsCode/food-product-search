import Stripe from 'stripe';

import { env } from './env.js';

/**
 * Single Stripe client for the process. The secret key only ever exists here and
 * in the environment; it is never sent to the browser, which uses Stripe's hosted
 * Checkout page via a redirect URL instead.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
