import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createHash } from "node:crypto";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { config } from "../src/config.js";
import { resetDb, seedProduct, address } from "./helpers.js";

const app = buildApp();
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

// Build a webhook body + valid checksum the way PhonePe would.
function signedWebhook(merchantTransactionId: string, state: string) {
  const payload = Buffer.from(JSON.stringify({ data: { merchantTransactionId, state } })).toString("base64");
  const xVerify =
    createHash("sha256").update(payload + config.phonepe.saltKey).digest("hex") + `###${config.phonepe.saltIndex}`;
  return { payload, xVerify };
}

async function placePhonepeOrderGetMtid() {
  const { variant } = await seedProduct(10, 100);
  const res = await request(app)
    .post("/v1/orders")
    .send({ items: [{ variantId: variant.id, quantity: 1 }], addressSnapshot: address, paymentMethod: "PHONEPE" });
  const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: res.body.data.id } });
  return { orderId: res.body.data.id, mtid: payment.phonepeMerchantTransactionId! };
}

describe("phonepe webhook", () => {
  it("marks the order PAID on a valid COMPLETED webhook", async () => {
    const { orderId, mtid } = await placePhonepeOrderGetMtid();
    const { payload, xVerify } = signedWebhook(mtid, "COMPLETED");
    const res = await request(app).post("/v1/payments/phonepe-webhook").set("x-verify", xVerify).send({ response: payload });
    expect(res.status).toBe(200);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.paymentStatus).toBe("PAID");
  });

  it("rejects a tampered checksum and leaves the order untouched", async () => {
    const { orderId, mtid } = await placePhonepeOrderGetMtid();
    const { payload } = signedWebhook(mtid, "COMPLETED");
    const res = await request(app).post("/v1/payments/phonepe-webhook").set("x-verify", "wrong###1").send({ response: payload });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_CHECKSUM");
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.paymentStatus).toBe("PENDING");
  });

  it("is idempotent — a replayed success webhook stays PAID", async () => {
    const { orderId, mtid } = await placePhonepeOrderGetMtid();
    const { payload, xVerify } = signedWebhook(mtid, "COMPLETED");
    await request(app).post("/v1/payments/phonepe-webhook").set("x-verify", xVerify).send({ response: payload });
    await request(app).post("/v1/payments/phonepe-webhook").set("x-verify", xVerify).send({ response: payload });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.paymentStatus).toBe("PAID");
    const payments = await prisma.payment.count({ where: { orderId, status: "PAID" } });
    expect(payments).toBe(1);
  });
});
