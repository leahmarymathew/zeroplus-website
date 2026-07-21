"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LinkButton } from "@/components/ui/Button";
import { getOrder } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

const PAYMENT_METHOD_LABEL: Record<Order["paymentMethod"], string> = {
  PHONEPE: "PhonePe / UPI",
  COD: "Cash on Delivery",
};

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={null}>
      <OrderConfirmationContent params={params} />
    </Suspense>
  );
}

function OrderConfirmationContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  // Guests arrive with ?token=<guestAccessToken> (from checkout or the PhonePe
  // redirect); logged-in owners are resolved from their JWT.
  const token = useSearchParams().get("token");
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    getOrder(orderId, token).then((res) => setOrder(res.success ? res.data : null));
  }, [orderId, token]);

  return (
    <>
      <Header variant="minimal" />
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-[560px] px-4 py-8 text-center sm:px-8 sm:py-10">
          {order === undefined && <p className="text-muted">Loading order…</p>}

          {order === null && (
            <>
              <h1 className="mb-2 text-2xl font-extrabold">Order not found</h1>
              <p className="mb-7 text-[15px] text-muted">
                We couldn&rsquo;t find that order on this device. Mock orders are stored locally until a real backend exists.
              </p>
              <LinkButton href="/shop">Continue Shopping</LinkButton>
            </>
          )}

          {order && (
            <>
              <div className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-success-bg">
                <Check size={36} className="text-success-text" strokeWidth={2.2} />
              </div>
              <h1 className="mb-2 text-2xl font-extrabold sm:text-[28px]">Order Confirmed!</h1>
              <p className="mb-7 text-[15px] text-muted">
                Thank you — your order has been placed. We&rsquo;ll send updates on WhatsApp &amp; SMS.
              </p>

              <div className="mb-6 rounded-[18px] border border-border-pink-light bg-white p-5 text-left">
                <Row label="Order Number" value={order.orderNumber} />
                <Row label="Payment Method" value={PAYMENT_METHOD_LABEL[order.paymentMethod]} />
                <Row label="Payment Status" value={order.paymentStatus === "PAID" ? "Paid" : "Pending (pay on delivery)"} />
                <div className="my-3 h-px bg-border-pink-light" />
                <div className="flex justify-between text-base font-extrabold">
                  <span>Total {order.paymentStatus === "PAID" ? "Paid" : "Due"}</span>
                  <span className="text-rose">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <LinkButton href={`/account/orders/${order.id}`} variant="secondary">
                  Track Order
                </LinkButton>
                <LinkButton href="/">Continue Shopping</LinkButton>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2.5 flex justify-between text-[13.5px]">
      <span className="text-muted-light">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
