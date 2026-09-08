import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

import { TEST_DATABASE_URL } from './testDatabaseUrl.js';

/**
 * Applies the committed migrations to the test database once per run, so a fresh
 * checkout can run `npm test` without any manual database preparation.
 *
 * The Prisma CLI is run through its JavaScript entry point rather than the `npx`
 * wrapper: on Windows the wrapper is a .cmd file, which Node refuses to spawn
 * without a shell.
 */
export default function setup() {
  const prismaCli = createRequire(import.meta.url).resolve('prisma/build/index.js');

  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
