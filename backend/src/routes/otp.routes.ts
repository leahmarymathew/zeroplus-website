import { Router } from "express";
import { z } from "zod";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { ok } from "../lib/respond.js";
import * as otp from "../services/otp.service.js";

export const otpRouter = Router();

// Each send costs a real WhatsApp message — cap sends per phone so the cost
// can't be inflated by repeated requests (plan 6.4).
const sendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.body?.phone as string) || ipKeyGenerator(req.ip ?? ""),
  handler: (_req, res) =>
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many code requests, try again later" },
    }),
});

const sendSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,13}$/),
  // Only CHECKOUT is offered here; LOGIN/PASSWORD_RESET flows have their own routes
  purpose: z.enum(["checkout"]).transform(() => "CHECKOUT" as const),
});

// POST /v1/otp/send — COD checkout verification (plan 6.4)
otpRouter.post("/send", sendLimiter, validate(sendSchema), async (req, res) => {
  const result = await otp.sendOtp(req.body.phone, req.body.purpose);
  ok(res, result);
});

const verifySchema = z.object({
  otpId: z.string().min(1),
  code: z.string().regex(/^[0-9]{6}$/),
});

// POST /v1/otp/verify
otpRouter.post("/verify", validate(verifySchema), async (req, res) => {
  await otp.verifyOtp(req.body.otpId, req.body.code);
  ok(res, { verified: true });
});
