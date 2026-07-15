"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/account/RequireAuth";
import { useAuthStore } from "@/store/authStore";
import { getOrdersByUser } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { LinkButton } from "@/components/ui/Button";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_STYLE: Record<OrderStatus, string> = {
  PLACED: "bg-info-bg text-info-text",
  CONFIRMED: "bg-success-bg text-success-text",
  PACKED: "bg-warning-bg text-warning-text",
  SHIPPED: "bg-purple-bg text-purple-text",
  DELIVERED: "bg-success-bg text-success-text",
  CANCELLED: "bg-danger-bg text-danger-text",
};

export default function MyOrdersPage() {
  return (
    <RequireAuth>
      <MyOrdersList />
    </RequireAuth>
  );
}

function MyOrdersList() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    getOrdersByUser(user.id).then((res) => setOrders(res.success ? res.data : []));
  }, [user]);

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
      <div className="mb-1.5 text-[13px] text-muted-light">
        <Link href="/account">Account</Link> / <span className="text-ink">My Orders</span>
      </div>
      <h1 className="mb-5.5 text-2xl font-extrabold sm:text-[26px]">My Orders</h1>

      {orders === null && <p className="text-muted">Loading…</p>}

      {orders?.length === 0 && (
        <div className="rounded-[18px] border border-border-pink-light bg-white p-8 text-center">
          <p className="mb-4 text-muted">No orders yet — orders you place while logged in will show up here.</p>
          <LinkButton href="/shop">Continue Shopping</LinkButton>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {orders?.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.id}`}
            className="flex flex-wrap items-center justify-between gap-3.5 rounded-[18px] border border-border-pink-light bg-white p-4.5 text-ink"
          >
            <div>
              <div className="mb-1 text-sm font-bold">Order {o.orderNumber}</div>
              <div className="text-xs text-muted-light">
                {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                {o.items.reduce((n, i) => n + i.quantity, 0)} items · {formatPrice(o.total)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${STATUS_STYLE[o.status]}`}>{o.status}</span>
              <span className="rounded-full bg-surface-pink-light px-4 py-2 text-[13px] font-bold text-rose">View</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
