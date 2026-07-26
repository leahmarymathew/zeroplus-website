import type { Product } from "@/lib/types";

export function formatPrice(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

export function discountPercent(price: number, compareAtPrice: number): number {
  return Math.round((1 - price / compareAtPrice) * 100);
}

/** The variant shown on cards/listings — cheapest in-stock variant, or cheapest overall if none are in stock. */
export function getDisplayVariant(product: Product) {
  const inStock = product.variants.filter((v) => v.stockQty > 0);
  const pool = inStock.length > 0 ? inStock : product.variants;
  return pool.reduce((min, v) => (v.price < min.price ? v : min), pool[0]);
}

export function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stockQty, 0);
}

export function toProductCardData(product: Product) {
  const variant = getDisplayVariant(product);
  return {
    slug: product.slug,
    name: product.name,
    imageUrl: product.images[0]?.url ?? null,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: variant.stockQty > 0,
  };
}
