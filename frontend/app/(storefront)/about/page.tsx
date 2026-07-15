import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function AboutPage() {
  return (
    <>
      <Header variant="content" />
      <main className="mx-auto max-w-[720px] flex-1 px-4 pt-6 pb-14 sm:px-8 sm:pt-10">
        <div className="mb-2.5 text-[13px] text-muted-light">
          <Link href="/">Home</Link> / <span className="text-ink">About</span>
        </div>
        <h1 className="mb-5 text-2xl font-extrabold sm:text-[34px]">About Zeroplus</h1>

        <div
          className="mb-7 flex h-[220px] items-center justify-center rounded-[18px] text-[11px] font-semibold text-black/30"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.045) 0 8px, transparent 8px 16px)" }}
        >
          store / team photo
        </div>

        <div className="text-[15.5px] leading-relaxed">
          <p className="mb-4">
            Zeroplus started in Kothamangalam as a small neighbourhood shop for new and expecting parents — a place
            to find genuine diapers, feeding supplies, and clothing without the guesswork.
          </p>
          <p className="mb-4">
            Today we serve families across Ernakulam district, both in-store and online, with the same promise we
            started with: real products, honest prices, and people who actually know the difference between one
            diaper brand and another.
          </p>
          <h2 className="mb-3 mt-8 text-lg font-bold">Why parents choose us</h2>
          <p className="mb-4">
            Every product on our shelves is sourced directly from authorised distributors — no grey-market stock, no
            expired batches. Our team tests and re-orders based on what actually works for babies in Kerala&rsquo;s
            climate.
          </p>
          <p className="mb-4">
            Have a question before you buy? Visit us at our Kothamangalam store or reach out on WhatsApp — we&rsquo;re
            happy to help you pick the right size or product for your little one.
          </p>
        </div>
      </main>
    </>
  );
}
