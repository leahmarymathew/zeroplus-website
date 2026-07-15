"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/api/categories";
import type { Category } from "@/lib/types";

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  return (
    <AdminShell>
      <div className="mb-4.5 flex items-center gap-3">
        <Link href="/admin/products" className="text-[13.5px] font-bold text-muted-light">
          ← Back
        </Link>
        <h1 className="text-xl font-extrabold">Add Product</h1>
      </div>
      {categories.length > 0 && <ProductForm categories={categories} />}
    </AdminShell>
  );
}
