import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Tests get their own environment values so they never depend on a developer's
    // local .env. Integration tests use the separate food_search_test database,
    // created by docker/mysql-init when the container first starts.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'mysql://app:apppassword@localhost:3306/food_search_test',
      WEB_ORIGIN: 'http://localhost:3000',
    },
  },
});
