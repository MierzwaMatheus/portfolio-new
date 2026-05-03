import { describe, it, expect, beforeEach, vi } from "vitest";

const { getAuthUserId } = vi.hoisted(() => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({
    auth: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    store: vi.fn(),
    isAuthenticated: vi.fn(),
  }),
  getAuthUserId,
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({
  Password: () => ({}),
}));

import {
  generateVideoUploadUrl,
  generateAvatarUploadUrl,
  _submitInternal,
  list,
  approve,
  reject,
  restore,
  publish,
  getDailyVideoUsage,
} from "../../convex/testimonialSubmissions";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;
const MB = 1024 * 1024;

function asAdmin(ctx: MockCtx, userId = "admin-1") {
  ctx.db._seed("users", [{ _id: userId, email: "a@b.com" }]);
  ctx.db._seed("userRoles", [{ userId, role: "admin" }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

describe("convex/testimonialSubmissions · generateVideoUploadUrl", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("rejects videos larger than 20MB", async () => {
    await expect(
      handler(generateVideoUploadUrl)(ctx, { fileSizeBytes: 21 * MB }),
    ).rejects.toThrow("VIDEO_TOO_LARGE");
  });

  it("rejects when daily aggregate would exceed 100MB", async () => {
    const dayStart = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    ctx.db._seed("testimonialSubmissions", [
      { videoFileSize: 95 * MB, createdAt: dayStart + 100, status: "pending", name: "x", role: "x", email: "x@x.com", type: "video" },
    ]);
    await expect(
      handler(generateVideoUploadUrl)(ctx, { fileSizeBytes: 10 * MB }),
    ).rejects.toThrow("VIDEO_DAILY_LIMIT_REACHED");
  });

  it("returns the upload URL when within limits", async () => {
    const url = await handler(generateVideoUploadUrl)(ctx, {
      fileSizeBytes: 5 * MB,
    });
    expect(url).toBe("https://upload.example.com/abc");
  });

  it("ignores submissions from previous days when computing the daily quota", async () => {
    const dayStart = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    ctx.db._seed("testimonialSubmissions", [
      { videoFileSize: 95 * MB, createdAt: dayStart - 10_000, status: "pending", name: "x", role: "x", email: "x@x.com", type: "video" },
    ]);
    await expect(
      handler(generateVideoUploadUrl)(ctx, { fileSizeBytes: 10 * MB }),
    ).resolves.toBeTruthy();
  });
});

describe("convex/testimonialSubmissions · generateAvatarUploadUrl", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("rejects avatars larger than 1MB", async () => {
    await expect(
      handler(generateAvatarUploadUrl)(ctx, { fileSizeBytes: 1.5 * MB }),
    ).rejects.toThrow("AVATAR_TOO_LARGE");
  });

  it("returns upload URL when within limit", async () => {
    const url = await handler(generateAvatarUploadUrl)(ctx, {
      fileSizeBytes: 100_000,
    });
    expect(url).toBeTruthy();
  });
});

describe("convex/testimonialSubmissions · _submitInternal (rate limits)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  const baseArgs = {
    name: "Alice",
    role: "Dev",
    email: "alice@x.com",
    type: "text" as const,
    text: "Great",
    ipAddress: "1.2.3.4",
  };

  it("rate-limits 1 per email per week", async () => {
    await handler(_submitInternal)(ctx, baseArgs);
    await expect(handler(_submitInternal)(ctx, baseArgs)).rejects.toThrow(
      "RATE_LIMITED",
    );
  });

  it("rate-limits 3 per IP per day", async () => {
    for (let i = 0; i < 3; i++) {
      await handler(_submitInternal)(ctx, {
        ...baseArgs,
        email: `u${i}@x.com`,
      });
    }
    await expect(
      handler(_submitInternal)(ctx, { ...baseArgs, email: "u4@x.com" }),
    ).rejects.toThrow("RATE_LIMITED");
  });

  it("inserts the submission with status=pending", async () => {
    const result = await handler(_submitInternal)(ctx, baseArgs);
    const doc = await ctx.db.get(result.id);
    expect(doc!.status).toBe("pending");
    expect(doc!.email).toBe("alice@x.com");
  });
});

