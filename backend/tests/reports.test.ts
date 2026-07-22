import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedUser, seedProduct, address } from "./helpers.js";

const app = buildApp();
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function adminToken() {
  await seedUser("admin@example.com", "password123", "ADMIN");
  const login = await request(app)
    .post("/v1/auth/login")
    .send({ identifier: "admin@example.com", password: "password123" });
  return login.body.data.accessToken as string;
}

// A PAID order with one plain product line and one kit line, so the report
// can surface it under both topProducts and topKits.
async function seedPaidKitOrder(variantId: string) {
  const counter = await prisma.orderCounter.upsert({
    where: { id: 1 },
    update: { value: { increment: 1 } },
    create: { id: 1, value: 1 },
  });
  return prisma.order.create({
    data: {
      orderNumber: `ZP-${String(counter.value).padStart(5, "0")}`,
      status: "CONFIRMED",
      paymentMethod: "PHONEPE",
      paymentStatus: "PAID",
      subtotal: 500,
      shippingFee: 0,
      codFee: 0,
      total: 500,
      addressSnapshot: address,
      items: {
        create: [
          { variantId, productName: "Widget", variantLabel: "Std", quantity: 3, priceAtPurchase: 100 },
          { kitId: "kit_x", kitName: "Newborn Essentials Kit", quantity: 2, priceAtPurchase: 100 },
        ],
      },
    },
  });
}

describe("admin reports", () => {
  it("returns topKits alongside topProducts", async () => {
    const token = await adminToken();
    const { variant } = await seedProduct(10, 100);
    await seedPaidKitOrder(variant.id);

    const res = await request(app)
      .get("/v1/admin/reports/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalRevenue).toBe(500);
    expect(res.body.data.topProducts).toContainEqual({ productName: "Widget", quantity: 3 });
    expect(res.body.data.topKits).toContainEqual({ kitName: "Newborn Essentials Kit", quantity: 2 });
  });

  it("omits non-kit lines from topKits", async () => {
    const token = await adminToken();
    const { variant } = await seedProduct(10, 100);
    await seedPaidKitOrder(variant.id);

    const res = await request(app)
      .get("/v1/admin/reports/summary")
      .set("Authorization", `Bearer ${token}`);

    // The plain "Widget" product line has no kitName, so it never appears here.
    const kitNames = res.body.data.topKits.map((k: { kitName: string }) => k.kitName);
    expect(kitNames).not.toContain("Widget");
    expect(kitNames).not.toContain(null);
  });
});
