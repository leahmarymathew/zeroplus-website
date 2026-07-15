"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminProducts, type GetAdminProductsParams } from "@/lib/api/admin/products";
import { getCategories } from "@/lib/api/categories";
import { formatPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

function totalStock(p: Product) {
  return p.variants.reduce((sum, v) => sum + v.stockQty, 0);
}
function minPrice(p: Product) {
  return p.variants.reduce((min, v) => Math.min(min, v.price), Infinity);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<GetAdminProductsParams["stock"] | "all">("all");
  const [sortBy, setSortBy] = useState<GetAdminProductsParams["sort"]>("name");

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    async function run() {
      const res = await getAdminProducts({
        q: search || undefined,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        stock: stockFilter === "all" ? undefined : stockFilter,
        sort: sortBy,
      });
      if (res.success) setProducts(res.data);
    }
    run();
  }, [search, categoryFilter, stockFilter, sortBy]);

  return (
    <AdminShell>
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="text-[22px] font-extrabold">Products</h1>
        <Link href="/admin/products/new" className="rounded-[10px] bg-rose px-5 py-2.5 text-[13.5px] font-bold text-white">
          + Add Product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[180px] flex-1 rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px] outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px]"
        >
          <option value="all">All Stock Levels</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px]"
        >
          <option value="name">Sort: Name</option>
          <option value="price">Sort: Price</option>
          <option value="stock">Sort: Stock</option>
        </select>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-2xl border border-admin-border bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
              <th className="px-3 py-2.5">Product</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5">Price</th>
              <th className="px-3 py-2.5">Stock</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = totalStock(p);
              const category = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-b border-admin-row-border">
                  <td className="px-3 py-2.5 font-bold">{p.name}</td>
                  <td className="px-3 py-2.5 text-muted">{category?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 font-bold text-rose">{formatPrice(minPrice(p))}</td>
                  <td className={`px-3 py-2.5 font-bold ${stock === 0 || stock <= 10 ? "text-danger-text" : "text-success-text"}`}>
                    {stock}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/products/${p.id}/edit`} className="rounded-lg bg-surface-pink-light px-3.5 py-1.5 text-xs font-bold text-rose">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-light">No products match these filters.</p>}
      </div>
    </AdminShell>
  );
}
