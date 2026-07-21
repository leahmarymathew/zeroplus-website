import type { ApiResult } from "@/lib/types";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// POST /v1/otp/send — checkout verification (Section 6.4). Returns the otpId
// the customer's typed code is verified against. The code itself is delivered
// over WhatsApp (or printed to the server console in dev).
export async function sendOtp(phone: string): Promise<ApiResult<{ otpId: string; expiresInSeconds: number }>> {
  if (!USE_MOCKS) {
    return unwrap<{ otpId: string; expiresInSeconds: number }>(
      api.post("/otp/send", { phone, purpose: "checkout" })
    );
  }
  await delay(200);
  return { success: true, data: { otpId: `mock-otp-${Date.now()}`, expiresInSeconds: 300 } };
}

// POST /v1/otp/verify — marks the OTP verified so it can authorize one COD
// order. In mock mode any 6-digit code passes.
export async function verifyOtp(otpId: string, code: string): Promise<ApiResult<{ verified: true }>> {
  if (!USE_MOCKS) return unwrap<{ verified: true }>(api.post("/otp/verify", { otpId, code }));
  await delay(200);
  if (!/^[0-9]{6}$/.test(code)) {
    return { success: false, error: { code: "OTP_INVALID", message: "Enter the 6-digit code" } };
  }
  return { success: true, data: { verified: true } };
}
