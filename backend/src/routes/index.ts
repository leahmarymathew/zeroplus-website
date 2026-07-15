import { Router } from "express";
import { ok } from "../lib/respond.js";
import { productsRouter, categoriesRouter } from "./catalog.routes.js";
import { authRouter } from "./auth.routes.js";
import { addressesRouter, wishlistRouter } from "./account.routes.js";
import { cartRouter } from "./cart.routes.js";
import { ordersRouter } from "./order.routes.js";

// Every resource router mounts here; app.ts mounts this under /v1.
export const v1 = Router();

v1.get("/health", (_req, res) => {
  ok(res, { status: "ok" });
});

v1.use("/auth", authRouter);
v1.use("/addresses", addressesRouter);
v1.use("/wishlist", wishlistRouter);
v1.use("/cart", cartRouter);
v1.use("/orders", ordersRouter);
v1.use("/products", productsRouter);
v1.use("/categories", categoriesRouter);
