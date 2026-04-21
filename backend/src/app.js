import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/authRoutes.js";
import { vendorRoutes } from "./routes/vendorRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { requestRoutes } from "./routes/requestRoutes.js";
import { chatRoutes } from "./routes/chatRoutes.js";
import { sendError } from "./utils/http.js";

function getAllowedOrigins() {
  return String(env.clientOrigin ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => res.type("text/plain").send("Backend running"));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/api", (_req, res) => res.json({ ok: true }));
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api", vendorRoutes);
  app.use("/api", productRoutes);
  app.use("/api", requestRoutes);
  app.use("/api", chatRoutes);

  app.use((req, res) => sendError(res, 404, `Route not found: ${req.method} ${req.path}`));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  });

  return app;
}
