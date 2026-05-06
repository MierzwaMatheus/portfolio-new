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

import { requireAuth, getUserRole, requireRole } from "../../convex/auth";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

describe("convex/auth · requireAuth", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("throws when not authenticated", async () => {
    getAuthUserId.mockResolvedValue(null);
    await expect(requireAuth(ctx as any)).rejects.toThrow("Unauthorized");
  });

  it("throws when user document is missing", async () => {
    getAuthUserId.mockResolvedValue("user-1");
    // db has no users
    await expect(requireAuth(ctx as any)).rejects.toThrow("User not found");
  });

  it("returns userId and user when authenticated", async () => {
    const [uid] = ctx.db._seed("users", [
      { _id: "u1", email: "a@b.com", name: "Alice" },
    ]);
    getAuthUserId.mockResolvedValue(uid);
    const result = await requireAuth(ctx as any);
    expect(result.userId).toBe(uid);
    expect(result.user.email).toBe("a@b.com");
  });
});

describe("convex/auth · getUserRole", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("returns null when user has no role assigned", async () => {
    const role = await getUserRole(ctx as any, "ghost" as any);
    expect(role).toBeNull();
  });

  it("returns the assigned role", async () => {
    ctx.db._seed("userRoles", [{ userId: "u1", role: "admin" }]);
    const role = await getUserRole(ctx as any, "u1" as any);
    expect(role).toBe("admin");
  });
});

describe("convex/auth · requireRole", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("throws Unauthorized when not signed in", async () => {
    getAuthUserId.mockResolvedValue(null);
    await expect(
      requireRole(ctx as any, ["root"]),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden when user has no role", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "x@y.com" }]);
    getAuthUserId.mockResolvedValue("u1");
    await expect(
      requireRole(ctx as any, ["root"]),
    ).rejects.toThrow("Forbidden");
  });

  it("throws Forbidden when role is not in the allowed list", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "x@y.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "blog-editor" }]);
    getAuthUserId.mockResolvedValue("u1");
    await expect(
      requireRole(ctx as any, ["root", "admin"]),
    ).rejects.toThrow("Forbidden");
  });

  it("succeeds when user role is in allowed list", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "x@y.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "admin" }]);
    getAuthUserId.mockResolvedValue("u1");
    const result = await requireRole(ctx as any, ["root", "admin"]);
    expect(result.role).toBe("admin");
    expect(result.userId).toBe("u1");
  });

  it("rejects root user when only non-root roles are allowed (no auto-grant)", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "x@y.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "root" }]);
    getAuthUserId.mockResolvedValue("u1");
    await expect(
      requireRole(ctx as any, ["blog-editor"]),
    ).rejects.toThrow("Forbidden");
  });
});
