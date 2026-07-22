import { createHash } from "node:crypto";
import axios from "axios";
import { config } from "../config.js";

// PhonePe Standard Checkout, called over the REST API directly — there is no
// official Node SDK (plan Section 1/11.3). Integrity is a SHA-256 checksum in
// the X-VERIFY header. Verify the exact recipe against PhonePe's live docs
// before go-live; API versions change.
//
// When merchant creds are absent (config.phonepe.enabled === false), the
// client runs in MOCK mode: initiatePayment returns a URL to a local endpoint
// that auto-completes the payment, so the whole redirect→confirm flow is
// demoable without sandbox credentials.

const PAY_PATH = "/pg/v1/pay";

function checksum(payloadBase64: string, path: string): string {
  const hash = createHash("sha256")
    .update(payloadBase64 + path + config.phonepe.saltKey)
    .digest("hex");
  return `${hash}###${config.phonepe.saltIndex}`;
}

export interface InitiateParams {
  merchantTransactionId: string;
  amountRupees: number;
  orderId: string;
  guestToken?: string | null;
  mobileNumber?: string;
}

// Where PhonePe redirects the customer's browser after payment.
function redirectUrl(orderId: string, guestToken?: string | null) {
  const base = `${config.frontendUrl}/order-confirmation/${orderId}`;
  return guestToken ? `${base}?token=${guestToken}` : base;
}

export async function initiatePayment(params: InitiateParams): Promise<{ redirectUrl: string }> {
  if (!config.phonepe.enabled) {
    // Mock: bounce through a backend endpoint that marks the payment paid.
    // Carry the guest token so the mock-pay redirect can hand it to the
    // confirmation page (guests have no JWT to fetch their order otherwise).
    const q = params.guestToken ? `?token=${encodeURIComponent(params.guestToken)}` : "";
    return {
      redirectUrl: `${config.backendPublicUrl}/v1/payments/mock-pay/${params.merchantTransactionId}${q}`,
    };
  }

  const payload = {
    merchantId: config.phonepe.merchantId,
    merchantTransactionId: params.merchantTransactionId,
    merchantUserId: params.orderId,
    amount: params.amountRupees * 100, // paise — the only rupee→paise conversion (plan 6.1)
    redirectUrl: redirectUrl(params.orderId, params.guestToken),
    redirectMode: "REDIRECT",
    callbackUrl: `${config.backendPublicUrl}/v1/payments/phonepe-webhook`,
    mobileNumber: params.mobileNumber?.replace(/[^0-9]/g, "").slice(-10),
    paymentInstrument: { type: "PAY_PAGE" },
  };
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");

  const { data } = await axios.post(
    `${config.phonepe.baseUrl}${PAY_PATH}`,
    { request: base64 },
    { headers: { "Content-Type": "application/json", "X-VERIFY": checksum(base64, PAY_PATH) } },
  );

  const url = data?.data?.instrumentResponse?.redirectInfo?.url;
  if (!url) throw new Error("PhonePe did not return a redirect URL");
  return { redirectUrl: url };
}

export type PhonePeState = "COMPLETED" | "FAILED" | "PENDING";

export async function checkStatus(merchantTransactionId: string): Promise<PhonePeState> {
  if (!config.phonepe.enabled) return "PENDING"; // mock: real state comes from mock-pay endpoint

  const path = `/pg/v1/status/${config.phonepe.merchantId}/${merchantTransactionId}`;
  const { data } = await axios.get(`${config.phonepe.baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": checksum("", path),
      "X-MERCHANT-ID": config.phonepe.merchantId,
    },
  });
  const state = data?.data?.state as string | undefined;
  if (state === "COMPLETED") return "COMPLETED";
  if (state === "FAILED") return "FAILED";
  return "PENDING";
}

// The webhook arrives as { response: <base64> } with an X-VERIFY header.
// Recompute the checksum over the base64 body and compare before trusting it.
export function verifyWebhook(base64Response: string, xVerify: string | undefined): boolean {
  if (!xVerify) return false;
  const expected = createHash("sha256")
    .update(base64Response + config.phonepe.saltKey)
    .digest("hex");
  return `${expected}###${config.phonepe.saltIndex}` === xVerify;
}

export function decodeWebhook(base64Response: string): {
  merchantTransactionId?: string;
  state?: string;
  transactionId?: string;
} {
  const json = JSON.parse(Buffer.from(base64Response, "base64").toString("utf8"));
  return {
    merchantTransactionId: json?.data?.merchantTransactionId,
    state: json?.data?.state ?? json?.code,
    transactionId: json?.data?.transactionId,
  };
}
