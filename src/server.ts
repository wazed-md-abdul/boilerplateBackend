import dotenv from "dotenv";
import path from "path";
import app from "./app";

// --- ENVIRONMENT VARIABLES LOADING & VALIDATION ---
dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface Config {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  BASE_URL: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(
      `Configuration Error: Environment variable "${key}" is required but not defined.`
    );
  }
  return value;
};

export const config: Config = {
  PORT: parseInt(getEnvVar("PORT", "3000"), 10),
  NODE_ENV: getEnvVar("NODE_ENV", "development") as Config["NODE_ENV"],
  BASE_URL: getEnvVar("BASE_URL"),
};

// --- SYNCHRONOUS ERROR HANDLER ---
process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] Uncaught Exception! Shutting down process...");
  console.error(err);
  process.exit(1);
});

// --- SERVER INITIALIZATION ---
const server = app.listen(config.PORT, () => {
  console.log(`[Server] Application listening on port ${config.PORT} in ${config.NODE_ENV} mode`);
});

// --- GRACEFUL SHUTDOWN HANDLERS ---
process.on("unhandledRejection", (err: Error) => {
  console.error("[CRITICAL] Unhandled Rejection! Shutting down server gracefully...");
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM signal received. Initiating graceful shutdown...");
  server.close(() => {
    console.log("[Server] Graceful shutdown completed.");
    process.exit(0);
  });
});
