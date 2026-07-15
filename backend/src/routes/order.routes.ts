import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { guestCart } from "../middleware/guestCart.js";
import { ok, paginate } from "../lib/respond.js";
import { ApiError } from "../lib/errors.js";
import { resolveCartKey } from "../services/cart.service.js";
import * as orders from "../services/order.service.js";

export const ordersRouter = Router();

const lineSchema = z
  .object({
    variantId: z.string().min(1).optional(),
    kitId: z.string().min(1).optional(),
    kitSelections: z.record(z.string(), z.string()).optional(),
    quantity: z.number().int().min(1).max(99),
  })
  .refine((l) => Boolean(l.variantId) !== Boolean(l.kitId), {
    message: "Each item needs exactly one of variantId or kitId",
  });

const addressSnapshotSchema = z.object({
  label: z.string().max(50).nullable().optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).nullable().optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/),
});

const createSchema = z
  .object({
    items: z.array(lineSchema).min(1),
    addressId: z.string().min(1).optional(),
    addressSnapshot: addressSnapshotSchema.optional(),
    paymentMethod: z.enum(["COD", "PHONEPE"]),
    contactEmail: z.string().email().optional(),
    contactName: z.string().max(100).optional(),
    // otpId is enforced for COD in the OTP phase (P10)
    otpId: z.string().optional(),
  })
  .refine((b) => b.addressId || b.addressSnapshot, {
    message: "Provide addressId or addressSnapshot",
  });

// POST /v1/orders — guest allowed. Identity comes from the JWT (optionalAuth),
// never from the body; the cart cookie lets us clear the server cart on success.
ordersRouter.post("/", optionalAuth, guestCart, validate(createSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const userId = req.user?.id;

  // Resolve the address snapshot: an explicit snapshot, or a saved address
  // (must belong to the caller) captured at order time.
  let snapshot = body.addressSnapshot;
  if (!snapshot && body.addressId) {
    if (!userId) throw new ApiError(401, "UNAUTHORIZED", "Log in to use a saved address");
    const { prisma } = await import("../lib/prisma.js");
    const addr = await prisma.address.findFirst({ where: { id: body.addressId, userId } });
    if (!addr) throw new ApiError(404, "NOT_FOUND", "Address not found");
    snapshot = {
      label: addr.label,
      line1: addr.line1,
      line2: addr.line2,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone,
    };
  }

  const cartKey = resolveCartKey(userId, res.locals.guestId as string);
  const order = await orders.createOrder(
    {
      userId,
      items: body.items,
      addressSnapshot: snapshot!,
      paymentMethod: body.paymentMethod,
      contactEmail: body.contactEmail,
      contactName: body.contactName,
    },
    cartKey,
  );
  ok(res, order, undefined, 201);
});

// GET /v1/orders — current user's history
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

ordersRouter.get("/", requireAuth, validate(listQuery, "query"), async (req, res) => {
  const { page, limit } = res.locals.query as z.infer<typeof listQuery>;
  const { items, total } = await orders.listUserOrders(req.user!.id, page, limit);
  ok(res, items, paginate(page, limit, total));
});

// GET /v1/orders/:id — JWT owner or ?token=guestAccessToken
const tokenQuery = z.object({ token: z.string().optional() });

ordersRouter.get("/:id", optionalAuth, validate(tokenQuery, "query"), async (req, res) => {
  const { token } = res.locals.query as z.infer<typeof tokenQuery>;
  const order = await orders.getOrderById(String(req.params.id), { userId: req.user?.id, token });
  ok(res, order);
});
