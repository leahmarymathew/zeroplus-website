"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";
import { getCategories } from "@/lib/api/categories";
import { getProducts, type ProductSort } from "@/lib/api/products";
import { AGE_TAGS } from "@/lib/ageTags";
import type { Category, Product } from "@/lib/types";

const PRICE_BUCKETS = [
  { label: "Under ₹300", min: 0, max: 300 },
  { label: "₹300 – ₹600", min: 300, max: 600 },
  { label: "₹600 – ₹1000", min: 600, max: 1000 },
  { label: "Above ₹1000", min: 1000, max: Infinity },
];


const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "Sort: Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedAges, setSelectedAges] = useState<Set<string>>(new Set());
  const [selectedPriceBuckets, setSelectedPriceBuckets] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<ProductSort>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    getCategories().then((res) => {
      if (!res.success) return;
      setCategories(res.data);
      setSelectedCategories(new Set(res.data.map((c) => c.id)));
      if (initialCategory) {
        const match = res.data.find((c) => c.slug === initialCategory);
        if (match) setSelectedCategories(new Set([match.id]));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priceRange = useMemo(() => {
    if (selectedPriceBuckets.size === 0) return {};
    const buckets = PRICE_BUCKETS.filter((_, i) => selectedPriceBuckets.has(i));
    return {
      minPrice: Math.min(...buckets.map((b) => b.min)),
      maxPrice: Math.max(...buckets.map((b) => b.max)),
    };
  }, [selectedPriceBuckets]);

  // Applied client-side rather than as a fetch param — catalog is small
  // (same reasoning as the price/category logic above), and a product with
  // no ageTags set (most skincare, per the tag plan) is left visible under
  // any age filter rather than hidden.
  const visibleProducts = useMemo(() => {
    if (selectedAges.size === 0) return products;
    return products.filter((p) => (p.ageTags ?? []).length === 0 || p.ageTags!.some((t) => selectedAges.has(t)));
  }, [products, selectedAges]);

  useEffect(() => {
    if (categories.length === 0) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      const results = await Promise.all(
        Array.from(selectedCategories).length === categories.length || selectedCategories.size === 0
          ? [getProducts({ sort, ...priceRange, limit: 60 })]
          : Array.from(selectedCategories).map((categoryId) => getProducts({ category: categoryId, sort, ...priceRange, limit: 60 }))
      );
      if (cancelled) return;
      const merged = new Map<string, Product>();
      for (const res of results) {
        if (res.success) for (const p of res.data) merged.set(p.id, p);
      }
      setProducts(Array.from(merged.values()));
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [categories, selectedCategories, sort, priceRange]);

  function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function clearFilters() {
    setSelectedCategories(new Set(categories.map((c) => c.id)));
    setSelectedAges(new Set());
    setSelectedPriceBuckets(new Set());
  }

  return (
    <div className="mx-auto px-4 pt-5 pb-8 sm:px-8 lg:px-12 sm:pt-8">
      <div className="mb-1.5 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <span className="text-ink">Shop</span>
      </div>
      <h1 className="mb-5 text-2xl font-extrabold sm:text-[30px]">All Products</h1>

      <div className="flex items-start gap-7">
        <aside className={`sticky top-24 w-[230px] flex-none flex-col gap-5.5 ${filtersOpen ? "flex" : "hidden lg:flex"}`}>
          <div>
            <div className="mb-2.5 text-sm font-bold">Category</div>
            {categories.map((c) => (
              <label key={c.id} className="mb-2 flex cursor-pointer items-center gap-2 text-[13.5px] text-muted">
                <input
                  type="checkbox"
                  checked={selectedCategories.has(c.id)}
                  onChange={() => toggleSet(selectedCategories, c.id, setSelectedCategories)}
                  className="h-4 w-4 accent-rose"
                />
                {c.name}
              </label>
            ))}
          </div>

          <div>
            <div className="mb-2.5 text-sm font-bold">Shop by Age</div>
            <div className="flex flex-wrap gap-2">
              {AGE_TAGS.map((label) => {
                const on = selectedAges.has(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleSet(selectedAges, label, setSelectedAges)}
                    className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-bold ${
                      on ? "border-rose bg-rose text-white" : "border-border-secondary bg-white text-rose"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2.5 text-sm font-bold">Price</div>
            {PRICE_BUCKETS.map((b, i) => (
              <label key={b.label} className="mb-2 flex cursor-pointer items-center gap-2 text-[13.5px] text-muted">
                <input
                  type="checkbox"
                  checked={selectedPriceBuckets.has(i)}
                  onChange={() => toggleSet(selectedPriceBuckets, i, setSelectedPriceBuckets)}
                  className="h-4 w-4 accent-rose"
                />
                {b.label}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border-[1.5px] border-border-secondary bg-white py-2 text-[13px] font-bold text-rose"
          >
            Clear filters
          </button>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="rounded-full bg-surface-pink-light px-4 py-2 text-[13px] font-bold text-rose lg:hidden"
            >
              Filters
            </button>
            <span className="text-[13.5px] text-muted-light">{loading ? "Loading…" : `${visibleProducts.length} products`}</span>
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

          {!loading && visibleProducts.length === 0 && (
            <p className="py-10 text-center text-muted">No products match these filters.</p>
          )}

          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {visibleProducts.map((p) => (
              <ProductCardInteractive key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
