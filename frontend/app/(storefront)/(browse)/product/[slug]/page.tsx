import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, Truck, RotateCcw, CreditCard } from "lucide-react";
import { getProduct, getRelatedProducts } from "@/lib/api/products";
import { getReviews } from "@/lib/api/reviews";
import { ProductPurchasePanel } from "@/components/storefront/ProductPurchasePanel";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { UrgencyWidgets } from "@/components/storefront/UrgencyWidgets";
import { ProductAccordions } from "@/components/storefront/ProductAccordions";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const productRes = await getProduct(slug);
  if (!productRes.success) notFound();
  const product = productRes.data;

  const [reviewsRes, related] = await Promise.all([getReviews(product.id), getRelatedProducts(product)]);
  const reviews = reviewsRes.success ? reviewsRes.data : [];

  // On sale if any variant has a compare-at price above its selling price.
  const onSale = product.variants.some((v) => v.compareAtPrice != null && v.compareAtPrice > v.price);

  const accordions = [
    {
      title: "Shipping & Returns",
      body: (
        <ul className="list-disc space-y-1 pl-4">
          <li>Free delivery on orders above ₹499; a flat ₹49 applies otherwise.</li>
          <li>Dispatched within 24–48 hours; delivered in 3–6 business days.</li>
          <li>7-day easy returns on unused items in original packaging.</li>
          <li>Cash on Delivery available across serviceable pincodes.</li>
        </ul>
      ),
    },
    ...(product.safetyInfo || (product.certifications && product.certifications.length > 0)
      ? [
          {
            title: "Safety & Certifications",
            body: (
              <div className="space-y-2">
                {product.safetyInfo && <p className="whitespace-pre-line">{product.safetyInfo}</p>}
                {product.certifications && product.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((c) => (
                      <span key={c} className="rounded-full bg-success-bg px-3 py-1 text-[11.5px] font-bold text-success-text-dark">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-4 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <Link href="/shop">Shop</Link> / <span className="text-ink">{product.name}</span>
      </div>

      <div className="flex flex-wrap gap-10">
        <div className="min-w-[280px] flex-1 basis-[380px]">
          <ProductGallery images={product.images} name={product.name} ownerHighlight={product.ownerHighlight} onSale={onSale} />
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

          <UrgencyWidgets seed={product.id} />

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

          <ProductAccordions sections={accordions} />
        </div>
      </div>

      {product.videoUrl && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Product Video</h2>
          <div className="max-w-[600px] overflow-hidden rounded-[18px] bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={product.videoUrl} controls className="w-full" />
          </div>
        </section>
      )}

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
