import { defineConfig } from 'vitest/config';

import { TEST_DATABASE_URL } from './tests/helpers/testDatabaseUrl.js';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/helpers/globalSetup.ts'],
    // Integration tests share one database, so they must not run concurrently.
    fileParallelism: false,
    // Tests get their own environment values so they never depend on a developer's
    // local .env, and no test can reach real Stripe or Open Food Facts.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      WEB_ORIGIN: 'http://localhost:3000',
      DEMO_USER_EMAIL: 'demo@food-product-search.local',
      OFF_USER_AGENT: 'food-product-search/test',
      OFF_TIMEOUT_MS: '5000',
      STRIPE_SECRET_KEY: 'sk_test_dummy_key_for_tests',
      STRIPE_PRICE_ID: 'price_dummy_for_tests',
      STRIPE_WEBHOOK_SECRET: 'whsec_dummy_secret_for_tests',
    },
  },
});
