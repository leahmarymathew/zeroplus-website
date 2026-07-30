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
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);

// `onRehydrateStorage` (a persist *option*, passed in above) fires while
// `create()` is still constructing the store — before this `const` binding
// exists — so a callback that closes over `useAdminAuthStore` throws a TDZ
// ReferenceError and `hydrated` never flips. Registering via `.persist.*`
// below runs after the binding exists. `hasHydrated()` covers the case
// where (synchronous storage) hydration already finished by this point.
// Guarded: this module also evaluates on the server (RSC), where there's
// no storage and `.persist` isn't attached.
if (typeof window !== "undefined") {
  useAdminAuthStore.persist.onFinishHydration(() => {
    useAdminAuthStore.setState({ hydrated: true });
  });
  if (useAdminAuthStore.persist.hasHydrated()) {
    useAdminAuthStore.setState({ hydrated: true });
  }
}
