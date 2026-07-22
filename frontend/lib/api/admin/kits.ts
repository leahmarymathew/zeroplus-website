import type { ApiResult, Kit, KitSlot } from "@/lib/types";
import { MOCK_KITS } from "@/lib/mock/kits";
import { delay } from "@/lib/api/delay";
import { api, unwrap, USE_MOCKS } from "@/lib/api/client";

// The backend kit schema takes only { label, options:[{productVariantId,
// priceAdjustment?}] }; productName/variantLabel are display-only and dropped.
function toKitPayload(input: KitFormInput) {
  return {
    name: input.name,
    description: input.description,
    basePrice: input.basePrice,
    imageUrl: input.imageUrl,
    isActive: input.isActive,
    slots: input.slots.map((slot) => ({
      label: slot.label,
      options: slot.options.map((o) => ({
        productVariantId: o.productVariantId,
        priceAdjustment: o.priceAdjustment,
      })),
    })),
  };
}

const STORAGE_KEY = "zeroplus-admin-kits";

function readKits(): Kit[] {
  if (typeof window === "undefined") return MOCK_KITS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    writeKits(MOCK_KITS);
    return MOCK_KITS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return MOCK_KITS;
  }
}

function writeKits(kits: Kit[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kits));
}

// GET /v1/admin/kits view — Section 2.2 (includes inactive kits, unlike
// the public GET /v1/kits)
export async function getAdminKits(): Promise<ApiResult<Kit[]>> {
  if (!USE_MOCKS) return unwrap<Kit[]>(api.get("/admin/kits"));
  await delay(150);
  return { success: true, data: readKits() };
}

export async function getAdminKit(id: string): Promise<ApiResult<Kit>> {
  if (!USE_MOCKS) return unwrap<Kit>(api.get(`/admin/kits/${id}`));
  await delay(150);
  const kit = readKits().find((k) => k.id === id);
  if (!kit) {
    return { success: false, error: { code: "NOT_FOUND", message: "Kit not found" } };
  }
  return { success: true, data: kit };
}

interface KitFormSlot {
  label: string;
  options: { productVariantId: string; productName: string; variantLabel: string; priceAdjustment: number | null }[];
}

export type KitFormInput = Omit<Kit, "id" | "slug" | "createdAt" | "updatedAt" | "slots"> & {
  slots: KitFormSlot[];
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSlots(kitId: string, slots: KitFormInput["slots"]): KitSlot[] {
  return slots.map((slot, i) => ({
    id: `${kitId}_slot_${i}`,
    kitId,
    label: slot.label,
    sortOrder: i,
    options: slot.options.map((opt, j) => ({
      ...opt,
      id: `${kitId}_slot_${i}_opt_${j}`,
      kitSlotId: `${kitId}_slot_${i}`,
    })),
  }));
}

// POST /v1/admin/kits — Section 6.2
export async function createKit(input: KitFormInput): Promise<ApiResult<Kit>> {
  if (!USE_MOCKS) return unwrap<Kit>(api.post("/admin/kits", toKitPayload(input)));
  await delay(200);
  const kits = readKits();
  const id = `kit_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const kit: Kit = {
    ...input,
    id,
    slug: slugify(input.name) || id,
    createdAt: now,
    updatedAt: now,
    slots: buildSlots(id, input.slots),
  };
  kits.unshift(kit);
  writeKits(kits);
  return { success: true, data: kit };
}

// PATCH /v1/admin/kits/:id — Section 6.2 (replaces slots/options wholesale)
export async function updateKit(id: string, input: KitFormInput): Promise<ApiResult<Kit>> {
  if (!USE_MOCKS) return unwrap<Kit>(api.patch(`/admin/kits/${id}`, toKitPayload(input)));
  await delay(200);
  const kits = readKits();
  const index = kits.findIndex((k) => k.id === id);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Kit not found" } };
  }
  const updated: Kit = {
    ...kits[index],
    ...input,
    updatedAt: new Date().toISOString(),
    slots: buildSlots(id, input.slots),
  };
  kits[index] = updated;
  writeKits(kits);
  return { success: true, data: updated };
}

// DELETE /v1/admin/kits/:id — Section 6.2
export async function deleteKit(id: string): Promise<ApiResult<{ id: string }>> {
  if (!USE_MOCKS) return unwrap<{ id: string }>(api.delete(`/admin/kits/${id}`));
  await delay(150);
  writeKits(readKits().filter((k) => k.id !== id));
  return { success: true, data: { id } };
}

// Convenience for the Kits list's active/inactive toggle switch
export async function setKitActive(id: string, isActive: boolean): Promise<ApiResult<Kit>> {
  if (!USE_MOCKS) return unwrap<Kit>(api.patch(`/admin/kits/${id}/active`, { isActive }));
  await delay(150);
  const kits = readKits();
  const index = kits.findIndex((k) => k.id === id);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Kit not found" } };
  }
  kits[index] = { ...kits[index], isActive, updatedAt: new Date().toISOString() };
  writeKits(kits);
  return { success: true, data: kits[index] };
}
