import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";
import { config } from "../config.js";
import { sendOtpWhatsApp } from "../lib/whatsapp.js";
import type { OtpPurpose } from "../generated/prisma/enums.js";

// Delivery is swappable: "console" prints the code to the server log (dev),
// "whatsapp" sends via Meta Cloud API. The generate/verify logic is identical
// either way — only this function changes.
async function deliver(phone: string, code: string) {
  if (config.otp.provider === "whatsapp" && config.otp.whatsapp.enabled) {
    await sendOtpWhatsApp(phone, code);
  } else {
    console.log(`[otp:console] phone=${phone} code=${code}`);
  }
}

export async function sendOtp(phone: string, purpose: OtpPurpose) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10); // never store the plaintext code
  const expiresAt = new Date(Date.now() + config.otp.ttlSeconds * 1000);

  const otp = await prisma.otpRequest.create({
    data: { phone, codeHash, purpose, expiresAt },
  });

  await deliver(phone, code); // if this throws, the request row still exists but unusable — fine
  return { otpId: otp.id, expiresInSeconds: config.otp.ttlSeconds };
}

// Verifies a code against a stored request. Enforces expiry, single-use, and
// an attempt cap so a 6-digit code cannot be brute-forced.
export async function verifyOtp(otpId: string, code: string) {
  const otp = await prisma.otpRequest.findUnique({ where: { id: otpId } });
  if (!otp) throw new ApiError(400, "OTP_NOT_FOUND", "Invalid or expired code");
  if (otp.consumed) throw new ApiError(400, "OTP_CONSUMED", "This code has already been used");
  // Expiry must be checked before the already-verified short-circuit, otherwise
  // a verified-but-expired code would still pass (e.g. for password reset).
  if (otp.expiresAt < new Date()) throw new ApiError(400, "OTP_EXPIRED", "This code has expired");
  if (otp.verified) return otp; // idempotent re-verify
  if (otp.attempts >= config.otp.maxAttempts) {
    throw new ApiError(429, "OTP_LOCKED", "Too many attempts, request a new code");
  }

  const match = await bcrypt.compare(code, otp.codeHash);
  if (!match) {
    await prisma.otpRequest.update({ where: { id: otpId }, data: { attempts: { increment: 1 } } });
    throw new ApiError(400, "OTP_INVALID", "Incorrect code");
  }

  return prisma.otpRequest.update({ where: { id: otpId }, data: { verified: true } });
}

// COD checkout gate (plan 6.4): the given OTP must be a verified, unconsumed,
// unexpired CHECKOUT code for the delivery phone. Does NOT consume — the caller
// consumes only after the order actually commits, so a failed checkout leaves
// the OTP reusable for the retry.
export async function assertCheckoutOtp(phone: string, otpId: string | undefined) {
  if (!otpId) throw new ApiError(400, "OTP_REQUIRED", "Phone verification is required for Cash on Delivery");
  const otp = await prisma.otpRequest.findUnique({ where: { id: otpId } });
  if (
    !otp ||
    otp.purpose !== "CHECKOUT" ||
    otp.phone !== phone ||
    !otp.verified ||
    otp.consumed ||
    otp.expiresAt < new Date()
  ) {
    throw new ApiError(400, "OTP_NOT_VERIFIED", "Phone number is not verified for this order");
  }
  return otp;
}

export async function consumeOtp(otpId: string) {
  await prisma.otpRequest.update({ where: { id: otpId }, data: { consumed: true } });
}
