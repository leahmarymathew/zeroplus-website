import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

export const GUEST_COOKIE = "guestId";

// Section 6.1: the backend sets a guestId httpOnly cookie on first cart
// request if absent. The browser attaches it automatically thereafter; the
// frontend never reads or manages its value. Logged-in users key on userId
// instead (see resolveCartKey), but we still keep the cookie so a later
// logout keeps their guest cart working.
export function guestCart(req: Request, res: Response, next: NextFunction) {
  let guestId = req.cookies?.[GUEST_COOKIE] as string | undefined;
  if (!guestId) {
    guestId = randomUUID();
    res.cookie(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: "lax",
      path: "/v1",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  res.locals.guestId = guestId;
  next();
}
