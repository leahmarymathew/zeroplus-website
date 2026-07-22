import type { ApiResult, Category } from "@/lib/types";
import { MOCK_CATEGORIES } from "@/lib/mock/categories";
import { readProducts } from "@/lib/api/admin/products";
import { delay } from "@/lib/api/delay";
import { api, unwrap, USE_MOCKS } from "@/lib/api/client";

const STORAGE_KEY = "zeroplus-admin-categories";

function readCategories(): Category[] {
  if (typeof window === "undefined") return MOCK_CATEGORIES;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    writeCategories(MOCK_CATEGORIES);
    return MOCK_CATEGORIES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return MOCK_CATEGORIES;
  }
}

function writeCategories(categories: Category[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export interface AdminCategory extends Category {
  productCount: number;
}

// GET /v1/admin/categories view — Section 2.2's category table shows each
// category's product count alongside its own data.
export async function getAdminCategories(): Promise<ApiResult<AdminCategory[]>> {
  if (!USE_MOCKS) return unwrap<AdminCategory[]>(api.get("/admin/categories"));
  await delay(150);
  const categories = readCategories();
  const products = readProducts();
  return {
    success: true,
    data: categories.map((c) => ({ ...c, productCount: products.filter((p) => p.categoryId === c.id).length })),
  };
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// POST /v1/admin/categories — Section 6.2
export async function createCategory(input: { name: string; imageUrl: string | null }): Promise<ApiResult<Category>> {
  if (!USE_MOCKS) return unwrap<Category>(api.post("/admin/categories", input));
  await delay(200);
  const categories = readCategories();
  const category: Category = {
    id: `cat_${crypto.randomUUID().slice(0, 8)}`,
    name: input.name,
    slug: slugify(input.name),
    parentId: null,
    imageUrl: input.imageUrl,
  };
  categories.push(category);
  writeCategories(categories);
  return { success: true, data: category };
}

// PATCH /v1/admin/categories/:id — Section 6.2
export async function updateCategory(
  id: string,
  input: { name: string; imageUrl: string | null }
): Promise<ApiResult<Category>> {
  if (!USE_MOCKS) return unwrap<Category>(api.patch(`/admin/categories/${id}`, input));
  await delay(200);
  const categories = readCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }
  categories[index] = { ...categories[index], name: input.name, imageUrl: input.imageUrl };
  writeCategories(categories);
  return { success: true, data: categories[index] };
}
