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
  remove,
  permanentDelete,
  restore,
  reorder,
  listByType,
  listAll,
} from "../../convex/resumeItems";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

describe("convex/resumeItems · create + label extraction", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it.each([
    ["skill", { name: "TypeScript" }, "TypeScript"],
    ["language", { name: "Português" }, "Português"],
    ["experience", { role: "Senior Dev" }, "Senior Dev"],
    ["volunteer", { role: "Helper" }, "Helper"],
    ["education", { degree: "BSc" }, "BSc"],
    ["course", { text: "Course X" }, "Course X"],
    ["soft_skill", { text: "Empathy" }, "Empathy"],
  ])("logs label correctly for type=%s", async (type, content, expectedLabel) => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: type as any,
      content,
      orderIndex: 0,
    });
    expect(id).toBeTruthy();
    const audit = ctx.db._all("auditLog").find((a) => a.targetId === id);
    expect((audit!.metadata as any).label).toBe(expectedLabel);
  });

  it("rejects unauthorized roles", async () => {
    asRole(ctx, "blog-editor");
    await expect(
      handler(create)(ctx, { type: "skill", content: { name: "X" }, orderIndex: 0 }),
    ).rejects.toThrow("Forbidden");
  });
});

describe("convex/resumeItems · listByType / listAll", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("listByType filters by type and excludes soft-deleted", async () => {
    asRole(ctx, "admin");
    await handler(create)(ctx, { type: "skill", content: { name: "TS" }, orderIndex: 1 });
    const id2 = await handler(create)(ctx, { type: "skill", content: { name: "JS" }, orderIndex: 2 });
    await handler(create)(ctx, { type: "experience", content: { role: "Dev" }, orderIndex: 1 });
    await handler(remove)(ctx, { id: id2 });

    const skills = await handler(listByType)(ctx, { type: "skill" });
    expect(skills).toHaveLength(1);
    expect(skills[0].content.name).toBe("TS");
  });

  it("listByType returns empty array when plugin disabled", async () => {
    ctx.db._seed("homeContent", [
      { key: "plugin:resume:enabled", value: false, createdAt: 1 },
    ]);
    const result = await handler(listByType)(ctx, { type: "skill" });
    expect(result).toEqual([]);
  });

  it("listAll returns items across all types", async () => {
    asRole(ctx, "admin");
    await handler(create)(ctx, { type: "skill", content: { name: "X" }, orderIndex: 1 });
    await handler(create)(ctx, { type: "experience", content: { role: "X" }, orderIndex: 2 });
    const all = await handler(listAll)(ctx, {});
    expect(all).toHaveLength(2);
  });

  it("listAll includes soft-deleted when includeDeleted=true", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(remove)(ctx, { id });
    expect(await handler(listAll)(ctx, {})).toHaveLength(0);
    expect(await handler(listAll)(ctx, { includeDeleted: true })).toHaveLength(1);
  });
});

describe("convex/resumeItems · update / remove / permanentDelete / restore / reorder", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(update)(ctx, { id, orderIndex: 5 });
    expect((await ctx.db.get(id))!.orderIndex).toBe(5);
  });

  it("permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("permanentDelete works for root", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(permanentDelete)(ctx, { id });
    expect(await ctx.db.get(id)).toBeNull();
  });

  it("restore (root only) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });

  it("reorder updates orderIndex for multiple items", async () => {
    asRole(ctx, "admin");
    const id1 = await handler(create)(ctx, { type: "skill", content: { name: "A" }, orderIndex: 0 });
    const id2 = await handler(create)(ctx, { type: "skill", content: { name: "B" }, orderIndex: 1 });
    await handler(reorder)(ctx, { items: [{ id: id1, orderIndex: 5 }, { id: id2, orderIndex: 3 }] });
    expect((await ctx.db.get(id1))!.orderIndex).toBe(5);
    expect((await ctx.db.get(id2))!.orderIndex).toBe(3);
  });
});
