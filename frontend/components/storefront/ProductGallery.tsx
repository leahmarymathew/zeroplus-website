"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { ProductImage } from "@/lib/types";

// momncute-style gallery: a large main image with a row of thumbnails below.
// Clicking a thumbnail swaps the main image. Falls back to a hatched
// placeholder when a product has no photos yet.
export function ProductGallery({
  images,
  name,
  ownerHighlight,
  onSale,
}: {
  images: ProductImage[];
  name: string;
  ownerHighlight?: string | null;
  onSale?: boolean;
}) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [active, setActive] = useState(0);
  const current = sorted[active];

  return (
    <div>
      <div className="relative">
        <div className="flex h-[360px] items-center justify-center overflow-hidden rounded-[20px] bg-surface-pink-light">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={name} className="h-full w-full object-contain" />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase text-black/30"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(0,0,0,.045) 0 6px, transparent 6px 12px)" }}
            >
              product photo
            </span>
          )}
        </div>

        {onSale && (
          <div className="absolute right-3.5 top-3.5 rounded-full bg-rose px-3 py-1.5 text-xs font-extrabold text-white shadow-lg">
            SALE
          </div>
        )}
        {ownerHighlight && (
          <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
            <Star size={13} fill="currentColor" strokeWidth={0} />
            {ownerHighlight}
          </div>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`h-[70px] w-[70px] flex-none overflow-hidden rounded-xl border-[1.5px] ${
                i === active ? "border-rose" : "border-border-pink-light"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
