import Link from "next/link";
import { notFound } from "next/navigation";
import { getKit } from "@/lib/api/kits";
import { formatPrice } from "@/lib/format";
import { KitBuilderPanel } from "@/components/storefront/KitBuilderPanel";

export default async function KitBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getKit(slug);
  if (!res.success) notFound();
  const kit = res.data;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-4 text-[13px] text-muted-light">
        <Link href="/">Home</Link> / <Link href="/kits">Kits</Link> / <span className="text-ink">{kit.name}</span>
      </div>

      <div className="flex flex-wrap gap-7">
        <div
          className="h-[200px] min-w-[220px] flex-[1_1_280px] rounded-[20px] flex items-center justify-center text-[11px] font-semibold text-black/30"
          style={{ backgroundImage: "linear-gradient(120deg, var(--color-surface-pink-light), var(--color-surface-pink))" }}
        >
          kit photo
        </div>
        <div className="min-w-[260px] flex-[2_1_340px]">
          <h1 className="mb-2 text-2xl font-extrabold sm:text-[28px]">{kit.name}</h1>
          <p className="mb-3.5 text-[14.5px] leading-relaxed text-muted">{kit.description}</p>
          <div className="text-xs font-bold text-muted-light">Base price</div>
          <div className="text-[22px] font-extrabold text-rose">{formatPrice(kit.basePrice)}</div>
        </div>
      </div>

      <KitBuilderPanel kit={kit} />
    </div>
  );
}
