import type { ApiResult, Kit } from "@/lib/types";
import { MOCK_KITS } from "@/lib/mock/kits";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// GET /v1/kits — Section 6.2
export async function getKits(): Promise<ApiResult<Kit[]>> {
  if (!USE_MOCKS) return unwrap<Kit[]>(api.get("/kits"));
  await delay(150);
  return { success: true, data: MOCK_KITS.filter((k) => k.isActive) };
}

// GET /v1/kits/:slug — Section 6.2/6.3
export async function getKit(slug: string): Promise<ApiResult<Kit>> {
  if (!USE_MOCKS) return unwrap<Kit>(api.get(`/kits/${slug}`));
  await delay();
  const kit = MOCK_KITS.find((k) => k.slug === slug && k.isActive);
  if (!kit) {
    return { success: false, error: { code: "NOT_FOUND", message: "Kit not found" } };
  }
  return { success: true, data: kit };
}
