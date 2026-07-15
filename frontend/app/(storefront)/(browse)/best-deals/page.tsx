import Link from "next/link";
import { getProducts } from "@/lib/api/products";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";

// No design file for this screen — built to match Shop's product-grid
// shell. Section 6.2: powered by `onSale`, no separate admin flag —
// automatically every product carrying a compareAtPrice (Section 5).
export default async function BestDealsPage() {
  const res = await getProducts({ onSale: true, sort: "popular", limit: 60 });
  const products = res.success ? res.data : [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-2.5 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <span className="text-ink">Best Deals</span>
      </div>
      <span className="mb-3 inline-block rounded-full bg-ink px-3.5 py-[5px] text-xs font-bold text-white">
        Limited-time savings
      </span>
      <h1 className="mb-2 text-2xl font-extrabold sm:text-[34px]">Best Deals</h1>
      <p className="mb-7 max-w-[560px] text-[15px] text-muted">
        Every product currently on sale, all in one place — updated automatically.
      </p>

      {products.length === 0 ? (
        <p className="py-10 text-center text-muted">No deals right now — check back soon.</p>
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
