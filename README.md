# Food Product Search

Search packaged food products from [Open Food Facts](https://openfoodfacts.org).
Basic product information is public; detailed nutrition data is protected by an
active Stripe subscription that is enforced in the backend.

## Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Local development](#local-development)
- [Tests](#tests)
- [Build](#build)
- [API overview](#api-overview)
- [Stripe test-mode setup](#stripe-test-mode-setup)
- [Internationalization](#internationalization)
- [Subscription authorization](#subscription-authorization)
- [Design decisions](#design-decisions)
- [Known limitations](#known-limitations)
- [Deployment notes](#deployment-notes)

## Architecture

```
Browser / Next.js  ->  Express API  ->  Prisma / MySQL
                            |
                            +-------->  Open Food Facts
                            +-------->  Stripe
```

Express is the trust boundary. It is the only process that holds secrets and the
only one that talks to Open Food Facts or Stripe. The browser never calls either
directly, and subscription state is never taken from the client.

| Layer    | Choice                                                |
| -------- | ----------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind 4 |
| Backend  | Express 5, TypeScript, Zod, Prisma 6                   |
| Database | MySQL 8 (Docker)                                       |
| Payments | Stripe hosted Checkout + webhooks (test mode)          |
| Tests    | Vitest + Supertest                                     |

```
apps/api/src
  app.ts               Express wiring (middleware order matters, see webhooks)
  env.ts               Zod-validated environment, parsed once at startup
  errors.ts            AppError hierarchy with stable error codes
  middleware.ts        404 + centralized error handler
  validation.ts        Zod schemas and the parse helper used by routes
  demoUser.ts          Resolves the single demo user server-side
  subscription.ts      isActiveStatus and the entitlement guard
  stripe.ts            Stripe client
  prisma.ts            Prisma client singleton
  openfoodfacts/
    client.ts          HTTP adapter: URLs, headers, timeouts, status codes
    mapper.ts          Pure mapping of provider payloads (no I/O)
  features/
    products.ts        search, detail, nutrition routes
    searches.ts        recent searches (record + list)
    billing.ts         Checkout session, subscription status
    webhooks.ts        Stripe webhook: verify, idempotency, state
```

## Prerequisites

- Node.js 20.11 or newer
- Docker Desktop (for MySQL)
- A Stripe account in test mode
- The [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhooks

## Installation

```bash
npm install

cp .env.example .env                       # MySQL container credentials
cp apps/api/.env.example apps/api/.env     # API configuration
cp apps/web/.env.example apps/web/.env.local
```

Then fill in the values described below.

## Environment variables

### Root `.env` (used by `docker-compose.yml`)

| Variable              | Description                                  |
| --------------------- | -------------------------------------------- |
| `MYSQL_ROOT_PASSWORD` | Root password for the MySQL container         |
| `MYSQL_PASSWORD`      | Password for the `app` user                   |
| `MYSQL_PORT`          | Host port to expose MySQL on (default `3306`) |

### `apps/api/.env`

| Variable                | Required | Description                                                        |
| ----------------------- | -------- | ------------------------------------------------------------------ |
| `NODE_ENV`              | no       | `development`, `test` or `production`                               |
| `PORT`                  | no       | API port, default `4000`                                            |
| `DATABASE_URL`          | **yes**  | MySQL connection string for `food_search`                           |
| `TEST_DATABASE_URL`     | no       | Connection string for `food_search_test`, used by the test suite     |
| `WEB_ORIGIN`            | no       | Allowed CORS origin and base for Stripe return URLs                 |
| `DEMO_USER_EMAIL`       | no       | Must match the seeded user                                          |
| `OFF_USER_AGENT`        | no       | Identifying User-Agent required by Open Food Facts                  |
| `OFF_TIMEOUT_MS`        | no       | Request timeout for Open Food Facts, default `5000`                 |
| `STRIPE_SECRET_KEY`     | **yes**  | Stripe test secret key (`sk_test_...`)                              |
| `STRIPE_PRICE_ID`       | **yes**  | Id of the monthly recurring price (`price_...`)                     |
| `STRIPE_WEBHOOK_SECRET` | **yes**  | Signing secret (`whsec_...`) from `stripe listen` or the dashboard  |

All of these are validated by Zod in `apps/api/src/env.ts`. A missing or
malformed value stops the process at startup with an explicit message instead of
failing later at runtime. Nothing else in the codebase reads `process.env`.

### `apps/web/.env.local`

| Variable              | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `API_INTERNAL_URL`    | API base URL used by Server Components                |
| `NEXT_PUBLIC_API_URL` | API base URL used by the browser (checkout, status)   |

No secret belongs in the web app. It holds no Stripe key at all, because
subscribing is a redirect to Stripe's hosted Checkout page.

## Database

```bash
npm run db:up        # start MySQL 8 in Docker
npm run db:deploy    # apply migrations
npm run db:seed      # create the demo user
```

`docker-compose.yml` creates `food_search`; `docker/mysql-init` creates
`food_search_test` the first time the volume is initialized, so both databases
live in one container and tests never touch development data.

Other commands: `npm run db:down`, `npm run db:reset` (deletes the volume),
`npm run db:studio`, and `npm run db:migrate` to create a new migration during
development.

Models: `User` (one demo user), `Subscription` (local read model of Stripe
state), `RecentSearch` (unique on `userId, term, language`), and
`ProcessedStripeEvent` (webhook idempotency).

## Local development

```bash
npm run dev                       # API on :4000 and web on :3000
stripe listen --forward-to localhost:4000/api/billing/webhook
```

Check the API with `curl http://localhost:4000/health`.

## Tests

```bash
npm test
```

Vitest applies the migrations to `food_search_test` automatically before the run,
so MySQL is the only prerequisite. Open Food Facts is mocked at the adapter
boundary and Stripe webhook payloads are signed locally with
`stripe.webhooks.generateTestHeaderString`, so **no test touches the network**.

Coverage focuses on business rules and boundaries rather than line count:
provider mapping and incomplete data, request validation, search and detail
behaviour, recent-search persistence and de-duplication, webhook signature
verification, webhook idempotency, webhook event ordering (a distinct older event
must not overwrite newer state), subscription state transitions, and nutrition
authorization including the absence of nutrition in public responses.

## Build

```bash
npm run typecheck
npm run build
```

## API overview

| Method | Endpoint                            | Description                                            |
| ------ | ----------------------------------- | ------------------------------------------------------ |
| GET    | `/health`                           | Liveness plus a database check                          |
| GET    | `/api/products/search`              | `?q=` (2–100 chars), `?language=en\|nl\|de\|fr`         |
| GET    | `/api/products/:code`               | Public product detail, no nutrition values              |
| GET    | `/api/products/:code/nutrition`     | Nutrition. **402** without an active subscription       |
| GET    | `/api/searches/recent`              | Latest searches for the demo user, `?limit=` up to 50   |
| POST   | `/api/billing/checkout`             | Creates a Checkout Session, returns `{ url }`           |
| GET    | `/api/billing/status`               | Subscription state as stored locally                    |
| POST   | `/api/billing/webhook`              | Stripe webhook (raw body, signature verified)           |

Errors always use the same envelope with a stable code:

```json
{ "error": { "code": "UPSTREAM_ERROR", "message": "..." } }
```

Codes: `VALIDATION_ERROR` (400), `SUBSCRIPTION_REQUIRED` (402), `NOT_FOUND` (404),
`CONFLICT` (409), `INVALID_SIGNATURE` (400, webhook only), `UPSTREAM_ERROR` (502),
`BILLING_UNAVAILABLE` (502, Stripe Customer Portal URL missing), `INTERNAL_ERROR`
(500). The frontend maps codes to translated messages, so the API never returns
user-facing prose.

## Stripe test-mode setup

1. Copy your test secret key into `STRIPE_SECRET_KEY`.
2. Create the subscription product and its **monthly recurring** price. Some
   sandboxes do not expose product creation in the dashboard navigation, so the
   repository ships a one-off script that does it through the API:

   ```bash
   cd apps/api
   npx tsx --env-file=.env scripts/create-stripe-price.ts
   ```

   It creates a $5/month recurring price in your sandbox using the
   `STRIPE_SECRET_KEY` you just set, refuses to run against a live key, and
   prints the resulting `price_...` id. Copy that id into `STRIPE_PRICE_ID`.
   Running it again creates another product, so run it once.
3. Run `stripe listen --forward-to localhost:4000/api/billing/webhook` and copy
   the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`, then restart the API.
4. Click Subscribe in the UI and pay with card `4242 4242 4242 4242`, any future
   expiry and any CVC.

The webhook is the **only** writer of subscription state, so nutrition unlocks
once `customer.subscription.created` has been received. If you subscribe without
a listener running, replay the event from the dashboard: the handler is
idempotent, so replaying is safe.

To cancel, use **Manage subscription** in the app. That opens Stripe's Customer
Portal for the existing customer; this project never cancels the subscription
itself. After you cancel in the portal, Stripe sends `customer.subscription.updated`
or `.deleted`, and the existing webhook updates local state so nutrition locks
again.

The Customer Portal must be turned on in the Stripe Dashboard (test mode):
**Settings → Billing → Customer portal**. Enable subscription cancellation
there. No extra environment variable is required.

Events handled: `checkout.session.completed` (links the Stripe customer to the
user), and `customer.subscription.created` / `.updated` / `.deleted` (write
status, price, period end and cancellation flag). Anything else is acknowledged
with 200 and ignored.

Stripe does not guarantee delivery order, so each subscription row stores the
`created` timestamp of the event it was written from. An arriving event older
than that timestamp is discarded, which stops a delayed `updated` event from
reactivating a subscription that has since been cancelled. Deduplication by
event id is kept separate, in `ProcessedStripeEvent`.

## Internationalization

English, Dutch, German and French, selected manually and never guessed.

- The language is a URL search parameter (`?language=nl`). Every page is a Server
  Component that already reads the URL, so switching language is a navigation and
  the result is shareable and correct with the back button.
- UI strings live in `apps/web/src/lib/i18n.ts` as four dictionaries. TypeScript
  requires the Dutch, German and French dictionaries to define exactly the same
  keys as English, so a missing translation is a build error.
- The selected language is forwarded to the backend, which passes it to Open Food
  Facts (`langs` when searching, `lc` and per-language fields when reading a
  product).
- Product text falls back in a fixed order: requested language, the provider's
  generic field, then the other supported languages. The UI labels the result
  when a fallback was used.
- Product text is **not** machine-translated. Ingredient and allergen wording is
  safety-relevant, and inventing a translation would be worse than showing the
  original language.

## Subscription authorization

Nutrition has its own endpoint, `GET /api/products/:code/nutrition`, guarded by
`assertActiveSubscription`. Without an active subscription it returns 402 and no
data, and the provider is not even contacted.

The rule itself lives in one function:

```ts
// apps/api/src/subscription.ts
const ACTIVE_STATUSES = new Set(['active', 'trialing']);
export function isActiveStatus(status: string | null | undefined): boolean;
```

Defence in depth:

- The public detail response has no nutrition fields at all. The mapper builds
  every DTO field by field and never spreads the raw provider payload, so
  `nutriments` cannot leak through a public endpoint. A test asserts this.
- Entitlement is read from the database on every request and never cached, so a
  `customer.subscription.deleted` webhook revokes access on the very next call.
- The frontend's locked panel is presentation only. It has nothing to reveal,
  because the server never sent any values.

## Design decisions

**Search-a-licious for search, the product API for detail.** Open Food Facts has
no full-text search in API v2 or v3 — only the deprecated `cgi/search.pl` or
Search-a-licious, which is the officially recommended path. Using one provider
keeps a single response shape and a single mapper. The trade-off is that
Search-a-licious is beta and its ranking can be loose.

**A pure mapper, isolated from routes.** All provider parsing is in
`openfoodfacts/mapper.ts` and works on `unknown`. Open Food Facts is
crowd-sourced, so fields are routinely missing, empty, or a different type than
documented. Keeping this pure makes the awkward cases cheap to test, and products
that cannot be represented safely (no barcode, no name in any language) are
skipped rather than rendered blank.

**No client-side state management.** The query and language live in the URL and
pages are Server Components. That removes React Query, a store, and a whole class
of synchronization bugs. Search runs on explicit submit with no debounce, which
also respects Open Food Facts' documented rate limits.

**Webhooks are the only writer of subscription state.** There is deliberately no
manual sync endpoint: a second write path would make it ambiguous which source is
authoritative. `GET /api/billing/status` reads local state only.

**Subscription status stored as a string, not an enum.** Stripe can add status
values; a MySQL enum would turn that into a failed write plus a migration. One
tested helper decides what counts as active.

**Duplicated DTO types instead of a shared package.** About fifty lines of
interfaces are declared in both apps. A shared workspace package would add build
ordering and project references to a two-app repository for very little gain.

**No i18n framework.** With four languages, no pluralization and the language
already in the URL, two dictionaries-and-a-function is smaller than the
configuration a framework would need.

## Known limitations

- One hard-coded demo user and no authentication. Anyone who can reach the API
  acts as that user. Production would need real auth and per-user entitlement.
- Stripe test mode only. There is no in-app upgrade UI and no custom cancel
  API: cancellation goes through Stripe's Customer Portal and back via webhook.
- Local webhooks require the Stripe CLI or a tunnel. A missed event has to be
  replayed from the dashboard (safe, since the handler is idempotent).
- Webhook ordering is resolved at one-second resolution, because that is what
  Stripe's `event.created` provides. Two events emitted in the same second are
  applied in arrival order.
- No caching, so every search and product view hits Open Food Facts, and its rate
  limits (10 search requests/minute/IP) apply.
- Open Food Facts data is frequently incomplete. "Not available" is a normal
  outcome, and a product may have no nutrition data at all.
- Search relevance comes from Search-a-licious (beta) and can be surprising for
  non-English terms.
- Backend messages are English developer-facing strings; the UI translates by
  error code rather than displaying them.
- No end-to-end browser tests, and only backend automated tests.
- Pagination is not implemented: the first 24 results are shown.

## Deployment notes

- Run `npm run build` and start the API with `npm start -w apps/api`, which reads
  configuration from real environment variables rather than a `.env` file.
- Apply migrations with `npm run db:deploy` (never `migrate dev`, which needs
  shadow-database permissions) and seed the demo user once.
- Set `WEB_ORIGIN` to the deployed frontend origin so CORS and the Stripe return
  URLs are correct.
- Register the webhook endpoint in the Stripe dashboard against the deployed
  `/api/billing/webhook` URL and use that endpoint's signing secret.
- Terminate TLS in front of both apps, and keep the MySQL user least-privileged
  rather than root.
