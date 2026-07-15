import type { Review } from "@/lib/types";

const now = new Date("2026-07-01T00:00:00.000Z").toISOString();

function review(id: string, productId: string, rating: number, comment: string, userName: string): Review & { userName: string } {
  return { id, productId, userId: `user_${id}`, userName, rating, comment, createdAt: now };
}

// Placeholder reviews for a handful of products — enough to exercise the
// review list UI and the "no reviews yet" empty state on the rest.
export const MOCK_REVIEWS: Array<Review & { userName: string }> = [
  review("rev_1", "prod_1", 5, "Placeholder review comment — replace with real customer feedback after launch.", "Sample Reviewer A"),
  review("rev_2", "prod_1", 4, "Placeholder review comment — replace with real customer feedback after launch.", "Sample Reviewer B"),
  review("rev_3", "prod_1", 5, "Placeholder review comment — replace with real customer feedback after launch.", "Sample Reviewer C"),
  review("rev_4", "prod_4", 5, "Placeholder review comment — replace with real customer feedback after launch.", "Sample Reviewer D"),
  review("rev_5", "prod_10", 5, "Placeholder review comment — replace with real customer feedback after launch.", "Sample Reviewer E"),
  review("rev_6", "prod_10", 4, "Placeholder review comment — replace with real customer feedback after launch.", "Sample Reviewer F"),
];
