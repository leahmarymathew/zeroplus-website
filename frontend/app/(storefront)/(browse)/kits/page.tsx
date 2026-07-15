import Link from "next/link";
import { getKits } from "@/lib/api/kits";
import { formatPrice } from "@/lib/format";

export default async function KitsPage() {
  const res = await getKits();
  const kits = res.success ? res.data : [];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-2.5 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <span className="text-ink">Kits</span>
      </div>
      <span className="mb-3 inline-block rounded-full bg-surface-pink-light px-3.5 py-[5px] text-xs font-bold text-rose">
        Curated Kits
      </span>
      <h1 className="mb-2 text-2xl font-extrabold sm:text-[34px]">Ready-made bundles, made yours</h1>
      <p className="mb-7 max-w-[560px] text-[15px] text-muted">
        Start with a kit our team put together for common needs, then customize sizes and options to fit your baby.
      </p>

      {kits.length === 0 ? (
        <p className="py-10 text-center text-muted">No kits available right now.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {kits.map((kit) => (
            <Link
              key={kit.id}
              href={`/kits/${kit.slug}`}
              className="block overflow-hidden rounded-[20px] border border-border-pink-light bg-white text-ink shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
            >
              <div
                className="flex h-[150px] items-center justify-center text-[11px] font-semibold text-black/30"
                style={{ backgroundImage: "linear-gradient(120deg, var(--color-surface-pink-light), var(--color-surface-pink))" }}
              >
                kit photo
              </div>
              <div className="p-4">
                <h2 className="mb-1 text-base font-bold">{kit.name}</h2>
                <p className="mb-2.5 line-clamp-2 text-[13px] leading-relaxed text-muted-light">{kit.description}</p>
                <div className="flex items-center justify-between gap-2.5">
                  <div>
                    <div className="text-[11px] font-bold text-muted-light">From</div>
                    <div className="text-lg font-extrabold text-rose">{formatPrice(kit.basePrice)}</div>
                  </div>
                  <span className="rounded-full bg-rose px-4.5 py-2 text-[13px] font-bold text-white">Customize</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
