import { PrismaClient } from '@prisma/client';

/**
 * A single PrismaClient for the whole process. `tsx watch` re-imports modules on
 * every change, so the instance is cached on globalThis to avoid opening a new
 * connection pool per reload.
 */
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
