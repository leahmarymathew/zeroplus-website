import type { Address, ApiResult, Wishlist } from "@/lib/types";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// Addresses + wishlist — authenticated customer resources (Section 6.2).
// The customer token is attached by the client interceptor. In mock mode these
// resolve to empty/echo values so pages that call them offline don't error; the
// local zustand stores remain the offline source of truth for the UI.

export type AddressInput = Omit<Address, "id" | "userId">;

// GET /v1/addresses
export async function getAddresses(): Promise<ApiResult<Address[]>> {
  if (!USE_MOCKS) return unwrap<Address[]>(api.get("/addresses"));
  await delay(100);
  return { success: true, data: [] };
}

// POST /v1/addresses
export async function createAddress(input: AddressInput): Promise<ApiResult<Address>> {
  if (!USE_MOCKS) return unwrap<Address>(api.post("/addresses", input));
  await delay(100);
  return { success: true, data: { ...input, id: crypto.randomUUID(), userId: "mock" } };
}

// PATCH /v1/addresses/:id
export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<ApiResult<Address>> {
  if (!USE_MOCKS) return unwrap<Address>(api.patch(`/addresses/${id}`, input));
  await delay(100);
  return { success: true, data: { id, userId: "mock", ...(input as AddressInput) } };
}

// DELETE /v1/addresses/:id
export async function deleteAddress(id: string): Promise<ApiResult<{ deleted: true }>> {
  if (!USE_MOCKS) return unwrap<{ deleted: true }>(api.delete(`/addresses/${id}`));
  await delay(100);
  return { success: true, data: { deleted: true } };
}

// GET /v1/wishlist — rows of { productId }; the page hydrates products from the
// catalog API.
export async function getWishlist(): Promise<ApiResult<Wishlist[]>> {
  if (!USE_MOCKS) return unwrap<Wishlist[]>(api.get("/wishlist"));
  await delay(100);
  return { success: true, data: [] };
}

// POST /v1/wishlist
export async function addToWishlist(productId: string): Promise<ApiResult<Wishlist>> {
  if (!USE_MOCKS) return unwrap<Wishlist>(api.post("/wishlist", { productId }));
  await delay(100);
  return {
    success: true,
    data: { id: crypto.randomUUID(), userId: "mock", productId, createdAt: new Date().toISOString() },
  };
}

// DELETE /v1/wishlist/:productId
export async function removeFromWishlist(productId: string): Promise<ApiResult<{ deleted: true }>> {
  if (!USE_MOCKS) return unwrap<{ deleted: true }>(api.delete(`/wishlist/${productId}`));
  await delay(100);
  return { success: true, data: { deleted: true } };
}
