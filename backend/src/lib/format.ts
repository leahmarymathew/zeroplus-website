// Rupee formatting for emails/logs. Mirrors the frontend's formatPrice.
export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}
