"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { getOrder } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"];
const STEP_LABELS: Record<OrderStatus, string> = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    getOrder(id).then((res) => setOrder(res.success ? res.data : null));
  }, [id]);

  const isAccountView = hydrated && !!user;

  return (
    <>
      <Header
        variant="minimal"
        rightSlot={
          !isAccountView ? (
            <Link href="/login" className="rounded-full bg-surface-pink-light px-4 py-2 text-[13px] font-bold text-rose">
              Log In
            </Link>
          ) : undefined
        }
      />
      <main className="flex-1">
        <div className="mx-auto max-w-[760px] px-4 pt-6 pb-14 sm:px-8 sm:pt-9">
          {isAccountView && (
            <div className="mb-3 text-[13px] text-muted-light">
              <Link href="/account">Account</Link> / <Link href="/account/orders">My Orders</Link> /{" "}
              <span className="text-ink">Order</span>
            </div>
          )}

          {order === undefined && <p className="text-muted">Loading order…</p>}

          {order === null && (
            <div className="rounded-[18px] border border-border-pink-light bg-white p-8 text-center">
              <h1 className="mb-2 text-xl font-extrabold">Order not found</h1>
              <p className="text-sm text-muted">
                We couldn&rsquo;t find that order on this device. Mock orders are stored locally until a real backend exists.
              </p>
            </div>
          )}

          {order && (
            <>
              <div className="mb-6">
                <div className="mb-1.5 text-[13px] text-muted-light">Order {order.orderNumber}</div>
                <h1 className="mb-1 text-2xl font-extrabold sm:text-[26px]">
                  {order.status === "CANCELLED" ? "Order cancelled" : STEP_LABELS[order.status] + " — order in progress"}
                </h1>
                <p className="m-0 text-[13.5px] text-muted">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {!isAccountView && " · No account needed — bookmark this page or use the link from your confirmation email."}
                </p>
              </div>

              {order.status === "CANCELLED" ? (
                <div className="mb-5 rounded-[18px] border border-border-pink-light bg-danger-bg p-5 text-center text-sm font-bold text-danger-text">
                  This order was cancelled.
                </div>
              ) : (
                <Stepper status={order.status} />
              )}

              {order.trackingNumber && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-info-bg p-4.5">
                  <div>
                    <div className="mb-0.5 text-[13.5px] font-bold text-info-text">Tracking Number</div>
                    <div className="text-[14.5px] font-extrabold text-info-text-dark">{order.trackingNumber}</div>
                  </div>
                  <span className="rounded-full border-[1.5px] border-info-bg bg-white px-4.5 py-2 text-[13px] font-bold text-info-text">
                    Track with Courier
                  </span>
                </div>
              )}

              <div className="mb-4 rounded-[18px] border border-border-pink-light bg-white p-5">
                <h2 className="mb-3.5 text-[15px] font-bold">Items</h2>
                <div className="flex flex-col gap-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-[52px] w-[52px] flex-none rounded-[10px] bg-surface-pink-light" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-bold">{item.kitName ?? item.productName}</div>
                        <div className="text-xs text-muted-light">
                          {item.variantLabel} · Qty {item.quantity}
                        </div>
                      </div>
                      <div className="text-[13.5px] font-bold text-rose">{formatPrice(item.priceAtPurchase * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="my-3.5 h-px bg-border-pink-light" />
                <div className="flex justify-between text-[15px] font-extrabold">
                  <span>Total</span>
                  <span className="text-rose">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="rounded-[18px] border border-border-pink-light bg-white p-5">
                <h2 className="mb-2.5 text-[15px] font-bold">Delivery Address</h2>
                <p className="m-0 text-[13.5px] leading-relaxed text-muted">
                  {order.addressSnapshot.line1}
                  <br />
                  {order.addressSnapshot.city}, {order.addressSnapshot.state} {order.addressSnapshot.pincode}
                  <br />
                  {order.addressSnapshot.phone}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Stepper({ status }: { status: OrderStatus }) {
  const currentIndex = STEPS.indexOf(status);
  return (
    <div className="mb-5 overflow-x-auto rounded-[18px] border border-border-pink-light bg-white p-5 sm:p-6">
      <div className="flex min-w-[480px] items-start">
        {STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <div key={step} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <div
                  className={`absolute right-1/2 top-4 z-0 h-[3px] w-full ${i <= currentIndex ? "bg-rose" : "bg-border-pink-light"}`}
                />
              )}
              <div
                className={`z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
                  done ? "bg-rose" : "bg-border-pink-light"
                }`}
              >
                {done ? (
                  <Check size={16} className="text-white" strokeWidth={3} />
                ) : (
                  <span className="text-xs font-extrabold text-strikethrough">{i + 1}</span>
                )}
              </div>
              <div className={`mt-2 text-center text-xs font-bold ${done ? "text-ink" : "text-strikethrough"}`}>
                {STEP_LABELS[step]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
