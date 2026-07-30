import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  productIds: string[];
  hydrated: boolean;
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

// `hydrated` starts false on both server and the client's first render so
// the SSR HTML always shows the "not wishlisted" state; it flips true once
// persist reads localStorage, after hydration. Reading productIds straight
// from the store during render would mismatch the server render whenever a
// product was already wishlisted (see store/authStore.ts for the same
// pattern).
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      hydrated: false,
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      isWishlisted: (productId) => get().productIds.includes(productId),
    }),
    {
      name: "zeroplus-wishlist",
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);

// See store/adminAuthStore.ts for why this can't be the inline
// `onRehydrateStorage` option — it fires mid-construction, before this
// `const` binding exists, throwing a TDZ ReferenceError. Guarded: this
// module also evaluates on the server (RSC), where there's no storage and
// `.persist` isn't attached.
if (typeof window !== "undefined") {
  useWishlistStore.persist.onFinishHydration(() => {
    useWishlistStore.setState({ hydrated: true });
  });
  if (useWishlistStore.persist.hasHydrated()) {
    useWishlistStore.setState({ hydrated: true });
  }
}

export const selectWishlistCount = (state: WishlistState) => state.productIds.length;
