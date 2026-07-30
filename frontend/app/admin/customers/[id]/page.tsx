"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminCustomer } from "@/lib/api/admin/customers";
import { formatPrice } from "@/lib/format";
import type { AdminCustomer } from "@/lib/mock/customers";
import type { OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-info-bg text-info-text",
  CONFIRMED: "bg-success-bg text-success-text",
  PACKED: "bg-warning-bg text-warning-text",
  SHIPPED: "bg-purple-bg text-purple-text",
  DELIVERED: "bg-success-bg text-success-text",
  CANCELLED: "bg-danger-bg text-danger-text",
};

export default function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<AdminCustomer | null | undefined>(undefined);

  useEffect(() => {
    getAdminCustomer(id).then((res) => {
      setCustomer(res.success ? res.data : null);
    });
  }, [id]);

  const orders = customer?.orders ?? [];

  if (customer === undefined) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-light">Loading…</p>
      </AdminShell>
    );
  }
  if (customer === null) {
    return (
      <AdminShell>
        <p className="text-sm text-danger-text">Customer not found.</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-4.5 flex items-center gap-3">
        <Link href="/admin/customers" className="text-[13.5px] font-bold text-muted-light">
          ← Back
        </Link>
        <h1 className="text-xl font-extrabold">{customer.name}</h1>
      </div>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
        <div className="rounded-2xl border border-admin-border bg-white p-4">
          <div className="mb-1 text-xs font-bold text-muted-light">Phone</div>
          <div className="text-[13.5px] font-bold">{customer.phone}</div>
        </div>
        <div className="rounded-2xl border border-admin-border bg-white p-4">
          <div className="mb-1 text-xs font-bold text-muted-light">Email</div>
          <div className="text-[13.5px] font-bold">{customer.email ?? "—"}</div>
        </div>
        <div className="rounded-2xl border border-admin-border bg-white p-4">
          <div className="mb-1 text-xs font-bold text-muted-light">Total Orders</div>
          <div className="text-[13.5px] font-bold text-rose">{customer.orderCount}</div>
        </div>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-2xl border border-admin-border bg-white">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
              <th className="px-3 py-2.5">Order</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Total</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-admin-row-border">
                <td className="px-3 py-2.5">
                  <Link href={`/admin/orders/${o.id}`} className="font-bold text-ink">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-muted-light">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                <td className="px-3 py-2.5 font-bold text-rose">{formatPrice(o.total)}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-3 py-[5px] text-[11px] font-bold ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-light">No orders yet.</p>}
      </div>
    </AdminShell>
  );
}
