import type { ApiResult, Banner } from "@/lib/types";
import { MOCK_BANNERS } from "@/lib/mock/banners";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// GET /v1/banners — public, active homepage hero slides only, in display
// order. Used by the homepage hero section; distinct from the admin CRUD at
// lib/api/admin/banners.ts (which also lists SCHEDULED slides).
export async function getBanners(): Promise<ApiResult<Banner[]>> {
  if (!USE_MOCKS) return unwrap<Banner[]>(api.get("/banners"));
  await delay(100);
  return {
    success: true,
    data: MOCK_BANNERS.filter((b) => b.status === "ACTIVE").sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
