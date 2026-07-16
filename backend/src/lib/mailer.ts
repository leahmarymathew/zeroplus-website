import { Resend } from "resend";
import { config } from "../config.js";
import { formatINR } from "./format.js";
import type { Order, OrderItem } from "../generated/prisma/client.js";

// When RESEND_API_KEY is unset, emails are logged to the server console
// instead of sent — so order flows are fully testable without a key.
const resend = config.resend.enabled ? new Resend(config.resend.apiKey) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`\n[email:console] to=${to} subject="${subject}"\n${stripHtml(html)}\n`);
    return;
  }
  await resend.emails.send({ from: config.resend.from, to, subject, html });
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\n\s*\n\s*\n/g, "\n\n").trim();
}

type OrderWithItems = Order & { items: OrderItem[] };

function itemsTable(items: OrderItem[]) {
  const rows = items
    .map((i) => {
      const name = i.kitName ?? i.productName ?? "Item";
      const label = i.variantLabel ? ` (${i.variantLabel})` : "";
      return `<tr><td>${name}${label}</td><td align="center">${i.quantity}</td><td align="right">${formatINR(
        i.priceAtPurchase * i.quantity,
      )}</td></tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse" cellpadding="6">
    <tr><th align="left">Item</th><th>Qty</th><th align="right">Amount</th></tr>${rows}</table>`;
}

export async function sendOrderConfirmation(order: OrderWithItems, to: string, guestTrackingUrl?: string) {
  const trackLine = guestTrackingUrl
    ? `<p>Track your order any time: <a href="${guestTrackingUrl}">${guestTrackingUrl}</a></p>`
    : "";
  const html = `
    <h2>Thanks for your order!</h2>
    <p>Your order <strong>${order.orderNumber}</strong> has been placed.</p>
    ${itemsTable(order.items)}
    <p style="margin-top:12px">
      Subtotal: ${formatINR(order.subtotal)}<br/>
      ${order.discount ? `Discount: −${formatINR(order.discount)}<br/>` : ""}
      Shipping: ${order.shippingFee ? formatINR(order.shippingFee) : "Free"}<br/>
      ${order.codFee ? `COD fee: ${formatINR(order.codFee)}<br/>` : ""}
      <strong>Total: ${formatINR(order.total)}</strong>
    </p>
    <p>Payment method: ${order.paymentMethod === "COD" ? "Cash on Delivery" : "PhonePe"}</p>
    ${trackLine}
    <p>— Zeroplus, Kothamangalam</p>`;
  await send(to, `Zeroplus order ${order.orderNumber} confirmed`, html);
}

export async function sendOrderStatusUpdate(order: OrderWithItems, to: string) {
  const html = `
    <h2>Order ${order.orderNumber} update</h2>
    <p>Your order status is now <strong>${order.status}</strong>.</p>
    ${order.trackingNumber ? `<p>Tracking number: <strong>${order.trackingNumber}</strong></p>` : ""}
    <p>— Zeroplus, Kothamangalam</p>`;
  await send(to, `Zeroplus order ${order.orderNumber}: ${order.status}`, html);
}
