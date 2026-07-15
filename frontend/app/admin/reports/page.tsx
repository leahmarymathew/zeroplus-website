"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminOrders } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

type Range = "day" | "week" | "month";
const RANGE_LABELS: Record<Range, string> = { day: "Day", week: "Week", month: "Month" };

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [range, setRange] = useState<Range>("week");
  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState(toDateStr(new Date(today.getTime() - 6 * 86400000)));
  const [toDate, setToDate] = useState(toDateStr(today));

  useEffect(() => {
    getAdminOrders().then((res) => {
      if (res.success) setOrders(res.data);
    });
  }, []);

  const inRange = orders.filter((o) => {
    const d = o.createdAt.slice(0, 10);
    return d >= fromDate && d <= toDate;
  });

  const chartBars = useMemo(() => {
    if (range === "day") {
      const buckets = ["12a", "4a", "8a", "12p", "4p", "8p", "11p"];
      const boundaries = [0, 4, 8, 12, 16, 20, 24];
      const todayStr = toDateStr(today);
      const sums = buckets.map((label, i) => {
        const sum = orders
          .filter((o) => o.createdAt.slice(0, 10) === todayStr)
          .filter((o) => {
            const hour = new Date(o.createdAt).getUTCHours();
            return hour >= boundaries[i] && hour < boundaries[i + 1];
          })
          .reduce((s, o) => s + o.total, 0);
        return { label, sum };
      });
      const max = Math.max(1, ...sums.map((s) => s.sum));
      return sums.map((s) => ({ label: s.label, height: `${Math.max(4, (s.sum / max) * 100)}%` }));
    }
    if (range === "month") {
      const weeks = [0, 1, 2, 3].map((w) => {
        const start = new Date(today.getTime() - (w + 1) * 7 * 86400000);
        const end = new Date(today.getTime() - w * 7 * 86400000);
        const sum = orders
          .filter((o) => o.createdAt.slice(0, 10) > toDateStr(start) && o.createdAt.slice(0, 10) <= toDateStr(end))
          .reduce((s, o) => s + o.total, 0);
        return { label: `Wk ${4 - w}`, sum };
      });
      weeks.reverse();
      const max = Math.max(1, ...weeks.map((w) => w.sum));
      return weeks.map((w) => ({ label: w.label, height: `${Math.max(4, (w.sum / max) * 100)}%` }));
    }
    const days = [6, 5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(today.getTime() - offset * 86400000);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const sum = orders.filter((o) => o.createdAt.slice(0, 10) === toDateStr(d)).reduce((s, o) => s + o.total, 0);
      return { label, sum };
    });
    const max = Math.max(1, ...days.map((d) => d.sum));
    return days.map((d) => ({ label: d.label, height: `${Math.max(4, (d.sum / max) * 100)}%` }));
  }, [range, orders, today]);

  const topProducts = useMemo(() => {
    const byName = new Map<string, { units: number; revenue: number }>();
    for (const order of inRange) {
      for (const item of order.items) {
        const name = item.kitName ?? item.productName ?? "Unknown";
        const entry = byName.get(name) ?? { units: 0, revenue: 0 };
        entry.units += item.quantity;
        entry.revenue += item.priceAtPurchase * item.quantity;
        byName.set(name, entry);
      }
    }
    return Array.from(byName.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [inRange]);

  function downloadCsv() {
    const rows = [["Product", "Units Sold", "Revenue"], ...topProducts.map((p) => [p.name, String(p.units), String(p.revenue)])];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeroplus-report-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <h1 className="text-[22px] font-extrabold">Reports</h1>
        <div className="flex gap-2">
          {(["day", "week", "month"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full border-[1.5px] px-4 py-1.5 text-xs font-bold ${
                range === r ? "border-rose bg-rose text-white" : "border-admin-border bg-white text-ink"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-[10px] border-[1.5px] border-border-pink px-3 py-2 text-[13px]"
          />
          <span className="text-[13px] text-muted-light">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-[10px] border-[1.5px] border-border-pink px-3 py-2 text-[13px]"
          />
        </div>
        <button type="button" onClick={downloadCsv} className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-admin-border bg-white px-4.5 py-2.5 text-[13px] font-bold">
          <Download size={15} strokeWidth={2} />
          Download CSV
        </button>
      </div>

      <div className="mb-5 rounded-2xl border border-admin-border bg-white p-5">
        <h2 className="mb-4 text-[15px] font-bold">Revenue — {RANGE_LABELS[range]}</h2>
        <div className="flex h-40 items-end gap-2.5">
          {chartBars.map((b) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="w-full max-w-[34px] rounded-t-md bg-rose" style={{ height: b.height }} />
              <span className="text-[11px] font-bold text-muted-light">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-admin-border bg-white p-5">
        <h2 className="mb-3.5 text-[15px] font-bold">Top Products</h2>
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-admin-border text-[12px] font-bold uppercase tracking-wide text-muted-light">
              <th className="px-2.5 py-2">Product</th>
              <th className="px-2.5 py-2">Units Sold</th>
              <th className="px-2.5 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.name} className="border-b border-admin-row-border">
                <td className="px-2.5 py-2 font-bold">{p.name}</td>
                <td className="px-2.5 py-2 text-muted">{p.units}</td>
                <td className="px-2.5 py-2 font-bold text-rose">{formatPrice(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topProducts.length === 0 && <p className="px-2.5 py-6 text-center text-sm text-muted-light">No sales in this date range.</p>}
      </div>
    </AdminShell>
  );
}
