import { Router } from "express";
import { ok } from "../lib/respond.js";

// Every resource router mounts here; app.ts mounts this under /v1.
export const v1 = Router();

v1.get("/health", (_req, res) => {
  ok(res, { status: "ok" });
});
