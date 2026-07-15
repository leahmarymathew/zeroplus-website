import type { Address, ApiResult, CartItem, Order, OrderStatus, PaymentMethod } from "@/lib/types";
import { MOCK_ORDERS } from "@/lib/mock/orders";
import { delay } from "./delay";

const STORAGE_KEY = "zeroplus-orders";

// Lazily seeds the placeholder order history (lib/mock/orders.ts) into the
// same localStorage-backed "database" real checkouts write to, so the
// admin panel and reports have real-looking data on first load. Only runs
// once — if the key already exists (even as "[]"), it's respected as-is.
function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    writeOrders(MOCK_ORDERS);
    return MOCK_ORDERS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function generateOrderNumber() {
  return "ZP-" + String(Math.floor(10000 + Math.random() * 90000));
}

export const FREE_DELIVERY_THRESHOLD = 499;
export const SHIPPING_FEE = 49;
export const COD_FEE = 30;

export interface CreateOrderInput {
  items: CartItem[];
  addressSnapshot: Omit<Address, "id" | "userId" | "isDefault">;
  paymentMethod: PaymentMethod;
  userId?: string | null;
}

// POST /v1/orders — Section 6.3. No backend yet, so this simulates the
// response shape locally instead of calling PhonePe or persisting to a
// database. Swap the body for a real POST once /backend exists; callers
// (Checkout page) don't need to change.
export async function createOrder(input: CreateOrderInput): Promise<ApiResult<Order>> {
  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = input.paymentMethod === "COD" ? COD_FEE : null;
  const total = subtotal + shippingFee + (codFee ?? 0);

  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: generateOrderNumber(),
    userId: input.userId ?? null,
    status: "PLACED",
    // Real PhonePe payment only confirms via the webhook (Section 6.3) — with
    // no backend yet, mock prepaid orders as already paid so the flow is
    // demoable end to end; COD stays PENDING until delivery.
    paymentStatus: input.paymentMethod === "PHONEPE" ? "PAID" : "PENDING",
    paymentMethod: input.paymentMethod,
    subtotal,
    discount: 0,
    shippingFee,
    codFee,
    total,
    addressSnapshot: input.addressSnapshot,
    guestAccessToken: crypto.randomUUID(),
    trackingNumber: null,
    items: input.items.map((item) => ({
      id: crypto.randomUUID(),
      orderId: "",
      variantId: item.kitId ? null : item.variantId,
      kitId: item.kitId,
      kitName: item.kitId ? item.name : null,
      kitSelectionsSnapshot: item.kitSelections,
      productName: item.kitId ? null : item.name,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      priceAtPurchase: item.unitPrice,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  order.items = order.items.map((i) => ({ ...i, orderId: order.id }));

  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);

  return { success: true, data: order };
}

// GET /v1/orders/:id — Section 6.3
export async function getOrder(orderId: string): Promise<ApiResult<Order>> {
  const order = readOrders().find((o) => o.id === orderId);
  if (!order) {
    return { success: false, error: { code: "NOT_FOUND", message: "Order not found" } };
  }
  return { success: true, data: order };
}

// GET /v1/orders — Section 6.2 (current user's order history)
export async function getOrdersByUser(userId: string): Promise<ApiResult<Order[]>> {
  return { success: true, data: readOrders().filter((o) => o.userId === userId) };
}

// GET /v1/admin/orders — Section 6.2
export async function getAdminOrders(): Promise<ApiResult<Order[]>> {
  await delay(150);
  return { success: true, data: readOrders() };
}

// PATCH /v1/admin/orders/:id/status — Section 6.3
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string | null
): Promise<ApiResult<Order>> {
  await delay(150);
  const orders = readOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    return { success: false, error: { code: "NOT_FOUND", message: "Order not found" } };
  }
  const updated: Order = {
    ...orders[index],
    status,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : orders[index].trackingNumber,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  writeOrders(orders);
  return { success: true, data: updated };
}
