"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminOrders } from "@/lib/api/orders";
import { getAdminProducts } from "@/lib/api/admin/products";
import { formatPrice } from "@/lib/format";
import type { Order, OrderStatus, Product } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-info-bg text-info-text",
  CONFIRMED: "bg-success-bg text-success-text",
  PACKED: "bg-warning-bg text-warning-text",
  SHIPPED: "bg-purple-bg text-purple-text",
  DELIVERED: "bg-success-bg text-success-text",
  CANCELLED: "bg-danger-bg text-danger-text",
};

function isToday(iso: string) {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}
function isThisMonth(iso: string) {
  return iso.slice(0, 7) === new Date().toISOString().slice(0, 7);
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function run() {
      const [ordersRes, productsRes] = await Promise.all([getAdminOrders(), getAdminProducts({ sort: "stock" })]);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (productsRes.success) setProducts(productsRes.data);
    }
    run();
  }, []);

  const todaysOrders = orders.filter((o) => isToday(o.createdAt));
  const monthOrders = orders.filter((o) => isThisMonth(o.createdAt));
  const pendingCount = orders.filter((o) => o.status === "PLACED" || o.status === "CONFIRMED").length;
  const todaysSales = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const monthSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const lowStock = products
    .map((p) => ({ product: p, stock: p.variants.reduce((sum, v) => sum + v.stockQty, 0) }))
    .filter((p) => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4);

  const cards = [
    { label: "Today's Sales", value: formatPrice(todaysSales), sub: `${todaysOrders.length} orders today` },
    { label: "Orders Today", value: String(todaysOrders.length), sub: "vs. yesterday: n/a" },
    { label: "This Month", value: formatPrice(monthSales), sub: `${monthOrders.length} orders` },
    { label: "Pending Orders", value: String(pendingCount), sub: pendingCount > 0 ? "Needs attention" : "All clear" },
  ];

  return (
    <AdminShell>
      <h1 className="mb-5 text-[22px] font-extrabold">Dashboard</h1>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-admin-border bg-white p-4.5">
            <div className="mb-2 text-[12.5px] font-bold text-muted-light">{c.label}</div>
            <div className="mb-1 text-2xl font-extrabold">{c.value}</div>
            <div className="text-xs font-bold text-success-text">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-admin-border bg-white p-5">
          <h2 className="mb-3.5 text-[15px] font-bold">Recent Orders</h2>
          <div className="flex flex-col gap-2.5">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between gap-2 border-b border-admin-row-border py-2 text-ink"
              >
                <div>
                  <div className="text-[13.5px] font-bold">{o.orderNumber}</div>
                  <div className="text-xs text-muted-light">{o.userId ?? "Guest"}</div>
                </div>
                <span className={`rounded-full px-3 py-[5px] text-[11px] font-bold ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                <div className="text-[13.5px] font-bold">{formatPrice(o.total)}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-admin-border bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold">
            Low Stock Alerts
            <span className="rounded-full bg-danger-bg px-2.5 py-0.5 text-[11px] font-bold text-danger-text">{lowStock.length}</span>
          </h2>
          <div className="flex flex-col gap-2.5">
            {lowStock.length === 0 && <p className="text-[13px] text-muted-light">No low-stock products.</p>}
            {lowStock.map(({ product, stock }) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}/edit`}
                className="flex items-center justify-between gap-2 border-b border-admin-row-border py-2 text-ink"
              >
                <span className="text-[13px] font-bold">{product.name}</span>
                <span className="text-xs font-extrabold text-danger-text">{stock} left</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
