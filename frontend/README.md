# Zeroplus — Frontend

Next.js storefront and admin panel for [Zeroplus](../README.md), a baby-products retailer. Built with the App Router, TypeScript, and Tailwind CSS.

> **Note:** This project runs on a pre-release Next.js version with breaking changes from the stable docs you may know — see [`AGENTS.md`](AGENTS.md) before making framework-level changes.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Zustand (state) · React Hook Form + Zod (forms/validation) · Axios · `@react-oauth/google`

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev              # http://localhost:3000
```

By default the app runs against an in-memory mock API layer (`NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`), so the full UI is browsable with no backend running. Point it at the real API by setting `NEXT_PUBLIC_USE_MOCKS=false` and `NEXT_PUBLIC_API_BASE_URL` — see [`../backend`](../backend) to run that locally.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Turbopack dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Project Structure

```
app/
  (storefront)/   Customer-facing routes — home, shop, product, cart, checkout, account
  admin/          Owner-facing admin panel — products, kits, orders, customers, banners, reports
components/
  storefront/     Customer UI (product cards, cart, checkout forms, kit builder, reviews)
  admin/          Admin UI (product/kit forms, image uploader, sidebar)
  account/        Auth-gated route guards
  layout/         Header, Footer, WhatsApp contact button
  ui/             Shared primitives (Button, Input, Badge)
lib/
  api/            One module per resource, each with a real-API call and an in-memory mock
  types.ts        Shared types, mirroring the backend's response shapes field-for-field
  format.ts       Currency/date formatting helpers
store/            Zustand stores (auth, admin auth, cart, wishlist) — each persists to
                   localStorage and exposes a `hydrated` flag so SSR and first paint
                   never mismatch the persisted client state
```

## Key Design Decisions

- **Mock-first development**: every function in `lib/api/*` checks `USE_MOCKS` and falls back to an in-memory mock, so the frontend builds and runs with zero backend dependency. Flip one env var to switch to the live API — no code changes.
- **Admin vs. customer auth are separate stores** (`adminAuthStore` / `authStore`): distinct sessions, distinct tokens, so an admin login never doubles as a customer session or vice versa.
- **Hydration-safe persisted state**: cart, wishlist, and both auth stores gate their first real render behind a `hydrated` flag, so server-rendered HTML always matches the client's first paint before localStorage is read.
- **Header has three variants** (`full` / `minimal` / `content`) reused across the storefront, checkout/auth funnel, and content pages (About/FAQ/policies), instead of one component branching heavily per route.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Zeroplus product & technical spec](../docs/plan.md)
- [Backend README](../backend/README.md)
