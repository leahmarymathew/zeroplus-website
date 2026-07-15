import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../lib/errors.js";

type Part = "body" | "query" | "params";

// validate(schema)            -> validates req.body
// validate(schema, "query")   -> validates req.query, result stored on res.locals.query
// Parsed (coerced/defaulted) values replace the originals so controllers
// always read post-validation data.
export function validate(schema: ZodType, part: Part = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const first = result.error.issues[0];
      const where = first.path.length ? `${first.path.join(".")}: ` : "";
      throw new ApiError(400, "VALIDATION_ERROR", `${where}${first.message}`);
    }
    if (part === "body") {
      req.body = result.data;
    } else {
      // req.query/req.params are getter-only in Express 5 — stash parsed values on locals
      res.locals[part] = result.data;
    }
    next();
  };
}
