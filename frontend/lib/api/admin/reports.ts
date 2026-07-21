import type { ApiResult } from "@/lib/types";
import { getAdminOrders } from "@/lib/api/orders";
import { readProducts } from "@/lib/api/admin/products";
import { delay } from "@/lib/api/delay";
import { api, unwrap, USE_MOCKS } from "@/lib/api/client";

// Shape of GET /v1/admin/reports/summary (backend admin.service.reportSummary).
export interface ReportSummary {
  totalRevenue: number;
  orderCount: number;
  topProducts: { productName: string | null; quantity: number }[];
  topKits: { kitName: string | null; quantity: number }[];
  revenueByDay: { day: string; revenue: number }[];
  lowStock: { productName: string; variantLabel: string; sku: string; stockQty: number }[];
}

// GET /v1/admin/reports/summary — revenue, best sellers (products + kits),
// revenue-by-day and low stock, optionally scoped to a [from, to] date range.
export async function getReportSummary(range?: {
  from?: string;
  to?: string;
}): Promise<ApiResult<ReportSummary>> {
  if (!USE_MOCKS) {
    const params: Record<string, string> = {};
    if (range?.from) params.from = range.from;
    if (range?.to) params.to = range.to;
    return unwrap<ReportSummary>(api.get("/admin/reports/summary", { params }));
  }

  // Mock: aggregate the same numbers client-side from the local order + product
  // stores so the dashboard/reports pages render offline.
  await delay(150);
  const ordersRes = await getAdminOrders();
  let orders = ordersRes.success ? ordersRes.data : [];
  if (range?.from) orders = orders.filter((o) => o.createdAt >= range.from!);
  if (range?.to) orders = orders.filter((o) => o.createdAt <= range.to! + "T23:59:59");

  const paid = orders.filter(
    (o) => o.status !== "CANCELLED" && (o.paymentStatus === "PAID" || (o.paymentMethod === "COD" && o.status === "DELIVERED"))
  );

  const productQty = new Map<string, number>();
  const kitQty = new Map<string, number>();
  const byDay = new Map<string, number>();
  for (const o of paid) {
    const day = o.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + o.total);
    for (const item of o.items) {
      if (item.kitName) kitQty.set(item.kitName, (kitQty.get(item.kitName) ?? 0) + item.quantity);
      else if (item.productName) productQty.set(item.productName, (productQty.get(item.productName) ?? 0) + item.quantity);
    }
  }

  const top = (m: Map<string, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const lowStock = readProducts()
    .flatMap((p) => p.variants.map((v) => ({ productName: p.name, variantLabel: v.label, sku: v.sku, stockQty: v.stockQty })))
    .filter((v) => v.stockQty <= 10)
    .sort((a, b) => a.stockQty - b.stockQty)
    .slice(0, 20);

  return {
    success: true,
    data: {
      totalRevenue: paid.reduce((sum, o) => sum + o.total, 0),
      orderCount: paid.length,
      topProducts: top(productQty).map(([productName, quantity]) => ({ productName, quantity })),
      topKits: top(kitQty).map(([kitName, quantity]) => ({ kitName, quantity })),
      revenueByDay: [...byDay.entries()].sort().map(([day, revenue]) => ({ day, revenue })),
      lowStock,
    },
  };
}
