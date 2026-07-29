import { Router } from "express";
import { ok } from "../lib/respond.js";
import { listActiveBanners } from "../services/admin.service.js";

export const bannersRouter = Router();

// GET /v1/banners — active homepage hero slides, in display order. Separate
// from the admin CRUD at /admin/banners (which also lists SCHEDULED slides).
bannersRouter.get("/", async (_req, res) => {
  ok(res, await listActiveBanners());
});
