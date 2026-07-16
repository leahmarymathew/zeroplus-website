import { prisma } from "../lib/prisma.js";
import { ApiError, notFound } from "../lib/errors.js";
import type { Prisma } from "../generated/prisma/client.js";

export type ProductSort = "popular" | "price_asc" | "price_desc" | "newest";

export interface ListProductsParams {
  category?: string; // category id or slug — the mock filters by id, the plan example by slug; accept both
  q?: string;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page: number;
  limit: number;
  includeInactive?: boolean; // admin listing reuses this service (plan 6.2)
  stock?: "low";
}

const LOW_STOCK_THRESHOLD = 5;

const productInclude = {
  variants: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

// Rating/reviewCount are aggregates over Review, not columns (frontend Product type needs them).
async function withRatings(products: ProductRow[]) {
  const ids = products.map((p) => p.id);
  const grouped = ids.length
    ? await prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: ids } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const byId = new Map(grouped.map((g) => [g.productId, g]));
  return products.map((p) => {
    const g = byId.get(p.id);
    return {
      ...p,
      rating: g?._avg.rating ? Math.round(g._avg.rating * 10) / 10 : 0,
      reviewCount: g?._count._all ?? 0,
    };
  });
}

export type ProductWithMeta = Awaited<ReturnType<typeof withRatings>>[number];

// Same rule as frontend/lib/format.ts getDisplayVariant: cheapest in-stock
// variant, else cheapest overall — price filters and price sorts key off it.
function displayPrice(p: ProductWithMeta): number {
  const pool = p.variants.filter((v) => v.stockQty > 0);
  const usable = pool.length > 0 ? pool : p.variants;
  if (usable.length === 0) return 0;
  return usable.reduce((min, v) => (v.price < min.price ? v : min), usable[0]).price;
}

export async function listProducts(params: ListProductsParams) {
  const where: Prisma.ProductWhereInput = {
    ...(params.includeInactive ? {} : { isActive: true }),
    ...(params.category && {
      category: { OR: [{ id: params.category }, { slug: params.category }] },
    }),
    ...(params.q && { name: { contains: params.q, mode: "insensitive" as const } }),
    ...(params.onSale && { variants: { some: { compareAtPrice: { not: null } } } }),
    ...(params.stock === "low" && { variants: { some: { stockQty: { lt: LOW_STOCK_THRESHOLD } } } }),
  };

  // Catalog is small (plan: a local store's inventory); display-variant price
  // filtering/sorting matches the mock exactly and is simplest done in memory.
  // Revisit with SQL-side sorting if the catalog ever grows past a few thousand.
  const rows = await prisma.product.findMany({ where, include: productInclude });
  let items = await withRatings(rows);

  if (params.minPrice != null) items = items.filter((p) => displayPrice(p) >= params.minPrice!);
  if (params.maxPrice != null) items = items.filter((p) => displayPrice(p) <= params.maxPrice!);

  switch (params.sort) {
    case "price_asc":
      items.sort((a, b) => displayPrice(a) - displayPrice(b));
      break;
    case "price_desc":
      items.sort((a, b) => displayPrice(b) - displayPrice(a));
      break;
    case "newest":
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case "popular":
    default:
      items.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  const total = items.length;
  const start = (params.page - 1) * params.limit;
  return { items: items.slice(start, start + params.limit), total };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productInclude,
  });
  if (!product) throw notFound("Product");
  const [withMeta] = await withRatings([product]);
  return withMeta;
}

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw notFound("Category");
  return category;
}

export async function listReviews(productId: string, page: number, limit: number) {
  const where = { productId };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true } } }, // name only — never leak email/phone
    }),
  ]);
  const items = rows.map(({ user, ...r }) => ({ ...r, userName: user.name }));
  return { items, total };
}

// Submit a review. Allowed only if the user has a DELIVERED order containing a
// variant of this product (plan 2.1) — reviews aren't open to anyone browsing.
export async function submitReview(
  productId: string,
  userId: string,
  input: { rating: number; comment?: string | null },
) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw notFound("Product");

  const variantIds = (
    await prisma.productVariant.findMany({ where: { productId }, select: { id: true } })
  ).map((v) => v.id);

  const delivered = await prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: { some: { variantId: { in: variantIds } } },
    },
    select: { id: true },
  });
  if (!delivered) {
    throw new ApiError(403, "NOT_ELIGIBLE", "You can only review products from a delivered order");
  }

  try {
    const review = await prisma.review.create({
      data: { productId, userId, rating: input.rating, comment: input.comment ?? null },
      include: { user: { select: { name: true } } },
    });
    const { user, ...r } = review;
    return { ...r, userName: user.name };
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      throw new ApiError(409, "ALREADY_REVIEWED", "You have already reviewed this product");
    }
    throw e;
  }
}
