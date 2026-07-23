"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { Badge } from "@/components/ui/Badge";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  // Gated on `hydrated` so the client's first render matches the SSR HTML
  // (always "not wishlisted") before the persisted store loads.
  const isWishlisted = useWishlistStore((s) => s.hydrated && s.isWishlisted(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const addItem = useCartStore((s) => s.addItem);

  const inStock = variant.stockQty > 0;

  function handleAddToCart() {
    if (!inStock) return;
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
    <div>
      <div className="mb-4.5 flex items-center gap-2.5">
        <PriceDisplay price={variant.price} compareAtPrice={variant.compareAtPrice} size="lg" showDiscountBadge />
      </div>

      {product.variants.length > 1 && (
        <div className="mb-4.5">
          <div className="mb-2 text-[13.5px] font-bold">Size / Variant</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const on = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`rounded-full border-[1.5px] px-4.5 py-2 text-[13.5px] font-bold ${
                    on ? "border-rose bg-rose text-white" : "border-border-secondary bg-white text-ink"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-success-text" : "bg-danger-text"}`} />
        <span className={`text-[13.5px] font-bold ${inStock ? "text-success-text" : "text-danger-text"}`}>
          {inStock ? "In Stock — ships in 24 hrs" : "Out of stock"}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button variant="primary" className="flex-1 basis-[180px]" onClick={handleAddToCart} disabled={!inStock}>
          Add to Cart
        </Button>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full border-[1.5px] border-border-secondary bg-white"
        >
          <Heart size={20} className="text-rose" fill={isWishlisted ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </div>

      {product.certifications && product.certifications.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-2">
          {product.certifications.map((cert) => (
            <Badge key={cert} variant="stock">
              {cert}
            </Badge>
          ))}
        </div>
      )}

      {product.safetyInfo && (
        <div className="mb-4 rounded-2xl bg-success-bg p-4">
          <div className="mb-0.5 text-[13.5px] font-bold text-success-text-dark">Safety information</div>
          <p className="m-0 text-[12.5px] leading-relaxed text-success-text-dark">{product.safetyInfo}</p>
        </div>
      )}
    </div>
  );
}
