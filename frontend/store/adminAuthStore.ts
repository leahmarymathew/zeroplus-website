import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminAuthState {
  isAuthenticated: boolean;
  hydrated: boolean;
  login: () => void;
  logout: () => void;
}

// Separate from the customer authStore — admin sessions (Section 2.2) and
// customer accounts are distinct concerns. No backend yet, so login()
// accepts any well-formed credentials, same as the customer login stub.
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hydrated: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: "zeroplus-admin-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
