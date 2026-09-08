/**
 * Single source for the test database URL. Imported by both vitest.config.ts and
 * the global setup, which run in different processes and would otherwise have to
 * duplicate the fallback.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'mysql://app:apppassword@localhost:3306/food_search_test';
