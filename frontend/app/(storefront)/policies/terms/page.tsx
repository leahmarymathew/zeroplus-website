import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function TermsPage() {
  return (
    <>
      <Header variant="content" />
      <main className="mx-auto max-w-[720px] flex-1 px-4 pt-6 pb-14 sm:px-8 sm:pt-10">
        <div className="mb-2.5 text-[13px] text-muted-light">
          <Link href="/">Home</Link> / <span className="text-ink">Terms &amp; Conditions</span>
        </div>
        <h1 className="mb-5 text-2xl font-extrabold sm:text-[34px]">Terms &amp; Conditions</h1>

        <div className="text-[15.5px] leading-relaxed">
          <p className="mb-4">
            Last updated: 1 July 2026. By using zeroplus.in or shopping at our Kothamangalam store, you agree to the
            following terms.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Orders &amp; Pricing</h2>
          <p className="mb-4">
            All prices are listed in INR and include applicable taxes unless stated otherwise. We reserve the right
            to cancel orders due to pricing errors or stock unavailability, with a full refund issued.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Product Information</h2>
          <p className="mb-4">
            We make every effort to ensure product descriptions, images, and pricing are accurate. Actual packaging
            may vary slightly from images shown.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Payments</h2>
          <p className="mb-4">
            We accept UPI/PhonePe and Cash on Delivery. COD orders require phone verification via OTP before
            dispatch.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Limitation of Liability</h2>
          <p className="mb-4">
            Zeroplus is not liable for indirect or consequential damages arising from product use. Always follow
            manufacturer usage instructions, especially for skincare and feeding items.
          </p>
        </div>
      </main>
    </>
  );
}
