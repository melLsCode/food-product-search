# Food Product Search

Search packaged food products from Open Food Facts. Basic product information is
public; detailed nutrition data requires an active Stripe subscription.

> Status: **project foundation only**. Product search, Open Food Facts
> integration, internationalization, Stripe subscriptions and webhooks are not
> implemented yet.

## Stack

| Layer    | Choice                                          |
| -------- | ----------------------------------------------- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend  | Express 5, TypeScript, Prisma                   |
| Database | MySQL 8 (Docker)                                |
| Tests    | Vitest + Supertest                              |

The browser talks only to Next.js and the Express API. Express is the only
process that holds secrets and the only one that will talk to Open Food Facts and
Stripe.

## Prerequisites

- Node.js 20.11 or newer
- Docker Desktop (for MySQL)

## Setup

```bash
# 1. Install dependencies for both workspaces
npm install

# 2. Create the environment files and fill in the placeholders
cp .env.example .env                      # MySQL container credentials
cp apps/api/.env.example apps/api/.env    # API configuration
cp apps/web/.env.example apps/web/.env.local

# 3. Start MySQL. This creates both food_search and food_search_test.
npm run db:up

# 4. Apply the migration and seed the demo user
npm run db:deploy
npm run db:seed

# 5. Run both applications (API on :4000, web on :3000)
npm run dev
```

Check the API with `curl http://localhost:4000/health`, which returns
`{"status":"ok","database":"up"}` when MySQL is reachable.

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Run API and web together                           |
| `npm run build`     | Build both applications                            |
| `npm run typecheck` | Typecheck both applications                        |
| `npm test`          | Run the backend test suite                         |
| `npm run db:up`     | Start the MySQL container                          |
| `npm run db:down`   | Stop the MySQL container                           |
| `npm run db:reset`  | Delete the MySQL volume and start fresh            |
| `npm run db:migrate`| Create a new migration during development          |
| `npm run db:deploy` | Apply existing migrations (setup and CI)           |
| `npm run db:seed`   | Create the demo user                               |

## Databases

Both databases live in the same container. `food_search` is created by
`MYSQL_DATABASE` in `docker-compose.yml`; `food_search_test` is created by
`docker/mysql-init/01-create-test-database.sql`, which MySQL runs once when the
data volume is empty. Tests use `food_search_test` so they never touch
development data.

## Environment variables

Secrets live only in `.env` files, which are gitignored. `apps/api/src/env.ts`
validates them with Zod at startup, so the API refuses to boot with a missing or
malformed value rather than failing later at runtime. Nothing else in the
codebase reads `process.env`.

See `.env.example`, `apps/api/.env.example` and `apps/web/.env.example`.
