import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { ApiResult } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useAdminAuthStore } from "@/store/adminAuthStore";

// Flip to the real backend by setting NEXT_PUBLIC_USE_MOCKS=false (and
// NEXT_PUBLIC_API_BASE_URL) in .env.local. Defaults to mocks so the frontend
// still builds/runs with no backend. Every api function checks USE_MOCKS and
// falls back to its in-memory mock when true.
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1",
  withCredentials: true, // carries the guestId + refresh cookies (browser only)
});

// Admin-scoped endpoints (require an ADMIN token): the whole /admin/* tree plus
// image uploads, which the backend also gates behind requireAdmin. Everything
// else uses the customer token.
function isAdminPath(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/admin") || url.startsWith("/uploads");
}

// Attach the right access token. Admin paths get the admin token; everything
// else the customer token. On the server (RSC) both stores are empty, which is
// fine — server components only read public endpoints.
api.interceptors.request.use((config) => {
  const token = isAdminPath(config.url)
    ? useAdminAuthStore.getState().accessToken
    : useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh the customer access token once on a 401, then replay the request.
// Guards against loops (the refresh call itself, and already-retried requests)
// and against multiple concurrent 401s all refreshing — they share one promise.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await api.post<ApiResult<{ accessToken: string; user: unknown }>>("/auth/refresh");
    if (res.data.success) {
      const { accessToken, user } = res.data.data as { accessToken: string; user: import("@/lib/types").User };
      useAuthStore.getState().login(user, accessToken);
      return accessToken;
    }
  } catch {
    /* fall through to logout */
  }
  useAuthStore.getState().logout();
  return null;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = err.response?.status;
    const isRefreshCall = original?.url?.includes("/auth/refresh");
    // Only customer (non-admin) requests get the silent refresh-and-retry.
    if (status === 401 && original && !original._retried && !isRefreshCall && !isAdminPath(original.url)) {
      original._retried = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

// The backend already returns the exact { success, data, pagination? } /
// { success, error } envelope the frontend's ApiResult expects, so success
// responses pass through unchanged. On an HTTP error axios throws; we return
// the error envelope the server sent (or synthesize one) so callers keep the
// same ApiResult contract they had with the mocks.
export async function unwrap<T>(p: Promise<AxiosResponse<ApiResult<T>>>): Promise<ApiResult<T>> {
  try {
    const res = await p;
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
      const body = err.response.data as ApiResult<T>;
      if ("success" in body) return body;
    }
    return { success: false, error: { code: "NETWORK_ERROR", message: "Could not reach the server" } };
  }
}
