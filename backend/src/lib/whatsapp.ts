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
export async function sendOtpWhatsApp(phone: string, code: string): Promise<void> {
  const wa = config.otp.whatsapp;
  const to = phone.replace(/[^0-9]/g, ""); // Meta wants digits only, with country code
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
