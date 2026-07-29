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
    videoUrl: null,
    status: "ACTIVE",
    sortOrder: banners.length,
  };
  banners.push(banner);
  writeBanners(banners);
  return { success: true, data: banner };
}

// PATCH /v1/admin/banners/:id — sets a slide's image or video (a slide is one
// or the other; setting one doesn't clear the other server-side, so the
// caller should pass the one being replaced).
export async function updateBanner(
  id: string,
  input: { title?: string; imageUrl?: string | null; videoUrl?: string | null; status?: Banner["status"] }
): Promise<ApiResult<Banner>> {
  if (!USE_MOCKS) return unwrap<Banner>(api.patch(`/admin/banners/${id}`, input));
  await delay(200);
  const banners = readBanners();
  const index = banners.findIndex((b) => b.id === id);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Banner not found" } };
  }
  const updated = { ...banners[index], ...input };
  banners[index] = updated;
  writeBanners(banners);
  return { success: true, data: updated };
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
