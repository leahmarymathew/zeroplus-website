import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

interface CartState {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

// `hydrated` starts false on both server and the client's first render so
// the SSR HTML always shows the empty-cart state; it flips true once persist
// reads localStorage, after hydration. See store/wishlistStore.ts.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === item.variantId && i.kitId === item.kitId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "zeroplus-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
    }
  )
);

// Stable reference for "no items yet" reads (pre-hydration). A `[]` literal
// inline in a selector would return a new array every call, which breaks
// useSyncExternalStore's reference-equality check and risks a render loop.
export const EMPTY_CART_ITEMS: CartItem[] = [];

export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.quantity, 0);

export const selectCartSubtotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
