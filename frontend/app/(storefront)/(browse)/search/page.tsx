"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";
import { getProducts, type ProductSort } from "@/lib/api/products";
import type { Product } from "@/lib/types";

const POPULAR_CATEGORIES = ["Diapers", "Feeding", "Skincare"];

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "Sort: Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [sort, setSort] = useState<ProductSort>("popular");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const res = await getProducts({ q: query || undefined, sort, limit: 60 });
      if (res.success) setProducts(res.data);
      setLoading(false);
    }
    run();
  }, [query, sort]);

  return (
    <div className="mx-auto px-4 pt-5 pb-14 sm:px-8 lg:px-12 sm:pt-8">
      <div className="mb-1.5 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <span className="text-ink">Search</span>
      </div>
      <h1 className="mb-5 text-xl font-extrabold sm:text-[26px]">
        {query ? `Search results for "${query}"` : "All Products"}
      </h1>

      {loading ? null : products.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-[13.5px] text-muted-light">{products.length} results</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSort)}
              className="rounded-full border-[1.5px] border-border-pink bg-input-fill px-3.5 py-2 text-[13px] font-bold text-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {products.map((p) => (
              <ProductCardInteractive key={p.id} product={p} showAddToCart />
            ))}
          </div>
        </>
      ) : (
        <div className="py-14 text-center">
          <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-surface-pink-light">
            <SearchIcon size={34} className="text-rose" strokeWidth={1.8} />
          </div>
          <h2 className="mb-2 text-lg font-extrabold">No results for &ldquo;{query}&rdquo;</h2>
          <p className="mx-auto mb-5.5 max-w-[340px] text-[14.5px] text-muted">
            Try a different word, or check the spelling. Here are a few popular categories instead.
          </p>
          <div className="mb-6 flex flex-wrap justify-center gap-2.5">
            {POPULAR_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/shop?category=${c.toLowerCase()}`}
                className="rounded-full bg-surface-pink-light px-4.5 py-2 text-[13px] font-bold text-rose"
              >
                {c}
              </Link>
            ))}
          </div>
          <LinkButton href="/shop">Browse All Products</LinkButton>
        </div>
      )}
    </div>
  );
}
