import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import type { OtpPurpose } from "../src/generated/prisma/enums.js";

// Wipe every table between tests for a deterministic starting state.
export async function resetDb() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.orderCounter.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.kitSlotOption.deleteMany(),
    prisma.kitSlot.deleteMany(),
    prisma.kit.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.otpRequest.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

// Minimal fixture: one category + one product with a single low-stock variant.
export async function seedProduct(stock = 5, price = 100) {
  const category = await prisma.category.create({ data: { name: "Cat", slug: "cat" } });
  const product = await prisma.product.create({
    data: {
      name: "Widget",
      slug: "widget",
      description: "d",
      categoryId: category.id,
      variants: { create: { label: "Std", price, stockQty: stock, sku: "SKU-WIDGET-STD" } },
    },
    include: { variants: true },
  });
  return { category, product, variant: product.variants[0] };
}

export async function seedUser(email = "u@example.com", password = "password123", role: "CUSTOMER" | "ADMIN" = "CUSTOMER") {
  return prisma.user.create({
    data: {
      name: "User",
      email,
      phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
      passwordHash: await bcrypt.hash(password, 10),
      role,
    },
  });
}

// A real, verifiable OTP row: unlike the checkout fixtures elsewhere (which
// set codeHash: "x" since assertCheckoutOtp only checks the `verified` flag),
// register/registerWithGoogle call the real verifyOtp — a bcrypt.compare
// against the plaintext code — so the hash has to actually match.
export async function seedOtp(phone: string, purpose: OtpPurpose, code = "123456") {
  const otp = await prisma.otpRequest.create({
    data: { phone, codeHash: await bcrypt.hash(code, 10), purpose, expiresAt: new Date(Date.now() + 5 * 60_000) },
  });
  return { otpId: otp.id, code };
}

export const address = {
  line1: "12 MG Road",
  city: "Kothamangalam",
  state: "Kerala",
  pincode: "686691",
  phone: "+919812345678",
};
