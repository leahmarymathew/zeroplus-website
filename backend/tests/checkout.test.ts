import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedProduct, address } from "./helpers.js";

const app = buildApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

function placePhonepeOrder(variantId: string, quantity: number) {
  return request(app)
    .post("/v1/orders")
    .send({ items: [{ variantId, quantity }], addressSnapshot: address, paymentMethod: "PHONEPE" });
}

describe("checkout", () => {
  it("places an order and deducts stock", async () => {
    const { variant } = await seedProduct(5, 100);
    const res = await placePhonepeOrder(variant.id, 2);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // 2×100 = 200 subtotal; <499 so +49 shipping; PhonePe so no COD fee
    expect(res.body.data.subtotal).toBe(200);
    expect(res.body.data.shippingFee).toBe(49);
    expect(res.body.data.total).toBe(249);
    const after = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(after!.stockQty).toBe(3);
  });

  it("computes totals from the DB, ignoring any client-sent price", async () => {
    const { variant } = await seedProduct(10, 100);
    const res = await request(app)
      .post("/v1/orders")
      .send({
        items: [{ variantId: variant.id, quantity: 1, unitPrice: 1 }], // bogus price
        addressSnapshot: address,
        paymentMethod: "PHONEPE",
      });
    expect(res.body.data.subtotal).toBe(100); // DB price, not the client's 1
  });

  it("rejects an order that exceeds stock", async () => {
    const { variant } = await seedProduct(1, 100);
    const res = await placePhonepeOrder(variant.id, 5);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("OUT_OF_STOCK");
  });

  it("never oversells under concurrency (the race)", async () => {
    const { variant } = await seedProduct(3, 100);
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => placePhonepeOrder(variant.id, 1)));
    const ok = results.filter((r) => r.status === 201).length;
    const oos = results.filter((r) => r.body?.error?.code === "OUT_OF_STOCK").length;
    expect(ok).toBe(3);
    expect(oos).toBe(2);
    const after = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(after!.stockQty).toBe(0);
  });

  it("requires a verified OTP for COD", async () => {
    const { variant } = await seedProduct(5, 100);
    const res = await request(app)
      .post("/v1/orders")
      .send({ items: [{ variantId: variant.id, quantity: 1 }], addressSnapshot: address, paymentMethod: "COD" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("OTP_REQUIRED");
  });

  it("allows COD with a verified checkout OTP and consumes it", async () => {
    const { variant } = await seedProduct(5, 100);
    const otp = await prisma.otpRequest.create({
      data: {
        phone: address.phone,
        codeHash: "x",
        purpose: "CHECKOUT",
        verified: true,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const res = await request(app)
      .post("/v1/orders")
      .send({ items: [{ variantId: variant.id, quantity: 1 }], addressSnapshot: address, paymentMethod: "COD", otpId: otp.id });
    expect(res.status).toBe(201);
    const consumed = await prisma.otpRequest.findUnique({ where: { id: otp.id } });
    expect(consumed!.consumed).toBe(true);
  });

  it("does not let a verified OTP authorize a second COD order (single-use)", async () => {
    const { variant } = await seedProduct(5, 100);
    const otp = await prisma.otpRequest.create({
      data: { phone: address.phone, codeHash: "x", purpose: "CHECKOUT", verified: true, expiresAt: new Date(Date.now() + 60_000) },
    });
    const body = { items: [{ variantId: variant.id, quantity: 1 }], addressSnapshot: address, paymentMethod: "COD", otpId: otp.id };
    const first = await request(app).post("/v1/orders").send(body);
    const second = await request(app).post("/v1/orders").send(body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(400);
    // Sequential reuse is caught by the pre-check (already consumed); the
    // concurrent race is caught by the in-transaction guard. Either rejects.
    expect(["OTP_NOT_VERIFIED", "OTP_ALREADY_USED"]).toContain(second.body.error.code);
    // Stock was deducted exactly once.
    const after = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(after!.stockQty).toBe(4);
  });

  it("gives sequential order numbers", async () => {
    const { variant } = await seedProduct(10, 100);
    const a = await placePhonepeOrder(variant.id, 1);
    const b = await placePhonepeOrder(variant.id, 1);
    expect(a.body.data.orderNumber).toBe("ZP-00001");
    expect(b.body.data.orderNumber).toBe("ZP-00002");
  });
});
