import { describe, it, expect } from "vitest";
import { toWhatsAppNumber } from "../src/lib/whatsapp.js";

// Meta's Cloud API needs digits including the country code. The checkout form
// validates a bare 10-digit Indian number (frontend addressSchema: /^\d{10}$/)
// and sends that, so the 10-digit case is the one that actually happens in
// production — it must come out as 91XXXXXXXXXX, not XXXXXXXXXX.
describe("toWhatsAppNumber", () => {
  it("prepends the India country code to a bare 10-digit number", () => {
    expect(toWhatsAppNumber("9812345678")).toBe("919812345678");
  });

  it("leaves a number that already has the country code alone", () => {
    expect(toWhatsAppNumber("919812345678")).toBe("919812345678");
  });

  it("strips +, spaces and dashes without double-prefixing", () => {
    expect(toWhatsAppNumber("+91 98123-45678")).toBe("919812345678");
    expect(toWhatsAppNumber("+919812345678")).toBe("919812345678");
    expect(toWhatsAppNumber("98123 45678")).toBe("919812345678");
  });

  it("never produces a number shorter than a dialable one", () => {
    for (const input of ["9812345678", "+919812345678", "91 98123 45678"]) {
      expect(toWhatsAppNumber(input).length).toBeGreaterThanOrEqual(12);
    }
  });
});
