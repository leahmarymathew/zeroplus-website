"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminProduct } from "@/lib/api/admin/products";
import { getCategories } from "@/lib/api/categories";
import type { Category, Product } from "@/lib/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([getAdminProduct(id), getCategories()]).then(([productRes, categoriesRes]) => {
      setProduct(productRes.success ? productRes.data : null);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    });
  }, [id]);

  return (
    <AdminShell>
      <div className="mb-4.5 flex items-center gap-3">
        <Link href="/admin/products" className="text-[13.5px] font-bold text-muted-light">
          ← Back
        </Link>
        <h1 className="text-xl font-extrabold">Edit Product</h1>
      </div>
      {product === undefined && <p className="text-sm text-muted-light">Loading…</p>}
      {product === null && <p className="text-sm text-danger-text">Product not found.</p>}
      {product && categories.length > 0 && <ProductForm product={product} categories={categories} />}
    </AdminShell>
  );
}
