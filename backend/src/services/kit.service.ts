import { prisma } from "../lib/prisma.js";
import { ApiError, notFound } from "../lib/errors.js";
import type { Prisma } from "../generated/prisma/client.js";

const kitInclude = {
  slots: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      options: {
        include: {
          productVariant: { include: { product: { select: { name: true, images: { take: 1, orderBy: { sortOrder: "asc" as const } } } } } },
        },
      },
    },
  },
} satisfies Prisma.KitInclude;

type KitRow = Prisma.KitGetPayload<{ include: typeof kitInclude }>;

// Hydrate options with productName/variantLabel (plan 6.3 response shape) —
// these live on the referenced variant/product, not on KitSlotOption.
function hydrate(kit: KitRow) {
  return {
    id: kit.id,
    name: kit.name,
    slug: kit.slug,
    description: kit.description,
    basePrice: kit.basePrice,
    imageUrl: kit.imageUrl,
    isActive: kit.isActive,
    createdAt: kit.createdAt,
    updatedAt: kit.updatedAt,
    slots: kit.slots.map((s) => ({
      id: s.id,
      kitId: s.kitId,
      label: s.label,
      sortOrder: s.sortOrder,
      options: s.options.map((o) => ({
        id: o.id,
        kitSlotId: o.kitSlotId,
        productVariantId: o.productVariantId,
        productName: o.productVariant.product.name,
        variantLabel: o.productVariant.label,
        priceAdjustment: o.priceAdjustment,
      })),
    })),
  };
}

export async function listKits() {
  const kits = await prisma.kit.findMany({ where: { isActive: true }, include: kitInclude, orderBy: { createdAt: "desc" } });
  return kits.map(hydrate);
}

export async function getKitBySlug(slug: string) {
  const kit = await prisma.kit.findFirst({ where: { slug, isActive: true }, include: kitInclude });
  if (!kit) throw notFound("Kit");
  return hydrate(kit);
}

export interface ValidatedKit {
  kitId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  // one component per slot — each drives a stock deduction on the chosen variant
  components: { variantId: string; slotLabel: string; snapshotText: string }[];
  snapshot: Record<string, string>; // slotLabel -> "Product — Variant", frozen on the order
}

// The integrity check (plan 6.1): re-derive everything from the DB. Every slot
// must be chosen exactly once; every choice must be a real option OF THAT SLOT;
// price is basePrice + Σ priceAdjustment of the chosen options. A manipulated
// request can never substitute an unlisted, pricier variant at the base price.
export async function validateKitSelection(
  kitId: string,
  selections: Record<string, string> | undefined,
): Promise<ValidatedKit> {
  const kit = await prisma.kit.findFirst({ where: { id: kitId, isActive: true }, include: kitInclude });
  if (!kit) throw notFound("Kit");
  const sel = selections ?? {};

  const knownSlotIds = new Set(kit.slots.map((s) => s.id));
  for (const slotId of Object.keys(sel)) {
    if (!knownSlotIds.has(slotId)) {
      throw new ApiError(400, "INVALID_KIT_SELECTION", `Unknown slot ${slotId} for this kit`);
    }
  }

  let unitPrice = kit.basePrice;
  const components: ValidatedKit["components"] = [];
  const snapshot: Record<string, string> = {};

  for (const slot of kit.slots) {
    const chosenVariantId = sel[slot.id];
    if (!chosenVariantId) {
      throw new ApiError(400, "INVALID_KIT_SELECTION", `Choose an option for "${slot.label}"`);
    }
    const option = slot.options.find((o) => o.productVariantId === chosenVariantId);
    if (!option) {
      throw new ApiError(400, "INVALID_KIT_SELECTION", `"${chosenVariantId}" is not an option for "${slot.label}"`);
    }
    unitPrice += option.priceAdjustment ?? 0;
    const snapshotText = `${option.productVariant.product.name} — ${option.productVariant.label}`;
    components.push({ variantId: chosenVariantId, slotLabel: slot.label, snapshotText });
    snapshot[slot.label] = snapshotText;
  }

  return { kitId: kit.id, name: kit.name, imageUrl: kit.imageUrl, unitPrice, components, snapshot };
}

// ---------- Admin ----------

interface KitSlotInput {
  label: string;
  options: { productVariantId: string; priceAdjustment?: number | null }[];
}
export interface KitInput {
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string | null;
  isActive?: boolean;
  slots: KitSlotInput[];
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Guard: every option must reference an existing, active product variant.
async function assertVariantsExist(slots: KitSlotInput[]) {
  const ids = [...new Set(slots.flatMap((s) => s.options.map((o) => o.productVariantId)))];
  const found = await prisma.productVariant.findMany({
    where: { id: { in: ids }, product: { isActive: true } },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    throw new ApiError(400, "INVALID_KIT_OPTION", "A kit option references a missing or inactive variant");
  }
}

export async function listAdminKits() {
  const kits = await prisma.kit.findMany({ include: kitInclude, orderBy: { createdAt: "desc" } });
  return kits.map(hydrate);
}

export async function getAdminKitById(id: string) {
  const kit = await prisma.kit.findUnique({ where: { id }, include: kitInclude });
  if (!kit) throw notFound("Kit");
  return hydrate(kit);
}

export async function createKit(input: KitInput) {
  await assertVariantsExist(input.slots);
  const kit = await prisma.kit.create({
    data: {
      name: input.name,
      slug: slugify(input.name) || `kit-${Date.now()}`,
      description: input.description,
      basePrice: input.basePrice,
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive ?? true,
      slots: {
        create: input.slots.map((s, i) => ({
          label: s.label,
          sortOrder: i,
          options: { create: s.options.map((o) => ({ productVariantId: o.productVariantId, priceAdjustment: o.priceAdjustment ?? null })) },
        })),
      },
    },
    include: kitInclude,
  });
  return hydrate(kit);
}

// Wholesale replace of slots/options (plan 6.2) — delete then recreate in one tx.
export async function updateKit(id: string, input: KitInput) {
  const exists = await prisma.kit.findUnique({ where: { id } });
  if (!exists) throw notFound("Kit");
  await assertVariantsExist(input.slots);

  const kit = await prisma.$transaction(async (tx) => {
    await tx.kitSlot.deleteMany({ where: { kitId: id } }); // cascades to options
    await tx.kit.update({
      where: { id },
      data: {
        name: input.name,
        slug: slugify(input.name) || exists.slug,
        description: input.description,
        basePrice: input.basePrice,
        imageUrl: input.imageUrl ?? null,
        isActive: input.isActive ?? true,
        slots: {
          create: input.slots.map((s, i) => ({
            label: s.label,
            sortOrder: i,
            options: { create: s.options.map((o) => ({ productVariantId: o.productVariantId, priceAdjustment: o.priceAdjustment ?? null })) },
          })),
        },
      },
    });
    return tx.kit.findUniqueOrThrow({ where: { id }, include: kitInclude });
  });
  return hydrate(kit);
}

export async function setKitActive(id: string, isActive: boolean) {
  const exists = await prisma.kit.findUnique({ where: { id } });
  if (!exists) throw notFound("Kit");
  const kit = await prisma.kit.update({ where: { id }, data: { isActive }, include: kitInclude });
  return hydrate(kit);
}

export async function deleteKit(id: string) {
  await prisma.kit.delete({ where: { id } }).catch(() => {
    throw notFound("Kit");
  });
  return { id };
}
