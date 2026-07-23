import type { ApiResult, User } from "@/lib/types";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// Shape returned by /auth/login, /auth/register, /auth/refresh, /auth/google.
export interface AuthSession {
  accessToken: string;
  user: User;
}

function mockUser(partial: Partial<User>): User {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: partial.name ?? "Sample User",
    email: partial.email ?? null,
    phone: partial.phone ?? "9800000000",
    role: partial.role ?? "CUSTOMER",
    createdAt: now,
    updatedAt: now,
  };
}

function mockSession(user: User): ApiResult<AuthSession> {
  return { success: true, data: { accessToken: `mock.${user.id}`, user } };
}

// POST /v1/auth/login — identifier is a phone number OR an email; the backend
// resolves by shape (Section 6.1).
export async function login(identifier: string, password: string): Promise<ApiResult<AuthSession>> {
  if (!USE_MOCKS) return unwrap<AuthSession>(api.post("/auth/login", { identifier, password }));
  await delay(200);
  const isEmail = identifier.includes("@");
  // Mock mode has no real backend to check roles against, so /admin/login's
  // ADMIN gate would otherwise reject every login. Any identifier containing
  // "admin" (e.g. admin@zeroplus.com) mocks an admin account so the admin UI
  // is reachable without a backend, matching the customer flow's no-backend story.
  const role = identifier.toLowerCase().includes("admin") ? "ADMIN" : "CUSTOMER";
  return mockSession(mockUser({ email: isEmail ? identifier : null, phone: isEmail ? "9800000000" : identifier, role }));
}

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string | null;
  password: string;
}

// POST /v1/auth/register — email is optional.
export async function register(input: RegisterInput): Promise<ApiResult<AuthSession>> {
  if (!USE_MOCKS) return unwrap<AuthSession>(api.post("/auth/register", input));
  await delay(200);
  return mockSession(mockUser({ name: input.name, phone: input.phone, email: input.email || null }));
}

// POST /v1/auth/google — placeholder until a real OAuth client id exists; the
// backend returns 503 SERVICE_UNAVAILABLE when Google sign-in isn't configured.
export async function loginWithGoogle(idToken: string): Promise<ApiResult<AuthSession>> {
  if (!USE_MOCKS) return unwrap<AuthSession>(api.post("/auth/google", { idToken }));
  await delay(200);
  return mockSession(mockUser({ email: "google@example.com" }));
}

// POST /v1/auth/refresh — reads the httpOnly refresh cookie; no body.
export async function refresh(): Promise<ApiResult<AuthSession>> {
  if (!USE_MOCKS) return unwrap<AuthSession>(api.post("/auth/refresh"));
  return { success: false, error: { code: "UNAUTHORIZED", message: "No session" } };
}

// POST /v1/auth/logout — clears the refresh cookie server-side.
export async function logout(): Promise<ApiResult<{ loggedOut: true }>> {
  if (!USE_MOCKS) return unwrap<{ loggedOut: true }>(api.post("/auth/logout"));
  await delay(100);
  return { success: true, data: { loggedOut: true } };
}

// POST /v1/auth/forgot-password — always resolves the same way whether or not
// the phone is registered (never leaks which numbers exist).
export async function forgotPassword(
  phone: string
): Promise<ApiResult<{ otpId: string; expiresInSeconds: number }>> {
  if (!USE_MOCKS) {
    return unwrap<{ otpId: string; expiresInSeconds: number }>(
      api.post("/auth/forgot-password", { phone })
    );
  }
  await delay(200);
  return { success: true, data: { otpId: `mock-otp-${Date.now()}`, expiresInSeconds: 300 } };
}

// POST /v1/auth/reset-password
export async function resetPassword(input: {
  otpId: string;
  code: string;
  newPassword: string;
}): Promise<ApiResult<{ reset: true }>> {
  if (!USE_MOCKS) return unwrap<{ reset: true }>(api.post("/auth/reset-password", input));
  await delay(200);
  return { success: true, data: { reset: true } };
}
