# Frontend ↔ Backend Full Integration + Storefront/Admin Polish — Design

**Date:** 2026-07-22
**Owner:** Jacob (now both frontend + backend dev)
**Status:** Approved, ready for implementation plan

## Context

Backend is complete and on `main` (59 endpoints, running locally against Neon dev). Leah's frontend already has all pages built (storefront + full admin: dashboard, reports, product/kit/category/banner CRUD forms) but running on **mock data**. PR #2 (`feature/frontend-api-wiring`) already wired the **public catalog + reviews reads** behind `NEXT_PUBLIC_USE_MOCKS` with a shared axios client (`lib/api/client.ts`). This spec finishes the job: full end-to-end wiring + targeted enhancements.

## Decisions (locked)

1. **Scope:** Full end-to-end wiring in one pass — customer auth, cart→checkout→order, admin, uploads.
2. **Auth contract:** Bend the **backend** to Leah's UX — register email optional, login by phone OR email, checkout OTP UI → 6 digits. (Backend also gains "top kits" in reports.)
3. **Product page:** Full momncute-style richness **including** urgency widgets ("X sold recently", "N viewing"), client-randomized.

## Architecture

- **Single branch/PR** `feature/frontend-api-wiring` carries the whole integration (Jacob owns both sides; simpler to build/test with running servers). Small backend auth tweaks included and clearly noted.
- **Token handling:** `authStore.accessToken` (customer, done) + new `adminAuthStore.accessToken`. The axios request interceptor attaches the **admin** token for `/admin/*` paths, **customer** token otherwise. On a 401, retry once via `POST /auth/refresh` (customer) then fail through.
- **Server vs client:** Server Components (home, product, category, kits, best-deals) already fetch public reads server-side. Client Components own auth/cart/checkout/account/admin.
- **Cart stays local** (zustand). At checkout its items map to `createOrder`'s `items[]` (`{variantId, quantity}` or `{kitId, kitSelections, quantity}`); backend re-prices. Backend cart endpoints go unused by this frontend.
- **USE_MOCKS** retained as offline fallback in every wired function.

## Backend changes (small)

- `auth.service.register`: make `email` optional (nullable). Schema + service.
- `auth.service.login`: resolve user by `email` OR `phone` from a single `identifier`. Update `/auth/login` schema to accept `identifier`.
- `admin.service.reportSummary`: add `topKits` (groupBy `OrderItem.kitName`, non-null), mirroring `topProducts`.
- Dev-only `mock-pay` redirect: include the guest `token` query param so the confirmation page can fetch a guest order.
- Add/adjust tests for the above.

## Frontend work

### New api modules (behind USE_MOCKS)
- `lib/api/auth.ts` — `login(identifier, password)`, `register(...)`, `forgotPassword(phone)`, `resetPassword(...)`, `refresh()`, `logout()`.
- `lib/api/otp.ts` — `sendOtp(phone)`, `verifyOtp(otpId, code)`.
- `lib/api/uploads.ts` — `uploadImage(file)` → `{ url }`.
- `lib/api/account.ts` — addresses CRUD + wishlist CRUD.

### Wire existing api modules to backend
- `lib/api/orders.ts` — `createOrder` (real; returns Order + `phonepeRedirectUrl`), `getOrder(id, token?)`, `getOrdersByUser`, `getAdminOrders`, `updateOrderStatus`.
- `lib/api/reviews.ts` — `submitReview` (auth + delivered-order gated).
- `lib/api/admin/*.ts` — products, categories, kits, customers, banners → real CRUD.

### Pages / components
- **login page:** call `auth.login`/`register`; store `{user, accessToken}`; handle phone-or-email identifier. Google button stays a graceful placeholder (no client ID yet).
- **forgot/reset pages:** real OTP-based reset.
- **checkout page:** OTP box → 6 digits, wired to `/otp/send` + `/otp/verify`, pass `otpId` for COD; on PhonePe `window.location.href = phonepeRedirectUrl`; thread guest `guestAccessToken` into confirmation URL.
- **order-confirmation + account/orders:** `getOrder` with token (guest) or JWT; `getOrdersByUser` (auth).
- **account/addresses + wishlist:** wire to `/addresses` + `/wishlist` (auth).
- **admin login page:** real login, assert `role==="ADMIN"`, store admin token.
- **admin dashboard + reports:** drive from `/admin/reports/summary` (revenue, top products, **top kits**, revenue-by-day, low stock) instead of client-side aggregation.
- **ProductForm + KitForm:** real create/update + **image upload component** (`lib/api/uploads`) for cover + multiple photos.
- **product detail page:** enrich to momncute style — image gallery + thumbnails, Sale badge, variant/price, Description/Shipping/Returns accordions, related products, urgency widgets (client-randomized).

## Testing (before PRs)

Against the running backend (`USE_MOCKS=false`):
- Guest checkout (PhonePe) → order lands in DB → confirmation via guest token.
- COD → 6-digit OTP (from server console) → order placed.
- Register (no email) → login by phone → account orders visible.
- Admin login → create product with uploaded photo → appears on storefront; dashboard shows real revenue/top-products/top-kits.
- Typecheck clean; backend tests green.

## Delivery

- Backend tweaks committed with tests, frontend wiring committed incrementally, all on `feature/frontend-api-wiring`; update PR #2 title to "full frontend↔backend integration" (or keep reads PR separate and stack — decide at PR time).
- Parallel agents may build independent chunks: (a) backend auth/reports tweaks, (b) customer flow wiring, (c) admin flow wiring, (d) product-page enrichment.

## Out of scope (YAGNI)

- Real Google OAuth (no client ID yet) — button stays placeholder.
- Switching cart to the backend cart API — local cart + checkout items is sufficient.
