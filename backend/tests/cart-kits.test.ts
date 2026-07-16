import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedProduct, seedUser } from "./helpers.js";

const app = buildApp();
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("cart", () => {
  it("uses the DB price, clamps to stock, and merges a guest cart on login", async () => {
    const { variant } = await seedProduct(5, 100);
    const agent = request.agent(app);

    const add = await agent.post("/v1/cart/items").send({ variantId: variant.id, quantity: 2 });
    expect(add.status).toBe(201);
    expect(add.body.data.items[0].unitPrice).toBe(100);
    expect(add.body.data.total).toBe(200);

    // clamp: existing 2 + 50 more caps at stock (5)
    const clamp = await agent.post("/v1/cart/items").send({ variantId: variant.id, quantity: 50 });
    expect(clamp.body.data.items[0].quantity).toBe(5);

    // register on the same agent -> guest cart merges to the user
    await agent.post("/v1/auth/register").send({ name: "A", email: "a@example.com", phone: "+919812345678", password: "password123" });
    const login = await agent.post("/v1/auth/login").send({ email: "a@example.com", password: "password123" });
    const token = login.body.data.accessToken;
    const cart = await agent.get("/v1/cart").set("Authorization", `Bearer ${token}`);
    expect(cart.body.data.items).toHaveLength(1);
    expect(cart.body.data.items[0].quantity).toBe(5);
  });
});

describe("kit integrity", () => {
  async function seedKit() {
    const category = await prisma.category.create({ data: { name: "C", slug: "c" } });
    const product = await prisma.product.create({
      data: {
        name: "P",
        slug: "p",
        description: "d",
        categoryId: category.id,
        variants: {
          create: [
            { label: "Cheap", price: 100, stockQty: 10, sku: "SKU-P-CHEAP" },
            { label: "Pricey", price: 5000, stockQty: 10, sku: "SKU-P-PRICEY" },
          ],
        },
      },
      include: { variants: true },
    });
    const cheap = product.variants.find((v) => v.sku === "SKU-P-CHEAP")!;
    const pricey = product.variants.find((v) => v.sku === "SKU-P-PRICEY")!;
    const kit = await prisma.kit.create({
      data: {
        name: "K",
        slug: "k",
        description: "d",
        basePrice: 500,
        slots: { create: { label: "Slot", sortOrder: 0, options: { create: { productVariantId: cheap.id, priceAdjustment: 0 } } } },
      },
      include: { slots: true },
    });
    return { kit, slot: kit.slots[0], cheap, pricey };
  }

  it("rejects a selection that references a variant not listed for the slot", async () => {
    const { kit, slot, pricey } = await seedKit();
    // Attack: substitute the ₹5000 variant, which is NOT an option, at base price
    const res = await request(app)
      .post("/v1/cart/items")
      .send({ kitId: kit.id, kitSelections: { [slot.id]: pricey.id }, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_KIT_SELECTION");
  });

  it("prices a valid kit from base + adjustments", async () => {
    const { kit, slot, cheap } = await seedKit();
    const res = await request(app)
      .post("/v1/cart/items")
      .send({ kitId: kit.id, kitSelections: { [slot.id]: cheap.id }, quantity: 1 });
    expect(res.status).toBe(201);
    expect(res.body.data.items[0].unitPrice).toBe(500); // base, adjustment 0
  });

  it("blocks a review from a user with no delivered order", async () => {
    const { product } = await seedProduct(5, 100);
    const user = await seedUser("r@example.com", "password123");
    const login = await request(app).post("/v1/auth/login").send({ email: "r@example.com", password: "password123" });
    const res = await request(app)
      .post(`/v1/products/${product.id}/reviews`)
      .set("Authorization", `Bearer ${login.body.data.accessToken}`)
      .send({ rating: 5 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("NOT_ELIGIBLE");
    void user;
  });
});
