import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address } from "@/lib/types";

interface AddressState {
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, address: Omit<Address, "id" | "userId">) => void;
  removeAddress: (id: string) => void;
}

// GET/POST/PATCH/DELETE /v1/addresses — Section 6.2. Local-only until
// /backend exists; shape matches the Address model in Section 5 exactly.
export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addresses: [],
      addAddress: (address) =>
        set((state) => {
          const withDefault =
            address.isDefault || state.addresses.length === 0
              ? state.addresses.map((a) => ({ ...a, isDefault: false }))
              : state.addresses;
          return { addresses: [...withDefault, { ...address, id: crypto.randomUUID(), isDefault: address.isDefault || state.addresses.length === 0 }] };
        }),
      updateAddress: (id, address) =>
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id
              ? { ...a, ...address }
              : address.isDefault
                ? { ...a, isDefault: false }
                : a
          ),
        })),
      removeAddress: (id) => set((state) => ({ addresses: state.addresses.filter((a) => a.id !== id) })),
    }),
    { name: "zeroplus-addresses" }
  )
);
