import axios from "axios";
import { config } from "../config.js";

// Sends an OTP via the WhatsApp Business Platform (Meta Cloud API) using an
// approved AUTHENTICATION-category template. We still generate/verify the code
// ourselves — WhatsApp only delivers it. No TRAI DLT registration required.
//
// The template must exist and be approved in WhatsApp Manager (name =
// WHATSAPP_OTP_TEMPLATE). Meta's authentication templates put the code in the
// body AND in a one-tap/copy button, so both components carry the same code.
// If the approved template uses a plain copy-code button, adjust the button
// sub_type below to match ("url" for one-tap autofill).
// Meta wants digits only, *including* the country code. The checkout form
// validates a bare 10-digit Indian number and sends exactly that, so stripping
// non-digits alone would hand Meta "9812345678" and every send would fail.
// India-only store (plan Section 12), so a 10-digit number gets 91 prepended;
// anything already carrying a country code is passed through untouched.
const INDIA_CC = "91";

export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits.length === 10 ? `${INDIA_CC}${digits}` : digits;
}

export async function sendOtpWhatsApp(phone: string, code: string): Promise<void> {
  const wa = config.otp.whatsapp;
  const to = toWhatsAppNumber(phone);
  const url = `https://graph.facebook.com/${wa.apiVersion}/${wa.phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: wa.template,
        language: { code: wa.lang },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${wa.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    },
  );
}
