import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import type { PhonePeState } from "../lib/phonepe.js";

// Applies a payment outcome to the Payment row and its Order. Idempotent and
// forward-only: once PAID, a later duplicate webhook or a FAILED status can't
// flip it back (webhooks can arrive twice or out of order). Returns the
// resulting order paymentStatus.
export async function applyPaymentResult(
  merchantTransactionId: string,
  state: PhonePeState,
  phonepeTransactionId?: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { phonepeMerchantTransactionId: merchantTransactionId },
    include: { order: true },
  });
  if (!payment) throw notFound("Payment");

  if (payment.status === "PAID") return "PAID" as const; // already settled — no-op

  if (state === "COMPLETED") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", phonepeTransactionId: phonepeTransactionId ?? null },
      }),
      prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "PAID" } }),
    ]);
    return "PAID" as const;
  }

  if (state === "FAILED") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
      prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: "FAILED" } }),
    ]);
    return "FAILED" as const;
  }

  return "PENDING" as const;
}

export async function getPaymentStatus(merchantTransactionId: string) {
  const payment = await prisma.payment.findUnique({
    where: { phonepeMerchantTransactionId: merchantTransactionId },
    include: { order: true },
  });
  if (!payment) throw notFound("Payment");
  return { status: payment.order.paymentStatus, orderId: payment.orderId };
}
