import type { ApiResult, Product, ProductVariant } from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { delay } from "@/lib/api/delay";
import { api, unwrap, USE_MOCKS } from "@/lib/api/client";

const STORAGE_KEY = "zeroplus-admin-products";

// Admin CRUD operates on its own localStorage-backed copy of the catalog,
// seeded from lib/mock/products.ts on first read — mirrors the pattern
// lib/api/orders.ts uses for orders. The public storefront (Home, Shop,
// Product, Category — several of them Server Components) keeps reading the
// static seed directly, since Server Components have no access to
// localStorage; a real backend removes this split entirely.
export function readProducts(): Product[] {
  if (typeof window === "undefined") return MOCK_PRODUCTS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    writeProducts(MOCK_PRODUCTS);
    return MOCK_PRODUCTS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return MOCK_PRODUCTS;
  }
}

function writeProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export interface GetAdminProductsParams {
  q?: string;
  category?: string;
  stock?: "in" | "low" | "out";
  sort?: "name" | "price" | "stock";
}

function totalStock(p: Product) {
  return p.variants.reduce((sum, v) => sum + v.stockQty, 0);
}
function minPrice(p: Product) {
  return p.variants.reduce((min, v) => Math.min(min, v.price), Infinity);
}
function stockBucket(p: Product): "in" | "low" | "out" {
  const stock = totalStock(p);
  if (stock === 0) return "out";
  if (stock <= 10) return "low";
  return "in";
}

// GET /v1/admin/products — Section 6.2. Includes inactive products, unlike
// the public GET /v1/products.
export async function getAdminProducts(params: GetAdminProductsParams = {}): Promise<ApiResult<Product[]>> {
  if (!USE_MOCKS) return unwrap<Product[]>(api.get("/admin/products", { params }));
  await delay(150);
  let results = readProducts();

  if (params.q) {
    const q = params.q.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (params.category) {
    results = results.filter((p) => p.categoryId === params.category);
  }
  if (params.stock) {
    results = results.filter((p) => stockBucket(p) === params.stock);
  }

  switch (params.sort) {
    case "price":
      results = [...results].sort((a, b) => minPrice(a) - minPrice(b));
      break;
    case "stock":
      results = [...results].sort((a, b) => totalStock(a) - totalStock(b));
      break;
    case "name":
    default:
      results = [...results].sort((a, b) => a.name.localeCompare(b.name));
  }

  return { success: true, data: results };
}

export async function getAdminProduct(id: string): Promise<ApiResult<Product>> {
  if (!USE_MOCKS) return unwrap<Product>(api.get(`/admin/products/${id}`));
  await delay(150);
  const product = readProducts().find((p) => p.id === id);
  if (!product) {
    return { success: false, error: { code: "NOT_FOUND", message: "Product not found" } };
  }
  return { success: true, data: product };
}

export type ProductFormInput = Omit<
  Product,
  "id" | "slug" | "images" | "rating" | "reviewCount" | "createdAt" | "updatedAt" | "variants"
> & {
  variants: Omit<ProductVariant, "id" | "productId">[];
  // Cover + gallery photos, in display order. First image is the cover.
  images?: { url: string; sortOrder?: number }[];
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// POST /v1/admin/products — Section 6.2
export async function createProduct(input: ProductFormInput): Promise<ApiResult<Product>> {
  if (!USE_MOCKS) return unwrap<Product>(api.post("/admin/products", input));
  await delay(200);
  const products = readProducts();
  const id = `prod_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id,
    slug: slugify(input.name) || id,
    images: (input.images ?? []).map((img, i) => ({
      id: `${id}_img${i}`,
      productId: id,
      url: img.url,
      sortOrder: img.sortOrder ?? i,
    })),
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
    variants: input.variants.map((v, i) => ({ ...v, id: `${id}_v${i}`, productId: id })),
  };
  products.unshift(product);
  writeProducts(products);
  return { success: true, data: product };
}

// PATCH /v1/admin/products/:id — Section 6.2/6.3
export async function updateProduct(id: string, input: ProductFormInput): Promise<ApiResult<Product>> {
  if (!USE_MOCKS) return unwrap<Product>(api.patch(`/admin/products/${id}`, input));
  await delay(200);
  const products = readProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Product not found" } };
  }
  const existing = products[index];
  const { images: inputImages, ...rest } = input;
  const updated: Product = {
    ...existing,
    ...rest,
    updatedAt: new Date().toISOString(),
    // Re-map submitted images to ProductImage rows; fall back to existing when
    // the form didn't touch them.
    images: inputImages
      ? inputImages.map((img, i) => ({ id: `${id}_img${i}`, productId: id, url: img.url, sortOrder: img.sortOrder ?? i }))
      : existing.images,
    variants: input.variants.map((v, i) => {
      const existingVariant = existing.variants[i];
      return { ...v, id: existingVariant?.id ?? `${id}_v${i}`, productId: id };
    }),
  };
  products[index] = updated;
  writeProducts(products);
  return { success: true, data: updated };
}

// PATCH /v1/admin/products/:id/sold-out — zeroes every variant's stock in one
// call. Sold out is not a separate flag: it just means stock is 0, so this is
// the shortcut for the counter, not a new piece of state. Restocking goes back
// through updateProduct with the real per-variant counts.
export async function setProductSoldOut(id: string): Promise<ApiResult<Product>> {
  if (!USE_MOCKS) return unwrap<Product>(api.patch(`/admin/products/${id}/sold-out`));
  await delay(150);
  const products = readProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Product not found" } };
  }
  const updated: Product = {
    ...products[index],
    updatedAt: new Date().toISOString(),
    variants: products[index].variants.map((v) => ({ ...v, stockQty: 0 })),
  };
  products[index] = updated;
  writeProducts(products);
  return { success: true, data: updated };
}

// DELETE /v1/admin/products/:id — Section 6.2
export async function deleteProduct(id: string): Promise<ApiResult<{ id: string }>> {
  if (!USE_MOCKS) return unwrap<{ id: string }>(api.delete(`/admin/products/${id}`));
  await delay(150);
  const products = readProducts().filter((p) => p.id !== id);
  writeProducts(products);
  return { success: true, data: { id } };
}
