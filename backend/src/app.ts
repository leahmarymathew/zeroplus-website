import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { v1 } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

// App construction is separate from listen() so tests can import it directly.
export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true, // guest cart + refresh token ride on cookies
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/v1", v1);

  // Envelope-shaped 404 for anything unmatched
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
  });

  app.use(errorHandler);
  return app;
}
