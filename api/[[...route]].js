import { createApp } from "../backend/src/app.js";
import { env } from "../backend/src/config/env.js";
import { connectDb } from "../backend/src/config/db.js";

const app = createApp();
let readyPromise;

async function ensureReady() {
  if (!readyPromise) {
    readyPromise = connectDb(env.mongoUri);
  }

  return readyPromise;
}

export default async function handler(req, res) {
  try {
    await ensureReady();
    return app(req, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: {
        message: "Database connection failed. Check your Atlas MONGODB_URI configuration.",
      },
    });
  }
}
