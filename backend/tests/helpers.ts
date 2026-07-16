import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

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

export const address = {
  line1: "12 MG Road",
  city: "Kothamangalam",
  state: "Kerala",
  pincode: "686691",
  phone: "+919812345678",
};
