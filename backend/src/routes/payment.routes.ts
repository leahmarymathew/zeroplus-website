import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { ok } from "../lib/respond.js";
import { ApiError } from "../lib/errors.js";
import { config } from "../config.js";
import { verifyWebhook, decodeWebhook, checkStatus } from "../lib/phonepe.js";
import { applyPaymentResult, getPaymentStatus } from "../services/payment.service.js";

export const paymentsRouter = Router();

const webhookSchema = z.object({ response: z.string().min(1) });

// POST /v1/payments/phonepe-webhook — the authoritative payment confirmation.
// PhonePe calls this server-to-server regardless of whether the customer's
// browser redirects back. We verify the checksum before trusting anything.
paymentsRouter.post("/phonepe-webhook", validate(webhookSchema), async (req, res) => {
  const base64 = req.body.response as string;
  if (!verifyWebhook(base64, req.header("x-verify"))) {
    throw new ApiError(400, "INVALID_CHECKSUM", "Webhook signature verification failed");
  }
  const { merchantTransactionId, state } = decodeWebhook(base64);
  if (!merchantTransactionId) throw new ApiError(400, "INVALID_PAYLOAD", "Missing merchantTransactionId");

  const mapped = state === "COMPLETED" || state === "PAYMENT_SUCCESS" ? "COMPLETED" : state === "FAILED" ? "FAILED" : "PENDING";
  await applyPaymentResult(merchantTransactionId, mapped);
  ok(res, { received: true }); // respond fast; PhonePe only needs a 200
});

// GET /v1/payments/status/:merchantTransactionId — used by the redirect-back
// page if it loads before the webhook has landed. Reconciles by actively
// polling PhonePe when still pending.
paymentsRouter.get("/status/:merchantTransactionId", async (req, res) => {
  const mtid = String(req.params.merchantTransactionId);
  let current = await getPaymentStatus(mtid);
  if (current.status === "PENDING") {
    const state = await checkStatus(mtid);
    if (state !== "PENDING") {
      await applyPaymentResult(mtid, state);
      current = await getPaymentStatus(mtid);
    }
  }
  ok(res, { status: current.status.toLowerCase(), orderId: current.orderId });
});

// DEV-ONLY mock payment page (PhonePe disabled): mimics the hosted page by
// marking the payment succeeded, then redirecting to the frontend confirmation.
// Never mounted when real PhonePe credentials are configured.
if (!config.phonepe.enabled) {
  paymentsRouter.get("/mock-pay/:merchantTransactionId", async (req, res) => {
    const mtid = String(req.params.merchantTransactionId);
    await applyPaymentResult(mtid, "COMPLETED");
    const { orderId } = await getPaymentStatus(mtid);
    res.redirect(`${config.frontendUrl}/order-confirmation/${orderId}`);
  });
}
