// Simulates network latency for the mock layer so loading states are real
// and stay honest once these functions are swapped for real fetch calls.
export function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
