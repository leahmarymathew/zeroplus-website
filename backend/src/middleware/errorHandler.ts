import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors.js";
import { config } from "../config.js";

// Express identifies the error handler by its 4-arg signature — keep _next.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ success: false, error: { code: err.code, message: err.message } });
  }

  // Multer size limit surfaces as a generic error with this code
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "LIMIT_FILE_SIZE") {
    return res
      .status(400)
      .json({ success: false, error: { code: "FILE_TOO_LARGE", message: "File exceeds the 5MB limit" } });
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL",
      message: config.isProd ? "Something went wrong" : String((err as Error)?.message ?? err),
    },
  });
}
