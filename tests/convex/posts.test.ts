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
  create,
  update,
  publish,
  unpublish,
  remove,
  permanentDelete,
  restore,
  getBySlug,
  listAdmin,
  listAllPublished,
} from "../../convex/posts";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asEditor(ctx: MockCtx, role = "blog-editor", userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

const baseArgs = {
  title: "Hello",
  slug: "hello",
  content: "<p>Body</p>",
  tags: ["tech"],
  featured: false,
  status: "draft" as const,
};

describe("convex/posts · create", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates a draft with no publishedAt", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    const post = await ctx.db.get(id);
    expect(post!.status).toBe("draft");
    expect(post!.publishedAt).toBeUndefined();
  });

  it("creates a published post with publishedAt set to now", async () => {
    asEditor(ctx);
    const before = Date.now();
    const id = await handler(create)(ctx, { ...baseArgs, status: "published" });
    const post = await ctx.db.get(id);
    expect(post!.publishedAt).toBeGreaterThanOrEqual(before);
  });

  it("rejects duplicate slug", async () => {
    asEditor(ctx);
    await handler(create)(ctx, baseArgs);
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow(
      "Slug already in use",
    );
  });

  it("rejects unauthorized roles", async () => {
    asEditor(ctx, "proposal-editor");
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Forbidden");
  });
});

describe("convex/posts · publish / unpublish", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("publish sets status=published with publishedAt", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(publish)(ctx, { id });
    const post = await ctx.db.get(id);
    expect(post!.status).toBe("published");
    expect(post!.publishedAt).toBeGreaterThan(0);
  });

  it("unpublish reverts to draft", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, { ...baseArgs, status: "published" });
    await handler(unpublish)(ctx, { id });
    expect((await ctx.db.get(id))!.status).toBe("draft");
  });
});

describe("convex/posts · update", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("patches fields and updatedAt", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(update)(ctx, { id, title: "New Title" });
    const post = await ctx.db.get(id);
    expect(post!.title).toBe("New Title");
    expect(post!.updatedAt).toBeGreaterThan(0);
  });
});

describe("convex/posts · remove / permanentDelete / restore", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("remove soft-deletes", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    const post = await ctx.db.get(id);
    expect(post!.deletedAt).toBeGreaterThan(0);
  });

  it("permanentDelete is root-only", async () => {
    asEditor(ctx, "blog-editor");
    const id = await handler(create)(ctx, baseArgs);
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow(
      "Forbidden",
    );
  });

  it("permanentDelete removes for root", async () => {
    asEditor(ctx, "root");
    const id = await handler(create)(ctx, baseArgs);
    await handler(permanentDelete)(ctx, { id });
    expect(await ctx.db.get(id)).toBeNull();
  });

  it("restore is root-only and clears deletedAt", async () => {
    asEditor(ctx, "root");
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});

describe("convex/posts · getBySlug / listAdmin / listAllPublished", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("getBySlug returns null for missing or soft-deleted", async () => {
    expect(await handler(getBySlug)(ctx, { slug: "ghost" })).toBeNull();

    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    expect(await handler(getBySlug)(ctx, { slug: "hello" })).toBeNull();
  });

  it("getBySlug returns post with imageUrl resolution", async () => {
    asEditor(ctx);
    await handler(create)(ctx, { ...baseArgs, imageUrl: "https://i.com/x.png" });
    const post = await handler(getBySlug)(ctx, { slug: "hello" });
    expect(post.title).toBe("Hello");
    expect(post.imageUrl).toBe("https://i.com/x.png");
  });

  it("listAdmin requires editor role", async () => {
    await expect(handler(listAdmin)(ctx, {})).rejects.toThrow();
  });

  it("listAdmin excludes soft-deleted by default", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(create)(ctx, { ...baseArgs, slug: "two", title: "Two" });
    await handler(remove)(ctx, { id });
    const posts = await handler(listAdmin)(ctx, {});
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("two");
  });

  it("listAllPublished returns only published, non-deleted posts", async () => {
    asEditor(ctx);
    await handler(create)(ctx, { ...baseArgs, slug: "p1", status: "published" });
    await handler(create)(ctx, { ...baseArgs, slug: "p2", status: "draft" });
    const published = await handler(listAllPublished)(ctx, {});
    expect(published.map((p: any) => p.slug)).toEqual(["p1"]);
  });
});
