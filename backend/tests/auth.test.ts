import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedUser } from "./helpers.js";

const app = buildApp();
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const creds = { name: "A", email: "a@example.com", phone: "+919812345678", password: "password123" };

describe("auth", () => {
  it("registers and returns a token without leaking the hash", async () => {
    const res = await request(app).post("/v1/auth/register").send(creds);
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.role).toBe("CUSTOMER");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/v1/auth/register").send(creds);
    const res = await request(app).post("/v1/auth/register").send({ ...creds, phone: "+919800000000" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("returns the same error for wrong password and unknown account", async () => {
    await request(app).post("/v1/auth/register").send(creds);
    const wrongPw = await request(app).post("/v1/auth/login").send({ identifier: creds.email, password: "nope" });
    const noUser = await request(app).post("/v1/auth/login").send({ identifier: "ghost@example.com", password: "whatever" });
    expect(wrongPw.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(noUser.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("registers without an email and logs in by phone", async () => {
    const phoneOnly = { name: "P", phone: "+919800001111", password: "password123" };
    const reg = await request(app).post("/v1/auth/register").send(phoneOnly);
    expect(reg.status).toBe(201);
    expect(reg.body.data.user.email).toBeNull();

    const byPhone = await request(app)
      .post("/v1/auth/login")
      .send({ identifier: phoneOnly.phone, password: phoneOnly.password });
    expect(byPhone.status).toBe(200);
    expect(byPhone.body.data.accessToken).toBeTruthy();
  });

  it("logs in by email or phone for the same account", async () => {
    await request(app).post("/v1/auth/register").send(creds);
    const byEmail = await request(app).post("/v1/auth/login").send({ identifier: creds.email, password: creds.password });
    const byPhone = await request(app).post("/v1/auth/login").send({ identifier: creds.phone, password: creds.password });
    expect(byEmail.status).toBe(200);
    expect(byPhone.status).toBe(200);
  });

  it("blocks protected routes without a token and non-admins from admin routes", async () => {
    const noAuth = await request(app).get("/v1/addresses");
    expect(noAuth.status).toBe(401);

    await seedUser("cust@example.com", "password123", "CUSTOMER");
    const login = await request(app).post("/v1/auth/login").send({ identifier: "cust@example.com", password: "password123" });
    const token = login.body.data.accessToken;
    const forbidden = await request(app).get("/v1/admin/products").set("Authorization", `Bearer ${token}`);
    expect(forbidden.status).toBe(403);
  });

  it("refreshes an access token from the cookie", async () => {
    const agent = request.agent(app);
    await agent.post("/v1/auth/register").send(creds);
    const res = await agent.post("/v1/auth/refresh");
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });
});
