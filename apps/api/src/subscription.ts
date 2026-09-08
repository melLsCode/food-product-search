import { SubscriptionRequiredError } from './errors.js';
import { prisma } from './prisma.js';

/**
 * Stripe subscription statuses that grant access. `trialing` is included because
 * a trial is a paid-for state from the customer's point of view.
 *
 * Every entitlement question in the application goes through isActiveStatus, so
 * the rule exists in exactly one place and cannot drift between call sites.
 */
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

export function isActiveStatus(status: string | null | undefined): boolean {
  return status !== null && status !== undefined && ACTIVE_STATUSES.has(status);
}

export interface SubscriptionState {
  active: boolean;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/** Reads entitlement from the database, which the Stripe webhook is the only writer of. */
export async function getSubscriptionState(userId: string): Promise<SubscriptionState> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  return {
    active: isActiveStatus(subscription?.status),
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
  };
}

/**
 * Guard for subscription-protected data. Deliberately re-read per request and
 * never cached, so a `customer.subscription.deleted` webhook revokes access on
 * the very next call.
 */
export async function assertActiveSubscription(userId: string): Promise<void> {
  const { active } = await getSubscriptionState(userId);

  if (!active) {
    throw new SubscriptionRequiredError();
  }
}
