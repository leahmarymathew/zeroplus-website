import Image from "next/image";
import Link from "next/link";
import { STORE, whatsappLink, googleMapsEmbedSrc } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { FacebookIcon } from "@/components/ui/FacebookIcon";
import { InstagramIcon } from "@/components/ui/InstagramIcon";

const POLICY_LINKS = [
  { href: "/policies/shipping-returns", label: "Shipping & Returns" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms of Service" },
  { href: "/faq", label: "FAQ" },
];

const SHOP_LINKS = [
  { href: "/shop", label: "All Products" },
  { href: "/best-deals", label: "Best Deals" },
  { href: "/kits", label: "Curated Kits" },
  { href: "/contact", label: "Contact Us" },
];

const SOCIAL_LINKS = [
  { href: "#", label: "Facebook", Icon: FacebookIcon },
  { href: "#", label: "Instagram", Icon: InstagramIcon },
  { href: whatsappLink(), label: "WhatsApp", Icon: WhatsAppIcon },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border-pink-light bg-input-fill">
      <div className="mx-auto grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 px-4 py-8 sm:px-8 lg:px-12 sm:py-10">
        <div>
          <Image src="/logo.png" alt="Zeroplus" width={1478} height={719} className="mb-2.5 h-12 w-auto" />
          <p className="m-0 text-[13px] leading-relaxed text-muted">
            {STORE.addressLines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>
          <div className="mt-2 h-[70px] w-[120px] overflow-hidden rounded-[10px]">
            {/* Rendered larger and scaled down so Google's embed UI (e.g. the "Maps" pill) shrinks with it — that overlay is fixed-size and can't be restyled directly since it's cross-origin iframe content. */}
            <iframe
              title="Zeroplus store location"
              src={googleMapsEmbedSrc()}
              className="h-[105px] w-[180px] origin-top-left scale-[0.667] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div>
          <div className="mb-2.5 text-[13.5px] font-bold">Contact</div>
          <p className="m-0 text-[13px] leading-[2] text-muted">
            {STORE.phoneDisplay}
            <br />
            {STORE.email}
          </p>
          <div className="mt-2.5 flex gap-2">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={label}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-border-pink bg-white text-rose"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2.5 text-[13.5px] font-bold">Policies</div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            {POLICY_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2.5 text-[13.5px] font-bold">Shop</div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            {SHOP_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border-pink px-4 py-3.5 text-center text-xs text-muted-light">
        © 2026 Zeroplus Moms &amp; Baby Care, Kothamangalam. All rights reserved.
      </div>
    </footer>
  );
}
