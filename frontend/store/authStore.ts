import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// No backend yet — login/register just create a local mock user record.
// Swap login()/register() call sites for real POST /v1/auth/* calls once
// /backend exists; the User shape already matches Section 5.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "zeroplus-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);
