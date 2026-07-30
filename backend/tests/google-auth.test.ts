import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedOtp, seedUser } from "./helpers.js";

// google-auth-library talks to Google's servers to verify a real ID token —
// not something a test can produce. Mocked at the OAuth2Client level so
// auth.service.ts's own logic (matching/creating accounts, the phone gate)
// runs for real against the test database; only the token-verification
// round trip to Google itself is stubbed.
const { mockVerifyIdToken } = vi.hoisted(() => ({ mockVerifyIdToken: vi.fn() }));
// `new OAuth2Client(...)` requires a constructable mock — an arrow function
// implementation isn't, so this uses a plain function expression instead.
vi.mock("google-auth-library", () => ({
  OAuth2Client: vi.fn().mockImplementation(function () {
    return { verifyIdToken: mockVerifyIdToken };
  }),
}));

const { buildApp } = await import("../src/app.js");
const app = buildApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

function mockPayload(sub: string, email: string | null = "new@example.com", name: string | null = "New User") {
  mockVerifyIdToken.mockResolvedValueOnce({ getPayload: () => ({ sub, email, name }) });
}

describe("POST /v1/auth/google — existing accounts only", () => {
  it("rejects a token Google itself wouldn't verify", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("bad token"));
    const res = await request(app).post("/v1/auth/google").send({ idToken: "garbage" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_GOOGLE_TOKEN");
  });

  it("logs in an account previously linked by googleId", async () => {
    const user = await seedUser("linked@example.com");
    await prisma.user.update({ where: { id: user.id }, data: { googleId: "g-existing-1" } });
    mockPayload("g-existing-1", "linked@example.com");
    const res = await request(app).post("/v1/auth/google").send({ idToken: "t" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
  });

  it("links by matching email when googleId isn't set yet", async () => {
    const user = await seedUser("emailmatch@example.com");
    mockPayload("g-new-2", "emailmatch@example.com");
    const res = await request(app).post("/v1/auth/google").send({ idToken: "t" });
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(user.id);
    const row = await prisma.user.findUnique({ where: { id: user.id } });
    expect(row?.googleId).toBe("g-new-2");
  });

  it("refuses to silently create an account for a brand new Google identity", async () => {
    mockPayload("g-brand-new", "nobody@example.com");
    const res = await request(app).post("/v1/auth/google").send({ idToken: "t" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("GOOGLE_NEEDS_PHONE");
    // Nothing should have been created — the placeholder-phone account this
    // used to silently create is exactly the gap being closed here.
    expect(await prisma.user.count()).toBe(0);
  });
});

describe("POST /v1/auth/google/register — completes signup with a verified phone", () => {
  it("creates the account with the real phone, not a placeholder", async () => {
    mockPayload("g-signup-1", "signup@example.com", "Signup Person");
    const { otpId, code } = await seedOtp("+919812340001", "REGISTER");
    const res = await request(app)
      .post("/v1/auth/google/register")
      .send({ idToken: "t", phone: "+919812340001", otpId, code });
    expect(res.status).toBe(201);
    expect(res.body.data.user.phone).toBe("+919812340001");
    expect(res.body.data.user.email).toBe("signup@example.com");

    const row = await prisma.otpRequest.findUnique({ where: { id: otpId } });
    expect(row?.consumed).toBe(true);
  });

  it("rejects it without a verified REGISTER otp for that exact phone", async () => {
    mockPayload("g-signup-2", "signup2@example.com");
    const { otpId, code } = await seedOtp("+919812340002", "CHECKOUT"); // wrong purpose
    const res = await request(app)
      .post("/v1/auth/google/register")
      .send({ idToken: "t", phone: "+919812340002", otpId, code });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("OTP_INVALID");
  });

  it("refuses a phone already tied to another account", async () => {
    await seedUser("other@example.com").then((u) => prisma.user.update({ where: { id: u.id }, data: { phone: "+919812340003" } }));
    mockPayload("g-signup-3", "signup3@example.com");
    const { otpId, code } = await seedOtp("+919812340003", "REGISTER");
    const res = await request(app)
      .post("/v1/auth/google/register")
      .send({ idToken: "t", phone: "+919812340003", otpId, code });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("PHONE_TAKEN");
  });

  it("logs in instead of erroring if the Google account got linked elsewhere mid-flow", async () => {
    const user = await seedUser("racer@example.com");
    await prisma.user.update({ where: { id: user.id }, data: { googleId: "g-race" } });
    mockPayload("g-race", "racer@example.com");
    const { otpId, code } = await seedOtp("+919812340004", "REGISTER");
    const res = await request(app)
      .post("/v1/auth/google/register")
      .send({ idToken: "t", phone: "+919812340004", otpId, code });
    expect(res.status).toBe(200); // not 201 — no new account created
    expect(res.body.data.user.id).toBe(user.id);
  });
});
