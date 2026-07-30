import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { ok, paginate } from "../lib/respond.js";
import * as catalog from "../services/catalog.service.js";

export const productsRouter = Router();
export const categoriesRouter = Router();

const listQuery = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  onSale: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["popular", "price_asc", "price_desc", "newest"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Cap is 100, not 50: the storefront browse pages (Shop, Search, Best Deals,
  // Category) have no pagination controls and ask for limit=60 to show the whole
  // catalogue in one grid. At 50 every one of them 400s and renders zero
  // products. Still bounded, so a huge catalogue can't be pulled in one request.
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /v1/products — Section 6.2: ?q= is search, ?onSale=true is Best Deals
productsRouter.get("/", validate(listQuery, "query"), async (_req, res) => {
  const params = res.locals.query as z.infer<typeof listQuery>;
  const { items, total } = await catalog.listProducts(params);
  ok(res, items, paginate(params.page, params.limit, total));
});

// GET /v1/products/:slug
productsRouter.get("/:slug", async (req, res) => {
  ok(res, await catalog.getProductBySlug(req.params.slug));
});

const reviewsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /v1/products/:id/reviews
productsRouter.get("/:id/reviews", validate(reviewsQuery, "query"), async (req, res) => {
  const { page, limit } = res.locals.query as z.infer<typeof reviewsQuery>;
  const { items, total } = await catalog.listReviews(String(req.params.id), page, limit);
  ok(res, items, paginate(page, limit, total));
});

const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional(),
});

// POST /v1/products/:id/reviews — customer with a delivered order only
productsRouter.post("/:id/reviews", requireAuth, validate(submitReviewSchema), async (req, res) => {
  const review = await catalog.submitReview(String(req.params.id), req.user!.id, req.body);
  ok(res, review, undefined, 201);
});

// GET /v1/categories
categoriesRouter.get("/", async (_req, res) => {
  ok(res, await catalog.listCategories());
});

// GET /v1/categories/:slug
categoriesRouter.get("/:slug", async (req, res) => {
  ok(res, await catalog.getCategoryBySlug(req.params.slug));
});
