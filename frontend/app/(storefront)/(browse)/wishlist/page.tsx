"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";
import { getProductsByIds } from "@/lib/api/products";
import type { Product } from "@/lib/types";
import { useWishlistStore } from "@/store/wishlistStore";

// No design file for this screen (top-level per Section 2.1/3, not part of
// the export's design pass) — built to match Shop's product-grid shell and
// Cart's empty-state pattern.
export default function WishlistPage() {
  const productIds = useWishlistStore((s) => s.productIds);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await getProductsByIds(productIds);
      if (res.success) setProducts(res.data);
      setLoading(false);
    }
    run();
  }, [productIds]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <h1 className="mb-5 text-2xl font-extrabold sm:text-[30px]">My Wishlist</h1>

      {!loading && products.length === 0 ? (
        <div className="py-16 text-center text-muted-light">
          <Heart size={40} className="mx-auto mb-3.5 text-border-pink" strokeWidth={1.5} />
          <p className="mb-3.5">Your wishlist is empty.</p>
          <LinkButton href="/shop">Continue Shopping</LinkButton>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {products.map((p) => (
            <ProductCardInteractive key={p.id} product={p} showAddToCart />
          ))}
        </div>
      )}
    </div>
  );
}
