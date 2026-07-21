import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../lib/errors.js";
import { signAccessToken, signRefreshToken } from "../lib/jwt.js";
import { config } from "../config.js";
import type { User } from "../generated/prisma/client.js";

// The user shape returned by every auth endpoint — matches frontend/lib/types.ts
// User exactly; passwordHash/googleId never leave the server.
export function publicUser(u: User) {
  const { passwordHash: _p, googleId: _g, ...safe } = u;
  return safe;
}

function issueTokens(user: User) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    user: publicUser(user),
  };
}

export async function register(input: {
  name: string;
  email?: string | null;
  phone: string;
  password: string;
}) {
  // email is optional; only check for a collision when one was provided.
  const email = input.email?.trim() || null;
  const [emailTaken, phoneTaken] = await Promise.all([
    email ? prisma.user.findUnique({ where: { email } }) : null,
    prisma.user.findUnique({ where: { phone: input.phone } }),
  ]);
  if (emailTaken) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  if (phoneTaken) throw new ApiError(409, "PHONE_TAKEN", "An account with this phone number already exists");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });
  return issueTokens(user);
}

// Identical error for unknown account and wrong password — never reveal
// which accounts exist.
const INVALID = () => new ApiError(401, "INVALID_CREDENTIALS", "Invalid credentials");

// A single `identifier` may be an email or a phone number; resolve by whichever
// matches its shape so customers can sign in with either.
export async function login(input: { identifier: string; password: string }) {
  const identifier = input.identifier.trim();
  const where = identifier.includes("@") ? { email: identifier } : { phone: identifier };
  const user = await prisma.user.findUnique({ where });
  if (!user?.passwordHash) throw INVALID();
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw INVALID();
  return issueTokens(user);
}

const googleClient = new OAuth2Client(config.googleClientId);

export async function loginWithGoogle(idToken: string) {
  if (!config.googleClientId) {
    throw new ApiError(503, "SERVICE_UNAVAILABLE", "Google sign-in is not configured yet");
  }

  const ticket = await googleClient
    .verifyIdToken({ idToken, audience: config.googleClientId })
    .catch(() => {
      throw new ApiError(401, "INVALID_GOOGLE_TOKEN", "Google token could not be verified");
    });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new ApiError(401, "INVALID_GOOGLE_TOKEN", "Google token could not be verified");

  const { sub: googleId, email, name } = payload;

  // 1) already linked  2) same email → link  3) brand new account
  let user = await prisma.user.findUnique({ where: { googleId } });
  if (!user && email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      user = await prisma.user.update({ where: { id: byEmail.id }, data: { googleId } });
    }
  }
  if (!user) {
    if (!email) throw new ApiError(400, "GOOGLE_EMAIL_REQUIRED", "Google account has no email");
    user = await prisma.user.create({
      data: {
        name: name ?? email.split("@")[0],
        email,
        googleId,
        // Plan Section 5: phone is unique + required. Google gives no phone,
        // so store a placeholder derived from the google id; the customer
        // sets a real phone at checkout / in their profile.
        phone: `google:${googleId}`,
        passwordHash: null,
      },
    });
  }
  return issueTokens(user);
}

export async function refresh(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "UNAUTHORIZED", "Account no longer exists");
  return issueTokens(user);
}

// Sends a PASSWORD_RESET OTP. Always resolves the same way whether or not an
// account exists for the phone — never leak which numbers are registered.
export async function forgotPassword(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    const { sendOtp } = await import("./otp.service.js");
    return sendOtp(phone, "PASSWORD_RESET");
  }
  // Unknown number: return a response indistinguishable from the real one. A
  // cuid-shaped random id (not a constant like "otp_none") so the otpId can't
  // be used to tell registered from unregistered phones. Verifying it later
  // simply fails as "not found", same as a mistyped code.
  const fakeOtpId = "c" + randomBytes(12).toString("hex");
  return { otpId: fakeOtpId, expiresInSeconds: config.otp.ttlSeconds };
}

export async function resetPassword(input: { otpId: string; code: string; newPassword: string }) {
  const { verifyOtp, consumeOtp } = await import("./otp.service.js");
  const otp = await verifyOtp(input.otpId, input.code);
  if (otp.purpose !== "PASSWORD_RESET" || otp.consumed) {
    throw new ApiError(400, "OTP_INVALID", "Invalid reset code");
  }
  const user = await prisma.user.findUnique({ where: { phone: otp.phone } });
  if (!user) throw new ApiError(400, "OTP_INVALID", "Invalid reset code");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(input.newPassword, 10) },
  });
  await consumeOtp(input.otpId);
  return { reset: true };
}
