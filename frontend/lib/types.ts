// Mirrors the Data Model in Section 5 of the plan field-for-field.
// camelCase throughout — no naming conversion between mock layer, API, and UI.

export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brand: string | null;
  safetyInfo: string | null;
  certifications: string[] | null;
  // Age/stage tags (e.g. "Newborn (0-2 weeks)", "1-3 Months") — see
  // docs/category-tag-plan.md. A product can carry several at once.
  ageTags: string[] | null;
  ownerHighlight: string | null;
  isActive: boolean;
  // Optional single demo/unboxing clip — not every product has one.
  videoUrl: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  label: string;
  price: number;
  compareAtPrice: number | null;
  stockQty: number;
  sku: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

export interface Kit {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
  slots: KitSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface KitSlot {
  id: string;
  kitId: string;
  label: string;
  sortOrder: number;
  options: KitSlotOption[];
}

export interface KitSlotOption {
  id: string;
  kitSlotId: string;
  productVariantId: string;
  productName: string;
  variantLabel: string;
  priceAdjustment: number | null;
}

export interface CartItem {
  id: string;
  sessionId: string | null;
  userId: string | null;
  variantId: string | null;
  kitId: string | null;
  kitSelections: Record<string, string> | null;
  quantity: number;
  // denormalized for display, not part of the DB row
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  imageUrl: string | null;
}

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "PHONEPE" | "COD";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number | null;
  total: number;
  addressSnapshot: Omit<Address, "id" | "userId" | "isDefault">;
  guestAccessToken: string | null;
  trackingNumber: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string | null;
  kitId: string | null;
  kitName: string | null;
  kitSelectionsSnapshot: Record<string, string> | null;
  productName: string | null;
  variantLabel: string | null;
  quantity: number;
  priceAtPurchase: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

// Homepage hero slide — a slide is either a still image or a short video,
// not both; videoUrl takes precedence over imageUrl when both are set.
export type BannerStatus = "ACTIVE" | "SCHEDULED";

export interface Banner {
  id: string;
  slotLabel: string;
  title: string;
  imageUrl: string | null;
  videoUrl: string | null;
  status: BannerStatus;
  sortOrder: number;
}

export type PaymentTxnStatus = "CREATED" | "PAID" | "FAILED";

export interface Payment {
  id: string;
  orderId: string;
  phonepeMerchantTransactionId: string | null;
  phonepeTransactionId: string | null;
  status: PaymentTxnStatus;
  amount: number;
}

export type OtpPurpose = "CHECKOUT" | "LOGIN" | "PASSWORD_RESET";

export interface OtpRequest {
  id: string;
  phone: string;
  purpose: OtpPurpose;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
}

// ---- API envelope (Section 6.1) ----

export interface ApiSuccess<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
