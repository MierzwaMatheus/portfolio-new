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
  list,
  getBySlug,
  getById,
  create,
  update,
  remove,
  permanentDelete,
  restore,
  reorder,
} from "../../convex/projects";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

const baseArgs = {
  title: "Project 1",
  description: "Desc",
  tags: ["web"],
  imageIds: [],
  orderIndex: 1,
};

describe("convex/projects · list / getBySlug / getById", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("list returns empty when plugin disabled", async () => {
    ctx.db._seed("homeContent", [
      { key: "plugin:portfolio:enabled", value: false, createdAt: 1 },
    ]);
    expect(await handler(list)(ctx, {})).toEqual([]);
  });

  it("list filters by tag and excludes soft-deleted", async () => {
    ctx.db._seed("projects", [
      { title: "A", description: "x", tags: ["web"], imageIds: [], orderIndex: 1, createdAt: 1 },
      { title: "B", description: "x", tags: ["mobile"], imageIds: [], orderIndex: 2, createdAt: 2 },
      { title: "C", description: "x", tags: ["web"], imageIds: [], orderIndex: 3, createdAt: 3, deletedAt: 100 },
    ]);
    const filtered = await handler(list)(ctx, { tag: "web" });
    expect(filtered.map((p: any) => p.title)).toEqual(["A"]);
  });

  it("list resolves externalImageUrls into images array", async () => {
    ctx.db._seed("projects", [
      { title: "A", description: "x", tags: [], imageIds: [], externalImageUrls: ["https://i/1.png", ""], orderIndex: 1, createdAt: 1 },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result[0].images).toHaveLength(1);
    expect(result[0].images[0].url).toBe("https://i/1.png");
  });

  it("getBySlug returns null for missing or soft-deleted", async () => {
    expect(await handler(getBySlug)(ctx, { slug: "ghost" })).toBeNull();
  });

  it("getBySlug returns project with images merged", async () => {
    ctx.db._seed("projects", [
      { title: "A", description: "x", tags: [], imageIds: [], externalImageUrls: ["https://i/1.png"], orderIndex: 1, slug: "a", createdAt: 1 },
    ]);
    const result = await handler(getBySlug)(ctx, { slug: "a" });
    expect(result.title).toBe("A");
    expect(result.images[0].url).toBe("https://i/1.png");
  });

  it("getById returns null for unknown id", async () => {
    expect(await handler(getById)(ctx, { id: "nope" as any })).toBeNull();
  });
});

describe("convex/projects · create / update / remove / permanentDelete / restore / reorder", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("create requires content-editor or above", async () => {
    asRole(ctx, "blog-editor");
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Forbidden");
  });

  it("create stores the project", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, baseArgs);
    expect((await ctx.db.get(id))!.title).toBe("Project 1");
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, baseArgs);
    await handler(update)(ctx, { id, title: "Updated" });
    expect((await ctx.db.get(id))!.title).toBe("Updated");
  });

  it("remove soft-deletes; permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeGreaterThan(0);
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("restore (root) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });

  it("reorder updates orderIndex of each item", async () => {
    asRole(ctx, "admin");
    const id1 = await handler(create)(ctx, { ...baseArgs, orderIndex: 0 });
    const id2 = await handler(create)(ctx, { ...baseArgs, title: "Project 2", orderIndex: 1 });
    await handler(reorder)(ctx, {
      items: [{ id: id1, orderIndex: 9 }, { id: id2, orderIndex: 5 }],
    });
    expect((await ctx.db.get(id1))!.orderIndex).toBe(9);
    expect((await ctx.db.get(id2))!.orderIndex).toBe(5);
  });
});
