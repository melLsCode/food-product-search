/**
 * One-off setup script: creates the subscription product and its monthly price
 * in Stripe, and prints the price id to put in STRIPE_PRICE_ID.
 *
 * This exists because the Stripe dashboard does not expose product creation in
 * every sandbox's navigation. It is a developer tool, not part of the API: the
 * application never creates products, it only reads STRIPE_PRICE_ID.
 *
 * Run from apps/api:
 *   npx tsx --env-file=.env scripts/create-stripe-price.ts
 */
import { env } from '../src/env.js';
import { stripe } from '../src/stripe.js';

const PRODUCT_NAME = 'Food Product Search Premium';
const CURRENCY = 'usd';
const UNIT_AMOUNT = 500; // $5.00, in cents.
const INTERVAL = 'month' as const;

async function main(): Promise<void> {
  // Refuse to touch a live account. The key itself is never read beyond this
  // prefix check and is never logged.
  if (!env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('STRIPE_SECRET_KEY is not a test-mode key. Refusing to create live objects.');
  }

  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Unlocks nutrition details for every product.',
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: CURRENCY,
    unit_amount: UNIT_AMOUNT,
    recurring: { interval: INTERVAL },
  });

  console.log(`Product:  ${product.id}  (${product.name})`);
  console.log(`Price:    ${price.id}  ($${(UNIT_AMOUNT / 100).toFixed(2)} ${CURRENCY.toUpperCase()}/${INTERVAL})`);
  console.log(`Livemode: ${price.livemode}`);
  console.log(`\nSet this in apps/api/.env:\n  STRIPE_PRICE_ID=${price.id}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
