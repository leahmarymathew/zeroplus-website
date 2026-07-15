import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { forbidden, unauthorized } from "../lib/errors.js";

function readBearer(req: Request): string | null {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req);
  if (!token) throw unauthorized();
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    throw unauthorized("Invalid or expired token");
  }
  next();
}

// Mount after requireAuth: router.use(requireAuth, requireAdmin)
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") throw forbidden("Admin access required");
  next();
}

// Cart/order endpoints: attach the user when a valid token is present,
// continue anonymously (guest cookie) otherwise. A bad token is treated as
// absent rather than an error — a stale token must not break guest browsing.
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, role: payload.role };
    } catch {
      /* treat as guest */
    }
  }
  next();
}
