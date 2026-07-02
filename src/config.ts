// src/config.ts
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "..", ".env"), quiet: true });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const config = {
  exchangeBaseUrl: required("EXCHANGE_BASE_URL"),
  port: parseInt(process.env.PORT ?? "3001", 10),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
};
