import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { ok, paginate } from "../lib/respond.js";
import * as admin from "../services/admin.service.js";
import * as kits from "../services/kit.service.js";

export const adminRouter = Router();

// Every admin route requires a valid admin token.
adminRouter.use(requireAuth, requireAdmin);

// ---------- Products ----------

const variantSchema = z.object({
  label: z.string().min(1),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  stockQty: z.number().int().min(0),
  sku: z.string().min(1),
});
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  brand: z.string().nullable().optional(),
  safetyInfo: z.string().nullable().optional(),
  certifications: z.array(z.string()).optional(),
  ownerHighlight: z.string().max(60).nullable().optional(),
  isActive: z.boolean().optional(),
  videoUrl: z.string().url().nullable().optional(),
  variants: z.array(variantSchema).min(1),
  images: z.array(z.object({ url: z.string().url(), sortOrder: z.number().int().optional() })).optional(),
});

const adminProductsQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  stock: z.enum(["in", "low", "out"]).optional(),
  sort: z.enum(["name", "price", "stock"]).optional(),
});

adminRouter.get("/products", validate(adminProductsQuery, "query"), async (_req, res) => {
  ok(res, await admin.listAdminProducts(res.locals.query));
});
adminRouter.get("/products/:id", async (req, res) => {
  ok(res, await admin.getAdminProduct(String(req.params.id)));
});
adminRouter.post("/products", validate(productSchema), async (req, res) => {
  ok(res, await admin.createProduct(req.body), undefined, 201);
});
adminRouter.patch("/products/:id", validate(productSchema), async (req, res) => {
  ok(res, await admin.updateProduct(String(req.params.id), req.body));
});
// Zeroes every variant's stock in one call — the "we ran out" tick in the admin
// product list. Restocking goes through PATCH /products/:id with real numbers.
adminRouter.patch("/products/:id/sold-out", async (req, res) => {
  ok(res, await admin.setProductSoldOut(String(req.params.id)));
});
adminRouter.delete("/products/:id", async (req, res) => {
  ok(res, await admin.deleteProduct(String(req.params.id)));
});

// ---------- Categories ----------

const categorySchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
});

adminRouter.get("/categories", async (_req, res) => {
  ok(res, await admin.listAdminCategories());
});
adminRouter.post("/categories", validate(categorySchema), async (req, res) => {
  ok(res, await admin.createCategory(req.body), undefined, 201);
});
adminRouter.patch("/categories/:id", validate(categorySchema.partial()), async (req, res) => {
  ok(res, await admin.updateCategory(String(req.params.id), req.body));
});

// ---------- Kits ----------

const kitSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.number().int().min(0),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
  slots: z
    .array(
      z.object({
        label: z.string().min(1),
        options: z
          .array(
            z.object({
              productVariantId: z.string().min(1),
              priceAdjustment: z.number().int().nullable().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

adminRouter.get("/kits", async (_req, res) => {
  ok(res, await kits.listAdminKits());
});
adminRouter.get("/kits/:id", async (req, res) => {
  ok(res, await kits.getAdminKitById(String(req.params.id)));
});
adminRouter.post("/kits", validate(kitSchema), async (req, res) => {
  ok(res, await kits.createKit(req.body), undefined, 201);
});
adminRouter.patch("/kits/:id", validate(kitSchema), async (req, res) => {
  ok(res, await kits.updateKit(String(req.params.id), req.body));
});
adminRouter.patch("/kits/:id/active", validate(z.object({ isActive: z.boolean() })), async (req, res) => {
  ok(res, await kits.setKitActive(String(req.params.id), req.body.isActive));
});
adminRouter.delete("/kits/:id", async (req, res) => {
  ok(res, await kits.deleteKit(String(req.params.id)));
});

// ---------- Orders ----------

const adminOrdersQuery = z.object({
  q: z.string().optional(),
  status: z.enum(["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

adminRouter.get("/orders", validate(adminOrdersQuery, "query"), async (_req, res) => {
  const q = res.locals.query as z.infer<typeof adminOrdersQuery>;
  const { items, total } = await admin.listAdminOrders(q);
  ok(res, items, paginate(q.page, q.limit, total));
});

const statusSchema = z.object({
  status: z.enum(["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().nullable().optional(),
});
adminRouter.patch("/orders/:id/status", validate(statusSchema), async (req, res) => {
  ok(res, await admin.updateOrderStatus(String(req.params.id), req.body.status, req.body.trackingNumber));
});

adminRouter.post("/orders/:id/refund", async (req, res) => {
  // Bookkeeping only — the actual refund happens in the PhonePe dashboard (plan 2.2).
  ok(res, await admin.setPaymentRefunded(String(req.params.id)));
});

// ---------- Customers ----------

const customersQuery = z.object({ q: z.string().optional() });
adminRouter.get("/customers", validate(customersQuery, "query"), async (_req, res) => {
  ok(res, await admin.listAdminCustomers((res.locals.query as { q?: string }).q));
});
adminRouter.get("/customers/:id", async (req, res) => {
  ok(res, await admin.getAdminCustomer(String(req.params.id)));
});

// ---------- Banners ----------

adminRouter.get("/banners", async (_req, res) => {
  ok(res, await admin.listBanners());
});
adminRouter.post(
  "/banners",
  validate(
    z.object({
      title: z.string().min(1),
      imageUrl: z.string().url().nullable().optional(),
      videoUrl: z.string().url().nullable().optional(),
    }),
  ),
  async (req, res) => {
    ok(res, await admin.createBanner(req.body), undefined, 201);
  },
);
adminRouter.patch(
  "/banners/:id",
  validate(
    z.object({
      title: z.string().min(1).optional(),
      imageUrl: z.string().url().nullable().optional(),
      videoUrl: z.string().url().nullable().optional(),
      status: z.enum(["ACTIVE", "SCHEDULED"]).optional(),
    }),
  ),
  async (req, res) => {
    ok(res, await admin.updateBanner(String(req.params.id), req.body));
  },
);
adminRouter.delete("/banners/:id", async (req, res) => {
  ok(res, await admin.deleteBanner(String(req.params.id)));
});

// ---------- Reports ----------

const reportQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

adminRouter.get("/reports/summary", validate(reportQuery, "query"), async (_req, res) => {
  const { from, to } = res.locals.query as z.infer<typeof reportQuery>;
  ok(res, await admin.reportSummary(from, to));
});

adminRouter.get("/reports/export", validate(reportQuery, "query"), async (_req, res) => {
  const { from, to } = res.locals.query as z.infer<typeof reportQuery>;
  const summary = await admin.reportSummary(from, to);
  const rows = [
    ["Metric", "Value"],
    ["Total Revenue", String(summary.totalRevenue)],
    ["Order Count", String(summary.orderCount)],
    [],
    ["Top Products", "Units Sold"],
    ...summary.topProducts.map((p) => [p.productName ?? "", String(p.quantity)]),
    [],
    ["Date", "Revenue"],
    ...summary.revenueByDay.map((d) => [d.day, String(d.revenue)]),
  ];
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="zeroplus-report.csv"');
  res.send(csv);
});

// Quote a field if it contains a comma, quote, or newline; double inner quotes.
function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
