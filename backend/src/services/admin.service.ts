import { prisma } from "../lib/prisma.js";
import { ApiError, notFound } from "../lib/errors.js";
import { restoreStock } from "./order.service.js";
import { sendOrderStatusUpdate } from "../lib/mailer.js";
import type { OrderStatus } from "../generated/prisma/enums.js";
import { Prisma } from "../generated/prisma/client.js";

// ---------- Products ----------

const productInclude = {
  variants: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface VariantInput {
  label: string;
  price: number;
  compareAtPrice?: number | null;
  stockQty: number;
  sku: string;
}
interface ImageInput {
  url: string;
  sortOrder?: number;
}
export interface ProductInput {
  name: string;
  description: string;
  categoryId: string;
  brand?: string | null;
  safetyInfo?: string | null;
  certifications?: string[];
  ownerHighlight?: string | null;
  isActive?: boolean;
  videoUrl?: string | null;
  variants: VariantInput[];
  images?: ImageInput[];
}

// Admin listing — includes inactive products. Stock buckets match the
// frontend admin table (out = 0, low ≤ 10, else in).
export async function listAdminProducts(params: {
  q?: string;
  category?: string;
  stock?: "in" | "low" | "out";
  sort?: "name" | "price" | "stock";
}) {
  const where: Prisma.ProductWhereInput = {
    ...(params.q && { name: { contains: params.q, mode: "insensitive" } }),
    ...(params.category && { categoryId: params.category }),
  };
  const rows = await prisma.product.findMany({ where, include: productInclude });

  const totalStock = (p: (typeof rows)[number]) => p.variants.reduce((s, v) => s + v.stockQty, 0);
  const minPrice = (p: (typeof rows)[number]) =>
    p.variants.reduce((m, v) => Math.min(m, v.price), Infinity);
  const bucket = (p: (typeof rows)[number]) => {
    const s = totalStock(p);
    return s === 0 ? "out" : s <= 10 ? "low" : "in";
  };

  let items = params.stock ? rows.filter((p) => bucket(p) === params.stock) : rows;
  items = [...items].sort((a, b) => {
    if (params.sort === "price") return minPrice(a) - minPrice(b);
    if (params.sort === "stock") return totalStock(a) - totalStock(b);
    return a.name.localeCompare(b.name);
  });
  return items;
}

export async function getAdminProduct(id: string) {
  const p = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!p) throw notFound("Product");
  return p;
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({
    data: {
      name: input.name,
      slug: slugify(input.name) || `prod-${Date.now()}`,
      description: input.description,
      categoryId: input.categoryId,
      brand: input.brand ?? null,
      safetyInfo: input.safetyInfo ?? null,
      certifications: input.certifications ?? [],
      ownerHighlight: input.ownerHighlight ?? null,
      isActive: input.isActive ?? true,
      videoUrl: input.videoUrl ?? null,
      variants: { create: input.variants },
      images: { create: (input.images ?? []).map((i, idx) => ({ url: i.url, sortOrder: i.sortOrder ?? idx })) },
    },
    include: productInclude,
  });
}

// Variants are reconciled by SKU rather than wiped: existing SKUs are updated,
// new ones created, missing ones deleted. This preserves variant ids that kit
// options and carts reference (a blind delete-all would cascade-break them).
export async function updateProduct(id: string, input: ProductInput) {
  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!existing) throw notFound("Product");

  const incomingSkus = new Set(input.variants.map((v) => v.sku));
  const toDelete = existing.variants.filter((v) => !incomingSkus.has(v.sku));

  return prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
        brand: input.brand ?? null,
        safetyInfo: input.safetyInfo ?? null,
        certifications: input.certifications ?? [],
        ownerHighlight: input.ownerHighlight ?? null,
        isActive: input.isActive ?? true,
        videoUrl: input.videoUrl ?? null,
      },
    });

    for (const v of input.variants) {
      const match = existing.variants.find((e) => e.sku === v.sku);
      if (match) {
        await tx.productVariant.update({ where: { id: match.id }, data: v });
      } else {
        await tx.productVariant.create({ data: { ...v, productId: id } });
      }
    }
    if (toDelete.length) {
      await tx.productVariant.deleteMany({ where: { id: { in: toDelete.map((v) => v.id) } } });
    }

    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: input.images.map((i, idx) => ({ productId: id, url: i.url, sortOrder: i.sortOrder ?? idx })),
      });
    }

    return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
  });
}

