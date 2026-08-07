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
};

export function whatsappLink(message = STORE.whatsappMessage) {
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
