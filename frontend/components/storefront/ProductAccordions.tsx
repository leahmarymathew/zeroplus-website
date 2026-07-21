"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionSection {
  title: string;
  body: React.ReactNode;
}

// Collapsible Description / Shipping & Returns / Safety sections, momncute-style.
// The first section starts open.
export function ProductAccordions({ sections }: { sections: AccordionSection[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mt-5 divide-y divide-border-pink-light rounded-[16px] border border-border-pink-light">
      {sections.map((s, i) => {
        const isOpen = open === i;
        return (
          <div key={s.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-[14px] font-bold"
            >
              {s.title}
              <ChevronDown size={17} className={`flex-none text-muted-light transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
            </button>
            {isOpen && <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-muted">{s.body}</div>}
          </div>
        );
      })}
    </div>
  );
}
