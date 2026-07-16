import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { optionalAuth } from "../middleware/auth.js";
import { guestCart } from "../middleware/guestCart.js";
import { ok } from "../lib/respond.js";
import { ApiError } from "../lib/errors.js";
import * as cart from "../services/cart.service.js";

export const cartRouter = Router();

// optionalAuth attaches req.user if a valid token is present; guestCart
// ensures a guestId cookie either way. resolveCartKey then picks the key.
cartRouter.use(optionalAuth, guestCart);

function keyFor(req: Request, res: Response) {
  return cart.resolveCartKey(req.user?.id, res.locals.guestId as string);
}

cartRouter.get("/", async (req, res) => {
  ok(res, await cart.getCart(keyFor(req, res)));
});

const addSchema = z
  .object({
    variantId: z.string().min(1).optional(),
    kitId: z.string().min(1).optional(),
    kitSelections: z.record(z.string(), z.string()).optional(),
    quantity: z.number().int().min(1).max(99),
  })
  .refine((b) => Boolean(b.variantId) !== Boolean(b.kitId), {
    message: "Provide exactly one of variantId or kitId",
  });

// POST /v1/cart/items — Section 6.3. Either a variant line or a configured kit.
cartRouter.post("/items", validate(addSchema), async (req, res) => {
  const key = keyFor(req, res);
  if (req.body.kitId) {
    ok(res, await cart.addKit(key, req.body.kitId, req.body.kitSelections ?? {}, req.body.quantity), undefined, 201);
  } else {
    ok(res, await cart.addVariant(key, req.body.variantId, req.body.quantity), undefined, 201);
  }
});

const qtySchema = z.object({ quantity: z.number().int().min(1).max(99) });

cartRouter.patch("/items/:id", validate(qtySchema), async (req, res) => {
  ok(res, await cart.updateQuantity(keyFor(req, res), String(req.params.id), req.body.quantity));
});

cartRouter.delete("/items/:id", async (req, res) => {
  ok(res, await cart.removeItem(keyFor(req, res), String(req.params.id)));
});
