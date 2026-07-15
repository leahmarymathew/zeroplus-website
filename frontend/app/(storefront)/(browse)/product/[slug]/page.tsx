import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Truck, RotateCcw, CreditCard } from "lucide-react";
import { getProduct, getRelatedProducts } from "@/lib/api/products";
import { getReviews } from "@/lib/api/reviews";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const productRes = await getProduct(slug);
  if (!productRes.success) notFound();
  const product = productRes.data;

  const [reviewsRes, related] = await Promise.all([getReviews(product.id), getRelatedProducts(product)]);
  const reviews = reviewsRes.success ? reviewsRes.data : [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-4 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="text-ink">{product.name}</span>
      </div>

      <div className="flex flex-wrap gap-10">
        <div className="min-w-[280px] flex-1 basis-[380px]">
          <div className="relative">
            <div className="flex h-[360px] items-center justify-center rounded-[20px] bg-surface-pink-light text-[11px] font-semibold text-black/30">
              main product photo
            </div>
            {product.ownerHighlight && (
              <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
                <Star size={13} fill="currentColor" strokeWidth={0} />
                {product.ownerHighlight}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-[70px] w-[70px] flex-none items-center justify-center rounded-xl border-[1.5px] border-border-pink-light bg-surface-pink-light text-[8px] font-semibold text-black/25"
              >
                photo {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-[280px] flex-1 basis-[380px]">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex text-rose">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={14} fill={n <= Math.round(product.rating) ? "currentColor" : "none"} strokeWidth={1.5} />
              ))}
            </div>
            <span className="text-[13px] text-muted-light">
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>
          <h1 className="mb-2.5 text-2xl font-extrabold sm:text-[28px]">{product.name}</h1>
          {product.brand && <p className="mb-3 text-sm text-muted-light">by {product.brand}</p>}
          <p className="mb-4 text-sm leading-relaxed text-muted">{product.description}</p>

          <ProductPurchasePanel product={product} />

          <div className="flex flex-wrap gap-4 text-[12.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <Truck size={15} className="text-info" strokeWidth={1.8} /> Free delivery above ₹499
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw size={15} className="text-info" strokeWidth={1.8} /> 7-day easy returns
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard size={15} className="text-info" strokeWidth={1.8} /> COD available
            </span>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} initialReviews={reviews} />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">You May Also Like</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {related.map((p) => (
              <ProductCardInteractive key={p.id} product={p} className="w-[170px] flex-none" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
