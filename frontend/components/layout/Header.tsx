"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore, selectCartCount } from "@/store/cartStore";
import { useWishlistStore, selectWishlistCount } from "@/store/wishlistStore";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/best-deals", label: "Best Deals" },
  { href: "/contact", label: "Contact" },
];

function IconBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose text-[10px] font-bold text-white">
      {count}
    </span>
  );
}

const CONTENT_NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface HeaderProps {
  /** "full" = search + all icons + category nav (browse pages). "minimal" =
   * narrow centered logo + wishlist + an optional right slot, used on the
   * checkout/auth/confirmation/tracking funnel where the design drops the
   * search bar and nav tabs to keep focus on the task. "content" = narrow
   * centered logo + a short text nav (Shop/About/Contact) + wishlist icon,
   * used on About/Contact/FAQ/policy pages to keep focus on reading. */
  variant?: "full" | "minimal" | "content";
  rightSlot?: React.ReactNode;
}

export function Header({ variant = "full", rightSlot }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Gated on `hydrated` so the SSR/first-client-render badge count (0, i.e.
  // hidden) matches until the persisted store loads.
  const cartCount = useCartStore((s) => (s.hydrated ? selectCartCount(s) : 0));
  const wishCount = useWishlistStore((s) => (s.hydrated ? selectWishlistCount(s) : 0));

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  if (variant === "content") {
    return (
      <header className="sticky top-0 z-30 border-b border-border-pink-light bg-page">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3.5 px-4 py-3.5 sm:px-8">
          <Link href="/" className="flex flex-none items-center">
            <Image src="/logo.png" alt="Zeroplus" width={1478} height={719} priority className="h-12 w-auto" />
          </Link>
          <nav className="flex items-center gap-4.5 text-[13.5px] font-bold">
            {CONTENT_NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? "text-rose" : "text-ink"}>
                {link.label}
              </Link>
            ))}
            <Link href="/wishlist" aria-label="Wishlist" className="flex text-ink">
              <Heart size={20} strokeWidth={1.8} />
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  if (variant === "minimal") {
    return (
      <header className="sticky top-0 z-30 border-b border-border-pink-light bg-page">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3.5 px-4 py-3.5 sm:px-8">
          <Link href="/" className="flex flex-none items-center">
            <Image src="/logo.png" alt="Zeroplus" width={1478} height={719} priority className="h-12 w-auto" />
          </Link>
          <div className="flex items-center gap-3.5">
            <Link href="/wishlist" aria-label="Wishlist" className="flex text-ink">
              <Heart size={20} strokeWidth={1.8} />
            </Link>
            {rightSlot}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border-pink-light bg-page shadow-[0_2px_12px_rgba(217,79,140,0.05)]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-8">
        <Link href="/" className="flex flex-none items-center gap-2">
          <Image src="/logo.png" alt="Zeroplus" width={1478} height={719} priority className="h-14 w-auto" />
        </Link>

        <form onSubmit={handleSearch} className="flex min-w-[160px] flex-1 items-center gap-2 rounded-full border-[1.5px] border-border-pink bg-input-fill px-4 py-[9px] text-muted-light">
          <Search size={16} className="text-placeholder-icon" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search diapers, feeding, clothing…"
            className="w-full min-w-0 border-none bg-transparent text-sm text-ink outline-none placeholder:text-muted-light"
          />
        </form>

        <div className="flex flex-none items-center gap-3.5">
          <Link href="/wishlist" aria-label="Wishlist" className="relative flex text-ink">
            <Heart size={22} strokeWidth={1.8} />
            <IconBadge count={wishCount} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative flex text-ink">
            <ShoppingBag size={22} strokeWidth={1.8} />
            <IconBadge count={cartCount} />
          </Link>
          <Link href="/account" aria-label="Account" className="flex text-ink">
            <User size={22} strokeWidth={1.8} />
          </Link>
        </div>
      </div>

      <nav className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 pb-2.5 sm:px-8">
        {NAV_LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-none rounded-full px-4 py-1.5 text-sm font-bold ${
                active ? "bg-surface-pink-light text-rose" : "text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
