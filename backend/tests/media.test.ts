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

describe("uploads — file type gate", () => {
  // Real accepted uploads hit live Cloudinary (config loads real credentials
  // via dotenv regardless of NODE_ENV) — only the request-validation layer is
  // exercised here, not a real network upload.
  it("rejects a disallowed file type before reaching Cloudinary", async () => {
    const token = await adminToken();
    const res = await request(app)
      .post("/v1/uploads/image")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("not a real file"), { filename: "notes.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("requires an admin token", async () => {
    const res = await request(app)
      .post("/v1/uploads/image")
      .attach("file", Buffer.from("fake"), { filename: "clip.mp4", contentType: "video/mp4" });
    expect(res.status).toBe(401);
  });
});

describe("product videoUrl", () => {
  it("accepts an optional videoUrl on create and returns it unchanged", async () => {
    const token = await adminToken();
    const category = await prisma.category.create({ data: { name: "Cat", slug: "cat" } });
    const res = await request(app)
      .post("/v1/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Widget",
        description: "d",
        categoryId: category.id,
        videoUrl: "https://res.cloudinary.com/zdpvtoe2/video/upload/v1/zeroplus/widget-demo.mp4",
        variants: [{ label: "Std", price: 100, stockQty: 5, sku: "SKU-WIDGET" }],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.videoUrl).toBe("https://res.cloudinary.com/zdpvtoe2/video/upload/v1/zeroplus/widget-demo.mp4");
  });

  it("defaults videoUrl to null when omitted", async () => {
    const token = await adminToken();
    const category = await prisma.category.create({ data: { name: "Cat", slug: "cat" } });
    const res = await request(app)
      .post("/v1/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Widget",
        description: "d",
        categoryId: category.id,
        variants: [{ label: "Std", price: 100, stockQty: 5, sku: "SKU-WIDGET" }],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.videoUrl).toBeNull();
  });

  it("clears videoUrl on update when set back to null", async () => {
    const token = await adminToken();
    const { product } = await seedProduct();
    await prisma.product.update({ where: { id: product.id }, data: { videoUrl: "https://example.com/old.mp4" } });

    const res = await request(app)
      .patch(`/v1/admin/products/${product.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        videoUrl: null,
        variants: [{ label: "Std", price: 100, stockQty: 5, sku: "SKU-WIDGET-STD" }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.videoUrl).toBeNull();
  });
});

describe("banners — videoUrl + public visibility", () => {
  it("public GET /v1/banners returns only ACTIVE slides, including videoUrl", async () => {
    const token = await adminToken();
    const active = await request(app)
      .post("/v1/admin/banners")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Active Slide", videoUrl: "https://res.cloudinary.com/zdpvtoe2/video/upload/v1/zeroplus/hero.mp4" });
    const scheduled = await request(app)
      .post("/v1/admin/banners")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Scheduled Slide" });
    await request(app)
      .patch(`/v1/admin/banners/${scheduled.body.data.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "SCHEDULED" });

    const res = await request(app).get("/v1/banners");
    expect(res.status).toBe(200);
    const titles = res.body.data.map((b: { title: string }) => b.title);
    expect(titles).toContain("Active Slide");
    expect(titles).not.toContain("Scheduled Slide");
    const activeSlide = res.body.data.find((b: { id: string }) => b.id === active.body.data.id);
    expect(activeSlide.videoUrl).toBe("https://res.cloudinary.com/zdpvtoe2/video/upload/v1/zeroplus/hero.mp4");
  });

  it("public banners endpoint needs no auth", async () => {
    const res = await request(app).get("/v1/banners");
    expect(res.status).toBe(200);
  });
});
