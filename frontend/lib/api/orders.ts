import type { Address, ApiResult, CartItem, Order, OrderStatus, PaymentMethod } from "@/lib/types";
import { MOCK_ORDERS } from "@/lib/mock/orders";
import { delay } from "./delay";
import { api, unwrap, USE_MOCKS } from "./client";

// The backend echoes the created order plus, for PhonePe, the hosted-page URL
// the browser must redirect to. COD orders come back without it.
export type CreatedOrder = Order & { phonepeRedirectUrl?: string | null };

// Cart items carry display fields the backend ignores; it re-prices from the
// DB. Send only what POST /v1/orders validates: one of variantId / kitId.
function toOrderLines(items: CartItem[]) {
  return items.map((i) =>
    i.kitId
      ? { kitId: i.kitId, kitSelections: i.kitSelections ?? {}, quantity: i.quantity }
      : { variantId: i.variantId as string, quantity: i.quantity }
  );
}

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
  // Guest contact + the verified checkout OTP (required for COD).
  contactEmail?: string | null;
  contactName?: string | null;
  otpId?: string | null;
}

// POST /v1/orders — Section 6.3. Against the real backend, identity comes from
// the JWT (not the body) and totals are recomputed from the DB; for PhonePe the
// response carries phonepeRedirectUrl. In mock mode this simulates the response
// shape in localStorage instead.
export async function createOrder(input: CreateOrderInput): Promise<ApiResult<CreatedOrder>> {
  if (!USE_MOCKS) {
    return unwrap<CreatedOrder>(
      api.post("/orders", {
        items: toOrderLines(input.items),
        addressSnapshot: input.addressSnapshot,
        paymentMethod: input.paymentMethod,
        ...(input.contactEmail ? { contactEmail: input.contactEmail } : {}),
        ...(input.contactName ? { contactName: input.contactName } : {}),
        ...(input.otpId ? { otpId: input.otpId } : {}),
      })
    );
  }
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

// GET /v1/orders/:id — Section 6.3. A guest passes their guestAccessToken; a
// logged-in owner is resolved from the JWT.
export async function getOrder(orderId: string, token?: string | null): Promise<ApiResult<Order>> {
  if (!USE_MOCKS) {
    return unwrap<Order>(api.get(`/orders/${orderId}`, token ? { params: { token } } : undefined));
  }
  const order = readOrders().find((o) => o.id === orderId);
  if (!order) {
    return { success: false, error: { code: "NOT_FOUND", message: "Order not found" } };
  }
  return { success: true, data: order };
}

// GET /v1/orders — Section 6.2 (current user's order history). The backend
// resolves the user from the JWT; the userId arg is only used by the mock.
export async function getOrdersByUser(userId: string): Promise<ApiResult<Order[]>> {
  if (!USE_MOCKS) return unwrap<Order[]>(api.get("/orders"));
  return { success: true, data: readOrders().filter((o) => o.userId === userId) };
}

// GET /v1/admin/orders — Section 6.2
export async function getAdminOrders(): Promise<ApiResult<Order[]>> {
  if (!USE_MOCKS) return unwrap<Order[]>(api.get("/admin/orders", { params: { limit: 50 } }));
  await delay(150);
  return { success: true, data: readOrders() };
}

// PATCH /v1/admin/orders/:id/status — Section 6.3
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  trackingNumber?: string | null
): Promise<ApiResult<Order>> {
  if (!USE_MOCKS) {
    return unwrap<Order>(
      api.patch(`/admin/orders/${orderId}/status`, {
        status,
        ...(trackingNumber !== undefined ? { trackingNumber } : {}),
      })
    );
  }
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
