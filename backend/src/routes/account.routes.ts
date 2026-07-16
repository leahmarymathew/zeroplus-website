// Addresses + wishlist — authenticated customer resources.
// Every query is ownership-scoped to req.user.id; update/delete use
// updateMany/deleteMany with { id, userId } so another user's row id
// yields count 0 -> 404 (never a cross-account write, and a foreign id
// is indistinguishable from a missing one).
import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { ok } from "../lib/respond.js";
import { ApiError, notFound } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

export const addressesRouter = Router();
export const wishlistRouter = Router();

addressesRouter.use(requireAuth);
wishlistRouter.use(requireAuth);

const addressSchema = z.object({
  label: z.string().max(50).nullable().optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).nullable().optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number"),
  isDefault: z.boolean().optional().default(false),
});

addressesRouter.get("/", async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  ok(res, addresses);
});

addressesRouter.post("/", validate(addressSchema), async (req, res) => {
  const userId = req.user!.id;
  const count = await prisma.address.count({ where: { userId } });
  const makeDefault = req.body.isDefault || count === 0; // first address is always default

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { ...req.body, isDefault: makeDefault, userId } });
  });
  ok(res, address, undefined, 201);
});

addressesRouter.patch("/:id", validate(addressSchema.partial()), async (req, res) => {
  const userId = req.user!.id;
  const id = String(req.params.id);

  const updated = await prisma.$transaction(async (tx) => {
    if (req.body.isDefault === true) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.updateMany({ where: { id, userId }, data: req.body });
  });
  if (updated.count === 0) throw notFound("Address");
  ok(res, await prisma.address.findUnique({ where: { id } }));
});

addressesRouter.delete("/:id", async (req, res) => {
  const deleted = await prisma.address.deleteMany({
    where: { id: String(req.params.id), userId: req.user!.id },
  });
  if (deleted.count === 0) throw notFound("Address");
  ok(res, { deleted: true });
});

// --- Wishlist (frontend stores productIds and hydrates via the products API) ---

wishlistRouter.get("/", async (req, res) => {
  const items = await prisma.wishlist.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  ok(res, items);
});

const wishlistAdd = z.object({ productId: z.string().min(1) });

wishlistRouter.post("/", validate(wishlistAdd), async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { id: req.body.productId, isActive: true },
  });
  if (!product) throw notFound("Product");

  try {
    const item = await prisma.wishlist.create({
      data: { userId: req.user!.id, productId: req.body.productId },
    });
    ok(res, item, undefined, 201);
  } catch (e) {
    // @@unique([userId, productId]) — duplicate add is a conflict, not a crash
    if ((e as { code?: string }).code === "P2002") {
      throw new ApiError(409, "ALREADY_WISHLISTED", "Product is already in the wishlist");
    }
    throw e;
  }
});

wishlistRouter.delete("/:productId", async (req, res) => {
  const deleted = await prisma.wishlist.deleteMany({
    where: { userId: req.user!.id, productId: String(req.params.productId) },
  });
  if (deleted.count === 0) throw notFound("Wishlist item");
  ok(res, { deleted: true });
});
