"use client";

import toast from "react-hot-toast";
import { ProductCard } from "@/components/ui/ProductCard";
import { getDisplayVariant, toProductCardData } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface ProductCardInteractiveProps {
  product: Product;
  showAddToCart?: boolean;
  className?: string;
}

// Thin client boundary so Home/Shop/Product (Server Components fetching
// data) can render interactive cards without becoming client components
// themselves.
export function ProductCardInteractive({ product, showAddToCart = false, className }: ProductCardInteractiveProps) {
  // Gated on `hydrated` so the client's first render matches the SSR HTML
  // (always "not wishlisted") before the persisted store loads.
  const isWishlisted = useWishlistStore((s) => s.hydrated && s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  function handleAddToCart() {
    const variant = getDisplayVariant(product);
    if (variant.stockQty <= 0) return;
    addItem({
      id: crypto.randomUUID(),
      sessionId: null,
      userId: null,
      variantId: variant.id,
      kitId: null,
      kitSelections: null,
      quantity: 1,
      name: product.name,
      variantLabel: variant.label,
      unitPrice: variant.price,
      imageUrl: product.images[0]?.url ?? null,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <ProductCard
      product={toProductCardData(product)}
      className={className}
      isWishlisted={isWishlisted}
      onToggleWishlist={() => toggleWishlist(product.id)}
      onAddToCart={showAddToCart ? handleAddToCart : undefined}
    />
  );
}
