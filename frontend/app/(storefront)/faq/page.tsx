"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "24–48 hours within Ernakulam district, 3–5 business days across the rest of Kerala.",
  },
  {
    q: "Is Cash on Delivery available?",
    a: "Yes, on all orders under ₹5,000. We verify your phone number with an OTP before dispatch.",
  },
  {
    q: "Can I return an opened product?",
    a: "Opened diaper packs, wipes, and feeding items can't be returned for hygiene reasons unless defective. Unopened items can be returned within 7 days.",
  },
  {
    q: "Do you sell genuine, non-expired products?",
    a: "Yes — everything is sourced directly from authorised distributors, never grey-market stock.",
  },
  {
    q: "Can I pick up my order from the store instead?",
    a: 'Yes, select "Store Pickup" at checkout and collect from our Kothamangalam location once it\'s ready.',
  },
  {
    q: "How do I track my order without an account?",
    a: "Every confirmation email includes a direct tracking link — no login required.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <>
      <Header variant="content" />
      <main className="mx-auto max-w-[720px] flex-1 px-4 pt-6 pb-14 sm:px-8 sm:pt-10">
        <div className="mb-2.5 text-[13px] text-muted-light">
          <Link href="/">Home</Link> / <span className="text-ink">FAQ</span>
        </div>
        <h1 className="mb-6 text-2xl font-extrabold sm:text-[34px]">Frequently Asked Questions</h1>

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => {
            const open = openIndex === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-border-pink-light bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-bold">{f.q}</span>
                  <Plus size={18} className={`flex-none text-rose transition-transform ${open ? "rotate-45" : ""}`} strokeWidth={2.5} />
                </button>
                {open && <div className="px-5 pb-4.5 text-[14.5px] leading-relaxed text-muted">{f.a}</div>}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