// Soft delete when the product appears in any order (history must survive);
// hard delete only when it was never ordered. OrderItem.variantId has no FK
// relation (snapshots make it independent), so we check against the product's
// own variant ids.
export async function deleteProduct(id: string) {
  const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound("Product");

  const variantIds = (
    await prisma.productVariant.findMany({ where: { productId: id }, select: { id: true } })
  ).map((v) => v.id);
  const referenced =
    variantIds.length > 0 &&
    (await prisma.orderItem.findFirst({ where: { variantId: { in: variantIds } } }));

  if (referenced) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { id, softDeleted: true };
  }
  await prisma.product.delete({ where: { id } });
  return { id, softDeleted: false };
}

// ---------- Categories ----------

export async function listAdminCategories() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const counts = await prisma.product.groupBy({ by: ["categoryId"], _count: { _all: true } });
  const byId = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  return categories.map((c) => ({ ...c, productCount: byId.get(c.id) ?? 0 }));
}

export async function createCategory(input: { name: string; imageUrl?: string | null }) {
  return prisma.category.create({
    data: { name: input.name, slug: slugify(input.name), imageUrl: input.imageUrl ?? null },
  });
}

export async function updateCategory(id: string, input: { name?: string; imageUrl?: string | null }) {
  const exists = await prisma.category.findUnique({ where: { id } });
  if (!exists) throw notFound("Category");
  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name, slug: slugify(input.name) }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
    },
  });
}

// ---------- Orders ----------

const orderInclude = { items: true } as const;

// Legal forward transitions. CANCELLED reachable from any pre-shipment state.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["CONFIRMED", "PACKED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function listAdminOrders(params: {
  q?: string;
  status?: OrderStatus;
  page: number;
  limit: number;
}) {
  const where: Prisma.OrderWhereInput = {
    ...(params.status && { status: params.status }),
    ...(params.q && {
      OR: [
        { orderNumber: { contains: params.q, mode: "insensitive" } },
        { contactName: { contains: params.q, mode: "insensitive" } },
        { user: { is: { name: { contains: params.q, mode: "insensitive" } } } },
        { user: { is: { phone: { contains: params.q } } } },
      ],
    }),
  };
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
  ]);
  return { items, total };
}

export async function updateOrderStatus(id: string, status: OrderStatus, trackingNumber?: string | null) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound("Order");

  if (order.status !== status && !TRANSITIONS[order.status].includes(status)) {
    throw new ApiError(400, "INVALID_TRANSITION", `Cannot move an order from ${order.status} to ${status}`);
  }

  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    await restoreStock(id); // return stock to inventory (plan Section 7)
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber !== undefined && { trackingNumber }),
      // Mark COD cash collected on delivery.
      ...(status === "DELIVERED" && order.paymentMethod === "COD" && { paymentStatus: "PAID" }),
    },
    include: orderInclude,
  });

  const to = updated.userId
    ? (await prisma.user.findUnique({ where: { id: updated.userId } }))?.email
    : updated.contactEmail;
  if (to) sendOrderStatusUpdate(updated, to).catch((e) => console.error("status email failed", e));

  return updated;
}

export async function setPaymentRefunded(id: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw notFound("Order");
  return prisma.order.update({ where: { id }, data: { paymentStatus: "REFUNDED" }, include: orderInclude });
}

// ---------- Customers ----------

export async function listAdminCustomers(q?: string) {
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true },
  });
  const counts = await prisma.order.groupBy({ by: ["userId"], _count: { _all: true } });
  const byId = new Map(counts.map((c) => [c.userId, c._count._all]));
  return users.map((u) => ({ ...u, orderCount: byId.get(u.id) ?? 0 }));
}

