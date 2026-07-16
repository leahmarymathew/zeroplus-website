import { Router } from "express";
import { ok } from "../lib/respond.js";
import * as kits from "../services/kit.service.js";

export const kitsRouter = Router();

// GET /v1/kits — active kits with hydrated slots/options
kitsRouter.get("/", async (_req, res) => {
  ok(res, await kits.listKits());
});

// GET /v1/kits/:slug — kit detail (plan 6.3)
kitsRouter.get("/:slug", async (req, res) => {
  ok(res, await kits.getKitBySlug(String(req.params.slug)));
});
