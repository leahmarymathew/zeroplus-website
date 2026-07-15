"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { STORE, whatsappLink } from "@/lib/constants";

const CONTACT_DETAILS = [
  { Icon: MapPin, label: "Store Address", value: STORE.addressLines.join(", ") },
  { Icon: Phone, label: "Phone", value: STORE.phoneDisplay, href: "tel:+919800000000" },
  { Icon: Mail, label: "Email", value: STORE.email, href: `mailto:${STORE.email}` },
  { Icon: Clock, label: "Store Hours", value: "Mon–Sat, 9:30 AM – 8:30 PM" },
];

// No backend yet — the message form is a UI-only stub (no POST endpoint in
// Section 6.2 for a contact form); WhatsApp is the real contact path today.
export default function ContactPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    toast.success("Message sent — we'll get back to you soon");
    setName("");
    setPhone("");
    setMessage("");
  }

  return (
    <>
      <Header variant="content" />
      <main className="mx-auto max-w-[900px] flex-1 px-4 pt-6 pb-14 sm:px-8 sm:pt-10">
        <div className="mb-2.5 text-[13px] text-muted-light">
          <Link href="/">Home</Link> / <span className="text-ink">Contact</span>
        </div>
        <span className="mb-3.5 inline-block rounded-full bg-surface-pink-light px-3.5 py-[5px] text-xs font-bold text-rose">
          We&rsquo;d love to help
        </span>
        <h1 className="mb-2 text-2xl font-extrabold sm:text-[34px]">Visit or reach out to Zeroplus</h1>
        <p className="mb-8 max-w-[520px] text-[15px] text-muted">
          Have a question about sizing, an order, or want to see a product in person? Our Kothamangalam store team is
          happy to help.
        </p>

        <div className="flex flex-wrap gap-8">
          <div className="min-w-[280px] flex-1 basis-[320px]">
            <div
              className="mb-5 flex h-[220px] items-center justify-center rounded-[18px] text-[11px] font-semibold text-black/30"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.045) 0 8px, transparent 8px 16px)" }}
            >
              store map
            </div>
            <div className="flex flex-col gap-4.5">
              {CONTACT_DETAILS.map(({ Icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-surface-pink-light">
                    <Icon size={18} className="text-rose" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="mb-0.5 text-sm font-bold">{label}</div>
                    {href ? (
                      <a href={href} className="text-[13.5px]">
                        {value}
                      </a>
                    ) : (
                      <div className="text-[13.5px] leading-relaxed text-muted">{value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-[280px] flex-1 basis-[320px] rounded-[20px] border border-border-pink-light bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
            <h2 className="mb-4 text-[17px] font-bold">Send us a message</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-full border-[1.5px] border-border-pink px-4 py-[11px] text-[13.5px] outline-none focus:border-rose"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="rounded-full border-[1.5px] border-border-pink px-4 py-[11px] text-[13.5px] outline-none focus:border-rose"
              />
              <textarea
                placeholder="How can we help?"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-y rounded-[18px] border-[1.5px] border-border-pink px-4 py-3 text-[13.5px] outline-none focus:border-rose"
              />
              <button
                type="submit"
                className="rounded-full bg-rose py-[13px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(217,79,140,0.25)]"
              >
                Send Message
              </button>
            </form>
            <div className="my-4.5 flex items-center gap-2.5">
              <div className="h-px flex-1 bg-border-pink-light" />
              <span className="text-xs text-strikethrough">or</span>
              <div className="h-px flex-1 bg-border-pink-light" />
            </div>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-success-bg py-3 text-sm font-bold text-success-text"
            >
              <WhatsAppIcon size={17} />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