export async function getAdminCustomer(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw notFound("Customer");
  const orders = await prisma.order.findMany({
    where: { userId: id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return { ...user, orderCount: orders.length, orders };
}

// ---------- Banners ----------

export async function listBanners() {
  return prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createBanner(input: { title: string; imageUrl?: string | null; videoUrl?: string | null }) {
  const count = await prisma.banner.count();
  return prisma.banner.create({
    data: {
      title: input.title,
      slotLabel: `Homepage Hero — Slide ${count + 1}`,
      imageUrl: input.imageUrl ?? null,
      videoUrl: input.videoUrl ?? null,
      sortOrder: count,
    },
  });
}

export async function updateBanner(
  id: string,
  input: { title?: string; imageUrl?: string | null; videoUrl?: string | null; status?: "ACTIVE" | "SCHEDULED" },
) {
  const exists = await prisma.banner.findUnique({ where: { id } });
  if (!exists) throw notFound("Banner");
  return prisma.banner.update({ where: { id }, data: input });
}

// Public homepage hero — active slides only, in display order. A slide is
// either a video or a still image (videoUrl set means show that, not both).
export async function listActiveBanners() {
  return prisma.banner.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });
}

export async function deleteBanner(id: string) {
  await prisma.banner.delete({ where: { id } }).catch(() => {
    throw notFound("Banner");
  });
  // Reindex remaining slots so labels stay sequential.
  const rest = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  await prisma.$transaction(
    rest.map((b, i) =>
      prisma.banner.update({ where: { id: b.id }, data: { sortOrder: i, slotLabel: `Homepage Hero — Slide ${i + 1}` } }),
    ),
  );
  return { id };
}

// ---------- Reports ----------

// Realized revenue = orders that actually brought money in: prepaid marked
// PAID, or COD marked DELIVERED. Cancelled orders never count.
function revenueWhere(from?: Date, to?: Date): Prisma.OrderWhereInput {
  return {
    status: { not: "CANCELLED" },
    OR: [{ paymentStatus: "PAID" }, { paymentMethod: "COD", status: "DELIVERED" }],
    ...(from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
  };
}

export async function reportSummary(from?: Date, to?: Date) {
  const where = revenueWhere(from, to);
  const [agg, orders, topRows, topKitRows, lowStock] = await Promise.all([
    prisma.order.aggregate({ where, _sum: { total: true }, _count: { _all: true } }),
    prisma.order.findMany({ where, select: { id: true } }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { is: where }, productName: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    // Most-selling kits, mirroring topProducts but grouped on the kit snapshot.
    prisma.orderItem.groupBy({
      by: ["kitName"],
      where: { order: { is: where }, kitName: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.productVariant.findMany({
      where: { stockQty: { lte: 10 } },
      orderBy: { stockQty: "asc" },
      include: { product: { select: { name: true } } },
      take: 20,
    }),
  ]);

  // Revenue grouped by day via raw SQL (date_trunc is not expressible in the
  // Prisma query API).
  const byDay = await prisma.$queryRaw<Array<{ day: Date; revenue: bigint }>>`
    SELECT date_trunc('day', "createdAt") AS day, SUM("total")::bigint AS revenue
    FROM "Order"
    WHERE "status" <> 'CANCELLED'
      AND ("paymentStatus" = 'PAID' OR ("paymentMethod" = 'COD' AND "status" = 'DELIVERED'))
      ${from ? Prisma.sql`AND "createdAt" >= ${from}` : Prisma.empty}
      ${to ? Prisma.sql`AND "createdAt" <= ${to}` : Prisma.empty}
    GROUP BY 1 ORDER BY 1`;

  return {
    totalRevenue: agg._sum.total ?? 0,
    orderCount: agg._count._all,
    topProducts: topRows.map((r) => ({ productName: r.productName, quantity: r._sum.quantity ?? 0 })),
    topKits: topKitRows.map((r) => ({ kitName: r.kitName, quantity: r._sum.quantity ?? 0 })),
    revenueByDay: byDay.map((r) => ({ day: r.day.toISOString().slice(0, 10), revenue: Number(r.revenue) })),
    lowStock: lowStock.map((v) => ({
      productName: v.product.name,
      variantLabel: v.label,
      sku: v.sku,
      stockQty: v.stockQty,
    })),
  };
}
