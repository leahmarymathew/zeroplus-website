"use client";

import Link from "next/link";
import { useCartStore, selectCartSubtotal, EMPTY_CART_ITEMS } from "@/store/cartStore";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_FEE } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";

export default function CartPage() {
  // Gated on `hydrated` so the SSR/first-client-render (always empty) matches
  // before the persisted cart loads — otherwise a non-empty cart causes a
  // full-subtree hydration mismatch between the empty state and the item list.
  const hydrated = useCartStore((s) => s.hydrated);
  const items = useCartStore((s) => (hydrated ? s.items : EMPTY_CART_ITEMS));
  const subtotal = useCartStore((s) => (hydrated ? selectCartSubtotal(s) : 0));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <h1 className="mb-5 text-2xl font-extrabold sm:text-[28px]">Your Cart</h1>

      <div className="flex flex-wrap items-start gap-7">
        <div className="min-w-[280px] flex-1 basis-[380px] flex-[2] flex flex-col gap-3.5">
          {items.length === 0 ? (
            <div className="py-10 text-center text-muted-light">
              <p className="mb-3.5">Your cart is empty.</p>
              <LinkButton href="/shop">Continue Shopping</LinkButton>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3.5 rounded-[18px] border border-border-pink-light bg-white p-3.5">
                <div className="h-[76px] w-[76px] flex-none rounded-xl bg-surface-pink-light" />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 truncate text-[14.5px] font-bold">{item.name}</div>
                  {item.variantLabel && <div className="mb-2 text-xs text-muted-light">{item.variantLabel}</div>}
                  <div className="text-[15px] font-extrabold text-rose">{formatPrice(item.unitPrice * item.quantity)}</div>
                </div>
                <div className="flex flex-none items-center gap-2.5">
                  <div className="flex items-center overflow-hidden rounded-full border-[1.5px] border-border-pink">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 bg-input-fill text-[15px] font-bold text-ink"
                    >
                      −
                    </button>
                    <span className="w-[26px] text-center text-[13.5px] font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 bg-input-fill text-[15px] font-bold text-ink"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove"
                    className="text-xl text-strikethrough"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="sticky top-24 min-w-[260px] flex-1 basis-[280px] rounded-[18px] border border-border-pink-light bg-white p-5">
            <h2 className="mb-3.5 text-base font-bold">Order Summary</h2>
            <div className="mb-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Promo code"
                className="flex-1 rounded-full border-[1.5px] border-border-pink px-3.5 py-2 text-[13px] outline-none"
              />
              <button type="button" className="rounded-full border-[1.5px] border-border-secondary bg-white px-4 py-2 text-[13px] font-bold text-rose">
                Apply
              </button>
            </div>
            <div className="mb-2 mt-3 flex justify-between text-[13.5px] text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="mb-2 flex justify-between text-[13.5px] text-muted">
              <span>Delivery</span>
              <span className={shippingFee === 0 ? "font-bold text-success-text" : ""}>
                {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="my-3 h-px bg-border-pink-light" />
            <div className="mb-4.5 flex justify-between text-base font-extrabold">
              <span>Total</span>
              <span className="text-rose">{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              className="block rounded-full bg-rose py-3.5 text-center text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(217,79,140,0.25)]"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
