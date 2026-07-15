# Frontend → Backend Integration Guide

The backend (`/backend`) implements every endpoint in the Section 6 contract. Its JSON responses match `frontend/lib/types.ts` **field-for-field** (verified). The frontend's `lib/api/*` functions are currently mock implementations — swapping them to call the backend is the remaining frontend task, and it's a drop-in swap.

## 1. Point the frontend at the backend

`frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/v1
NEXT_PUBLIC_USE_MOCKS=false
```

Run the backend (`cd backend && npm run dev`) alongside `npm run dev` in `frontend`.

## 2. Add a shared HTTP client

Create `frontend/lib/api/client.ts`:
```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // sends the guestId + refreshToken httpOnly cookies
});

// Attach the access token (store it in memory / authStore after login).
api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken; // add accessToken to authStore
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
```

Then each mock function becomes a call, e.g. `lib/api/products.ts`:
```ts
export async function getProducts(params = {}) {
  const { data } = await api.get("/products", { params });
  return data; // already { success, data, pagination }
}
```

## 3. Things to know

- **Envelope**: every response is `{ success, data, pagination? }` or `{ success, error: { code, message } }`. Branch on `error.code` (e.g. `OUT_OF_STOCK`, `OTP_REQUIRED`, `NOT_ELIGIBLE`).
- **Auth**: `POST /v1/auth/login|register|google` return `{ accessToken, user }` and set the refresh cookie. Keep `accessToken` in memory (authStore); call `POST /v1/auth/refresh` (no body, uses the cookie) to get a new one on 401.
- **Cart & guest orders work with no token** — the backend sets a `guestId` cookie automatically (needs `withCredentials: true`). On login the guest cart merges automatically.
- **Checkout** (`POST /v1/orders`) returns the full `Order`, plus `phonepeRedirectUrl` when `paymentMethod: "PHONEPE"` — do `window.location.href = phonepeRedirectUrl`. COD requires `otpId` from the `/v1/otp/send` + `/v1/otp/verify` flow (COD only; prepaid skips OTP).
- **Guest order tracking**: the confirmation email links to `/order-confirmation/{id}?token={guestAccessToken}`; fetch it with `GET /v1/orders/:id?token=...`.
- **Admin**: all `/v1/admin/*` need an admin JWT. Image uploads: `POST /v1/uploads/image` as `multipart/form-data` (field name `file`), returns `{ url }` — send product/category/banner images there first, then save the returned URL.

## 4. Running without third-party keys

The backend runs fully offline: PhonePe returns a mock hosted-page URL that auto-completes payment, OTP codes print to the backend console, uploads return placeholder URLs, emails log to the console. So the whole flow is demoable before any credentials exist. See `backend/README.md`.
