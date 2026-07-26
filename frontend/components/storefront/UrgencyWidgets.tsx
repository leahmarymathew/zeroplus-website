"use client";

import { useEffect, useState } from "react";
import { Flame, Eye } from "lucide-react";

// Social-proof nudges (momncute-style). The counts are randomized on the
// client after mount — generating them during render would cause a hydration
// mismatch, and they're intentionally illustrative, not real telemetry.
export function UrgencyWidgets({ seed }: { seed: string }) {
  const [stats, setStats] = useState<{ sold: number; viewing: number } | null>(null);

  useEffect(() => {
    // Derive from the product id so the numbers are stable per product per load
    // but vary across products.
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    setStats({ sold: 8 + (h % 40), viewing: 3 + ((h >>> 3) % 15) });
  }, [seed]);

  if (!stats) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2.5">
      <span className="flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1.5 text-[12.5px] font-bold text-warning-text">
        <Flame size={14} strokeWidth={2} /> {stats.sold} sold in the last 24 hours
      </span>
      <span className="flex items-center gap-1.5 rounded-full bg-info-bg px-3 py-1.5 text-[12.5px] font-bold text-info-text">
        <Eye size={14} strokeWidth={2} /> {stats.viewing} people viewing now
      </span>
    </div>
  );
}
