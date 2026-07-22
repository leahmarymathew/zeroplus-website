import type { ApiResult, Category } from "@/lib/types";
import { MOCK_CATEGORIES } from "@/lib/mock/categories";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// GET /v1/categories — Section 6.2
export async function getCategories(): Promise<ApiResult<Category[]>> {
  if (!USE_MOCKS) return unwrap<Category[]>(api.get("/categories"));
  await delay(150);
  return { success: true, data: MOCK_CATEGORIES };
}

// GET /v1/categories/:slug — Section 6.2
export async function getCategory(slug: string): Promise<ApiResult<Category>> {
  if (!USE_MOCKS) return unwrap<Category>(api.get(`/categories/${slug}`));
  await delay(150);
  const category = MOCK_CATEGORIES.find((c) => c.slug === slug);
  if (!category) {
    return { success: false, error: { code: "NOT_FOUND", message: "Category not found" } };
  }
  return { success: true, data: category };
}
