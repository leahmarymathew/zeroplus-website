import type { ApiResult, Review } from "@/lib/types";
import { MOCK_REVIEWS } from "@/lib/mock/reviews";
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

// POST /v1/products/:id/reviews — Section 6.2. Real backend restricts this
// to customers with a delivered order containing the product; that check
// needs auth + orders, so it's a no-op here until the backend exists.
export async function submitReview(
  productId: string,
  input: { rating: number; comment: string | null; userName: string }
): Promise<ApiResult<Review & { userName: string }>> {
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
