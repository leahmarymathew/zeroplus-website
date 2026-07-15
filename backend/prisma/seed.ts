// Seed — mirrors frontend/lib/mock/* (same ids/slugs/prices) so the frontend
// looks identical when NEXT_PUBLIC_USE_MOCKS is turned off.
//
//   npm run seed                -> admin + full demo catalog (dev)
//   SEED_SCOPE=admin npm run seed -> admin account only (production)
//
// The first admin is created here and only here — never via an endpoint
// (plan Section 7).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Same id derivation as frontend/lib/mock/products.ts `variant()` helper —
// kit slot options below reference these ids.
function variant(
  productId: string,
  label: string,
  price: number,
  stockQty: number,
  compareAtPrice: number | null = null,
) {
  return {
    id: `${productId}_${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label,
    price,
    compareAtPrice,
    stockQty,
    sku: `SKU-${productId.toUpperCase()}-${label.toUpperCase().replace(/[^A-Z0-9]+/g, "")}`,
  };
}

const CATEGORIES = [
  { id: "cat_diapers", name: "Diapers", slug: "diapers" },
  { id: "cat_feeding", name: "Feeding", slug: "feeding" },
  { id: "cat_clothing", name: "Clothing", slug: "clothing" },
  { id: "cat_skincare", name: "Skincare", slug: "skincare" },
  { id: "cat_toys", name: "Toys", slug: "toys" },
];

const PLACEHOLDER_DESC =
  "Placeholder description. Replace with real product copy from the store owner (Section 15.1).";

type SeedProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  brand?: string;
  safetyInfo?: string;
  certifications?: string[];
  ownerHighlight?: string;
  variants: ReturnType<typeof variant>[];
};

const PRODUCTS: SeedProduct[] = [
  {
    id: "prod_1", name: "Sample Product 1 — Diapers", slug: "sample-product-1", categoryId: "cat_diapers",
    brand: "Sample Brand",
    safetyInfo: "Placeholder safety info — no parabens, suitable from birth. Confirm with owner before launch.",
    certifications: ["Dermatologically Tested", "Hypoallergenic"],
    ownerHighlight: "Best for rainy season",
    variants: [
      variant("prod_1", "NB", 449, 40),
      variant("prod_1", "S", 499, 42, 699),
      variant("prod_1", "M", 549, 30, 699),
      variant("prod_1", "L", 599, 18),
    ],
  },
  {
    id: "prod_2", name: "Sample Product 2 — Diapers", slug: "sample-product-2", categoryId: "cat_diapers",
    brand: "Sample Brand", safetyInfo: "Placeholder safety info.", certifications: ["BPA Free"],
    variants: [variant("prod_2", "S", 429, 25), variant("prod_2", "M", 469, 20)],
  },
  {
    id: "prod_3", name: "Sample Product 3 — Diapers (low stock)", slug: "sample-product-3", categoryId: "cat_diapers",
    variants: [variant("prod_3", "M", 389, 3)],
  },
  {
    id: "prod_4", name: "Sample Product 4 — Feeding", slug: "sample-product-4", categoryId: "cat_feeding",
    brand: "Sample Brand",
    safetyInfo: "Placeholder safety info — BPA-free plastic, anti-colic design.",
    certifications: ["BPA Free"],
    variants: [variant("prod_4", "125ml", 299, 50), variant("prod_4", "250ml", 349, 40)],
  },
  {
    id: "prod_5", name: "Sample Product 5 — Feeding", slug: "sample-product-5", categoryId: "cat_feeding",
    brand: "Sample Brand",
    variants: [variant("prod_5", "Standard", 249, 33, 349)],
  },
  {
    id: "prod_6", name: "Sample Product 6 — Feeding (out of stock)", slug: "sample-product-6", categoryId: "cat_feeding",
    variants: [variant("prod_6", "Standard", 199, 0)],
  },
  {
    id: "prod_7", name: "Sample Product 7 — Clothing", slug: "sample-product-7", categoryId: "cat_clothing",
    brand: "Sample Brand",
    safetyInfo: "Placeholder safety info — 100% cotton, soft on skin.",
    certifications: ["Hypoallergenic"],
    variants: [
      variant("prod_7", "0-3m", 399, 22, 549),
      variant("prod_7", "3-6m", 399, 19, 549),
      variant("prod_7", "6-9m", 429, 15),
    ],
  },
  {
    id: "prod_8", name: "Sample Product 8 — Clothing", slug: "sample-product-8", categoryId: "cat_clothing",
    variants: [variant("prod_8", "One Size", 349, 28)],
  },
  {
    id: "prod_9", name: "Sample Product 9 — Clothing", slug: "sample-product-9", categoryId: "cat_clothing",
    brand: "Sample Brand",
    variants: [variant("prod_9", "3-6m", 449, 17), variant("prod_9", "6-12m", 479, 14)],
  },
  {
    id: "prod_10", name: "Sample Product 10 — Skincare", slug: "sample-product-10", categoryId: "cat_skincare",
    brand: "Sample Brand",
    safetyInfo: "Placeholder safety info — dermatologically tested, no added fragrance.",
    certifications: ["Dermatologically Tested", "Hypoallergenic", "BPA Free"],
    ownerHighlight: "Parent favourite",
    variants: [variant("prod_10", "200ml", 349, 45, 449), variant("prod_10", "400ml", 599, 22, 799)],
  },
  {
    id: "prod_11", name: "Sample Product 11 — Skincare", slug: "sample-product-11", categoryId: "cat_skincare",
    certifications: ["Hypoallergenic"],
    variants: [variant("prod_11", "200ml", 279, 38)],
  },
  {
    id: "prod_12", name: "Sample Product 12 — Skincare", slug: "sample-product-12", categoryId: "cat_skincare",
    brand: "Sample Brand",
    variants: [variant("prod_12", "Pack of 80", 149, 60)],
  },
  {
    id: "prod_13", name: "Sample Product 13 — Toys", slug: "sample-product-13", categoryId: "cat_toys",
    safetyInfo: "Placeholder safety info — non-toxic materials, no small parts.",
    certifications: ["BPA Free"],
    variants: [variant("prod_13", "Standard", 199, 24)],
  },
  {
    id: "prod_14", name: "Sample Product 14 — Toys", slug: "sample-product-14", categoryId: "cat_toys",
    brand: "Sample Brand",
    ownerHighlight: "Customer favourite",
    variants: [variant("prod_14", "Standard", 299, 31, 399)],
  },
];

// Mirrors frontend/lib/mock/kits.ts
type SeedKit = {
  id: string; name: string; slug: string; description: string; basePrice: number;
  slots: { id: string; label: string; sortOrder: number; options: { id: string; productVariantId: string; priceAdjustment: number }[] }[];
};

const KITS: SeedKit[] = [
  {
    id: "kit_1", name: "Newborn Essentials Kit", slug: "newborn-essentials-kit", basePrice: 1999,
    description:
      "Everything for the first weeks home — diapers, a feeding bottle, lotion, and onesies bundled together at a better price than buying separately.",
    slots: [
      { id: "kit_1_slot_diaper", label: "Choose a diaper size", sortOrder: 1, options: [
        { id: "kit_1_slot_diaper_opt_nb", productVariantId: "prod_1_nb", priceAdjustment: 0 },
        { id: "kit_1_slot_diaper_opt_s", productVariantId: "prod_1_s", priceAdjustment: 0 },
        { id: "kit_1_slot_diaper_opt_m", productVariantId: "prod_1_m", priceAdjustment: 50 },
      ]},
      { id: "kit_1_slot_bottle", label: "Choose a feeding bottle size", sortOrder: 2, options: [
        { id: "kit_1_slot_bottle_opt_125", productVariantId: "prod_4_125ml", priceAdjustment: 0 },
        { id: "kit_1_slot_bottle_opt_250", productVariantId: "prod_4_250ml", priceAdjustment: 50 },
      ]},
      { id: "kit_1_slot_lotion", label: "Choose a baby lotion size", sortOrder: 3, options: [
        { id: "kit_1_slot_lotion_opt_200", productVariantId: "prod_10_200ml", priceAdjustment: 0 },
        { id: "kit_1_slot_lotion_opt_400", productVariantId: "prod_10_400ml", priceAdjustment: 250 },
      ]},
      { id: "kit_1_slot_onesie", label: "Choose onesie size", sortOrder: 4, options: [
        { id: "kit_1_slot_onesie_opt_03", productVariantId: "prod_7_0-3m", priceAdjustment: 0 },
        { id: "kit_1_slot_onesie_opt_36", productVariantId: "prod_7_3-6m", priceAdjustment: 0 },
        { id: "kit_1_slot_onesie_opt_69", productVariantId: "prod_7_6-9m", priceAdjustment: 40 },
      ]},
    ],
  },
  {
    id: "kit_2", name: "Travel Kit", slug: "travel-kit", basePrice: 1299,
    description:
      "A grab-and-go bundle for outings and short trips — compact diaper pack, a feeding bottle, and an easy outfit.",
    slots: [
      { id: "kit_2_slot_diaper", label: "Choose a diaper pack", sortOrder: 1, options: [
        { id: "kit_2_slot_diaper_opt_s", productVariantId: "prod_2_s", priceAdjustment: 0 },
        { id: "kit_2_slot_diaper_opt_m", productVariantId: "prod_2_m", priceAdjustment: 40 },
      ]},
      { id: "kit_2_slot_bottle", label: "Choose a feeding bottle size", sortOrder: 2, options: [
        { id: "kit_2_slot_bottle_opt_125", productVariantId: "prod_4_125ml", priceAdjustment: 0 },
        { id: "kit_2_slot_bottle_opt_250", productVariantId: "prod_4_250ml", priceAdjustment: 50 },
      ]},
      { id: "kit_2_slot_outfit", label: "Choose an outfit size", sortOrder: 3, options: [
        { id: "kit_2_slot_outfit_opt_36", productVariantId: "prod_9_3-6m", priceAdjustment: 0 },
        { id: "kit_2_slot_outfit_opt_612", productVariantId: "prod_9_6-12m", priceAdjustment: 30 },
      ]},
    ],
  },
  {
    id: "kit_3", name: "Bath Time Kit", slug: "bath-time-kit", basePrice: 1099,
    description:
      "Gentle bath and skincare essentials in one bundle — lotion, a diaper pack, and a wipes pack.",
    slots: [
      { id: "kit_3_slot_lotion", label: "Choose a baby lotion size", sortOrder: 1, options: [
        { id: "kit_3_slot_lotion_opt_200", productVariantId: "prod_10_200ml", priceAdjustment: 0 },
        { id: "kit_3_slot_lotion_opt_400", productVariantId: "prod_10_400ml", priceAdjustment: 250 },
      ]},
      { id: "kit_3_slot_diaper", label: "Choose a diaper size", sortOrder: 2, options: [
        { id: "kit_3_slot_diaper_opt_nb", productVariantId: "prod_1_nb", priceAdjustment: 0 },
        { id: "kit_3_slot_diaper_opt_s", productVariantId: "prod_1_s", priceAdjustment: 0 },
      ]},
      { id: "kit_3_slot_wipes", label: "Choose a wipes pack", sortOrder: 3, options: [
        { id: "kit_3_slot_wipes_opt_80", productVariantId: "prod_12_pack-of-80", priceAdjustment: 0 },
      ]},
    ],
  },
];

const BANNERS = [
  { id: "banner_1", slotLabel: "Homepage Hero — Slide 1", title: "Sample Banner — Diaper Sale", status: "ACTIVE", sortOrder: 0 },
  { id: "banner_2", slotLabel: "Homepage Hero — Slide 2", title: "Sample Banner — New Kits Launch", status: "ACTIVE", sortOrder: 1 },
  { id: "banner_3", slotLabel: "Homepage Hero — Slide 3", title: "Sample Banner — Skincare Bundle", status: "SCHEDULED", sortOrder: 2 },
] as const;

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const phone = process.env.SEED_ADMIN_PHONE;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !phone || !password) {
    throw new Error("SEED_ADMIN_EMAIL, SEED_ADMIN_PHONE and SEED_ADMIN_PASSWORD must be set");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { name: "Zeroplus Admin", email, phone, passwordHash, role: "ADMIN" },
  });
  console.log(`admin ready: ${email}`);
}

async function seedCatalog() {
  // Dev-only demo data: wipe and recreate for a deterministic state.
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.kitSlotOption.deleteMany(),
    prisma.kitSlot.deleteMany(),
    prisma.kit.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.banner.deleteMany(),
  ]);

  await prisma.category.createMany({ data: CATEGORIES });

  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: PLACEHOLDER_DESC,
        categoryId: p.categoryId,
        brand: p.brand ?? null,
        safetyInfo: p.safetyInfo ?? null,
        certifications: p.certifications ?? [],
        ownerHighlight: p.ownerHighlight ?? null,
        variants: { create: p.variants },
      },
    });
  }

  for (const k of KITS) {
    await prisma.kit.create({
      data: {
        id: k.id,
        name: k.name,
        slug: k.slug,
        description: k.description,
        basePrice: k.basePrice,
        slots: {
          create: k.slots.map((s) => ({
            id: s.id,
            label: s.label,
            sortOrder: s.sortOrder,
            options: { create: s.options },
          })),
        },
      },
    });
  }

  await prisma.banner.createMany({ data: [...BANNERS] });

  // Two demo customers with a handful of reviews so listings aren't empty.
  const demoPassword = await bcrypt.hash("customer123", 10);
  const [asha, rahul] = await Promise.all([
    prisma.user.upsert({
      where: { email: "asha@example.com" },
      update: {},
      create: { name: "Asha Thomas", email: "asha@example.com", phone: "+919800000002", passwordHash: demoPassword },
    }),
    prisma.user.upsert({
      where: { email: "rahul@example.com" },
      update: {},
      create: { name: "Rahul Menon", email: "rahul@example.com", phone: "+919800000003", passwordHash: demoPassword },
    }),
  ]);

  await prisma.review.createMany({
    data: [
      { productId: "prod_1", userId: asha.id, rating: 5, comment: "Very soft, no rashes at all." },
      { productId: "prod_1", userId: rahul.id, rating: 4, comment: "Good quality, sizes run slightly small." },
      { productId: "prod_10", userId: asha.id, rating: 5, comment: "Gentle on skin, lovely mild smell." },
      { productId: "prod_4", userId: rahul.id, rating: 5, comment: "Anti-colic design actually works." },
      { productId: "prod_7", userId: asha.id, rating: 4, comment: "Soft cotton, washes well." },
    ],
  });

  console.log(
    `catalog seeded: ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${KITS.length} kits, ${BANNERS.length} banners`,
  );
}

async function main() {
  await seedAdmin();
  if (process.env.SEED_SCOPE !== "admin") {
    await seedCatalog();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
