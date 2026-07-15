# Zeroplus — E-Commerce Platform
## Technical & Operational Plan

**Prepared for:** Zeroplus (Kothamangalam, Kerala) — baby products store, online launch
**Scope:** Full online store — catalog, cart, checkout, online payment + COD, delivery, order tracking
**Team:** 2 developers (1 frontend, 1 backend), intermediate level
**Version:** 2.0

---

## Table of Contents

1. Technology Stack
2. Feature Specification
3. Site Map
4. User Flows
5. Data Model
6. API Contract — Decisions & Examples
7. Work Division
8. Git Collaboration Workflow
9. Development Timeline
10. Budget — Tiered Cost Analysis
11. Payment Gateway (PhonePe)
12. Delivery & Logistics
13. Legal & Compliance
14. Marketing Basics
15. Content Required From the Owner
16. Launch Checklist

---

## 1. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS | SEO-capable rendering for product pages, strong ecosystem, fast to scaffold |
| Backend | Node.js, Express, TypeScript | Standalone REST API, clean ownership boundary for a 2-person split |
| Database | PostgreSQL via Prisma ORM, hosted on Neon | Relational structure fits orders/stock/users; type-safe queries, managed migrations; Neon's free tier is permanent and commercial-use is explicitly permitted (see Section 10.2) |
| Environment separation | Two separate Neon projects — one for development, one for production | Both fit inside Neon's free tier, so this costs nothing extra. Keeps testing during the build (seed data, broken migrations, experiments) completely isolated from real customer orders once live — never point local development at the production database |
| Auth | JWT (access + refresh tokens), plus Google OAuth as a login/register option | Predictable, no vendor dependency for core auth; Google sign-in adds a one-click, pre-verified option alongside email/password and guest checkout (Section 2.1) |
| Image storage | Cloudinary | Free tier covers a catalog this size; automatic resize/optimization |
| Payments | PhonePe Payment Gateway | Standard rate 1.95%, no setup/annual fee — comparable to or cheaper than Razorpay's 2.36%; full breakdown in Section 11. Note: integration is via PhonePe's REST API directly (no official first-party Node.js SDK, unlike Razorpay's `razorpay` npm package), and checkout is a redirect flow to a PhonePe-hosted page rather than an in-page popup |
| Transactional email | Resend | Order confirmations and status updates |
| Frontend hosting | Cloudflare Pages | Free tier permits commercial use (see note below) |
| Backend app hosting | Railway | Simplest managed deploy for the Node app; database hosted separately on Neon |
| Domain registrar | Namecheap / Hostinger / GoDaddy | Compare price at time of purchase |
| State management (frontend) | Zustand | Cart quantity changes fire frequently; React Context re-renders every consumer on each change unless carefully split into multiple providers, while Zustand updates only the components reading the changed slice — meaningfully less boilerplate than a reducer + Context setup for the same result |
| Package manager | npm | Ships with Node by default; no second tool for either developer to install or learn |
| Node.js version | 24 (Active LTS) | Active LTS as of mid-2026, supported through April 2028 — the safe default for a project starting now. Pinned via `.nvmrc` at the repo root |
| Image upload flow | Browser → Backend → Cloudinary | Every upload is proxied through the backend using a signed server-side request, never uploaded directly from the browser. Keeps the Cloudinary API secret server-side only and lets the backend validate file type/size before anything reaches storage |
| SMS/OTP provider | MSG91 | Full integration, compliance requirement, and cost breakdown in Section 6.4 |
| Deployment trigger | Auto-deploy on merge to `main` | Cloudflare Pages and Railway both redeploy automatically on every push to `main`. Branch protection (Section 8.2) is the safety gate, not a manual deploy step |

**Note on Vercel:** Vercel's free "Hobby" tier prohibits commercial use under its Terms of Service. Since Zeroplus processes real payments from launch, Vercel Hobby is not a compliant option — either budget for Vercel Pro, or use Cloudflare Pages, which has an equivalent free tier without the restriction. Cloudflare Pages is the default recommendation; see Section 10 for the full comparison.

**Note on PhonePe pricing:** PhonePe is currently running a promotional zero-processing-fee offer for new merchants. Treat this as temporary — budget using the standard 1.95% rate (Section 11.1), and take the promotional period as a bonus if it's still active when Zeroplus onboards, not as the number to plan around long-term.

### 1.1 Core Packages

Fixed dependency lists for both developers to install at project setup, rather than each picking ad hoc as the build progresses.

**Frontend (`/frontend`)**

| Package | Purpose |
|---|---|
| `next`, `react`, `react-dom` | Framework |
| `typescript`, `@types/react`, `@types/node` | Type safety |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling |
| `zustand` | Cart and global UI state |
| `axios` | API calls, with a shared instance for attaching the auth token and handling errors centrally |
| `react-hook-form` | Checkout address form, admin product forms |
| `zod` | Form and API response validation — same library as the backend, so validation logic reads the same on both sides |
| `react-hot-toast` | Cart/checkout notifications and error messages |
| `lucide-react` | Icon set |
| `@react-oauth/google` | Google sign-in button and OAuth flow |

**Backend (`/backend`)**

| Package | Purpose |
|---|---|
| `express`, `typescript`, `tsx` | Framework and dev runtime |
| `@types/express`, `@types/node` | Type safety |
| `prisma`, `@prisma/client` | Database ORM and migrations |
| `jsonwebtoken` | JWT issuance/verification |
| `bcryptjs` | Password hashing |
| `zod` | Request body validation |
| `cors` | Cross-origin requests from the frontend domain |
| `dotenv` | Environment variable loading |
| `multer` | Handling incoming multipart file uploads before forwarding to Cloudinary |
| `cloudinary` | Official SDK for signed image uploads |
| `google-auth-library` | Verifying Google ID tokens sent from the frontend sign-in flow |
| — (no package) | PhonePe integration calls their REST API directly via `axios` (already needed elsewhere) — no official Node SDK exists, so the checksum generation (`sha256` via Node's built-in `crypto` module) and API calls are written by hand following PhonePe's API docs |
| `resend` | Order confirmation emails |
| `helmet` | Security headers |
| `express-rate-limit` | Rate-limiting the OTP send endpoint specifically, to prevent abuse of a per-message-cost API |

---

## 2. Feature Specification

### 2.1 Customer-Facing

- Home: hero banner, featured categories, best sellers, new arrivals, trust badges
- Shop/category listing with filters (age group, price, brand) and sort. Prices show with a struck-through original price when a variant has one set (`compareAtPrice`, Section 5) — this is set per variant in the admin product form, not a separate discount system
- Search with autosuggest
- Product detail: image gallery, variants, stock status, description, safety/ingredient information, certification badges (e.g. "Dermatologically Tested," "Hypoallergenic" — small icon-tags, distinct from the longer safety text), reviews, related products
- Review submission: a "Write a review" form on the product page, but only shown to customers who've actually had that product delivered — not open to anyone browsing. Star rating plus optional comment
- Owner highlight badge: a short, optional line of text floating near the product image on the product detail page only (e.g. "Best for rainy season"), written by the shop owner per product. Rendered only when set — most products will not have one, and the layout does not reserve space for it when absent
- Cart: persists across sessions; guest cart merges into account on login
- Three ways to check out: full account (email/password or one-click Google sign-in), or as a guest — no account required. Guest checkout only asks for name, phone, and delivery address, same as an account would, just without saving it
- Phone OTP verification is required only for Cash on Delivery orders (guest or logged-in — the point is confirming a real, reachable phone number to cut COD fraud/no-shows, not gatekeeping who can buy). Prepaid orders (PhonePe) skip OTP entirely, since payment itself already confirms intent
- Checkout: address entry, delivery charge calculation, payment method selection (PhonePe or COD)
- Order confirmation page and email notification. Guest orders can be tracked later via a link in that email — no login needed
- My Account: order history, tracking status, saved addresses, wishlist, profile
- Post-delivery reviews and ratings
- Wishlist — its own page (`/wishlist`), reached via a header icon on every page, not nested under My Account
- Best Deals page (`/best-deals`) — every product currently carrying a `compareAtPrice` (Section 5), shown automatically. No separate "is this a deal" toggle for the owner to manage
- Customizable kits: owner-defined bundles (e.g. "Newborn Essentials Kit") made up of a fixed set of slots — each slot is a choice like "pick a diaper pack" or "pick a feeding bottle" — where the customer picks one option per slot from a curated list the owner set up, then adds the whole configured kit to cart as a single line item at the kit's price. Not a fully open build-your-own-bundle from the entire catalog — scoped to keep it buildable
- Static pages: About, Contact (with map to the physical Kothamangalam store), Shipping & Returns Policy, Privacy Policy, Terms & Conditions, FAQ
- WhatsApp contact button on all pages — a plain `wa.me` deep link with a prefilled message, not the paid WhatsApp Business API. No extra integration cost
- Optional: blog for baby-care content, supports local SEO

### 2.2 Admin (Owner-Facing)

- Dashboard: sales overview, low-stock alerts
- Product management: create/edit/delete, variants (including the `compareAtPrice` strike-through field), stock levels, image upload, categories, certification badges (Section 5 — a small preset list the owner selects from, e.g. "Dermatologically Tested"), and an optional short "highlight" text field per product (shown as a floating badge on that product's page — the owner can add, edit, or clear it at any time; leaving it blank is the default and expected state for most products). Product list has search, category/stock filters, and sort — same as the customer-facing shop listing, since an owner managing dozens of products needs to find one quickly just as much as a customer does. Each product has its own edit page
- Category management: add/edit, each category has its own image (`Category.imageUrl`, Section 5) — set here, not in the Banners section (see below)
- Order management: view, update status (Placed → Confirmed → Packed → Shipped → Delivered, or Cancelled), print invoice. List has search (order number, customer name/phone), status filter, and date sort. Cancellation is admin-only — customers can't self-cancel from their account; they contact the store directly, which fits a small local business and avoids refund-timing edge cases
- Refunds are processed manually in the PhonePe merchant dashboard by whoever runs orders, not through a custom endpoint. The `REFUNDED` status on an order is just a record the admin marks after the refund is actually done on PhonePe's side
- Customer list with order history and a search field (name, phone, email)
- Inventory tracking with automatic stock deduction on order placement
- Banners: homepage hero carousel images only — not a catch-all for every image on the site. Each upload slot is clearly labeled with where it appears (e.g. "Homepage Hero — Slide 1"), so the owner never has to guess what an image controls. Category tile images live with categories, product images live with products
- Kit management: create a kit, define its slots (e.g. "Choose a diaper pack"), and choose which existing product variants are eligible options for each slot. No separate kit inventory — stock is drawn from whichever variant the customer picks per slot, same as a normal order
- Reports: top products, revenue by day/week/month, with a date-range filter and a CSV download — a small store still needs to hand these numbers to an accountant or the owner directly, not just eyeball them on screen
- Single admin role is sufficient at launch; staff roles can be added later
- Coupon codes are out of scope for now — descoped to keep the initial build focused. The `discount` field on Order still supports a one-off manual discount an admin can apply by hand; a full coupon-code system can be added later without changing the Order model

---

## 3. Site Map

**Customer**

| # | Route | Purpose |
|---|---|---|
| 1 | `/` | Home |
| 2 | `/shop` | All products, filterable |
| 3 | `/category/[slug]` | Category listing |
| 4 | `/product/[slug]` | Product detail |
| 5 | `/kits` | Kit listing |
| 6 | `/kits/[slug]` | Kit builder — pick one option per slot |
| 7 | `/cart` | Cart |
| 8 | `/checkout` | Checkout |
| 9 | `/order-confirmation/[orderId]` | Order confirmation |
| 10 | `/login`, `/register` | Authentication |
| 11 | `/account` | Account overview — links out to the sub-pages below, not tabs sharing one page |
| 12 | `/account/orders` | Order history list |
| 13 | `/account/orders/[id]` | Order detail / tracking — same page a guest reaches via the confirmation email link (Section 6.1), just without the account chrome around it when accessed that way |
| 14 | `/account/addresses` | Saved addresses — add/edit/delete |
| 15 | `/account/profile` | Name, email, phone, password change |
| 16 | `/about` | About |
| 17 | `/contact` | Contact |
| 18 | `/policies/shipping-returns` | Policy |
| 19 | `/policies/privacy` | Policy |
| 20 | `/policies/terms` | Policy |
| 21 | `/faq` | FAQ |
| 22 | `/search` | Search results |
| 23 | `/wishlist` | Wishlist — top-level, reached via a header icon on every page, not nested under Account |
| 24 | `/best-deals` | Any product with `compareAtPrice` set (Section 5) — automatic, no separate admin flag needed |
| 25 | `/forgot-password` | Send a password-reset OTP (Section 6.3) |
| 26 | `/reset-password` | Enter OTP and set new password (Section 6.3) |
| 27 | `/blog`, `/blog/[slug]` | Optional content |

**Admin** (route group `/admin/*`, authenticated)

| # | Route | Purpose |
|---|---|---|
| 1 | `/admin/login` | Admin authentication |
| 2 | `/admin` | Dashboard |
| 3 | `/admin/products`, `/admin/products/[id]/edit` | Product management |
| 4 | `/admin/categories` | Category management |
| 5 | `/admin/kits`, `/admin/kits/[id]/edit` | Kit management — slots and eligible variants per slot |
| 6 | `/admin/orders`, `/admin/orders/[id]` | Order management |
| 7 | `/admin/customers`, `/admin/customers/[id]` | Customer list and detail view (contact info, order history) |
| 8 | `/admin/banners` | Homepage content |
| 9 | `/admin/reports` | Analytics |

---

## 4. User Flows

**Customer flow**
Home → browse or search → product detail → add to cart → cart review → checkout (name, phone, address; account optional via email/password or Google sign-in) → select payment method → if COD, verify phone via OTP → place order → if paying online, redirected to PhonePe's hosted payment page → redirected back to order confirmation → order confirmation + email (with a guest tracking link if no account) → track status in My Account or via that link → post-delivery review.

**Admin flow**
Login → dashboard → new order notification → open order → verify payment/confirm COD → status: Confirmed → Packed → Shipped (with tracking number, if courier-shipped) → Delivered. Stock is deducted at order placement, not at confirmation, to prevent overselling.

---

## 5. Data Model

Field names below are final and are used exactly as written — in the Prisma schema, in API request/response bodies (Section 6), and in frontend TypeScript types. camelCase throughout; no naming conversion between layers.

**User**
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | |
| name | string | |
| email | string, nullable | Unique when set; not required for OTP-only guest-to-account conversion |
| phone | string | Unique |
| passwordHash | string, nullable | Null for accounts created via OTP or Google only |
| googleId | string, nullable | Unique. Set when the account was created or linked via Google sign-in |
| role | enum: `CUSTOMER`, `ADMIN` | |
| createdAt | datetime | |
| updatedAt | datetime | |

**Address**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| userId | string | |
| label | string, nullable | e.g. "Home", "Work" |
| line1 | string | |
| line2 | string, nullable | |
| city | string | |
| state | string | |
| pincode | string | |
| phone | string | |
| isDefault | boolean | |

**Category**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| slug | string | Unique |
| parentId | string, nullable | Self-relation, for subcategories |
| imageUrl | string, nullable | |

**Product**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| slug | string | Unique |
| description | text | |
| categoryId | string | |
| brand | string, nullable | |
| safetyInfo | text, nullable | |
| certifications | string[] (array), nullable | Short badge-style tags — e.g. "Dermatologically Tested," "Hypoallergenic," "BPA Free." Distinct from `safetyInfo`: these render as small badges/icons on the product page, not paragraph text. Owner picks from a small preset list per product in the admin form (Section 2.2) |
| ownerHighlight | string, nullable | Max ~60 characters. The floating badge text on the product detail page (Section 2.1). Null/empty by default; the frontend renders the badge only when this is non-empty |
| isActive | boolean | |
| createdAt | datetime | |
| updatedAt | datetime | |

**ProductVariant**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| productId | string | |
| label | string | e.g. "0–3 months", "Blue" |
| price | int | Rupees |
| compareAtPrice | int, nullable | Original price, for showing a struck-through sale price |
| stockQty | int | |
| sku | string | Unique |

**ProductImage**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| productId | string | |
| url | string | |
| sortOrder | int | |

**Kit**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | e.g. "Newborn Essentials Kit" |
| slug | string | Unique |
| description | text | |
| basePrice | int | The combined kit price — typically less than the sum of its parts bought separately |
| imageUrl | string, nullable | One hero image; not a full gallery like Product, to keep scope contained |
| isActive | boolean | |
| createdAt | datetime | |
| updatedAt | datetime | |

**KitSlot**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| kitId | string | |
| label | string | e.g. "Choose a diaper pack" |
| sortOrder | int | |

**KitSlotOption**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| kitSlotId | string | |
| productVariantId | string | References an existing `ProductVariant` — kits are built from the same catalog, not separate kit-only products |
| priceAdjustment | int, nullable | Added to `Kit.basePrice` if this option costs more than the kit's default (e.g. a premium variant) |

**CartItem**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| sessionId | string, nullable | Set for guest carts — see Section 6.1 for how it's generated |
| userId | string, nullable | Set once authenticated; guest cart merges into this on login |
| variantId | string, nullable | Required when this line is a single product (`kitId` is null) |
| kitId | string, nullable | Required when this line is a configured kit (`variantId` is null) |
| kitSelections | JSON, nullable | Only set when `kitId` is set — map of `kitSlotId` → chosen `productVariantId`, one entry per slot |
| quantity | int | |

**Order**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| orderNumber | string | Unique, human-readable — e.g. `ZP-00123` |
| userId | string, nullable | Null for guest checkout |
| status | enum: `PLACED`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED` | |
| paymentStatus | enum: `PENDING`, `PAID`, `FAILED`, `REFUNDED` | |
| paymentMethod | enum: `PHONEPE`, `COD` | |
| subtotal | int | |
| discount | int | Manual discount only, set by admin if applied — no coupon-code system (descoped for now, see Section 2.2) |
| shippingFee | int | |
| codFee | int, nullable | The COD handling fee from Section 12.3, when applicable |
| total | int | |
| addressSnapshot | JSON | Captured at order time so later address edits don't rewrite order history |
| guestAccessToken | string, nullable | Random opaque token, generated only for guest (no-account) orders. Included in the confirmation email link so the order can be tracked without logging in |
| trackingNumber | string, nullable | |
| createdAt | datetime | |
| updatedAt | datetime | |

**OrderItem**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| orderId | string | |
| variantId | string, nullable | Set when this line was a single product |
| kitId | string, nullable | Set when this line was a configured kit |
| kitName | string, nullable | Snapshot of `Kit.name` at order time |
| kitSelectionsSnapshot | JSON, nullable | Snapshot of the chosen product/variant name per slot, frozen at order time — same reasoning as `productName`/`variantLabel` below, so a later catalog change never rewrites past orders |
| productName | string, nullable | Snapshot at time of order — null for kit lines, see `kitName` instead |
| variantLabel | string, nullable | Snapshot at time of order — null for kit lines |
| quantity | int | |
| priceAtPurchase | int | |

**Review**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| productId | string | |
| userId | string | |
| rating | int | 1–5 |
| comment | text, nullable | |
| createdAt | datetime | |

**Wishlist**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| userId | string | |
| productId | string | |
| createdAt | datetime | |

**Payment**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| orderId | string | |
| phonepeMerchantTransactionId | string, nullable | Generated by the backend, unique per attempt — sent to PhonePe when initiating the transaction |
| phonepeTransactionId | string, nullable | PhonePe's own transaction ID, returned once payment completes |
| status | enum: `CREATED`, `PAID`, `FAILED` | |
| amount | int | |

**OtpRequest**
| Field | Type | Notes |
|---|---|---|
| id | string | |
| phone | string | |
| code | string | Stored hashed, never plaintext |
| purpose | enum: `CHECKOUT`, `LOGIN`, `PASSWORD_RESET` | `CHECKOUT` is only issued for COD orders (Section 2.1) |
| expiresAt | datetime | 5 minutes from creation |
| verified | boolean | |
| createdAt | datetime | |

---

## 6. API Contract — Decisions & Examples

Before dividing work, both developers must agree on the following. Treat this as a fixed reference document (a shared file in both repos) for the duration of the build — changing it mid-build is the primary source of integration bugs in a 2-person split.

### 6.1 Decisions Required

| Decision | Recommendation |
|---|---|
| Base URL and versioning | `https://api.zeroplusbaby.com/v1/` — version in the path from day one |
| Response envelope | Consistent shape for every endpoint: `{ success, data }` on success, `{ success, error: { code, message } }` on failure |
| Auth mechanism | JWT in `Authorization: Bearer <token>` header; refresh token via httpOnly cookie |
| Route naming | Resource-based, plural nouns, kebab-case: `/product-variants`, not `/getProductVariant` |
| Field naming | camelCase everywhere — matches the Data Model in Section 5 exactly. No separate API-only naming and no snake_case/camelCase conversion layer between backend and frontend |
| Pagination | Query params `?page=1&limit=20`; response includes a `pagination` object |
| Error format | Standard HTTP status codes plus an internal `error.code` string (e.g. `OUT_OF_STOCK`) for the frontend to branch on |
| Date/time format | ISO 8601 throughout |
| Currency handling | Store and transmit amounts in rupees (integer); convert to the smallest unit only at the point of calling PhonePe |
| Image upload flow | Client sends the file to the backend (`multipart/form-data`), the backend uploads to Cloudinary with a signed server-side request and returns the resulting URL. The frontend never talks to Cloudinary directly and never holds a Cloudinary credential |
| Guest cart identification | Backend sets a `guestId` in an httpOnly cookie on first cart request if one isn't already present. The browser attaches it automatically on every subsequent request — the frontend never reads or manages its value directly |
| Guest order tracking | Each guest (no-account) order gets a random `guestAccessToken` (Section 5) at creation, included in the confirmation email as a link like `/order-confirmation/{orderId}?token={guestAccessToken}`. `GET /v1/orders/:id` accepts either a valid JWT or a matching `token` query param |
| Kit validation | When a kit is added to cart, the backend validates that every `kitSelections` entry references an option actually listed under that slot in `KitSlotOption` — never trust the frontend's selection blindly, since a manipulated request could otherwise substitute an unlisted, pricier variant at the kit's base price |

### 6.2 Complete Endpoint Index

Every endpoint the frontend needs. Full request/response detail for the ones most likely to cause integration mismatches is in Section 6.3; the rest follow the same envelope and naming conventions from 6.1.

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/v1/auth/register` | Create an account (email/password) | None |
| POST | `/v1/auth/login` | Login | None |
| POST | `/v1/auth/google` | Sign in / register via Google ID token | None |
| POST | `/v1/auth/forgot-password` | Send a password-reset OTP | None |
| POST | `/v1/auth/reset-password` | Verify OTP and set a new password | None |
| POST | `/v1/auth/refresh` | Refresh access token | Refresh cookie |
| POST | `/v1/otp/send` | Send a checkout (COD-only) OTP | None |
| POST | `/v1/otp/verify` | Verify an OTP code | None |
| GET | `/v1/products` | List/filter/sort products; `?q=` also does search, `?onSale=true` powers the Best Deals page (any variant with `compareAtPrice` set) — no separate endpoint for either | None |
| GET | `/v1/products/:slug` | Product detail (includes `ownerHighlight`) | None |
| GET | `/v1/categories` | List categories | None |
| GET | `/v1/categories/:slug` | Category detail + its products | None |
| GET | `/v1/kits` | List active kits | None |
| GET | `/v1/kits/:slug` | Kit detail — its slots and each slot's eligible options | None |
| GET | `/v1/cart` | Get current cart | Optional |
| POST | `/v1/cart/items` | Add item to cart — either `{variantId, quantity}` or `{kitId, kitSelections, quantity}` | Optional |
| PATCH | `/v1/cart/items/:id` | Update quantity | Optional |
| DELETE | `/v1/cart/items/:id` | Remove item | Optional |
| GET | `/v1/wishlist` | Get wishlist | Customer |
| POST | `/v1/wishlist` | Add to wishlist | Customer |
| DELETE | `/v1/wishlist/:productId` | Remove from wishlist | Customer |
| GET | `/v1/addresses` | List saved addresses | Customer |
| POST | `/v1/addresses` | Add address | Customer |
| PATCH | `/v1/addresses/:id` | Edit address | Customer |
| DELETE | `/v1/addresses/:id` | Delete address | Customer |
| POST | `/v1/orders` | Create order (checkout) | Optional (guest allowed) |
| GET | `/v1/orders` | Current user's order history | Customer |
| GET | `/v1/orders/:id` | Order detail / tracking | JWT or `?token=guestAccessToken` (Section 6.1) |
| POST | `/v1/payments/phonepe-webhook` | PhonePe server-to-server payment callback | None (verified via checksum) |
| GET | `/v1/payments/status/:merchantTransactionId` | Actively check a payment's status | Optional |
| POST | `/v1/products/:id/reviews` | Submit a review — only allowed if the requester has a delivered order containing this product | Customer |
| GET | `/v1/products/:id/reviews` | List reviews for a product | None |
| POST | `/v1/uploads/image` | Upload an image, returns Cloudinary URL | Admin |
| GET | `/v1/admin/products` | List all products for the admin table — includes inactive/out-of-stock, unlike the public listing. Supports `?q=`, `?category=`, `?stock=low`, `?sort=` | Admin |
| POST | `/v1/admin/products` | Create product | Admin |
| PATCH | `/v1/admin/products/:id` | Update product (incl. `ownerHighlight`, `certifications`, variant `compareAtPrice`) | Admin |
| DELETE | `/v1/admin/products/:id` | Delete product | Admin |
| POST | `/v1/admin/categories` | Create category (incl. `imageUrl`) | Admin |
| PATCH | `/v1/admin/categories/:id` | Update category | Admin |
| POST | `/v1/admin/kits` | Create kit (with slots and options) | Admin |
| PATCH | `/v1/admin/kits/:id` | Update kit — replaces its slots/options wholesale | Admin |
| DELETE | `/v1/admin/kits/:id` | Delete kit | Admin |
| GET | `/v1/admin/orders` | List all orders. Supports `?q=` (order number, customer name/phone), `?status=`, `?sort=date` | Admin |
| PATCH | `/v1/admin/orders/:id/status` | Update order status | Admin |
| GET | `/v1/admin/customers` | List customers. Supports `?q=` (name, phone, email) | Admin |
| GET | `/v1/admin/customers/:id` | Customer detail — contact info plus their order history | Admin |
| GET | `/v1/admin/reports/summary` | Dashboard summary stats. Supports `?from=&to=` date range | Admin |
| GET | `/v1/admin/reports/export` | Same data as `/summary`, returned as a downloadable CSV | Admin |

### 6.3 Worked Examples

**List products**
```
GET /v1/products?category=diapers&page=1&limit=20&sort=price_asc

200 OK
{
  "success": true,
  "data": [
    { "id": "prod_123", "name": "Cotton Cloth Diaper", "slug": "cotton-cloth-diaper",
      "price": 499, "images": ["https://..."], "stock": 42 }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 87, "totalPages": 5 }
}
```

**Get product detail** (includes the owner highlight badge)
```
GET /v1/products/cotton-cloth-diaper

200 OK
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Cotton Cloth Diaper",
    "slug": "cotton-cloth-diaper",
    "description": "...",
    "safetyInfo": "...",
    "ownerHighlight": "Best for rainy season",
    "images": ["https://..."],
    "variants": [
      { "id": "var_456", "label": "Newborn", "price": 499, "stockQty": 42 }
    ]
  }
}
```
`ownerHighlight` is `null` when the owner hasn't set one for that product — the frontend renders the floating badge only when this field is non-null and non-empty, and renders nothing (not an empty box) otherwise.

**Get kit detail**
```
GET /v1/kits/newborn-essentials-kit

200 OK
{
  "success": true,
  "data": {
    "id": "kit_001",
    "name": "Newborn Essentials Kit",
    "slug": "newborn-essentials-kit",
    "description": "...",
    "basePrice": 1499,
    "imageUrl": "https://...",
    "slots": [
      {
        "id": "slot_1",
        "label": "Choose a diaper pack",
        "options": [
          { "productVariantId": "var_456", "productName": "Cotton Cloth Diaper", "variantLabel": "Newborn", "priceAdjustment": 0 },
          { "productVariantId": "var_789", "productName": "Premium Diaper Pack", "variantLabel": "Newborn", "priceAdjustment": 100 }
        ]
      },
      {
        "id": "slot_2",
        "label": "Choose a feeding bottle",
        "options": [
          { "productVariantId": "var_222", "productName": "Anti-Colic Bottle", "variantLabel": "125ml", "priceAdjustment": 0 }
        ]
      }
    ]
  }
}
```
The frontend renders one selector per slot; the customer must pick exactly one option per slot before the kit can be added to cart. `priceAdjustment` shows next to any option that costs more than the kit's base price already covers.

**Add a configured kit to cart**
```
POST /v1/cart/items
Body: {
  "kitId": "kit_001",
  "kitSelections": { "slot_1": "var_456", "slot_2": "var_222" },
  "quantity": 1
}

200 OK
{
  "success": true,
  "data": {
    "cartId": "cart_001",
    "items": [ { "kitId": "kit_001", "kitSelections": { "slot_1": "var_456", "slot_2": "var_222" }, "quantity": 1, "price": 1499 } ],
    "total": 1499
  }
}
```
The backend re-validates every entry in `kitSelections` against `KitSlotOption` before accepting this (Section 6.1) — never trust that the frontend only ever sent a valid combination.

**Add item to cart**
```
POST /v1/cart/items
Body: { "variantId": "var_456", "quantity": 2 }

200 OK
{
  "success": true,
  "data": { "cartId": "cart_001", "items": [ { "variantId": "var_456", "quantity": 2 } ], "total": 998 }
}
```

**Send OTP** (COD orders only)
```
POST /v1/otp/send
Body: { "phone": "+919961661605", "purpose": "checkout" }

200 OK
{ "success": true, "data": { "otpId": "otp_789", "expiresInSeconds": 300 } }
```

**Verify OTP**
```
POST /v1/otp/verify
Body: { "otpId": "otp_789", "code": "482913" }

200 OK
{ "success": true, "data": { "verified": true } }
```

**Sign in with Google**
```
POST /v1/auth/google
Body: { "idToken": "<Google ID token from @react-oauth/google>" }

200 OK
{ "success": true, "data": { "accessToken": "...", "user": { "id": "usr_1", "name": "...", "email": "..." } } }
```
The backend verifies the ID token against Google's public keys (`google-auth-library`), then finds an existing user by `googleId` or `email`, or creates one. No password is ever set for these accounts.

**Forgot password**
```
POST /v1/auth/forgot-password
Body: { "phone": "+919961661605" }

200 OK
{ "success": true, "data": { "otpId": "otp_456", "expiresInSeconds": 300 } }
```
```
POST /v1/auth/reset-password
Body: { "otpId": "otp_456", "code": "119284", "newPassword": "..." }

200 OK
{ "success": true, "data": { "reset": true } }
```

**Create order (checkout)**
```
POST /v1/orders
Body: { "addressId": "addr_789", "paymentMethod": "phonepe" }

200 OK
{
  "success": true,
  "data": {
    "orderId": "order_abc",
    "orderNumber": "ZP-00123",
    "total": 899,
    "phonepeRedirectUrl": "https://mercury.phonepe.com/transact/..."
  }
}
```
For `paymentMethod: "phonepe"`, the frontend redirects the browser to `phonepeRedirectUrl` (`window.location.href = ...`) rather than opening an in-page checkout widget — PhonePe's Standard Checkout is a hosted page, not a JS popup like Razorpay's.

**PhonePe server-to-server callback** (the authoritative payment confirmation)
```
POST /v1/payments/phonepe-webhook
Body: { "response": "<base64-encoded payload>", "checksum": "..." }

200 OK
{ "success": true }
```
PhonePe calls this endpoint directly from its servers once a payment completes, independent of whether the customer's browser successfully redirects back. The backend verifies the checksum, decodes the payload, and updates `Payment.status` and `Order.paymentStatus` from this call — not from the browser redirect, which can be interrupted (closed tab, network drop, back button) without payment status ever reaching the frontend.

**Check payment status** (used if the redirect-back page loads before the webhook has landed)
```
GET /v1/payments/status/order_abc

200 OK
{ "success": true, "data": { "status": "paid" } }
```

**Upload an image (admin)**
```
POST /v1/uploads/image
Header: Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
Body: file=<binary>

200 OK
{ "success": true, "data": { "url": "https://res.cloudinary.com/.../product-123.jpg" } }
```
The browser sends the file to this endpoint, not to Cloudinary. The backend performs the actual signed upload and returns only the resulting URL — the Cloudinary API secret never leaves the server.

**Admin: update a product (including the owner highlight)**
```
PATCH /v1/admin/products/prod_123
Header: Authorization: Bearer <admin_token>
Body: { "name": "Cotton Cloth Diaper", "ownerHighlight": "Best for rainy season" }

200 OK
{ "success": true, "data": { "id": "prod_123", "ownerHighlight": "Best for rainy season" } }
```
Send `null` or an empty string for `ownerHighlight` to clear a previously set badge.

**Admin: update order status** (also used for cancellation — see Section 2.2)
```
PATCH /v1/admin/orders/order_abc/status
Header: Authorization: Bearer <admin_token>
Body: { "status": "shipped", "trackingNumber": "SR123456789" }

200 OK
{ "success": true, "data": { "orderId": "order_abc", "status": "shipped" } }
```

### 6.4 OTP / SMS Verification

**Scope: Cash on Delivery orders only.** Prepaid orders (PhonePe) never trigger an OTP — payment itself already confirms the customer is real and intends to buy. OTP exists specifically to cut down on fake or careless COD orders, which is the one checkout path with no financial commitment up front. This also means switching to Google sign-in or any other account option doesn't reduce fraud risk on COD orders — a verified email says nothing about whether the delivery phone number is real and reachable, which is the actual thing being protected against.

**Provider: MSG91.** Well-documented REST API, handles DLT compliance tooling directly, competitive pricing (~₹0.15–0.20 per delivered SMS), and includes an automatic voice-call fallback if SMS delivery fails. 2Factor.in is a reasonable fallback option — same integration shape (send code, verify code) — if switching providers later ever becomes necessary; the swap only touches one backend module.

**Compliance requirement:** TRAI's DLT (Distributed Ledger Technology) framework requires every business sending transactional or OTP SMS in India to register as a DLT Principal Entity with at least one telecom operator, and to register the specific message template used. Messages sent outside this registration are blocked by Jio, Airtel, Vi, and BSNL. Start this registration in Week 1, alongside PhonePe KYC — both are identity-verification processes with similar lead times, and COD checkout cannot go live without it.

**Flow:**
1. Customer selects Cash on Delivery at checkout and enters a phone number.
2. Frontend calls `POST /v1/otp/send`.
3. Backend generates a 6-digit code, stores it hashed against the phone number with a 5-minute expiry (the `OtpRequest` entity in Section 5), and calls the MSG91 API to send it.
4. Customer enters the code; frontend calls `POST /v1/otp/verify`.
5. Backend compares the hashed code and marks the request verified; the order is allowed to proceed.

The same send/verify pair is reused for password reset (`purpose: "password_reset"`) — one integration, two purposes.

**Cost:** each OTP send is one billable SMS (~₹0.15–0.20), and a resend is billed again. Since OTP now only fires on COD orders rather than every checkout, actual volume is lower than the original estimate — a store with a genuine mix of COD and online payment will send meaningfully fewer OTPs than one requiring it universally. Rate-limit `POST /v1/otp/send` per phone number (Section 1.1, `express-rate-limit`) so the cost can't be inflated by repeated requests.

---

## 7. Work Division

**Frontend developer** — Next.js, React, Tailwind
- All customer-facing pages and components
- Kit builder page: one selector per slot, validation that every slot has a selection before allowing add-to-cart, live price update as options with a `priceAdjustment` are chosen
- Cart state management with Zustand (Section 1)
- API integration against the contract in Section 6
- Google sign-in button and OAuth flow (`@react-oauth/google`), plus the email/password and forgot-password forms
- Admin panel UI, including the product form's optional owner-highlight field, and the kit builder form (add slots, assign eligible variants per slot)
- Mobile-first responsive layout (majority of traffic expected on mobile)
- SEO basics: meta tags, sitemap.xml, structured data (schema.org `Product`) on product pages
- Image uploads in the admin product form submit the file to the backend's `/v1/uploads/image` endpoint (Section 6.3), not directly to Cloudinary
- Redirect to and back from PhonePe's hosted checkout page (Section 6.3) — not an in-page payment widget

**Backend developer** — Node, Express, Prisma, Postgres
- Database schema design and migrations
- REST API implementation per the contract: auth, products, cart, orders, kits, admin endpoints
- Kit validation: every `kitSelections` entry checked against `KitSlotOption` before a kit can be added to cart (Section 6.1) — never trust the frontend's selection as-is
- Kit stock handling: a kit order deducts stock from whichever `ProductVariant` was chosen per slot — there's no separate kit-level stock count to manage
- PhonePe integration: transaction initiation, checksum generation/verification, webhook handling, active status-check fallback (Section 6.3) — built against PhonePe's REST API directly, no official Node SDK
- Google ID token verification (`google-auth-library`) for the Google sign-in endpoint
- Auth: password hashing, JWT issuance/verification, forgot-password via OTP
- OTP integration with MSG91 for COD verification and password reset (Section 6.4), including DLT registration
- Image upload endpoint: receives the file from the frontend, performs the signed upload to Cloudinary, returns the URL
- Stock management: deduction on order placement, restoration on cancellation
- Resend integration for order emails
- Seed the first admin account via a Prisma seed script (`prisma/seed.ts`), run once manually — never through a public endpoint
- Backend and database deployment to Railway, with auto-deploy enabled on merge to `main`

**Joint responsibilities**
- Finalize the API contract (Section 6) before diverging
- Wireframes / rough page layout
- Cross-review of pull requests

---

## 8. Git Collaboration Workflow

### 8.1 Repository Structure

Single GitHub repository with `/frontend` and `/backend` as top-level folders. This keeps one issue tracker and one PR history for a 2-person team; a two-repo split works equally well if preferred, with the same workflow applied to each.

### 8.2 Initial Setup (once)

1. Create the repository; add the second developer as a collaborator.
2. Add `.gitignore` covering `node_modules/`, `.env`, `.next/`, `dist/`, `build/`.
3. Add `.env.example` in both `/frontend` and `/backend`, listing required variable names with placeholder values. Never commit a real `.env` file.
4. Push an initial commit with the base folder structure and a `README.md` covering local setup instructions.
5. Enable branch protection on `main`: require at least one pull request review before merge, and disallow direct pushes to `main`.

### 8.3 Branching Strategy

A two-tier model — `main` plus short-lived feature branches. A separate `develop` branch adds unnecessary overhead for a 2-person team.

- `main` — always deployable
- `feature/<short-description>` — one branch per task, e.g. `feature/product-detail-page`
- `fix/<short-description>` — bug fixes, e.g. `fix/cart-total-rounding`

### 8.4 Standard Workflow

1. Sync and branch:
   ```
   git checkout main
   git pull origin main
   git checkout -b feature/product-detail-page
   ```
2. Commit in small, logical increments:
   ```
   git add .
   git commit -m "feat: add product detail page layout"
   ```
3. Push the branch:
   ```
   git push origin feature/product-detail-page
   ```
4. Open a pull request on GitHub — base `main`, compare the feature branch — with a short description of the change.
5. Request review from the other developer; address comments if any.
6. Merge using **Squash and merge** to keep `main` history to one commit per feature.
7. Delete the feature branch after merge.
8. Both developers run `git checkout main && git pull origin main` before starting the next task.

Cloudflare Pages and Railway are both connected to auto-deploy on every push to `main` (Section 1). There is no separate manual deploy step — merging the pull request is the deploy. This makes the review in step 5 the actual safety check, not a formality before a later gate.

### 8.5 Staying in Sync / Resolving Conflicts

If `main` advances while a feature branch is in progress, merge it in periodically rather than waiting until the pull request:
```
git checkout feature/product-detail-page
git merge main
```
If Git reports a conflict, it marks the affected sections in each file with `<<<<<<<`, `=======`, `>>>>>>>`. Resolve manually, remove the markers, then:
```
git add .
git commit -m "merge: resolve conflicts with main"
git push origin feature/product-detail-page
```

### 8.6 Commit Convention

Prefix commits by type: `feat:`, `fix:`, `chore:`, `docs:`. Example: `feat: add PhonePe transaction initiation endpoint`.

### 8.7 Secrets Handling

Real credentials (PhonePe merchant ID/salt key, JWT secret, database URL, Google OAuth client ID/secret, Cloudinary/Resend/MSG91 keys) exist only in local `.env` files (git-ignored) and in the hosting platform's dashboard for production. `.env.example` documents required variable names with placeholders only.

---

## 9. Development Timeline

| Week | Frontend | Backend |
|---|---|---|
| 1 | Wireframes, project setup, Tailwind config | Project setup, DB schema, finalize API contract |
| 2–3 | Home, shop, category, product detail (dummy data) | Auth, product/category CRUD, seed data |
| 4 | Cart UI, connect to live APIs | Cart/order APIs |
| 5 | Checkout flow UI | PhonePe integration (sandbox/test environment), COD logic, webhooks |
| 6 | Admin panel UI | Admin APIs, order status logic |
| 7 | Policy pages, real product content, mobile QA | End-to-end order testing, bug fixes |
| 8 | Final polish, image optimization | Deploy, switch PhonePe to live mode, launch |
| 9 | Kit builder page, admin kit form | Kit CRUD APIs, kit validation and stock handling, cart/order support for kit lines |

Begin PhonePe KYC and MSG91 DLT registration in Week 1, in parallel with development — see Section 11 for PhonePe document requirements and Section 6.4 for the DLT registration requirement. Both are identity-verification processes that gate go-live and should not be left until the final week.

**On Week 9:** the kit feature is genuine added scope, not something that fits invisibly into the original 8 weeks — it's its own data model, its own validation logic, and its own UI. Rather than compress it into an already-full week, it's placed after the core commerce flow (browse → cart → checkout → payment → delivery) is fully working and tested. That core flow is what actually makes Zeroplus a functioning store; kits are a genuine enhancement on top of it, not a blocker to launching. If the timeline needs to hold at 8 weeks, launching without kits and adding them as a fast-follow in Week 9 is the more honest plan than quietly stretching every other week to make room.

---

## 10. Budget — Tiered Cost Analysis

All figures are monthly recurring costs unless stated otherwise. Domain registration is a separate one-time yearly cost (Section 10.5).

### 10.1 Frontend Hosting

| Option | Cost | Pros | Cons |
|---|---|---|---|
| Cloudflare Pages | ₹0 | Free indefinitely, no commercial-use restriction, unlimited bandwidth, global CDN, automatic SSL | Smaller Next.js-specific tooling ecosystem than Vercel |
| Netlify Free | ₹0 | Comparable free tier, solid CI/CD | 100GB bandwidth cap; some Next.js features (ISR) behave differently |
| Vercel Pro | ~₹1,700/mo ($20) | Best Next.js-specific developer experience, per-PR preview deployments, built-in analytics and image optimization | Per-seat billing, bandwidth overage charges beyond 1TB |

**Recommendation:** Cloudflare Pages at launch. Move to Vercel Pro only if the team specifically needs Vercel-only tooling and budget allows.

### 10.2 Backend Hosting + Database

App hosting and database are evaluated separately, since the recommended setup splits them across two providers.

**Database**

| Option | Cost | Pros | Cons |
|---|---|---|---|
| Neon (Postgres) | ₹0 | Permanent free tier, no credit card required, commercial use explicitly permitted, 100 compute-hours/month, scale-to-zero with a sub-second cold start | 0.5GB storage per project — sufficient at launch, requires monitoring as catalog and order history grow |
| Supabase Free | ₹0 | Permanent free Postgres (500MB), bundled auth/storage available if needed later | Pauses after 1 week of inactivity; wake time is noticeably slower than Neon's |
| Render Free (Postgres) | ₹0 | Simple to provision alongside a Render web service | Free Postgres instance expires after 90 days, requiring migration |
| Railway Postgres | Shares Railway's usage-based billing | Same dashboard as the app, if hosting both there | Draws from the same $5 included credit as the app itself |

**Recommendation:** Neon for the database. Its free tier is permanent rather than trial-based, explicitly allows commercial use, and its scale-to-zero cold start (approximately 500ms) is fast enough that a customer completing checkout is unlikely to notice a delay — a meaningful advantage over Supabase's or Render's free-tier pause behaviour. Storage should be monitored as the catalog grows; Neon's paid Launch tier has no monthly minimum and bills purely for usage beyond the free allowance.

Create **two Neon projects**, not one: `zeroplus-dev` and `zeroplus-prod`. Both stay on the free tier, so this doesn't cost anything extra — it just keeps local development, seed data, and schema experiments completely separate from real orders and customer data once the site is live. The backend's `.env` points at `zeroplus-dev` locally and in any test setup; only the Railway production deployment's environment variables point at `zeroplus-prod`. Set this up in Week 1, before either database has real data worth protecting.

**Backend application hosting**

| Option | Cost | Pros | Cons |
|---|---|---|---|
| Render Free | ₹0 | Free web service to start | Spins down after inactivity, causing a slow first request |
| Railway Hobby | ~₹430/mo ($5) | Always-on, no spin-down, auto-detects framework, simple deploy | Usage-based billing — a traffic spike can exceed the included credit |
| Railway Pro | ~₹1,700/mo ($20) | Higher resource ceiling | Unnecessary until traffic justifies it |

**Recommendation:** Render Free while building and testing. Move to Railway Hobby (~₹430/month) before taking live orders, so the Express app is always-on and checkout is never exposed to a cold-start delay. Keeping the database on Neon rather than on Railway means the $5 Railway credit is spent entirely on app compute rather than shared with database usage — more headroom for the same cost.

### 10.3 Image Storage

| Option | Cost | Pros | Cons |
|---|---|---|---|
| Cloudinary Free | ₹0 | ~25 credits/month (storage + bandwidth + transformations combined), automatic optimization, sufficient for a catalog this size | Credits are shared across usage types; monitor as traffic grows |
| Cloudflare Images | ~₹400/mo ($5 / 100k images) | Cost-efficient at scale, fast global delivery | Separate billing relationship, less automatic optimization than Cloudinary |

**Recommendation:** Cloudinary free tier for launch and likely well beyond.

### 10.4 Transactional Email

| Option | Cost | Pros | Cons |
|---|---|---|---|
| Resend Free | ₹0 | 3,000 emails/month, clean API, good deliverability | Requires domain verification (SPF/DKIM) for best inbox placement |
| Resend Pro | ~₹1,700/mo ($20) | 50,000 emails/month | Unnecessary at launch volume |

**Recommendation:** Free tier is sufficient for a new store.

### 10.5 Domain (One-Time, Yearly)

| Option | Cost/year | Pros | Cons |
|---|---|---|---|
| `.in` (Hostinger/Namecheap) | ~₹500–700 | Cheapest, signals an Indian business | Marginally less globally recognized than `.com` |
| `.com` (Namecheap/GoDaddy) | ~₹800–1,200 | Most recognized, easiest for customers to recall | Higher cost; desired name may be unavailable |

### 10.6 Recommended Bundles

| Bundle | Monthly Cost | Stack | Best For |
|---|---|---|---|
| Tier 1 — Free | ₹0 (+ domain, one-time yearly) | Cloudflare Pages + Render (app) + Neon (database) + Cloudinary free + Resend free | Build and test phase, or the first 1–2 months live at low order volume |
| Tier 2 — Budget (recommended default) | ~₹430–500 (+ domain) | Cloudflare Pages + Railway Hobby (app only) + Neon (database, free) + Cloudinary free + Resend free | Live store taking real orders — always-on backend at low cost, database stays free and permanent |
| Tier 3 — Growth | ~₹1,700–2,100 (+ domain) | Vercel Pro or Railway Pro (app), Neon paid tier if storage/compute needs exceed the free allowance | Justified only once traffic or team size genuinely requires it |

Tier 2 fits comfortably within the ₹500–2,000/month budget and is the recommended starting point once the site is live and processing orders. Because the database sits on Neon's free tier independently of app hosting, the ₹430/month Railway cost is unlikely to grow until traffic is substantial.

---

## 11. Payment Gateway (PhonePe)

### 11.1 Fees

- Standard rate: **1.95% per successful transaction**, across UPI, cards, and net banking
- No setup fee, no annual maintenance charge — cost is incurred only on successful transactions, same structure as Razorpay
- PhonePe is currently running a promotional zero-processing-fee offer for new merchants. Treat this as time-limited (Section 1) — the 1.95% figure is what to budget against; the promotion is a bonus if still running at onboarding, not something to rely on
- On a ₹1,000 order at the standard rate: approximately ₹19.50 — modestly cheaper than Razorpay's ~2.36%

### 11.2 KYC Requirements (Sole Proprietorship)

Zeroplus, as an existing physical shop, will most likely register as a Sole Proprietorship. Documentation categories PhonePe requires are broadly the same class of documents as any RBI-regulated Indian payment gateway:

- Identity documents: PAN, plus a second ID (Aadhaar, passport, driving license, or similar)
- Business registration proof: incorporation/registration documents appropriate to the business type — for a sole proprietorship, typically Shop & Establishment Certificate, Udyam registration, or GST certificate, along with PAN and GSTIN if applicable
- Bank account details for settlement — matching the business/proprietor name

The exact document checklist is confirmed during onboarding on the PhonePe Business Dashboard; treat the above as the shape of what's needed, and verify the final list directly with PhonePe rather than assuming it's identical to Razorpay's.

### 11.3 Process Notes

- Onboarding is digital, through the PhonePe Business Dashboard — PhonePe advertises "instant, paperless onboarding" for standard merchants
- Integration options: Standard Checkout (hosted payment page, no PCI-DSS burden on Zeroplus), or Custom APIs for a more tailored flow. Section 6.3 uses Standard Checkout, the simpler of the two for a first build
- No official Node.js SDK — PhonePe's first-party SDKs cover PHP, Java, Python, and Flutter. The Node/Express backend calls the REST API directly: build the request payload, compute the required checksum (SHA-256, via Node's built-in `crypto` module), and POST it. This is a small amount of extra manual work compared to Razorpay's plug-and-play `razorpay` npm package, but is a well-documented, mechanical integration
- A live Refund & Cancellation policy and Shipping policy page are required on the site before go-live approval, same as with any Indian payment gateway
- GST is not universally mandatory for small sellers (general threshold for goods is ₹40 lakh annual turnover in Kerala, a non-special-category state), but having Shop Act/Udyam registration ready smooths onboarding regardless. Confirm exact applicability with a local chartered accountant — this document does not constitute tax or legal advice.

---

## 12. Delivery & Logistics

A two-tier delivery model is recommended.

### 12.1 Tier 1 — Local Delivery (Kothamangalam and surrounding area, approx. 15–20 km radius)

- Self-delivery using shop staff or a two-wheeler, bypassing courier companies entirely
- Cost: negligible — typically ₹0–40 in fuel/handling, no per-shipment courier fee
- Same-day or next-day delivery achievable
- COD cash collected directly at the doorstep; online payment already settled at checkout
- Managed manually from the admin panel: status progresses "Out for Delivery" → "Delivered"

### 12.2 Tier 2 — Rest of Kerala and Rest of India

Use a courier aggregator — Shiprocket or NimbusPost — rather than contracting a single courier directly. Aggregators pool volume across thousands of small sellers to access 15–40+ courier partners (Delhivery, Xpressbees, DTDC, Ecom Express, India Post) at discounted rates, and let the cheapest available option be selected per shipment. Both offer free signup with no monthly commitment; cost is per-shipment only, which suits unpredictable early-stage volume.

| Zone | Coverage | Indicative rate (per 500g) | Typically cheapest via |
|---|---|---|---|
| A | Local (Kothamangalam) | — | Self-delivery (skip courier) |
| B | Rest of Kerala / neighbouring states | ~₹30–45 | Xpressbees, Delhivery |
| C | Rest of South/West India | ~₹45–60 | Delhivery, DTDC |
| D | North/East India | ~₹55–75 | Delhivery, India Post |
| E | Remote/Northeast/islands | Varies | India Post — reaches 27,000+ pin codes private couriers skip |

### 12.3 Cash-on-Delivery Costs

- COD adds an additional ₹25–80 per order: a flat handling fee (~₹15–30) plus 0.5–2% of order value
- Return-to-Origin (RTO — customer refuses or is unavailable) runs 15–25% on COD orders versus 2–5% on prepaid; each RTO costs forward shipping, return shipping, the COD fee, and wasted packaging
- Mitigation: confirm COD orders via WhatsApp or call before shipping (reduces RTO substantially), offer a small discount for prepaid orders, and consider disabling COD below a minimum order value
- Recommendation: pass a ₹30–40 COD handling fee to the customer at checkout to protect margin and filter low-intent orders

### 12.4 Money Flow, End to End

1. Customer pays online (PhonePe) or selects COD at checkout.
2. Online payments settle to Zeroplus's bank account per PhonePe's settlement cycle, net of the ~1.95% gateway fee.
3. Order is packed and handed to delivery — self-delivery for Zone A, courier aggregator for Zones B–E.
4. For COD, the courier collects cash on delivery and remits it to Zeroplus's bank account on the aggregator's schedule (daily to weekly depending on plan), net of shipping and COD handling fees.
5. All shipments and remittances are tracked from a single aggregator dashboard, regardless of which underlying courier fulfilled each order.

### 12.5 Setup

Create a free account with Shiprocket or NimbusPost, register the pickup location (the Kothamangalam store), and either call their rate API from checkout to show a live delivery estimate, or start with a small set of flat zone-based rates for simplicity at launch and automate later once volume justifies it.

### 12.6 "Track with Courier" Link

The order tracking page's courier-tracking link should only appear once `Order.trackingNumber` is set — before that (Placed/Confirmed/Packed), there's nothing to track yet, so hide the control entirely rather than showing a dead link. Once set, point it at the aggregator's own tracking page (Shiprocket and NimbusPost both provide a generic tracking URL that auto-detects the actual courier from the tracking number), not a specific courier's site — since which courier fulfilled a given shipment varies per Section 12.2.

---

## 13. Legal & Compliance

- Shop & Establishment license (or equivalent) required for PhonePe KYC if not already held for the physical store
- GST registration: not mandatory below the ₹40 lakh annual turnover threshold for goods in Kerala, but confirm current applicability with a local CA, particularly given evolving payment-gateway onboarding requirements
- Refund/Cancellation, Shipping, Privacy, and Terms policy pages must be live before PhonePe go-live approval
- This document does not constitute legal or tax advice; consult a qualified professional for the business's specific circumstances

---

## 14. Marketing Basics

- Google Business Profile for the physical Kothamangalam store, linked to the website — significant for local search intent ("baby shop near me")
- Submit sitemap to Google Search Console at launch
- WhatsApp catalog/chat button on every product page
- Instagram/Facebook presence linked back to the site

---

## 15. Content Required From the Owner

This is the one dependency neither developer directly controls, and it gates Week 6–7 of the timeline (Section 9). Assign one person to collect it and set a deadline against the timeline, rather than waiting for it to arrive organically.

### 15.1 Per Product

| Item | Notes |
|---|---|
| Product photos | Minimum 2–3 images per product, ideally on a plain background; more for the main image if it will be used as a hero/featured image |
| Product name | |
| Category | Which existing category it belongs to, or a new one to create |
| Description | A few sentences — what it is, what it's for |
| Variants | Sizes/colors available, and price for each |
| Stock quantity | Per variant, at launch |
| Brand | If applicable |
| Safety/ingredient info | Especially relevant for baby products — skin-contact items, feeding items, and cosmetics should have this filled in before launch, not added later |
| Certifications (optional) | Any of "Dermatologically Tested," "Hypoallergenic," "BPA Free," etc. that genuinely apply — shown as badges (Section 5), not claimed by default |
| Owner highlight text (optional) | The short floating badge text from Section 2.1 (e.g. "Best for rainy season") — only for products the owner specifically wants to call out; most products will not have one, and that is the expected default |

### 15.2 Per Kit

| Item | Notes |
|---|---|
| Kit name and description | e.g. "Newborn Essentials Kit" |
| Kit image | One hero image |
| Kit base price | The combined price — should read as a genuine saving over buying the items separately, or there's little reason for a customer to pick it |
| Slots | What choices make up the kit (e.g. "a diaper pack", "a feeding bottle") and how many slots total |
| Eligible options per slot | Which existing products/variants the customer can choose from for each slot, and whether any option should cost more than the base price (the `priceAdjustment` in Section 5) |

### 15.3 Store-Wide

| Item | Notes |
|---|---|
| Store logo | Vector or high-resolution version |
| Homepage hero banner images | For the homepage hero carousel only (admin Banners section) |
| Category tile images | One per category, attached in the admin Categories screen — separate from the hero banners above |
| Business phone number and email | For the footer and Contact page |
| Physical store address | For the footer map and About/Contact pages |
| Social media links | Instagram/Facebook, if active |
| Return/refund policy specifics | Drafted — see `zeroplus-return-policy.md`: 7-day window, unused/unworn/sealed condition required, damaged/defective items returned free, unboxing video recommended for damage claims. Owner to confirm contact details, refund timing, and sign off before publishing to `/policies/shipping-returns` |
| Delivery charge structure | Confirm the zone-based rates in Section 12.2 match what the owner wants to charge customers, or provide their own figures |
| Testimonials (optional) | Any existing customer reviews or quotes the owner wants featured on the homepage |
| Business documents for KYC | PAN, ID, bank proof, Shop & Establishment/Udyam certificate — see Section 11.2. Same person collecting product content should also be the one chasing these, since both come from the owner |

### 15.4 Timing

Product content, kit definitions, and store-wide content are needed by Week 6 (Section 9) to stay on schedule — this is when real content replaces the seed/dummy data used during development. Kit content specifically only needs to be ready by Week 9, when that feature is actually built (Section 9). KYC documents (15.3, last row) should be collected far earlier, in Week 1, since PhonePe and MSG91 approval both take independent lead time and are not on the critical path of any coding task.

---

## 16. Launch Checklist

- [ ] Wireframes finalized
- [ ] Domain registered
- [ ] Repository set up, API contract (Section 6) agreed
- [ ] PhonePe KYC submitted
- [ ] Google OAuth client credentials created
- [ ] MSG91 account created, DLT registration submitted
- [ ] Cloudinary, Resend, Railway, Cloudflare Pages, Neon accounts created
- [ ] Two Neon projects created (`zeroplus-dev`, `zeroplus-prod`), kept separate throughout
- [ ] Backend: schema, auth (email/password + Google), product APIs complete
- [ ] Frontend: home/shop/product pages functional against live data
- [ ] Cart and checkout integrated, guest checkout working end to end
- [ ] PhonePe integrated (sandbox/test environment verified)
- [ ] OTP flow integrated for COD orders and password reset (test verified)
- [ ] Admin panel functional, including owner-highlight field on products; first admin seeded via script
- [ ] Policy pages published (required for PhonePe go-live)
- [ ] Content received from owner (Section 15) and loaded
- [ ] End-to-end order test completed (COD, PhonePe, and guest checkout)
- [ ] PhonePe switched to live mode; site deployed
- [ ] Google Business Profile and Search Console configured

**Fast-follow (Week 9, per Section 9 — not required for initial launch):**
- [ ] Kit content received from owner (Section 15.2) and loaded
- [ ] Kit builder page and admin kit management functional
- [ ] Kit selection validation tested (cannot submit an invalid/unlisted combination)
- [ ] Kit stock deduction tested end to end
