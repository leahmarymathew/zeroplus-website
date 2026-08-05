# Zeroplus — E-Commerce Platform

Full-stack online store for **Zeroplus**, a baby-products retailer based in Kothamangalam, Kerala — customer storefront, checkout, and an owner-facing admin panel, backed by a REST API.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## Overview

Zeroplus is a two-sided application:

- **Storefront** — browsing, search, cart, guest or account checkout, order tracking, wishlist, reviews, and curated product kits.
- **Admin panel** — the owner manages catalog, orders, customers, banners, kits, and sales reports from one dashboard, no separate tooling required.

The frontend and backend are independently deployable apps in the same repository, communicating over a versioned REST API.

## Features

**Customer-facing**
- Home, category browsing, search, and a dedicated Best Deals page
- Product detail with variants, image gallery, safety info, certification badges, and post-delivery reviews
- Customizable kits — owner-curated bundles where the customer picks one option per slot
- Cart that persists across sessions and merges on login
- Checkout as a full account, or as a guest with no sign-up required
- Phone OTP verification on Cash-on-Delivery orders (prepaid orders skip it)
- Order tracking by email link for guests, or from account history for logged-in customers
- Wishlist, saved addresses, and profile management

**Admin (owner-facing)**
- Dashboard with sales overview and low-stock alerts
- Product, category, and kit management, including image uploads and stock levels
- Order management with status workflow (Placed → Confirmed → Packed → Shipped → Delivered / Cancelled)
- Customer directory with order history
- Homepage banner carousel management
- Sales reports with date-range filtering

See [`docs/plan.md`](docs/plan.md) for the full product and technical specification.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma ORM (Neon) |
| Auth | JWT (access + refresh), Google OAuth |
| Payments | PhonePe Payment Gateway |
| Media | Cloudinary |
| Transactional email | Resend |
| OTP delivery | WhatsApp Business Cloud API (console fallback in dev) |

Every third-party integration degrades gracefully with no credentials configured — see [`backend/README.md`](backend/README.md#provider-modes-works-with-zero-third-party-credentials) — so the full app runs and is testable offline.

## Project Structure

```
zeroplus-website/
├── frontend/   Next.js customer storefront + admin panel
├── backend/    Express REST API (auth, catalog, cart, checkout, payments, admin)
├── docs/       Product spec, API contract, and data model
└── render.yaml Backend deployment blueprint (Render)
```

Each app is independent — see [`frontend/README.md`](frontend/README.md) and [`backend/README.md`](backend/README.md) for their own setup, scripts, and architecture notes.

## Getting Started

**Prerequisites:** Node 24 (pinned in [`.nvmrc`](.nvmrc)), npm, and a PostgreSQL database (a free [Neon](https://neon.tech) project works well).

```bash
git clone https://github.com/leahmarymathew/zeroplus-website.git
cd zeroplus-website
nvm use
```

### Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL at minimum
npx prisma migrate dev
npm run generate
npm run seed               # admin account + demo catalog
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

By default the frontend runs against an in-memory mock API (`NEXT_PUBLIC_USE_MOCKS=true`), so it works with no backend running at all. Set it to `false` once the backend is up to use the real API.

## Environment Variables

Real secrets live only in local `.env` / `.env.local` files (git-ignored) and in the hosting platform's dashboard for production. Every required variable is listed, with an explanation, in `.env.example` in each app folder.

## Deployment

- **Backend** — deployed via the [Render Blueprint](render.yaml) (`render.yaml` at the repo root). Build: `npm install && npx prisma generate && npm run build`; start: `npx prisma migrate deploy && npm start`; health check at `/v1/health`.
- **Frontend** — deploys as a standard Next.js app to any platform with commercial-use-compatible free tier (e.g. Cloudflare Pages).
- Both auto-deploy on merge to `main`.

## Contributing / Git Workflow

- `main` is always deployable.
- One branch per task: `feature/<description>` or `fix/<description>`.
- Open a pull request into `main`; squash and merge once reviewed.

## License

Private and proprietary. All rights reserved.
