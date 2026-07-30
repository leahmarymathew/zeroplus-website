import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  hydrated: boolean;
  login: (user: User, accessToken?: string | null) => void;
  logout: () => void;
}

// `accessToken` is attached to backend requests by lib/api/client.ts. login()
// now accepts an optional token so real POST /v1/auth/* wiring can store it;
// existing mock login(user) calls still work (token defaults to null).
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      login: (user, accessToken = null) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "zeroplus-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);

// See store/adminAuthStore.ts for why this can't be the inline
// `onRehydrateStorage` option — it fires mid-construction, before this
// `const` binding exists, throwing a TDZ ReferenceError. Guarded: this
// module also evaluates on the server (RSC), where there's no storage and
// `.persist` isn't attached.
if (typeof window !== "undefined") {
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.setState({ hydrated: true });
  });
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ hydrated: true });
  }
}
