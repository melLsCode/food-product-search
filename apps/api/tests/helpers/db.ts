import type { User } from '@prisma/client';

import { prisma } from '../../src/prisma.js';

export const DEMO_EMAIL = 'demo@food-product-search.local';
export const STRIPE_CUSTOMER_ID = 'cus_test_demo';

/** Empties every table so each test starts from a known state. */
export async function resetDatabase(): Promise<void> {
  await prisma.recentSearch.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.processedStripeEvent.deleteMany();
  await prisma.user.deleteMany();
}

/** Creates the demo user the API resolves from DEMO_USER_EMAIL. */
export async function seedDemoUser(stripeCustomerId: string | null = null): Promise<User> {
  return prisma.user.create({
    data: { email: DEMO_EMAIL, name: 'Demo User', stripeCustomerId },
  });
}

export async function giveSubscription(userId: string, status: string): Promise<void> {
  await prisma.subscription.create({
    data: {
      userId,
      stripeSubscriptionId: `sub_test_${status}`,
      stripeCustomerId: STRIPE_CUSTOMER_ID,
      stripePriceId: 'price_test_monthly',
      status,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });
}
