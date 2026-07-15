"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminOrders } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-info-bg text-info-text",
  CONFIRMED: "bg-success-bg text-success-text",
  PACKED: "bg-warning-bg text-warning-text",
  SHIPPED: "bg-purple-bg text-purple-text",
  DELIVERED: "bg-success-bg text-success-text",
  CANCELLED: "bg-danger-bg text-danger-text",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    getAdminOrders().then((res) => {
      if (res.success) setOrders(res.data);
    });
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = orders
    .filter(
      (o) =>
        (!q || o.orderNumber.toLowerCase().includes(q) || o.addressSnapshot.phone.toLowerCase().includes(q)) &&
        (statusFilter === "all" || o.status === statusFilter)
    )
    .sort((a, b) => (sortBy === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));

  return (
    <AdminShell>
      <h1 className="mb-4 text-[22px] font-extrabold">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2.5">
        <input
          type="text"
          placeholder="Search order #, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px] outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px]"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-[10px] border-[1.5px] border-border-pink px-3.5 py-2.5 text-[13px]"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
        </select>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-2xl border border-admin-border bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
              <th className="px-3 py-2.5">Order</th>
              <th className="px-3 py-2.5">Phone</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Total</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer border-b border-admin-row-border">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/orders/${o.id}`} className="font-bold text-ink">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted">{o.addressSnapshot.phone}</td>
                <td className="px-3 py-2.5 text-muted-light">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                <td className="px-3 py-2.5 font-bold text-rose">{formatPrice(o.total)}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-3 py-[5px] text-[11px] font-bold ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-light">No orders match these filters.</p>}
      </div>
    </AdminShell>
  );
}
