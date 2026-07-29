import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { ProductCardInteractive } from "@/components/storefront/ProductCardInteractive";
import { getCategories } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import { getBanners } from "@/lib/api/banners";
import type { Product } from "@/lib/types";
import { Truck, RotateCcw, ShieldCheck, Banknote, Star } from "lucide-react";

const TRUST_BADGES = [
  { label: "Free delivery above ₹499", Icon: Truck },
  { label: "Easy Returns within 7 days", Icon: RotateCcw },
  { label: "100% Genuine Products", Icon: ShieldCheck },
  { label: "Cash on Delivery Available", Icon: Banknote },
];

// Obviously-placeholder testimonials — swap for real quotes per Section 15.3.
const TESTIMONIALS = [
  { quote: "Placeholder testimonial quote — replace with a real customer quote before launch.", name: "Sample Customer A" },
  { quote: "Placeholder testimonial quote — replace with a real customer quote before launch.", name: "Sample Customer B" },
  { quote: "Placeholder testimonial quote — replace with a real customer quote before launch.", name: "Sample Customer C" },
];

export default async function HomePage() {
  const [categoriesRes, bestSellersRes, newArrivalsRes, bannersRes] = await Promise.all([
    getCategories(),
    getProducts({ sort: "popular", limit: 4 }),
    getProducts({ sort: "newest", limit: 4 }),
    getBanners(),
  ]);

  const categories = categoriesRes.success ? categoriesRes.data : [];
  const bestSellers = bestSellersRes.success ? bestSellersRes.data : [];
  const newArrivals = newArrivalsRes.success ? newArrivalsRes.data : [];
  // Single hero slot — first active banner with media, if any. Multiple
  // active banners exist for the admin's future rotation UI; the storefront
  // just shows the lead one for now.
  const heroBanner = (bannersRes.success ? bannersRes.data : []).find((b) => b.videoUrl || b.imageUrl) ?? null;

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-4 pt-5 sm:px-8 sm:pt-10">
        <div
          className="flex flex-wrap-reverse items-center gap-7 rounded-[28px] p-7 sm:p-14"
          style={{ backgroundImage: "linear-gradient(120deg, var(--color-surface-pink-light), var(--color-surface-pink))" }}
        >
          <div className="min-w-[260px] flex-1 basis-[280px]">
            <span className="mb-3.5 inline-block rounded-full bg-white px-3.5 py-[5px] text-xs font-bold text-rose">
              Kothamangalam&rsquo;s trusted baby store
            </span>
            <h1 className="mb-3 text-[28px] font-extrabold leading-tight sm:text-[44px]">
              Everything your little one needs, delivered with care
            </h1>
            <p className="mb-5 max-w-[440px] text-base text-muted">
              Diapers, feeding, clothing &amp; more — 100% genuine baby products, at your doorstep or in-store.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/shop" variant="primary">
                Shop Now
              </LinkButton>
              <LinkButton href="/kits" variant="secondary">
                Explore Kits
              </LinkButton>
            </div>
          </div>
          {heroBanner?.videoUrl ? (
            <div className="h-[220px] min-w-[220px] flex-1 basis-[260px] overflow-hidden rounded-[20px] bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={heroBanner.videoUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            </div>
          ) : heroBanner?.imageUrl ? (
            <div className="h-[220px] min-w-[220px] flex-1 basis-[260px] overflow-hidden rounded-[20px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroBanner.imageUrl} alt={heroBanner.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div
              className="flex h-[220px] min-w-[220px] flex-1 basis-[260px] items-center justify-center rounded-[20px] text-center text-xs font-semibold text-muted-light"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(233,30,140,.06) 0 10px, rgba(122,79,201,.06) 10px 20px)",
              }}
            >
              hero photo —
              <br />
              parent &amp; baby
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-8 sm:pt-12">
        <h2 className="mb-4.5 text-xl font-bold sm:text-2xl">Shop by Category</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3.5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="flex flex-col items-center gap-2 text-ink"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-[18px] bg-surface-pink-light text-[10px] font-semibold text-black/30">
                photo
              </div>
              <span className="text-center text-[13.5px] font-bold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <ProductRow title="Best Sellers" products={bestSellers} />
      <ProductRow title="New Arrivals" products={newArrivals} />

      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-4.5 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Curated Kits, Made Just for You</h2>
            <p className="mt-1 text-sm text-muted">Pick a starter bundle, then swap in exactly what your baby needs.</p>
          </div>
          <Link href="/kits" className="rounded-full bg-surface-pink px-4 py-2 text-[13.5px] font-bold text-rose">
            See all kits →
          </Link>
        </div>
        <div className="rounded-[20px] border border-border-pink-light bg-white p-6 text-center text-sm text-muted">
          Curated kits are coming soon — this section links to <code>/kits</code>, built in a later milestone.
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-8 sm:pt-12">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
          {TRUST_BADGES.map(({ label, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-input-fill px-2.5 py-4 text-center">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-info">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div className="text-[12.5px] font-bold text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-8 sm:pt-12">
        <h2 className="mb-4.5 text-xl font-bold sm:text-2xl">What Parents Say</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-[18px] border border-border-pink-light bg-white p-4.5">
              <div className="mb-2 flex text-rose">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <p className="mb-3 text-sm leading-relaxed text-muted">{t.quote}</p>
              <div className="text-[13px] font-bold">{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[24px] bg-ink p-6 text-white sm:p-9">
          <div className="min-w-[260px] flex-1 basis-[260px]">
            <h2 className="mb-1.5 text-lg font-bold sm:text-xl">Prefer to shop in person?</h2>
            <p className="text-sm text-white/70">
              Visit us at our Kothamangalam store — see products up close, get expert advice from our team.
            </p>
          </div>
          <Link
            href="/contact"
            className="flex-none rounded-full bg-rose px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(217,79,140,0.25)]"
          >
            Get Directions
          </Link>
        </div>
      </section>
    </>
  );
}

function ProductRow({ title, products }: { title: string; products: Product[] }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-8 sm:pt-12">
      <div className="mb-4.5 flex items-baseline justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        <Link href="/shop" className="text-[13.5px] font-bold">
          See all
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((p) => (
          <ProductCardInteractive key={p.id} product={p} showAddToCart className="w-[170px] flex-none" />
        ))}
      </div>
    </section>
  );
}
