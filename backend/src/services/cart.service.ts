import { prisma } from "../lib/prisma.js";
import { ApiError, notFound } from "../lib/errors.js";
import { validateKitSelection } from "./kit.service.js";
import type { Prisma } from "../generated/prisma/client.js";

// Where-fragment identifying "this cart": the authenticated user's, or the
// guest session's. Never both — a request is one or the other.
export type CartKey = { userId: string } | { sessionId: string };

export function resolveCartKey(userId: string | undefined, guestId: string): CartKey {
  return userId ? { userId } : { sessionId: guestId };
}

const lineInclude = {
  variant: { include: { product: { include: { images: { orderBy: { sortOrder: "asc" as const } } } } } },
  kit: true,
} satisfies Prisma.CartItemInclude;

type CartRow = Prisma.CartItemGetPayload<{ include: typeof lineInclude }>;

// Shape one DB row into the frontend CartItem (denormalized display fields).
// Kit lines are re-priced from their stored selections every read, so a later
// price change is reflected; if the kit has since become invalid, fall back to
// its base price rather than crashing the whole cart.
async function toDisplay(row: CartRow) {
  const base = {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    variantId: row.variantId,
    kitId: row.kitId,
    kitSelections: row.kitSelections as Record<string, string> | null,
    quantity: row.quantity,
  };

  if (row.kitId) {
    try {
      const v = await validateKitSelection(row.kitId, (row.kitSelections as Record<string, string>) ?? {});
      return { ...base, name: v.name, variantLabel: null, unitPrice: v.unitPrice, imageUrl: v.imageUrl };
    } catch {
      return { ...base, name: row.kit?.name ?? "Kit", variantLabel: null, unitPrice: row.kit?.basePrice ?? 0, imageUrl: row.kit?.imageUrl ?? null };
    }
  }

  return {
    ...base,
    name: row.variant?.product.name ?? "Item",
    variantLabel: row.variant?.label ?? null,
    unitPrice: row.variant?.price ?? 0,
    imageUrl: row.variant?.product.images[0]?.url ?? null,
  };
}

async function buildCart(key: CartKey) {
  const rows = await prisma.cartItem.findMany({
    where: key,
    include: lineInclude,
    orderBy: { id: "asc" },
  });
  const items = await Promise.all(rows.map(toDisplay));
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  return { items, total };
}

export function getCart(key: CartKey) {
  return buildCart(key);
}

export async function addVariant(key: CartKey, variantId: string, quantity: number) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { isActive: true } },
  });
  if (!variant) throw notFound("Product variant");
  if (variant.stockQty <= 0) {
    throw new ApiError(409, "OUT_OF_STOCK", "This item is out of stock");
  }

  const existing = await prisma.cartItem.findFirst({ where: { ...key, variantId } });
  const desired = (existing?.quantity ?? 0) + quantity;
  // Cart never holds more than available; stock is authoritatively re-checked
  // at checkout. If clamped, the returned quantity is lower than requested —
  // the frontend should surface that (e.g. "only N left").
  const finalQty = Math.min(desired, variant.stockQty);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: finalQty } });
  } else {
    await prisma.cartItem.create({ data: { ...key, variantId, quantity: finalQty } });
  }
  return buildCart(key);
}

// Kit lines are validated (plan 6.1) before storing — the selection map is
// verified against the kit's real options, never trusted as sent. Each kit
// configuration is its own line (unlike variant lines, we don't merge, since
// two kits of the same id can have different selections).
export async function addKit(
  key: CartKey,
  kitId: string,
  kitSelections: Record<string, string>,
  quantity: number,
) {
  await validateKitSelection(kitId, kitSelections); // throws on any invalid selection
  await prisma.cartItem.create({ data: { ...key, kitId, kitSelections, quantity } });
  return buildCart(key);
}

export async function updateQuantity(key: CartKey, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, ...key } });
  if (!item) throw notFound("Cart item");

  if (item.variantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    const stock = variant?.stockQty ?? 0;
    if (stock <= 0) throw new ApiError(409, "OUT_OF_STOCK", "This item is out of stock");
    quantity = Math.min(quantity, stock);
  }

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return buildCart(key);
}

export async function removeItem(key: CartKey, itemId: string) {
  const deleted = await prisma.cartItem.deleteMany({ where: { id: itemId, ...key } });
  if (deleted.count === 0) throw notFound("Cart item");
  return buildCart(key);
}

// Called from every login path (login/register/google). Moves guest lines to
// the user's cart; same variant in both sums quantities (capped at stock);
// then clears the guest cart. Idempotent — a second login finds no guest rows.
export async function mergeGuestCart(guestId: string | undefined, userId: string) {
  if (!guestId) return;
  const guestLines = await prisma.cartItem.findMany({ where: { sessionId: guestId } });
  if (guestLines.length === 0) return;

  for (const line of guestLines) {
    const match = line.variantId
      ? await prisma.cartItem.findFirst({ where: { userId, variantId: line.variantId } })
      : null;

    if (match) {
      let qty = match.quantity + line.quantity;
      if (line.variantId) {
        const variant = await prisma.productVariant.findUnique({ where: { id: line.variantId } });
        if (variant) qty = Math.min(qty, variant.stockQty);
      }
      await prisma.cartItem.update({ where: { id: match.id }, data: { quantity: qty } });
      await prisma.cartItem.delete({ where: { id: line.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: line.id },
        data: { userId, sessionId: null },
      });
    }
  }
}
