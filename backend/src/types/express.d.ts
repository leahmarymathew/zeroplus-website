import type { Role } from "../generated/prisma/enums.js";

// Populated by middleware/auth.ts (requireAuth / optionalAuth).
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export {};
