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
  toggleShowOnHome,
  setTranslations,
  unpublish,
  createWithAvatar,
} from "../../convex/testimonials";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/testimonials · list", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("excludes soft-deleted by default", async () => {
    ctx.db._seed("testimonials", [
      { name: "A", role: "x", text: "1", showOnHome: false, orderIndex: 1, createdAt: 1 },
      { name: "B", role: "x", text: "2", showOnHome: false, orderIndex: 2, createdAt: 2, deletedAt: 100 },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result.map((t: any) => t.name)).toEqual(["A"]);
  });

  it("filters by showOnHome when onlyHome=true", async () => {
    ctx.db._seed("testimonials", [
      { name: "Home", role: "x", text: "1", showOnHome: true, orderIndex: 1, createdAt: 1 },
      { name: "Hidden", role: "x", text: "2", showOnHome: false, orderIndex: 2, createdAt: 2 },
    ]);
    const result = await handler(list)(ctx, { onlyHome: true });
    expect(result.map((t: any) => t.name)).toEqual(["Home"]);
  });

  it("returns all in orderIndex ascending", async () => {
    ctx.db._seed("testimonials", [
      { name: "Z", role: "x", text: "1", showOnHome: false, orderIndex: 5, createdAt: 1 },
      { name: "A", role: "x", text: "2", showOnHome: false, orderIndex: 1, createdAt: 2 },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result.map((t: any) => t.name)).toEqual(["Z", "A"]);
  });
});

describe("convex/testimonials · create / update / remove", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("create stores with showOnHome=false default", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    expect((await ctx.db.get(id))!.showOnHome).toBe(false);
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    await handler(update)(ctx, { id, name: "X2" });
    expect((await ctx.db.get(id))!.name).toBe("X2");
  });

  it("remove soft-deletes; permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    await handler(remove)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeGreaterThan(0);

    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("restore (root only) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});

describe("convex/testimonials · toggleShowOnHome", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("flips showOnHome and returns new value", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, { name: "X", role: "Y", text: "Z" });
    expect(await handler(toggleShowOnHome)(ctx, { id })).toBe(true);
    expect((await ctx.db.get(id))!.showOnHome).toBe(true);
    expect(await handler(toggleShowOnHome)(ctx, { id })).toBe(false);
  });

  it("rejects when testimonial not found", async () => {
    asRole(ctx, "admin");
    await expect(
      handler(toggleShowOnHome)(ctx, { id: "ghost" as any }),
    ).rejects.toThrow("Not found");
  });
});

describe("convex/testimonials · setTranslations", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("patches both textTranslations and roleTranslations", async () => {
    const [id] = ctx.db._seed("testimonials", [
      { name: "X", role: "Y", text: "Z", showOnHome: false, orderIndex: 1, createdAt: 1 },
    ]);
    await handler(setTranslations)(ctx, {
      id,
      textTranslations: { ptBR: "Z", enUS: "Z-en" },
      roleTranslations: { ptBR: "Y", enUS: "Y-en" },
    });
    const doc = await ctx.db.get(id);
    expect(doc!.textTranslations.enUS).toBe("Z-en");
    expect(doc!.roleTranslations.enUS).toBe("Y-en");
  });
});

describe("convex/testimonials · unpublish", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects non-published submissions", async () => {
    asRole(ctx, "admin");
    const [subId] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "text", status: "approved", createdAt: 1 },
    ]);
    await expect(
      handler(unpublish)(ctx, { submissionId: subId }),
    ).rejects.toThrow(/não está publicado/);
  });

  it("removes the testimonial and reverts submission to approved", async () => {
    asRole(ctx, "admin");
    const [tid] = ctx.db._seed("testimonials", [
      { name: "X", role: "Y", text: "Z", showOnHome: false, orderIndex: 1, createdAt: 1 },
    ]);
    const [subId] = ctx.db._seed("testimonialSubmissions", [
      { name: "X", role: "Y", email: "x@y.com", type: "text", status: "published", testimonialId: tid, createdAt: 1 },
    ]);
    await handler(unpublish)(ctx, { submissionId: subId });
    expect(await ctx.db.get(tid)).toBeNull();
    const sub = await ctx.db.get(subId);
    expect(sub!.status).toBe("approved");
    expect(sub!.testimonialId).toBeUndefined();
  });
});

describe("convex/testimonials · createWithAvatar", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates folder + image metadata then testimonial when avatar provided", async () => {
    asRole(ctx, "admin");
    const id = await handler(createWithAvatar)(ctx, {
      name: "X",
      role: "Y",
      text: "Z",
      avatarStorageId: "storage_1" as any,
      avatarFileSize: 1234,
    });
    const t = await ctx.db.get(id);
    expect(t!.imageId).toBeTruthy();
    const folder = ctx.db._all("imageFolders").find((f) => f.path === "testimonials");
    expect(folder).toBeTruthy();
    const meta = ctx.db._all("imageMetadata")[0];
    expect(meta.storageId).toBe("storage_1");
    expect(meta.fileSize).toBe(1234);
  });

  it("reuses existing folder when present", async () => {
    asRole(ctx, "admin");
    ctx.db._seed("imageFolders", [
      { _id: "folder_1", path: "testimonials", name: "Depoimentos", createdAt: 1 },
    ]);
    await handler(createWithAvatar)(ctx, {
      name: "X",
      role: "Y",
      text: "Z",
      avatarStorageId: "storage_1" as any,
    });
    const folders = ctx.db._all("imageFolders");
    expect(folders).toHaveLength(1);
    expect(folders[0]._id).toBe("folder_1");
  });

  it("creates testimonial without imageId when no avatar", async () => {
    asRole(ctx, "admin");
    const id = await handler(createWithAvatar)(ctx, {
      name: "X",
      role: "Y",
      text: "Z",
    });
    expect((await ctx.db.get(id))!.imageId).toBeUndefined();
  });
});
