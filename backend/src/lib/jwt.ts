import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { Role } from "../generated/prisma/enums.js";

export interface AccessPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(user: { id: string; role: Role }): string {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl,
  });
}

export function signRefreshToken(user: { id: string }): string {
  return jwt.sign({ sub: user.id, type: "refresh" }, config.jwt.refreshSecret, {
    expiresIn: `${config.jwt.refreshTtlDays}d`,
  });
}

// Both throw on invalid/expired — callers convert to 401 ApiError.
export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, config.jwt.accessSecret) as jwt.JwtPayload;
  return { sub: String(payload.sub), role: payload.role as Role };
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, config.jwt.refreshSecret) as jwt.JwtPayload;
  if (payload.type !== "refresh") throw new Error("not a refresh token");
  return { sub: String(payload.sub) };
}
