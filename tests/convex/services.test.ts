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
  create,
  update,
  remove,
  permanentDelete,
  restore,
} from "../../convex/services";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/services", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("create requires admin/root", async () => {
    asRole(ctx, "blog-editor");
    await expect(
      handler(create)(ctx, { title: "X", description: "Y" }),
    ).rejects.toThrow("Forbidden");
  });

  it("create stores the service with title/description and translations", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      title: "Web App",
      titleTranslations: { ptBR: "Aplicativo Web", enUS: "Web App" },
      description: "Build modern web apps",
    });
    const doc = await ctx.db.get(id);
    expect(doc!.title).toBe("Web App");
    expect(doc!.titleTranslations.ptBR).toBe("Aplicativo Web");
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { title: "X", description: "Y" });
    await handler(update)(ctx, { id, title: "Z" });
    expect((await ctx.db.get(id))!.title).toBe("Z");
  });

  it("list returns non-deleted in orderIndex order", async () => {
    asRole(ctx, "admin");
    const id1 = await handler(create)(ctx, { title: "A", description: "1", orderIndex: 2 });
    void id1;
    const id2 = await handler(create)(ctx, { title: "B", description: "2", orderIndex: 1 });
    void id2;
    const result = await handler(list)(ctx, {});
    expect(result.map((s: any) => s.title)).toEqual(["A", "B"]);
  });

  it("list excludes soft-deleted by default", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { title: "A", description: "1" });
    await handler(remove)(ctx, { id });
    expect(await handler(list)(ctx, {})).toHaveLength(0);
    expect(await handler(list)(ctx, { includeDeleted: true })).toHaveLength(1);
  });

  it("permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { title: "X", description: "Y" });
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("restore (root) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, { title: "X", description: "Y" });
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});
