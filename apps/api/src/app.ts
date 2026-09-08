import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './env.js';
import { billingRouter } from './features/billing.js';
import { productsRouter } from './features/products.js';
import { searchesRouter } from './features/searches.js';
import { webhookRouter } from './features/webhooks.js';
import { errorHandler, notFound } from './middleware.js';
import { prisma } from './prisma.js';

/**
 * Builds the Express application. This is a function rather than a module-level
 * app so tests can create an instance with Supertest using the exact same wiring
 * as production.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN }));

  // The Stripe webhook must see the raw request body to verify its signature, so
  // it is mounted before the JSON parser. Order matters here - moving this below
  // express.json() would silently break signature verification.
  app.use('/api/billing/webhook', webhookRouter);

  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  app.use('/api/products', productsRouter);
  app.use('/api/searches', searchesRouter);
  app.use('/api/billing', billingRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
