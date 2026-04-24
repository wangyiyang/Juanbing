import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: ":memory:",
    SESSION_SECRET: "12345678901234567890123456789012",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH:
      "$2b$10$nA1DjKqLQDSG/lTG/X/ftO1MRdBTIrX0bgxzKoh9rZf0xgMJo4xR6",
  },
}));

describe("admin auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts valid credentials", async () => {
    const { verifyAdminCredentials } = await import("@/lib/auth/session");

    await expect(verifyAdminCredentials("admin", "secret123")).resolves.toBe(
      true,
    );
  });

  it("rejects invalid credentials", async () => {
    const { verifyAdminCredentials } = await import("@/lib/auth/session");

    await expect(verifyAdminCredentials("admin", "wrong-pass")).resolves.toBe(
      false,
    );
  });
});
