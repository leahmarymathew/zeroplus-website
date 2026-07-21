import axios, { type AxiosResponse } from "axios";
import type { ApiResult } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

// Flip to the real backend by setting NEXT_PUBLIC_USE_MOCKS=false (and
// NEXT_PUBLIC_API_BASE_URL) in .env.local. Defaults to mocks so the frontend
// still builds/runs with no backend. Every api function checks USE_MOCKS and
// falls back to its in-memory mock when true.
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/v1",
  withCredentials: true, // carries the guestId + refresh cookies (browser only)
});

// Attach the access token when one is present. On the server (RSC) the store
// is empty, which is fine — server components only read public endpoints.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
