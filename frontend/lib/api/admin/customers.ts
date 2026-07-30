import type { ApiResult } from "@/lib/types";
import { MOCK_CUSTOMERS, type AdminCustomer } from "@/lib/mock/customers";
import { getAdminOrders } from "@/lib/api/orders";
import { delay } from "@/lib/api/delay";
import { api, unwrap, USE_MOCKS } from "@/lib/api/client";

// GET /v1/admin/customers — Section 6.2. Order counts are computed live
// against the order store (Section 6.2's orders endpoints) rather than
// trusted from the static seed, so a customer's count stays accurate if
// more orders are placed against their id during this session.
export async function getAdminCustomers(q?: string): Promise<ApiResult<AdminCustomer[]>> {
  if (!USE_MOCKS) return unwrap<AdminCustomer[]>(api.get("/admin/customers", { params: q ? { q } : {} }));
  await delay(150);
  const ordersRes = await getAdminOrders();
  const orders = ordersRes.success ? ordersRes.data : [];

  let customers = MOCK_CUSTOMERS.map((c) => ({
    ...c,
    orderCount: orders.filter((o) => o.userId === c.id).length,
  }));

  if (q) {
    const needle = q.toLowerCase();
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.phone.toLowerCase().includes(needle) ||
        (c.email ?? "").toLowerCase().includes(needle)
    );
  }

  return { success: true, data: customers };
}

// GET /v1/admin/customers/:id — Section 6.2
export async function getAdminCustomer(id: string): Promise<ApiResult<AdminCustomer>> {
  if (!USE_MOCKS) return unwrap<AdminCustomer>(api.get(`/admin/customers/${id}`));
  await delay(150);
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);
  if (!customer) {
    return { success: false, error: { code: "NOT_FOUND", message: "Customer not found" } };
  }
  const ordersRes = await getAdminOrders();
  const orders = ordersRes.success ? ordersRes.data.filter((o) => o.userId === id) : [];
  return { success: true, data: { ...customer, orderCount: orders.length, orders } };
}
