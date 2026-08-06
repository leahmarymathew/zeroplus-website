import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { PriceDisplay } from "./PriceDisplay";

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  compareAtPrice?: number | null;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

interface ProductCardProps {
  product: ProductCardData;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onAddToCart?: () => void;
  className?: string;
}

function ProductImage({ imageUrl }: { imageUrl?: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="h-full w-full rounded-xl object-contain" />;
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl text-[9px] font-semibold uppercase text-black/30"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(0,0,0,.045) 0 6px, transparent 6px 12px)",
      }}
    >
      product photo
    </div>
  );
}

function RatingRow({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <div className="flex text-rose">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={12} fill={n <= Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
        ))}
      </div>
      <span className="text-[11px] text-muted-light">({reviewCount})</span>
    </div>
  );
}

function WishlistButton({ active, onClick }: { active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-[18px] top-[18px] z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
    >
      <Heart size={15} className="text-rose" fill={active ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  );
}

export function ProductCard({ product, isWishlisted, onToggleWishlist, onAddToCart, className = "" }: ProductCardProps) {
  const body = (
    <>
      <div className="relative mb-2.5 h-[110px]">
        <ProductImage imageUrl={product.imageUrl} />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/70">
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
      <div className="mb-1 line-clamp-1 text-sm font-bold text-ink">{product.name}</div>
      <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
    </>
  );

  const shell = `relative rounded-[18px] border border-border-pink-light bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] ${className}`;

  if (onAddToCart) {
    return (
      <div className={shell}>
        <WishlistButton active={isWishlisted} onClick={onToggleWishlist} />
        <Link href={`/product/${product.slug}`} className="block text-ink">
          {body}
        </Link>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!product.inStock}
          className="mt-2.5 w-full rounded-[10px] border-[1.5px] border-rose bg-white py-[9px] text-[13px] font-bold text-rose transition-colors hover:bg-rose hover:text-white disabled:cursor-not-allowed disabled:border-disabled-bg disabled:bg-disabled-bg disabled:text-disabled-text disabled:hover:bg-disabled-bg disabled:hover:text-disabled-text"
        >
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    );
  }

  return (
    <div className={shell}>
      <WishlistButton active={isWishlisted} onClick={onToggleWishlist} />
      <Link href={`/product/${product.slug}`} className="block text-ink">
        {body}
      </Link>
    </div>
  );
}
