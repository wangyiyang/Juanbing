import { z } from "zod";

const TEST_DEFAULTS = {
  SESSION_SECRET: "12345678901234567890123456789012",
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD_HASH:
    "$2b$10$Y0K89iDd3s1B4kgX4V0f0.x5X7VfVKiwoMPmxjSPdZRhqUWLWyd4W", // secret123
};

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  ADMIN_USERNAME: z.string().trim().min(1),
  ADMIN_PASSWORD_HASH: z.string().min(20),
});

function readRawEnv() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isTest = nodeEnv === "test";

  return {
    NODE_ENV: nodeEnv,
    DATABASE_URL:
      process.env.DATABASE_URL ?? (isTest ? ":memory:" : "data/juanbing.sqlite"),
    SESSION_SECRET:
      process.env.SESSION_SECRET ??
      (isTest ? TEST_DEFAULTS.SESSION_SECRET : undefined),
    ADMIN_USERNAME:
      process.env.ADMIN_USERNAME ??
      (isTest ? TEST_DEFAULTS.ADMIN_USERNAME : undefined),
    ADMIN_PASSWORD_HASH:
      process.env.ADMIN_PASSWORD_HASH ??
      (isTest ? TEST_DEFAULTS.ADMIN_PASSWORD_HASH : undefined),
  };
}

export const env = envSchema.parse(readRawEnv());
