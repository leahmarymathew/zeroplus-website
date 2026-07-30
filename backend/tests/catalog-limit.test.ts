import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedProduct } from "./helpers.js";

const app = buildApp();
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

// The storefront browse pages have no pagination UI — they request limit=60 to
// render the whole catalogue at once. When the cap was 50 they all 400'd and
// showed an empty grid, so the limit the frontend actually sends is pinned here.
const STOREFRONT_LIMIT = 60;

describe("GET /v1/products — limit bounds", () => {
  it("accepts the limit the storefront browse pages send", async () => {
    await seedProduct();
    const res = await request(app).get("/v1/products").query({ sort: "popular", limit: STOREFRONT_LIMIT });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("accepts the same limit alongside the Best Deals and search filters", async () => {
    await seedProduct();
    for (const query of [
      { onSale: "true", sort: "popular", limit: STOREFRONT_LIMIT },
      { q: "Widget", sort: "popular", limit: STOREFRONT_LIMIT },
    ]) {
      const res = await request(app).get("/v1/products").query(query);
      expect(res.status).toBe(200);
    }
  });

  it("still rejects an unbounded limit", async () => {
    const res = await request(app).get("/v1/products").query({ limit: 5000 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("reports the requested limit in the pagination meta", async () => {
    await seedProduct();
    const res = await request(app).get("/v1/products").query({ limit: STOREFRONT_LIMIT });
    expect(res.body.pagination.limit).toBe(STOREFRONT_LIMIT);
  });
});
