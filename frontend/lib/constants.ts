export const STORE = {
  name: "Zeroplus",
  addressLines: [
    "Post Office Junction, near OP Gate Baselious Hospital",
    "near Dharmagiri Hospital, Kothamangalam",
    "Kerala 686691",
  ],
  phoneDisplay: "+91 98xxx xxxx0",
  email: "hello@zeroplus.in",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919800000000",
  whatsappMessage: "Hi! I have a question about a product on the Zeroplus website.",
  // Google's business name for the storefront — "Zero Plus Moms and Baby
  // Care Store" (with spaces) — used for map queries; matches the real
  // Google Business listing so the embed/directions resolve to the right pin.
  googleMapsQuery: "Zero Plus Moms and Baby Care Store, Kothamangalam, Kerala 686691",
};

export function whatsappLink(message = STORE.whatsappMessage) {
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

// No-API-key embed — Google serves an interactive map for a text query via
// this URL as long as it's loaded inside an <iframe> (it refuses to render
// standalone). Avoids needing a billed Google Maps API key for a simple
// "here's our store" embed.
export function googleMapsEmbedSrc() {
  return `https://www.google.com/maps?q=${encodeURIComponent(STORE.googleMapsQuery)}&output=embed`;
}

export function googleMapsDirectionsUrl() {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE.googleMapsQuery)}`;
}
