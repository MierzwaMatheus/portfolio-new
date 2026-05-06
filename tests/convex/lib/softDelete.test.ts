import { describe, it, expect, beforeEach, vi } from "vitest";
import { softDeleteDoc, restoreDoc } from "../../../convex/lib/softDelete";
import { createMockCtx, type MockCtx } from "../../_helpers/convexCtx";

describe("convex/lib/softDelete", () => {
  let ctx: MockCtx;
  let docId: string;

  beforeEach(() => {
    ctx = createMockCtx();
    [docId] = ctx.db._seed("posts", [{ title: "p1" }]);
  });

  describe("softDeleteDoc", () => {
    it("sets deletedAt to now and deletedBy to actorId", async () => {
      const before = Date.now();
      await softDeleteDoc(ctx as any, "posts", docId as any, "user-1");
      const doc = await ctx.db.get(docId);
      expect(doc?.deletedAt).toBeGreaterThanOrEqual(before);
      expect(doc?.deletedBy).toBe("user-1");
    });

    it("is idempotent — re-calling overwrites with new timestamp/actor", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1_000_000));
      await softDeleteDoc(ctx as any, "posts", docId as any, "actor-A");
      const firstSnapshot = { ...(await ctx.db.get(docId))! };

      vi.setSystemTime(new Date(2_000_000));
      await softDeleteDoc(ctx as any, "posts", docId as any, "actor-B");
      const secondSnapshot = await ctx.db.get(docId);

      expect(secondSnapshot?.deletedAt).toBe(2_000_000);
      expect(secondSnapshot?.deletedBy).toBe("actor-B");
      expect(firstSnapshot.deletedAt).toBe(1_000_000);
      vi.useRealTimers();
    });
  });

  describe("restoreDoc", () => {
    it("clears deletedAt and deletedBy on a soft-deleted doc", async () => {
      await softDeleteDoc(ctx as any, "posts", docId as any, "u");
      await restoreDoc(ctx as any, "posts", docId as any);
      const doc = await ctx.db.get(docId);
      expect(doc?.deletedAt).toBeUndefined();
      expect(doc?.deletedBy).toBeUndefined();
    });

    it("is idempotent on a doc that was never soft-deleted", async () => {
      await expect(
        restoreDoc(ctx as any, "posts", docId as any),
      ).resolves.toBeUndefined();
      const doc = await ctx.db.get(docId);
      expect(doc?.deletedAt).toBeUndefined();
    });
  });
});
