import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './env.js';
import { errorHandler, notFound } from './middleware.js';
import { prisma } from './prisma.js';

/**
 * Builds the Express application. This is a function rather than a module-level
 * app so tests can create an instance with Supertest using the exact same wiring
 * as production.
 *
 * Note on middleware order: the Stripe webhook route will be mounted here with a
 * raw body parser *before* express.json(), because signature verification needs
 * the unparsed request body.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
