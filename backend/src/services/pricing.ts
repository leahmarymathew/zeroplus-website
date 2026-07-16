// Single source of truth for order money math. Values mirror the frontend's
// lib/api/orders.ts (FREE_DELIVERY_THRESHOLD / SHIPPING_FEE / COD_FEE) so
// backend and frontend totals always agree. The plan (Section 12) allows
// zone-based shipping later; this flat model is what the live frontend uses,
// and swapping it is a one-function change.
import type { PaymentMethod } from "../generated/prisma/enums.js";

export const FREE_DELIVERY_THRESHOLD = 499;
export const SHIPPING_FEE = 49;
export const COD_FEE = 30;

export interface PricedLine {
  quantity: number;
  unitPrice: number;
}

export function priceOrder(lines: PricedLine[], paymentMethod: PaymentMethod, discount = 0) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === "COD" ? COD_FEE : null;
  const total = subtotal - discount + shippingFee + (codFee ?? 0);
  return { subtotal, discount, shippingFee, codFee, total };
}
