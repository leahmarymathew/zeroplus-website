import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedUser, seedProduct } from "./helpers.js";

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

describe("PATCH /v1/admin/products/:id/sold-out", () => {
  it("zeroes every variant's stock", async () => {
    const token = await adminToken();
    const { product, category } = await seedProduct(7);
    await prisma.productVariant.create({
      data: { productId: product.id, label: "Large", price: 200, stockQty: 4, sku: "SKU-WIDGET-LG" },
    });
    expect(category.id).toBeTruthy();

    const res = await request(app)
      .patch(`/v1/admin/products/${product.id}/sold-out`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.variants).toHaveLength(2);
    expect(res.body.data.variants.every((v: { stockQty: number }) => v.stockQty === 0)).toBe(true);
  });

  it("keeps the product active and listed rather than deleting it", async () => {
    const token = await adminToken();
    const { product } = await seedProduct(3);

    await request(app).patch(`/v1/admin/products/${product.id}/sold-out`).set("Authorization", `Bearer ${token}`);

    // Still in the public catalog — the storefront renders it as out of stock,
    // which is the whole point of sold out over delete/deactivate.
    const publicList = await request(app).get("/v1/products");
    expect(publicList.body.data.map((p: { id: string }) => p.id)).toContain(product.id);

    const row = await prisma.product.findUnique({ where: { id: product.id } });
    expect(row?.isActive).toBe(true);
  });

  it("makes the product unaddable to a cart afterwards", async () => {
    const token = await adminToken();
    const { product, variant } = await seedProduct(5);

    const before = await request(app).post("/v1/cart/items").send({ variantId: variant.id, quantity: 1 });
    expect(before.status).toBe(201);

    await request(app).patch(`/v1/admin/products/${product.id}/sold-out`).set("Authorization", `Bearer ${token}`);

    const after = await request(app).post("/v1/cart/items").send({ variantId: variant.id, quantity: 1 });
    expect(after.status).toBe(409);
    expect(after.body.error.code).toBe("OUT_OF_STOCK");
  });

  it("is reversible by writing real stock back through the normal update", async () => {
    const token = await adminToken();
    const { product, category, variant } = await seedProduct(5);

    await request(app).patch(`/v1/admin/products/${product.id}/sold-out`).set("Authorization", `Bearer ${token}`);

    const restock = await request(app)
      .patch(`/v1/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Widget",
        description: "d",
        categoryId: category.id,
        variants: [{ label: "Std", price: 100, stockQty: 12, sku: variant.sku }],
      });

    expect(restock.status).toBe(200);
    expect(restock.body.data.variants[0].stockQty).toBe(12);
    // Variant id survives the round trip — carts and kit options that reference
    // it are not broken by a sold-out/restock cycle.
    expect(restock.body.data.variants[0].id).toBe(variant.id);
  });

  it("requires an admin token", async () => {
    const { product } = await seedProduct(5);
    const res = await request(app).patch(`/v1/admin/products/${product.id}/sold-out`);
    expect(res.status).toBe(401);
  });

  it("404s for an unknown product", async () => {
    const token = await adminToken();
    const res = await request(app)
      .patch("/v1/admin/products/prod_does_not_exist/sold-out")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
