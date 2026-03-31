import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Use unique keys per test to avoid shared state
    vi.useFakeTimers();
  });

  it("should allow requests within the limit", () => {
    const key = `test:allow:${Date.now()}`;
    const config = { maxRequests: 3, windowMs: 60_000 };

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("should block requests exceeding the limit", () => {
    const key = `test:block:${Date.now()}`;
    const config = { maxRequests: 2, windowMs: 60_000 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("should reset after the time window expires", () => {
    const key = `test:reset:${Date.now()}`;
    const config = { maxRequests: 1, windowMs: 1_000 };

    checkRateLimit(key, config);
    expect(checkRateLimit(key, config).allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1_100);

    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("should track different keys independently", () => {
    const keyA = `test:a:${Date.now()}`;
    const keyB = `test:b:${Date.now()}`;
    const config = { maxRequests: 1, windowMs: 60_000 };

    checkRateLimit(keyA, config);
    expect(checkRateLimit(keyA, config).allowed).toBe(false);
    // Different key should still be allowed
    expect(checkRateLimit(keyB, config).allowed).toBe(true);
  });

  it("should return correct retryAfterMs", () => {
    const key = `test:retry:${Date.now()}`;
    const config = { maxRequests: 1, windowMs: 10_000 };

    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(10_000);
  });

  it("should implement sliding window (not fixed window)", () => {
    const key = `test:sliding:${Date.now()}`;
    const config = { maxRequests: 2, windowMs: 10_000 };

    // t=0: first request
    checkRateLimit(key, config);

    // t=6s: second request
    vi.advanceTimersByTime(6_000);
    checkRateLimit(key, config);

    // t=6s: at limit, should be blocked
    expect(checkRateLimit(key, config).allowed).toBe(false);

    // t=11s: first request (t=0) has expired, so one slot opens
    vi.advanceTimersByTime(5_000);
    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  describe("predefined rate limit configs", () => {
    it("should have AI_QUERY config", () => {
      expect(RATE_LIMITS.AI_QUERY.maxRequests).toBe(20);
      expect(RATE_LIMITS.AI_QUERY.windowMs).toBe(60_000);
    });

    it("should have UPLOAD config", () => {
      expect(RATE_LIMITS.UPLOAD.maxRequests).toBe(5);
      expect(RATE_LIMITS.UPLOAD.windowMs).toBe(60_000);
    });
  });
});
