import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  checkRateLimit,
  recordRateLimitAttempt,
  resetRateLimit,
} from "../../convex/rateLimit";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const TABLE = "rateLimitAttempts";

describe("convex/rateLimit", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("allows when no record exists", async () => {
      const result = await checkRateLimit(ctx as any, "login", "alice@example.com");
      expect(result).toEqual({ allowed: true });
    });

    it("blocks when blockedUntil is still in the future", async () => {
      const future = Date.now() + 60_000;
      ctx.db._seed(TABLE, [
        {
          key: "login:alice",
          identifier: "alice",
          type: "login",
          attemptCount: 99,
          firstAttemptAt: Date.now(),
          lastAttemptAt: Date.now(),
          blockedUntil: future,
          expiresAt: future + 1000,
        },
      ]);
      const result = await checkRateLimit(ctx as any, "login", "alice");
      expect(result).toEqual({ allowed: false, blockedUntil: future });
    });

    it("allows when window has expired", async () => {
      const past = Date.now() - 16 * 60 * 1000; // beyond 15min login window
      ctx.db._seed(TABLE, [
        {
          key: "login:bob",
          identifier: "bob",
          type: "login",
          attemptCount: 5,
          firstAttemptAt: past,
          lastAttemptAt: past,
          expiresAt: past + 30 * 60 * 1000,
        },
      ]);
      const result = await checkRateLimit(ctx as any, "login", "bob");
      expect(result.allowed).toBe(true);
    });

    it("allows when attemptCount is below the perKey threshold", async () => {
      ctx.db._seed(TABLE, [
        {
          key: "login:carol",
          identifier: "carol",
          type: "login",
          attemptCount: 3,
          firstAttemptAt: Date.now(),
          lastAttemptAt: Date.now(),
          expiresAt: Date.now() + 60_000,
        },
      ]);
      const result = await checkRateLimit(ctx as any, "login", "carol");
      expect(result.allowed).toBe(true);
    });

    it("blocks when attemptCount reaches perKey", async () => {
      // login limit perKey=10
      ctx.db._seed(TABLE, [
        {
          key: "login:dave",
          identifier: "dave",
          type: "login",
          attemptCount: 10,
          firstAttemptAt: Date.now(),
          lastAttemptAt: Date.now(),
          expiresAt: Date.now() + 60_000,
        },
      ]);
      const result = await checkRateLimit(ctx as any, "login", "dave");
      expect(result.allowed).toBe(false);
    });
  });

  describe("recordRateLimitAttempt", () => {
    it("creates a new record on first attempt", async () => {
      await recordRateLimitAttempt(ctx as any, "login", "user-1");
      const all = ctx.db._all(TABLE);
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({
        key: "login:user-1",
        identifier: "user-1",
        type: "login",
        attemptCount: 1,
      });
    });

    it("increments attemptCount on subsequent attempts", async () => {
      await recordRateLimitAttempt(ctx as any, "login", "user-2");
      await recordRateLimitAttempt(ctx as any, "login", "user-2");
      await recordRateLimitAttempt(ctx as any, "login", "user-2");
      const all = ctx.db._all(TABLE);
      expect(all).toHaveLength(1);
      expect(all[0].attemptCount).toBe(3);
    });

    it("sets blockedUntil once perKey threshold is reached", async () => {
      // proposal_password limit: perKey=5, blockDuration=30min
      for (let i = 0; i < 4; i++) {
        await recordRateLimitAttempt(
          ctx as any,
          "proposal_password",
          "abc",
        );
      }
      // 4 attempts so far -> not blocked
      let record = ctx.db._all(TABLE)[0];
      expect(record.blockedUntil).toBeFalsy();

      await recordRateLimitAttempt(ctx as any, "proposal_password", "abc");
      record = ctx.db._all(TABLE)[0];
      expect(record.attemptCount).toBe(5);
      expect(record.blockedUntil).toBeGreaterThan(Date.now());
    });

    it("uses different rate limit windows per type", async () => {
      // Each type has its own bucket
      await recordRateLimitAttempt(ctx as any, "login", "x");
      await recordRateLimitAttempt(ctx as any, "proposal_password", "x");
      const all = ctx.db._all(TABLE);
      expect(all).toHaveLength(2);
      expect(all.map((r) => r.type).sort()).toEqual([
        "login",
        "proposal_password",
      ]);
    });
  });

  describe("resetRateLimit", () => {
    it("removes the matching record", async () => {
      await recordRateLimitAttempt(ctx as any, "login", "u");
      expect(ctx.db._all(TABLE)).toHaveLength(1);

      await resetRateLimit(ctx as any, "login", "u");
      expect(ctx.db._all(TABLE)).toHaveLength(0);
    });

    it("is a no-op when no record exists", async () => {
      await expect(
        resetRateLimit(ctx as any, "login", "ghost"),
      ).resolves.toBeUndefined();
    });

    it("only removes the targeted (type, identifier) bucket", async () => {
      await recordRateLimitAttempt(ctx as any, "login", "u");
      await recordRateLimitAttempt(ctx as any, "login", "v");
      await resetRateLimit(ctx as any, "login", "u");
      const remaining = ctx.db._all(TABLE);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].identifier).toBe("v");
    });
  });
});
