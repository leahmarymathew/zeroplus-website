import { Router } from "express";
import { z } from "zod";
import { ok } from "../lib/respond.js";
import { validate } from "../middleware/validate.js";
import { listFeaturedReviews } from "../services/catalog.service.js";

export const reviewsRouter = Router();

const featuredQuery = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
});

// GET /v1/reviews/featured — homepage "What Parents Say". Real customer
// reviews only (rating >= 4, has a comment) — no hardcoded testimonials.
reviewsRouter.get("/featured", validate(featuredQuery, "query"), async (_req, res) => {
  const { limit } = res.locals.query as z.infer<typeof featuredQuery>;
  ok(res, await listFeaturedReviews(limit));
});
