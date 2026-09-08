import { z } from 'zod';

/**
 * Every environment variable the API reads is declared here and validated once,
 * at startup. Nothing else in the codebase touches process.env, so a missing or
 * malformed value fails immediately and visibly instead of surfacing later as a
 * confusing runtime error.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  /** Origin allowed by CORS, and the base for Stripe's return URLs. */
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),

  /** The application has a single demo user, created by prisma/seed.ts. */
  DEMO_USER_EMAIL: z.string().email().default('demo@food-product-search.local'),

  /** Open Food Facts requires an identifying User-Agent: AppName/Version (contact). */
  OFF_USER_AGENT: z
    .string()
    .min(1)
    .default('food-product-search/0.1 (assessment project)'),
  OFF_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_PRICE_ID: z.string().min(1, 'STRIPE_PRICE_ID is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nSee apps/api/.env.example for the expected variables.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();

export type Env = typeof env;
