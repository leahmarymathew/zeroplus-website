import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header variant="content" />
      <main className="mx-auto max-w-[720px] flex-1 px-4 pt-6 pb-14 sm:px-8 sm:pt-10">
        <div className="mb-2.5 text-[13px] text-muted-light">
          <Link href="/">Home</Link> / <span className="text-ink">Privacy Policy</span>
        </div>
        <h1 className="mb-5 text-2xl font-extrabold sm:text-[34px]">Privacy Policy</h1>

        <div className="text-[15.5px] leading-relaxed">
          <p className="mb-4">
            Last updated: 1 July 2026. This policy explains what information Zeroplus collects when you shop with
            us, and how we use it.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Information We Collect</h2>
          <p className="mb-4">
            Name, phone number, email, delivery address, and order history — collected when you register, check
            out, or contact us. We never collect payment card details directly; these are handled by our payment
            partners.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">How We Use It</h2>
          <p className="mb-4">
            To process and deliver your orders, send order updates via SMS/WhatsApp, and improve our product
            selection. We do not sell your data to third parties.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Data Security</h2>
          <p className="mb-4">
            We use industry-standard measures to protect your information. Access is limited to staff who need it to
            fulfil your orders.
          </p>
          <h2 className="mb-2.5 mt-7 text-lg font-bold">Your Rights</h2>
          <p className="mb-4">
            You can request a copy of your data, ask us to correct it, or request deletion of your account by
            emailing hello@zeroplus.in.
          </p>
        </div>
      </main>
    </>
  );
}
