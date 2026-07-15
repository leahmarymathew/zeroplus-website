import type { ApiResult, Product } from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { getDisplayVariant } from "@/lib/format";
import { delay } from "./delay";

export type ProductSort = "popular" | "price_asc" | "price_desc" | "newest";

export interface GetProductsParams {
  category?: string;
  q?: string;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

// GET /v1/products — Section 6.2/6.3. `q` also powers search, `onSale`
// powers Best Deals; no separate endpoints for either.
export async function getProducts(params: GetProductsParams = {}): Promise<ApiResult<Product[]>> {
  await delay();

  let results = MOCK_PRODUCTS.filter((p) => p.isActive);

  if (params.category) {
    results = results.filter((p) => p.categoryId === params.category);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    results = results.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (params.onSale) {
    results = results.filter((p) => p.variants.some((v) => v.compareAtPrice && v.compareAtPrice > v.price));
  }
  if (params.minPrice != null) {
    results = results.filter((p) => getDisplayVariant(p).price >= params.minPrice!);
  }
  if (params.maxPrice != null) {
    results = results.filter((p) => getDisplayVariant(p).price <= params.maxPrice!);
  }

  switch (params.sort) {
    case "price_asc":
      results = [...results].sort((a, b) => getDisplayVariant(a).price - getDisplayVariant(b).price);
      break;
    case "price_desc":
      results = [...results].sort((a, b) => getDisplayVariant(b).price - getDisplayVariant(a).price);
      break;
    case "newest":
      results = [...results].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "popular":
    default:
      results = [...results].sort((a, b) => b.reviewCount - a.reviewCount);
  }

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const start = (page - 1) * limit;
  const pageItems = results.slice(start, start + limit);

  return {
    success: true,
    data: pageItems,
    pagination: {
      page,
      limit,
      total: results.length,
      totalPages: Math.max(1, Math.ceil(results.length / limit)),
    },
  };
}

// GET /v1/products/:slug — Section 6.3
export async function getProduct(slug: string): Promise<ApiResult<Product>> {
  await delay();
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug && p.isActive);
  if (!product) {
    return { success: false, error: { code: "NOT_FOUND", message: "Product not found" } };
  }
  return { success: true, data: product };
}

// No dedicated endpoint in Section 6.2 — the wishlist page resolves its
// stored productIds (Section 5's Wishlist model) against the product list.
export async function getProductsByIds(ids: string[]): Promise<ApiResult<Product[]>> {
  await delay(150);
  const found = MOCK_PRODUCTS.filter((p) => ids.includes(p.id) && p.isActive);
  return { success: true, data: found };
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  await delay(150);
  return MOCK_PRODUCTS.filter((p) => p.isActive && p.categoryId === product.categoryId && p.id !== product.id).slice(
    0,
    limit
  );
}
