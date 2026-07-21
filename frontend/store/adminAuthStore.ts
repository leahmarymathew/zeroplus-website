import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AdminAuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  login: (user?: User | null, accessToken?: string | null) => void;
  logout: () => void;
}

// Separate from the customer authStore — admin sessions (Section 2.2) and
// customer accounts are distinct concerns. `accessToken` is attached to
// /admin/* and /uploads/* requests by lib/api/client.ts. login() accepts an
// optional user + token so real POST /v1/auth/login wiring can store them;
// callers that only flip the flag (mock mode) still work.
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      hydrated: false,
      login: (user = null, accessToken = null) =>
        set({ isAuthenticated: true, user, accessToken }),
      logout: () => set({ isAuthenticated: false, user: null, accessToken: null }),
    }),
    {
      name: "zeroplus-admin-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
