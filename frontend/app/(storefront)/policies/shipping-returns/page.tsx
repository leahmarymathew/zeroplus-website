import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function ShippingReturnsPolicyPage() {
  return (
    <>
      <Header variant="content" />
      <main className="mx-auto max-w-[720px] flex-1 px-4 pt-6 pb-14 sm:px-8 sm:pt-10">
        <div className="mb-2.5 text-[13px] text-muted-light">
          <Link href="/">Home</Link> / <span className="text-ink">Shipping &amp; Returns</span>
        </div>
        <h1 className="mb-5 text-2xl font-extrabold sm:text-[34px]">Shipping &amp; Returns Policy</h1>

        <div className="text-[15.5px] leading-relaxed">
          <h2 className="mb-2.5 text-lg font-bold">Delivery</h2>
          <p className="mb-4">
            We deliver across Ernakulam district within 24–48 hours, and across Kerala within 3–5 business days.
            Orders above ₹499 ship free; orders below incur a flat ₹49 delivery fee.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Cash on Delivery</h2>
          <p className="mb-4">
            COD is available on all orders under ₹5,000. A one-time OTP confirms your phone number at checkout to
            reduce failed deliveries.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Returns &amp; Exchanges</h2>
          <p className="mb-4">
            Unused, unworn, and sealed items can be returned within 7 days of delivery for a full refund or exchange.
            Opened diaper packs, wipes, and feeding items cannot be returned for hygiene reasons unless defective. We
            recommend recording an unboxing video, which speeds up any damage claim.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Damaged or Wrong Items</h2>
          <p className="mb-4">
            If your order arrives damaged or incorrect, contact us within 48 hours via WhatsApp or email with
            photos, and we&rsquo;ll arrange a free replacement or refund.
          </p>
        </div>
      </main>
    </>
  );
}
