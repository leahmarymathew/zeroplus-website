"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/format";
import type { Kit } from "@/lib/types";
import { useCartStore } from "@/store/cartStore";

export function KitBuilderPanel({ kit }: { kit: Kit }) {
  // slotId -> productVariantId, matching CartItem.kitSelections' shape (Section 5)
  const [selections, setSelections] = useState<Record<string, string>>({});
  const addItem = useCartStore((s) => s.addItem);

  const missing = kit.slots.filter((slot) => !selections[slot.id]);
  const allSelected = missing.length === 0;

  const addOns = useMemo(() => {
    return kit.slots.reduce((sum, slot) => {
      const chosenVariantId = selections[slot.id];
      const option = slot.options.find((o) => o.productVariantId === chosenVariantId);
      return sum + (option?.priceAdjustment ?? 0);
    }, 0);
  }, [kit, selections]);

  const total = kit.basePrice + addOns;

  function handleAddToCart() {
    if (!allSelected) return;
    addItem({
      id: crypto.randomUUID(),
      sessionId: null,
      userId: null,
      variantId: null,
      kitId: kit.id,
      kitSelections: selections,
      quantity: 1,
      name: kit.name,
      variantLabel: null,
      unitPrice: total,
      imageUrl: kit.imageUrl,
    });
    toast.success(`${kit.name} added to cart`);
  }

  return (
    <div className="mt-8 flex flex-wrap-reverse gap-7">
      <div className="flex min-w-[280px] flex-[2_1_380px] flex-col gap-5.5">
        {kit.slots.map((slot) => {
          const chosenVariantId = selections[slot.id];
          return (
            <div key={slot.id}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[15px] font-bold">{slot.label}</span>
                {chosenVariantId ? (
                  <span className="rounded-full bg-success-bg px-2.5 py-[3px] text-[11px] font-bold text-success-text">
                    ✓ Selected
                  </span>
                ) : (
                  <span className="rounded-full bg-warning-bg px-2.5 py-[3px] text-[11px] font-bold text-warning-text">
                    Choose one
                  </span>
                )}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                {slot.options.map((opt) => {
                  const chosen = opt.productVariantId === chosenVariantId;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelections((s) => ({ ...s, [slot.id]: opt.productVariantId }))}
                      className={`rounded-[14px] border-[1.5px] px-3.5 py-3 text-left text-[13px] font-bold ${
                        chosen ? "border-rose bg-rose text-white" : "border-border-pink bg-input-fill text-ink"
                      }`}
                    >
                      <div>{opt.variantLabel}</div>
                      <div className={`mt-0.5 text-[11.5px] font-semibold ${chosen ? "text-white/85" : "text-muted-light"}`}>
                        {opt.priceAdjustment ? `+${formatPrice(opt.priceAdjustment)}` : "Included"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-[1_1_260px] basis-[260px]">
        <div className="sticky top-24 rounded-[18px] border border-border-pink-light bg-white p-5">
          <h2 className="mb-3.5 text-[15px] font-bold">Your Kit</h2>
          <div className="mb-2 flex justify-between text-[13.5px] text-muted">
            <span>Base price</span>
            <span>{formatPrice(kit.basePrice)}</span>
          </div>
          {addOns > 0 && (
            <div className="mb-2 flex justify-between text-[13.5px] text-muted">
              <span>Upgrades</span>
              <span>+{formatPrice(addOns)}</span>
            </div>
          )}
          <div className="my-3 h-px bg-border-pink-light" />
          <div className="mb-4 flex justify-between text-lg font-extrabold">
            <span>Total</span>
            <span className="text-rose">{formatPrice(total)}</span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!allSelected}
            className="w-full rounded-full bg-rose py-[13px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(217,79,140,0.25)] disabled:bg-disabled-bg disabled:text-disabled-text disabled:shadow-none"
          >
            Add Kit to Cart
          </button>
          {!allSelected && (
            <p className="mt-2.5 text-[12.5px] font-bold text-warning-text">
              Still need to choose: {missing.map((s) => s.label.replace(/^Choose (a |an |)/i, "")).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
