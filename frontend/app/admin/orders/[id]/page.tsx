"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AdminShell } from "@/components/admin/AdminShell";
import { getOrder, updateOrderStatus } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [status, setStatus] = useState<OrderStatus>("PLACED");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    getOrder(id).then((res) => {
      if (res.success) {
        setOrder(res.data);
        setStatus(res.data.status);
        setTracking(res.data.trackingNumber ?? "");
      } else {
        setOrder(null);
      }
    });
  }

  useEffect(load, [id]);

  async function handleSave() {
    setSaving(true);
    const res = await updateOrderStatus(id, status, tracking.trim() || null);
    setSaving(false);
    if (res.success) {
      toast.success("Order updated");
      setOrder(res.data);
    } else {
      toast.error(res.error.message);
    }
  }

  if (order === undefined) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-light">Loading…</p>
      </AdminShell>
    );
  }
  if (order === null) {
    return (
      <AdminShell>
        <p className="text-sm text-danger-text">Order not found.</p>
      </AdminShell>
    );
  }

  const addr = order.addressSnapshot;

  return (
    <AdminShell>
      <div className="mb-4.5 flex items-center gap-3">
        <Link href="/admin/orders" className="text-[13.5px] font-bold text-muted-light">
          ← Back
        </Link>
        <h1 className="text-xl font-extrabold">Order {order.orderNumber}</h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-admin-border bg-white p-4.5">
            <div className="mb-3 text-sm font-bold">Items</div>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-admin-row-border py-2 text-[13.5px] last:border-b-0">
                <span>
                  {item.kitName ?? item.productName} {item.variantLabel ? `(${item.variantLabel})` : ""} × {item.quantity}
                </span>
                <span className="font-bold">{formatPrice(item.priceAtPurchase * item.quantity)}</span>
              </div>
            ))}
            <div className="mt-3 flex flex-col gap-1.5 border-t border-admin-row-border pt-3 text-[13px] text-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span>
              </div>
              {order.codFee ? (
                <div className="flex justify-between">
                  <span>COD fee</span>
                  <span>{formatPrice(order.codFee)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-extrabold text-ink">
                <span>Total</span>
                <span className="text-rose">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-admin-border bg-white p-4.5">
            <div className="mb-2.5 text-sm font-bold">Delivery Address</div>
            <p className="m-0 text-[13.5px] leading-relaxed text-muted">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}
              <br />
              {addr.phone}
            </p>
          </div>

          <div className="rounded-2xl border border-admin-border bg-white p-4.5 text-[13px] text-muted">
            Payment: <span className="font-bold text-ink">{order.paymentMethod}</span> ·{" "}
            <span className="font-bold text-ink">{order.paymentStatus}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 rounded-2xl border border-admin-border bg-white p-4.5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold">Update Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
              className="w-full rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-bold">Tracking Number</label>
            <input
              placeholder="e.g. SR7742093KL"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="w-full rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13.5px] outline-none focus:border-rose"
            />
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="rounded-[10px] bg-rose py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
