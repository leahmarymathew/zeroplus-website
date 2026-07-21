import type { ApiResult } from "@/lib/types";
import { MOCK_BANNERS, type Banner } from "@/lib/mock/banners";
import { delay } from "@/lib/api/delay";
import { api, unwrap, USE_MOCKS } from "@/lib/api/client";

const STORAGE_KEY = "zeroplus-admin-banners";

function readBanners(): Banner[] {
  if (typeof window === "undefined") return MOCK_BANNERS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    writeBanners(MOCK_BANNERS);
    return MOCK_BANNERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return MOCK_BANNERS;
  }
}

function writeBanners(banners: Banner[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banners));
}

export async function getAdminBanners(): Promise<ApiResult<Banner[]>> {
  if (!USE_MOCKS) return unwrap<Banner[]>(api.get("/admin/banners"));
  await delay(150);
  return { success: true, data: [...readBanners()].sort((a, b) => a.sortOrder - b.sortOrder) };
}

export async function addBanner(title: string): Promise<ApiResult<Banner>> {
  if (!USE_MOCKS) return unwrap<Banner>(api.post("/admin/banners", { title }));
  await delay(200);
  const banners = readBanners();
  const banner: Banner = {
    id: crypto.randomUUID(),
    slotLabel: `Homepage Hero — Slide ${banners.length + 1}`,
    title,
    imageUrl: null,
    status: "ACTIVE",
    sortOrder: banners.length,
  };
  banners.push(banner);
  writeBanners(banners);
  return { success: true, data: banner };
}

export async function removeBanner(id: string): Promise<ApiResult<{ id: string }>> {
  if (!USE_MOCKS) return unwrap<{ id: string }>(api.delete(`/admin/banners/${id}`));
  await delay(150);
  const remaining = readBanners()
    .filter((b) => b.id !== id)
    .map((b, i) => ({ ...b, sortOrder: i, slotLabel: `Homepage Hero — Slide ${i + 1}` }));
  writeBanners(remaining);
  return { success: true, data: { id } };
}