describe("convex/testimonialSubmissions · approve / reject / restore", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("approve sets status=approved and stores reviewer", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "text", status: "pending", createdAt: 1 },
    ]);
    await handler(approve)(ctx, { id });
    const doc = await ctx.db.get(id);
    expect(doc!.status).toBe("approved");
    expect(doc!.reviewedBy).toBeTruthy();
  });

  it("reject deletes storage when not yet published", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "video", status: "pending", videoStorageId: "vs1", avatarStorageId: "as1", createdAt: 1 },
    ]);
    await handler(reject)(ctx, { id });
    expect(ctx.storage.delete).toHaveBeenCalledWith("vs1");
    expect(ctx.storage.delete).toHaveBeenCalledWith("as1");
  });

  it("reject deletes published testimonial when reverting from published", async () => {
    asAdmin(ctx);
    const [tid] = ctx.db._seed("testimonials", [
      { name: "X", role: "Y", text: "t", orderIndex: 1, showOnHome: false, createdAt: 1 },
    ]);
    const [id] = ctx.db._seed("testimonialSubmissions", [
      {
        name: "X", role: "Y", email: "x@y.com", type: "text", status: "published",
        testimonialId: tid, createdAt: 1,
      },
    ]);
    await handler(reject)(ctx, { id });
    expect(await ctx.db.get(tid)).toBeNull();
  });

  it("restore sets status back to pending", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "text", status: "rejected", createdAt: 1 },
    ]);
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.status).toBe("pending");
  });
});

describe("convex/testimonialSubmissions · publish", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates a testimonial from a text submission and increments orderIndex", async () => {
    asAdmin(ctx);
    ctx.db._seed("testimonials", [
      { name: "Old", role: "x", text: "y", orderIndex: 7, showOnHome: false, createdAt: 1 },
    ]);
    const [id] = ctx.db._seed("testimonialSubmissions", [
      { name: "New", role: "Dev", email: "n@x.com", type: "text", text: "Awesome", status: "approved", createdAt: 2 },
    ]);
    const result = await handler(publish)(ctx, { id });
    expect(result.testimonialId).toBeTruthy();
    const t = await ctx.db.get(result.testimonialId);
    expect(t!.orderIndex).toBe(8);
    expect((await ctx.db.get(id))!.status).toBe("published");
  });

  it("rejects video submissions", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("testimonialSubmissions", [
      { name: "V", role: "Dev", email: "v@x.com", type: "video", status: "approved", createdAt: 1 },
    ]);
    await expect(handler(publish)(ctx, { id })).rejects.toThrow(
      /Apenas depoimentos em texto/,
    );
  });
});

describe("convex/testimonialSubmissions · getDailyVideoUsage", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("aggregates total video bytes for today and returns MB stats", async () => {
    asAdmin(ctx);
    const dayStart = (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();
    ctx.db._seed("testimonialSubmissions", [
      { videoFileSize: 5 * MB, createdAt: dayStart + 100, status: "pending", name: "x", role: "x", email: "x@x.com", type: "video" },
      { videoFileSize: 3 * MB, createdAt: dayStart + 200, status: "pending", name: "y", role: "y", email: "y@x.com", type: "video" },
    ]);
    const usage = await handler(getDailyVideoUsage)(ctx, {});
    expect(usage.usedBytes).toBe(8 * MB);
    expect(usage.usedMB).toBe(8);
    expect(usage.limitMB).toBe(100);
  });
});

describe("convex/testimonialSubmissions · list (auth + filter)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects callers without proper role", async () => {
    await expect(handler(list)(ctx, {})).rejects.toThrow();
  });

  it("filters by status when provided", async () => {
    asAdmin(ctx);
    ctx.db._seed("testimonialSubmissions", [
      { name: "A", role: "x", email: "a@x.com", type: "text", status: "pending", createdAt: 1 },
      { name: "B", role: "x", email: "b@x.com", type: "text", status: "approved", createdAt: 2 },
    ]);
    const res = await handler(list)(ctx, { status: "approved" });
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe("B");
  });
});
