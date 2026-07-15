"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { submitReview } from "@/lib/api/reviews";
import type { Review } from "@/lib/types";

interface ProductReviewsProps {
  productId: string;
  initialReviews: Array<Review & { userName: string }>;
}

export function ProductReviews({ productId, initialReviews }: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Pick a star rating first");
      return;
    }
    setSubmitting(true);
    const res = await submitReview(productId, {
      rating,
      comment: comment.trim() || null,
      userName: name.trim() || "Guest",
    });
    setSubmitting(false);
    if (res.success) {
      setReviews((prev) => [res.data, ...prev]);
      setRating(0);
      setComment("");
      setName("");
      toast.success("Thanks for your review!");
    }
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">Ratings &amp; Reviews</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">No reviews yet — be the first to review this product.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-[18px] border border-border-pink-light bg-white p-4.5">
              <div className="mb-2 flex text-rose">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill={n <= r.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                ))}
              </div>
              {r.comment && <p className="mb-3 text-sm leading-relaxed text-muted">&ldquo;{r.comment}&rdquo;</p>}
              <div className="text-[13px] font-bold">— {r.userName}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 max-w-[480px] rounded-[18px] border border-border-pink-light bg-white p-5">
        <h3 className="mb-1 text-[15px] font-bold">Write a Review</h3>
        <p className="mb-3 text-xs text-muted-light">
          Shown to customers with a delivered order for this product once accounts exist — open to everyone for now.
        </p>
        <div className="mb-3 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`Rate ${n} stars`}
              className="p-0 text-[26px] leading-none"
              style={{ color: n <= rating ? "var(--color-rose)" : "var(--color-disabled-bg)" }}
            >
              ★
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mb-3 w-full rounded-full border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product (optional)"
          rows={3}
          className="mb-3 w-full resize-y rounded-2xl border-[1.5px] border-border-pink px-3.5 py-3 text-[13.5px] outline-none focus:border-rose"
        />
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Review"}
        </Button>
      </div>
    </section>
  );
}
