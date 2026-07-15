# Zeroplus Backend

REST API for the Zeroplus store (baby products, Kothamangalam). Node + Express 5 + TypeScript + Prisma + PostgreSQL. Built against the API contract in [`../docs/plan.md`](../docs/plan.md) Section 6 — the frontend in `../frontend` consumes these endpoints directly (flip `NEXT_PUBLIC_USE_MOCKS=false` there).

## Stack

Express 5 · TypeScript (ESM) · Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) · PostgreSQL (Neon in prod) · JWT auth · Zod validation · PhonePe payments · WhatsApp OTP (Meta Cloud API) · Cloudinary uploads · Resend email.

## Quick start

```bash
nvm use                 # Node 24 (see ../.nvmrc)
npm install
cp .env.example .env     # fill in DATABASE_URL at minimum
npx prisma migrate dev   # create tables
npm run generate         # generate the Prisma client (see note below)
npm run seed             # admin + demo catalog mirroring the frontend mocks
npm run dev              # http://localhost:4000  (health: /v1/health)
```

Default admin from the seed: `admin@zeroplus.local` / `admin12345` (override via `SEED_ADMIN_*` in `.env`).

> **Prisma 7 note:** after every `prisma migrate`, run `npm run generate`. Prisma 7 with a custom client output path does not always regenerate automatically. The prod build command runs it explicitly.

## Provider modes (works with zero third-party credentials)

Every external integration degrades gracefully when its keys are blank, so the whole app runs and is testable offline:

| Integration | Without credentials |
|---|---|
| PhonePe | Checkout returns a mock hosted-page URL (`/v1/payments/mock-pay/:mtid`) that marks the order paid |
| WhatsApp OTP | `OTP_PROVIDER=console` prints the code to the server log |
| Cloudinary | Upload returns a `placehold.co` URL |
| Resend | Emails are logged to the console |

Fill in real keys in `.env` to switch each to live mode. See `.env.example` for every variable.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Hot-reloading dev server (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run (what Railway runs) |
| `npm run seed` | Admin + full demo catalog |
| `npm run seed:admin` | Admin account only (for production) |
| `npm test` | Vitest + Supertest integration tests (needs the `zeroplus_test` DB) |
| `npm run migrate` / `migrate:deploy` | Prisma migrations (dev / prod) |

## Architecture

```
src/
  index.ts        entry — starts the server
  app.ts          builds the Express app (importable by tests, no listen)
  config.ts       reads + validates env once; exposes typed `config`
  routes/         one router per resource; index.ts mounts all under /v1
  services/       business logic + Prisma (no req/res here)
  middleware/     auth, validate, errorHandler, guestCart
  lib/            prisma client, jwt, mailer, phonepe, whatsapp, cloudinary, errors
  generated/      Prisma client (git-ignored)
```

Request flow: **route → validate (Zod) → controller → service → Prisma**. Services `throw new ApiError(status, code, message)`; one error handler converts it to the `{ success:false, error:{ code, message } }` envelope. Success responses use `ok(res, data, pagination?)`.

## Key design decisions

- **Response envelope** (plan 6.1): `{ success, data, pagination? }` / `{ success, error:{ code, message } }`, camelCase throughout, matching `../frontend/lib/types.ts` field-for-field.
- **Race-safe checkout**: stock is decremented with a conditional `updateMany({ where:{ stockQty:{ gte } } })` inside a transaction — two concurrent last-item orders cannot both succeed (test: `checkout.test.ts`).
- **Snapshots**: order items copy product/variant name + price; kit lines snapshot the chosen selections. Catalog edits never rewrite order history.
- **Guest support**: guest carts keyed by an httpOnly `guestId` cookie; guest orders get a `guestAccessToken` for email tracking (`GET /v1/orders/:id?token=`).
- **Auth**: bcrypt passwords; JWT access token (15m) in `Authorization: Bearer`; refresh token in an httpOnly cookie, rotated on each refresh; Google sign-in via ID-token verification.
- **OTP**: 6-digit code, stored hashed, 5-min expiry, attempt-locked, single-use. Required for COD checkout only; prepaid skips it.
- **PhonePe**: hand-rolled checksum (no Node SDK); the authoritative PAID/FAILED update comes from the idempotent, checksum-verified webhook, not the browser redirect.
- **Kit integrity**: kit selections are re-validated against the DB and re-priced server-side — a manipulated request can't substitute an unlisted variant at the base price.

## Security

helmet · CORS locked to `FRONTEND_URL` with credentials · every input Zod-validated · ownership-scoped queries (no IDOR) · rate limits on auth + OTP-send · `passwordHash`/tokens never in responses · httpOnly+secure cookies in prod · Prisma parameterizes all SQL · error handler hides internals in production.

## Deployment (plan Section 15)

Build: `npm install && npx prisma generate && npm run build`.
Start: `npx prisma migrate deploy && npm start`.
Health check: `/v1/health`. Point `DATABASE_URL` at the Neon `zeroplus-prod` project, set all provider keys + live PhonePe credentials, and seed the admin once with `npm run seed:admin`.
