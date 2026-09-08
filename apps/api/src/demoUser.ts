import type { User } from '@prisma/client';

import { env } from './env.js';
import { prisma } from './prisma.js';

/**
 * The application has exactly one user. Resolving it server-side from
 * configuration - rather than accepting an id from the request - is what stops a
 * client from acting as someone else, and it keeps every route free of
 * user-identity handling.
 */
export async function getDemoUser(): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { email: env.DEMO_USER_EMAIL },
  });

  if (!user) {
    throw new Error(
      `Demo user ${env.DEMO_USER_EMAIL} is missing. Run "npm run db:seed" to create it.`,
    );
  }

  return user;
}
