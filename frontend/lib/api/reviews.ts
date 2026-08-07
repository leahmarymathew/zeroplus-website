import type { ApiResult, FeaturedReview, Review } from "@/lib/types";
import { MOCK_REVIEWS } from "@/lib/mock/reviews";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// module-level so newly-submitted reviews persist for the session (not across reloads)
const reviews = [...MOCK_REVIEWS];

// GET /v1/products/:id/reviews — Section 6.2
export async function getReviews(productId: string): Promise<ApiResult<Array<Review & { userName: string }>>> {
  if (!USE_MOCKS) return unwrap<Array<Review & { userName: string }>>(api.get(`/products/${productId}/reviews`));
  await delay(150);
  return { success: true, data: reviews.filter((r) => r.productId === productId) };
}

// GET /v1/reviews/featured — homepage "What Parents Say". Real, positive
// customer reviews only (rating >= 4, has a comment) — never hardcoded copy.
export async function getFeaturedReviews(limit = 6): Promise<ApiResult<FeaturedReview[]>> {
  if (!USE_MOCKS) return unwrap<FeaturedReview[]>(api.get("/reviews/featured", { params: { limit } }));
  await delay(150);
  const data = reviews
    .filter((r) => r.rating >= 4 && r.comment && r.comment.trim().length > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((r) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === r.productId);
      return { ...r, productName: product?.name ?? "", productSlug: product?.slug ?? "" };
    });
  return { success: true, data };
}

// POST /v1/products/:id/reviews — Section 6.2. Real backend restricts this
// to customers with a delivered order containing the product; that check
// needs auth + orders, so it's a no-op here until the backend exists.
export async function submitReview(
  productId: string,
  input: { rating: number; comment: string | null; userName: string }
): Promise<ApiResult<Review & { userName: string }>> {
  if (!USE_MOCKS) {
    // The backend derives the author from the JWT and gates on a delivered
    // order; only rating + comment are sent.
    return unwrap<Review & { userName: string }>(
      api.post(`/products/${productId}/reviews`, { rating: input.rating, comment: input.comment })
    );
  }
  await delay(200);
  const newReview: Review & { userName: string } = {
    id: `rev_${Date.now()}`,
    productId,
    userId: "guest",
    userName: input.userName,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  reviews.unshift(newReview);
  return { success: true, data: newReview };
}
