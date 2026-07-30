import { Router, type Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { ok } from "../lib/respond.js";
import { unauthorized } from "../lib/errors.js";
import { verifyRefreshToken } from "../lib/jwt.js";
import { config } from "../config.js";
import * as auth from "../services/auth.service.js";
import { mergeGuestCart } from "../services/cart.service.js";
import { GUEST_COOKIE } from "../middleware/guestCart.js";

export const authRouter = Router();

const phoneSchema = z.string().regex(/^\+?[0-9]{10,13}$/, "Enter a valid phone number");

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true, // JS can never read it
    secure: config.isProd, // HTTPS-only in production
    sameSite: "lax",
    path: "/v1/auth", // only sent to auth endpoints
    maxAge: config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
  });
}

// Brute-force protection on credential endpoints (plan Section 1.1)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts, try again later" },
    }),
});

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  // email is optional — customers can register with just a phone number.
  // Accept an empty string (from an untouched form field) as "no email".
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  phone: phoneSchema,
  password: z.string().min(8).max(100),
  // Every signup path requires a phone verified via /otp/send (purpose=register).
  otpId: z.string().min(1),
  code: z.string().regex(/^[0-9]{6}$/),
});

authRouter.post("/register", authLimiter, validate(registerSchema), async (req, res) => {
  const { accessToken, refreshToken, user } = await auth.register(req.body);
  await mergeGuestCart(req.cookies?.[GUEST_COOKIE], user.id);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken, user }, undefined, 201);
});

// `identifier` is an email OR a phone number — the service resolves by shape.
const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { accessToken, refreshToken, user } = await auth.login(req.body);
  await mergeGuestCart(req.cookies?.[GUEST_COOKIE], user.id);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken, user });
});

const googleSchema = z.object({ idToken: z.string().min(1) });

// Existing accounts only — throws GOOGLE_NEEDS_PHONE for a brand new identity
// (see auth.service.ts). The frontend then collects + verifies a phone and
// calls /auth/google/register to actually create the account.
authRouter.post("/google", authLimiter, validate(googleSchema), async (req, res) => {
  const { accessToken, refreshToken, user } = await auth.loginWithGoogle(req.body.idToken);
  await mergeGuestCart(req.cookies?.[GUEST_COOKIE], user.id);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken, user });
});

const googleRegisterSchema = z.object({
  idToken: z.string().min(1),
  phone: phoneSchema,
  otpId: z.string().min(1),
  code: z.string().regex(/^[0-9]{6}$/),
});

authRouter.post("/google/register", authLimiter, validate(googleRegisterSchema), async (req, res) => {
  const { accessToken, refreshToken, user, created } = await auth.registerWithGoogle(req.body);
  await mergeGuestCart(req.cookies?.[GUEST_COOKIE], user.id);
  setRefreshCookie(res, refreshToken);
  ok(res, { accessToken, user }, undefined, created ? 201 : 200);
});

// POST /v1/auth/refresh — auth via the httpOnly cookie, not a Bearer header
authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw unauthorized("Missing refresh token");
  let sub: string;
  try {
    ({ sub } = verifyRefreshToken(token));
  } catch {
    throw unauthorized("Invalid or expired refresh token");
  }
  const { accessToken, refreshToken, user } = await auth.refresh(sub);
  setRefreshCookie(res, refreshToken); // rotate on every refresh
  ok(res, { accessToken, user });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/v1/auth" });
  ok(res, { loggedOut: true });
});

const forgotSchema = z.object({ phone: phoneSchema });

authRouter.post("/forgot-password", authLimiter, validate(forgotSchema), async (req, res) => {
  ok(res, await auth.forgotPassword(req.body.phone));
});

const resetSchema = z.object({
  otpId: z.string().min(1),
  code: z.string().regex(/^[0-9]{6}$/),
  newPassword: z.string().min(8).max(100),
});

authRouter.post("/reset-password", authLimiter, validate(resetSchema), async (req, res) => {
  ok(res, await auth.resetPassword(req.body));
});
