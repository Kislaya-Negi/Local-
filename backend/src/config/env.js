import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,
  mongoUri: String(process.env.MONGODB_URI ?? "").trim(),
  jwtSecret: process.env.JWT_SECRET ?? "dev_secret_change_me",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "",
};
