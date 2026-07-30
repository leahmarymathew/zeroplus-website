import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedUser, seedOtp } from "./helpers.js";

const app = buildApp();
beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const creds = { name: "A", email: "a@example.com", phone: "+919812345678", password: "password123" };

// Every signup path requires a verified phone (Section on leads) — register()
// calls the real verifyOtp, so tests need a genuine REGISTER-purpose OTP for
// the exact phone being registered, not just any otpId.
async function registerWithOtp(overrides: Partial<typeof creds> = {}) {
  const body = { ...creds, ...overrides };
  const { otpId, code } = await seedOtp(body.phone, "REGISTER");
  return request(app)
    .post("/v1/auth/register")
    .send({ ...body, otpId, code });
}

describe("auth", () => {
  it("registers and returns a token without leaking the hash", async () => {
    const res = await registerWithOtp();
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.role).toBe("CUSTOMER");
  });

  it("rejects a duplicate email with 409", async () => {
    await registerWithOtp();
    const res = await registerWithOtp({ phone: "+919800000000" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("returns the same error for wrong password and unknown account", async () => {
    await registerWithOtp();
    const wrongPw = await request(app).post("/v1/auth/login").send({ identifier: creds.email, password: "nope" });
    const noUser = await request(app).post("/v1/auth/login").send({ identifier: "ghost@example.com", password: "whatever" });
    expect(wrongPw.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(noUser.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("registers without an email and logs in by phone", async () => {
    const reg = await registerWithOtp({ email: undefined, phone: "+919800001111" });
    expect(reg.status).toBe(201);
    expect(reg.body.data.user.email).toBeNull();

    const byPhone = await request(app)
      .post("/v1/auth/login")
      .send({ identifier: "+919800001111", password: creds.password });
    expect(byPhone.status).toBe(200);
    expect(byPhone.body.data.accessToken).toBeTruthy();
  });

  it("logs in by email or phone for the same account", async () => {
    await registerWithOtp();
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
    const { otpId, code } = await seedOtp(creds.phone, "REGISTER");
    await agent.post("/v1/auth/register").send({ ...creds, otpId, code });
    const res = await agent.post("/v1/auth/refresh");
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  describe("phone verification at signup", () => {
    it("rejects registration without an otpId/code", async () => {
      const res = await request(app).post("/v1/auth/register").send(creds);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects a code that doesn't match the OTP that was sent", async () => {
      const { otpId } = await seedOtp(creds.phone, "REGISTER", "123456");
      const res = await request(app)
        .post("/v1/auth/register")
        .send({ ...creds, otpId, code: "000000" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("OTP_INVALID");
    });

    it("rejects an OTP verified for a different phone number", async () => {
      const { otpId, code } = await seedOtp("+919800009999", "REGISTER");
      const res = await request(app)
        .post("/v1/auth/register")
        .send({ ...creds, otpId, code });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("OTP_INVALID");
    });

    it("rejects an OTP that was sent for a different purpose (e.g. checkout)", async () => {
      const { otpId, code } = await seedOtp(creds.phone, "CHECKOUT");
      const res = await request(app)
        .post("/v1/auth/register")
        .send({ ...creds, otpId, code });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("OTP_INVALID");
    });

    it("consumes the OTP on a successful registration so it can't be reused", async () => {
      const { otpId, code } = await seedOtp(creds.phone, "REGISTER");
      const first = await request(app)
        .post("/v1/auth/register")
        .send({ ...creds, otpId, code });
      expect(first.status).toBe(201);

      const row = await prisma.otpRequest.findUnique({ where: { id: otpId } });
      expect(row?.consumed).toBe(true);
    });
  });
});
