import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/security/rate-limit";

describe("rate limiter", () => {
  it("blocks the 11th request within one minute", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

    for (let index = 0; index < 10; index += 1) {
      expect(limiter.consume("127.0.0.1")).toBe(true);
    }

    expect(limiter.consume("127.0.0.1")).toBe(false);
  });
});
