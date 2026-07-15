import type { User } from "@/lib/types";

// Placeholder customer directory for the admin panel (Section 2.2). Order
// counts are a derived admin-view field, not part of the User model in
// Section 5 — computed here rather than added to lib/types.ts.
export interface AdminCustomer extends User {
  orderCount: number;
}

const now = new Date("2026-07-01T00:00:00.000Z").toISOString();

export const MOCK_CUSTOMERS: AdminCustomer[] = [
  { id: "cust_1", name: "Sample Customer A", email: "customer.a@example.com", phone: "9800000001", role: "CUSTOMER", createdAt: now, updatedAt: now, orderCount: 3 },
  { id: "cust_2", name: "Sample Customer B", email: "customer.b@example.com", phone: "9800000002", role: "CUSTOMER", createdAt: now, updatedAt: now, orderCount: 2 },
  { id: "cust_3", name: "Sample Customer C", email: null, phone: "9800000003", role: "CUSTOMER", createdAt: now, updatedAt: now, orderCount: 1 },
  { id: "cust_4", name: "Sample Customer D", email: "customer.d@example.com", phone: "9800000004", role: "CUSTOMER", createdAt: now, updatedAt: now, orderCount: 1 },
  { id: "cust_5", name: "Sample Customer E", email: "customer.e@example.com", phone: "9800000005", role: "CUSTOMER", createdAt: now, updatedAt: now, orderCount: 1 },
];
