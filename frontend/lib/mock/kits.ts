import type { Kit } from "@/lib/types";

// Placeholder kit catalog — matches Section 5's Kit/KitSlot/KitSlotOption
// shape exactly. Every option's productVariantId references a real variant
// in lib/mock/products.ts, same as the plan requires for the real catalog
// (kits are built from existing products, not separate kit-only items).

const now = new Date("2026-07-01T00:00:00.000Z").toISOString();

export const MOCK_KITS: Kit[] = [
  {
    id: "kit_1",
    name: "Newborn Essentials Kit",
    slug: "newborn-essentials-kit",
    description:
      "Everything for the first weeks home — diapers, a feeding bottle, lotion, and onesies bundled together at a better price than buying separately.",
    basePrice: 1999,
    imageUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    slots: [
      {
        id: "kit_1_slot_diaper",
        kitId: "kit_1",
        label: "Choose a diaper size",
        sortOrder: 1,
        options: [
          { id: "kit_1_slot_diaper_opt_nb", kitSlotId: "kit_1_slot_diaper", productVariantId: "prod_1_nb", productName: "Sample Product 1 — Diapers", variantLabel: "NB", priceAdjustment: 0 },
          { id: "kit_1_slot_diaper_opt_s", kitSlotId: "kit_1_slot_diaper", productVariantId: "prod_1_s", productName: "Sample Product 1 — Diapers", variantLabel: "S", priceAdjustment: 0 },
          { id: "kit_1_slot_diaper_opt_m", kitSlotId: "kit_1_slot_diaper", productVariantId: "prod_1_m", productName: "Sample Product 1 — Diapers", variantLabel: "M", priceAdjustment: 50 },
        ],
      },
      {
        id: "kit_1_slot_bottle",
        kitId: "kit_1",
        label: "Choose a feeding bottle size",
        sortOrder: 2,
        options: [
          { id: "kit_1_slot_bottle_opt_125", kitSlotId: "kit_1_slot_bottle", productVariantId: "prod_4_125ml", productName: "Sample Product 4 — Feeding", variantLabel: "125ml", priceAdjustment: 0 },
          { id: "kit_1_slot_bottle_opt_250", kitSlotId: "kit_1_slot_bottle", productVariantId: "prod_4_250ml", productName: "Sample Product 4 — Feeding", variantLabel: "250ml", priceAdjustment: 50 },
        ],
      },
      {
        id: "kit_1_slot_lotion",
        kitId: "kit_1",
        label: "Choose a baby lotion size",
        sortOrder: 3,
        options: [
          { id: "kit_1_slot_lotion_opt_200", kitSlotId: "kit_1_slot_lotion", productVariantId: "prod_10_200ml", productName: "Sample Product 10 — Skincare", variantLabel: "200ml", priceAdjustment: 0 },
          { id: "kit_1_slot_lotion_opt_400", kitSlotId: "kit_1_slot_lotion", productVariantId: "prod_10_400ml", productName: "Sample Product 10 — Skincare", variantLabel: "400ml", priceAdjustment: 250 },
        ],
      },
      {
        id: "kit_1_slot_onesie",
        kitId: "kit_1",
        label: "Choose onesie size",
        sortOrder: 4,
        options: [
          { id: "kit_1_slot_onesie_opt_03", kitSlotId: "kit_1_slot_onesie", productVariantId: "prod_7_0-3m", productName: "Sample Product 7 — Clothing", variantLabel: "0-3m", priceAdjustment: 0 },
          { id: "kit_1_slot_onesie_opt_36", kitSlotId: "kit_1_slot_onesie", productVariantId: "prod_7_3-6m", productName: "Sample Product 7 — Clothing", variantLabel: "3-6m", priceAdjustment: 0 },
          { id: "kit_1_slot_onesie_opt_69", kitSlotId: "kit_1_slot_onesie", productVariantId: "prod_7_6-9m", productName: "Sample Product 7 — Clothing", variantLabel: "6-9m", priceAdjustment: 40 },
        ],
      },
    ],
  },
  {
    id: "kit_2",
    name: "Travel Kit",
    slug: "travel-kit",
    description: "A grab-and-go bundle for outings and short trips — compact diaper pack, a feeding bottle, and an easy outfit.",
    basePrice: 1299,
    imageUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    slots: [
      {
        id: "kit_2_slot_diaper",
        kitId: "kit_2",
        label: "Choose a diaper pack",
        sortOrder: 1,
        options: [
          { id: "kit_2_slot_diaper_opt_s", kitSlotId: "kit_2_slot_diaper", productVariantId: "prod_2_s", productName: "Sample Product 2 — Diapers", variantLabel: "S", priceAdjustment: 0 },
          { id: "kit_2_slot_diaper_opt_m", kitSlotId: "kit_2_slot_diaper", productVariantId: "prod_2_m", productName: "Sample Product 2 — Diapers", variantLabel: "M", priceAdjustment: 40 },
        ],
      },
      {
        id: "kit_2_slot_bottle",
        kitId: "kit_2",
        label: "Choose a feeding bottle size",
        sortOrder: 2,
        options: [
          { id: "kit_2_slot_bottle_opt_125", kitSlotId: "kit_2_slot_bottle", productVariantId: "prod_4_125ml", productName: "Sample Product 4 — Feeding", variantLabel: "125ml", priceAdjustment: 0 },
          { id: "kit_2_slot_bottle_opt_250", kitSlotId: "kit_2_slot_bottle", productVariantId: "prod_4_250ml", productName: "Sample Product 4 — Feeding", variantLabel: "250ml", priceAdjustment: 50 },
        ],
      },
      {
        id: "kit_2_slot_outfit",
        kitId: "kit_2",
        label: "Choose an outfit size",
        sortOrder: 3,
        options: [
          { id: "kit_2_slot_outfit_opt_36", kitSlotId: "kit_2_slot_outfit", productVariantId: "prod_9_3-6m", productName: "Sample Product 9 — Clothing", variantLabel: "3-6m", priceAdjustment: 0 },
          { id: "kit_2_slot_outfit_opt_612", kitSlotId: "kit_2_slot_outfit", productVariantId: "prod_9_6-12m", productName: "Sample Product 9 — Clothing", variantLabel: "6-12m", priceAdjustment: 30 },
        ],
      },
    ],
  },
  {
    id: "kit_3",
    name: "Bath Time Kit",
    slug: "bath-time-kit",
    description: "Gentle bath and skincare essentials in one bundle — lotion, a diaper pack, and a wipes pack.",
    basePrice: 1099,
    imageUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    slots: [
      {
        id: "kit_3_slot_lotion",
        kitId: "kit_3",
        label: "Choose a baby lotion size",
        sortOrder: 1,
        options: [
          { id: "kit_3_slot_lotion_opt_200", kitSlotId: "kit_3_slot_lotion", productVariantId: "prod_10_200ml", productName: "Sample Product 10 — Skincare", variantLabel: "200ml", priceAdjustment: 0 },
          { id: "kit_3_slot_lotion_opt_400", kitSlotId: "kit_3_slot_lotion", productVariantId: "prod_10_400ml", productName: "Sample Product 10 — Skincare", variantLabel: "400ml", priceAdjustment: 250 },
        ],
      },
      {
        id: "kit_3_slot_diaper",
        kitId: "kit_3",
        label: "Choose a diaper size",
        sortOrder: 2,
        options: [
          { id: "kit_3_slot_diaper_opt_nb", kitSlotId: "kit_3_slot_diaper", productVariantId: "prod_1_nb", productName: "Sample Product 1 — Diapers", variantLabel: "NB", priceAdjustment: 0 },
          { id: "kit_3_slot_diaper_opt_s", kitSlotId: "kit_3_slot_diaper", productVariantId: "prod_1_s", productName: "Sample Product 1 — Diapers", variantLabel: "S", priceAdjustment: 0 },
        ],
      },
      {
        id: "kit_3_slot_wipes",
        kitId: "kit_3",
        label: "Choose a wipes pack",
        sortOrder: 3,
        options: [
          { id: "kit_3_slot_wipes_opt_80", kitSlotId: "kit_3_slot_wipes", productVariantId: "prod_12_pack-of-80", productName: "Sample Product 12 — Skincare", variantLabel: "Pack of 80", priceAdjustment: 0 },
        ],
      },
    ],
  },
];
