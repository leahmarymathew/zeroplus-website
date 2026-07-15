import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { ApiError, notFound, forbidden } from "../lib/errors.js";
import { randomBytes as randomBytesId } from "node:crypto";
import { priceOrder } from "./pricing.js";
import { sendOrderConfirmation } from "../lib/mailer.js";
import { assertCheckoutOtp, consumeOtp } from "./otp.service.js";
import { validateKitSelection } from "./kit.service.js";
import { initiatePayment } from "../lib/phonepe.js";
import { config } from "../config.js";
import type { PaymentMethod } from "../generated/prisma/enums.js";
import type { CartKey } from "./cart.service.js";

export interface OrderLineInput {
  variantId?: string;
  kitId?: string;
  kitSelections?: Record<string, string>;
  quantity: number;
}

export interface AddressSnapshot {
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface CreateOrderParams {
  userId?: string;
  items: OrderLineInput[];
  addressSnapshot: AddressSnapshot;
  paymentMethod: PaymentMethod;
  contactEmail?: string; // guest confirmation/tracking email (plan 6.1)
  contactName?: string;
  otpId?: string; // required for COD (plan 6.4)
}

const orderInclude = { items: true } as const;

function genOrderNumber(value: number) {
  return `ZP-${String(value).padStart(5, "0")}`;
}

export async function createOrder(params: CreateOrderParams, cartKey?: CartKey) {
  if (params.items.length === 0) {
    throw new ApiError(400, "EMPTY_CART", "Cannot place an order with no items");
  }

  // COD requires a verified phone (plan 6.4). Check validity before touching
  // stock; the OTP is consumed only after the order commits (below), so a
  // failed checkout leaves it reusable. Prepaid (PhonePe) skips OTP entirely.
  if (params.paymentMethod === "COD") {
    await assertCheckoutOtp(params.addressSnapshot.phone, params.otpId);
  }

  // Re-derive every line from the DB — never trust client prices/names/kit
  // configs. Variant lines and kit lines both flow into: order-item rows to
  // create, price lines for the subtotal, and stock deductions aggregated per
  // variant (a variant may appear in several lines and/or inside a kit).
  const variantIds = params.items.filter((i) => i.variantId).map((i) => i.variantId!);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  const orderItemRows: {
    variantId?: string;
    kitId?: string;
    kitName?: string;
    kitSelectionsSnapshot?: object;
    productName?: string;
    variantLabel?: string;
    quantity: number;
    priceAtPurchase: number;
  }[] = [];
  const priceLines: { quantity: number; unitPrice: number }[] = [];
  const deductions = new Map<string, number>();
  const deductionNames = new Map<string, string>();
  const addDeduction = (variantId: string, qty: number, name: string) => {
    deductions.set(variantId, (deductions.get(variantId) ?? 0) + qty);
    deductionNames.set(variantId, name);
  };

  for (const item of params.items) {
    if (item.variantId) {
      const variant = variantById.get(item.variantId);
      if (!variant || !variant.product.isActive) throw notFound(`Product variant ${item.variantId}`);
      orderItemRows.push({
        variantId: variant.id,
        productName: variant.product.name,
        variantLabel: variant.label,
        quantity: item.quantity,
        priceAtPurchase: variant.price,
      });
      priceLines.push({ quantity: item.quantity, unitPrice: variant.price });
      addDeduction(variant.id, item.quantity, variant.product.name);
    } else if (item.kitId) {
      // Server-side kit integrity check + pricing (plan 6.1).
      const kit = await validateKitSelection(item.kitId, item.kitSelections);
      orderItemRows.push({
        kitId: kit.kitId,
        kitName: kit.name,
        kitSelectionsSnapshot: kit.snapshot,
        quantity: item.quantity,
        priceAtPurchase: kit.unitPrice,
      });
      priceLines.push({ quantity: item.quantity, unitPrice: kit.unitPrice });
      for (const c of kit.components) addDeduction(c.variantId, item.quantity, c.snapshotText);
    }
  }

  const totals = priceOrder(priceLines, params.paymentMethod);
  const isGuest = !params.userId;
  const guestAccessToken = isGuest ? randomBytes(24).toString("base64url") : null;

  // The whole thing is one transaction: stock is conditionally decremented per
  // line (updateMany with `gte` is race-safe — two concurrent last-item orders
  // cannot both succeed), the order number is drawn from an atomic counter, and
  // the order + items are created. Any failure rolls the entire thing back, so
  // stock is never lost to a half-created order (plan Section 4).
  const order = await prisma.$transaction(async (tx) => {
    for (const [variantId, qty] of deductions) {
      const dec = await tx.productVariant.updateMany({
        where: { id: variantId, stockQty: { gte: qty } },
        data: { stockQty: { decrement: qty } },
      });
      if (dec.count === 0) {
        throw new ApiError(409, "OUT_OF_STOCK", `${deductionNames.get(variantId) ?? "An item"} is out of stock`);
      }
    }

    const counter = await tx.orderCounter.upsert({
      where: { id: 1 },
      create: { id: 1, value: 1 },
      update: { value: { increment: 1 } },
    });

    const created = await tx.order.create({
      data: {
        orderNumber: genOrderNumber(counter.value),
        // Connect the user relation only for logged-in orders; guests leave it null.
        ...(params.userId ? { user: { connect: { id: params.userId } } } : {}),
        status: "PLACED",
        paymentStatus: "PENDING",
        paymentMethod: params.paymentMethod,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: totals.shippingFee,
        codFee: totals.codFee,
        total: totals.total,
        addressSnapshot: params.addressSnapshot as object,
        contactEmail: params.contactEmail ?? null,
        contactName: params.contactName ?? null,
        guestAccessToken,
        items: { create: orderItemRows }, // snapshots — survive later catalog edits
      },
      include: orderInclude,
    });

    if (cartKey) {
      await tx.cartItem.deleteMany({ where: cartKey });
    }
    return created;
  });

  // Order committed — now burn the COD OTP so it can't authorize another order.
  if (params.paymentMethod === "COD" && params.otpId) {
    await consumeOtp(params.otpId).catch(() => {});
  }

  // Email after the commit — a mail failure must never roll back a real order.
  const to = params.userId
    ? (await prisma.user.findUnique({ where: { id: params.userId } }))?.email
    : params.contactEmail;
  if (to) {
    const trackingUrl = guestAccessToken
      ? `${config.frontendUrl}/order-confirmation/${order.id}?token=${guestAccessToken}`
      : undefined;
    sendOrderConfirmation(order, to, trackingUrl).catch((e) =>
      console.error(`order ${order.orderNumber}: confirmation email failed`, e),
    );
  }

  // Prepaid: create the Payment attempt row and get PhonePe's hosted-page URL.
  // The frontend redirects the browser there; the authoritative PAID/FAILED
  // update arrives later via the webhook (see payment.service).
  let phonepeRedirectUrl: string | undefined;
  if (params.paymentMethod === "PHONEPE") {
    const merchantTransactionId = `MT${randomBytesId(12).toString("hex")}`;
    await prisma.payment.create({
      data: { orderId: order.id, phonepeMerchantTransactionId: merchantTransactionId, amount: order.total },
    });
    const init = await initiatePayment({
      merchantTransactionId,
      amountRupees: order.total,
      orderId: order.id,
      guestToken: guestAccessToken,
      mobileNumber: params.addressSnapshot.phone,
    });
    phonepeRedirectUrl = init.redirectUrl;
  }

  return { ...order, phonepeRedirectUrl };
}

// GET /v1/orders/:id — JWT owner OR matching guest token (plan 6.1).
export async function getOrderById(id: string, auth: { userId?: string; token?: string }) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw notFound("Order");

  const ownedByUser = order.userId && order.userId === auth.userId;
  const matchesToken = order.guestAccessToken && order.guestAccessToken === auth.token;
  if (!ownedByUser && !matchesToken) {
    throw forbidden("You do not have access to this order");
  }
  return order;
}

export async function listUserOrders(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { items, total };
}

// Restores stock for each line — called when an order is cancelled (admin, P13).
export async function restoreStock(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId, variantId: { not: null } } });
  await prisma.$transaction(
    items.map((i) =>
      prisma.productVariant.update({
        where: { id: i.variantId! },
        data: { stockQty: { increment: i.quantity } },
      }),
    ),
  );
}
