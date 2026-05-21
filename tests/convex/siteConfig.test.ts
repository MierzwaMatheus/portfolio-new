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

import { getPublic, getByKey } from "../../convex/siteConfig";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/siteConfig · getPublic", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna apenas chaves públicas sem autenticação", async () => {
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "Meu Site", createdAt: 1 },
      { key: "og_image_storage_id", value: "store123", createdAt: 2 },
    ]);
    const result = await handler(getPublic)(ctx, {});
    const keys = result.map((r: any) => r.key);
    expect(keys).toContain("site_title");
    expect(keys).not.toContain("og_image_storage_id");
  });

  it("retorna array vazio quando banco está vazio", async () => {
    const result = await handler(getPublic)(ctx, {});
    expect(result).toEqual([]);
  });

  it("não requer autenticação", async () => {
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "T", createdAt: 1 },
    ]);
    await expect(handler(getPublic)(ctx, {})).resolves.toBeDefined();
  });
});

describe("convex/siteConfig · getByKey", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("lança Unauthorized para chave interna sem autenticação", async () => {
    ctx.db._seed("siteConfig", [
      { key: "og_image_storage_id", value: "s123", createdAt: 1 },
    ]);
    getAuthUserId.mockResolvedValue(null);
    await expect(handler(getByKey)(ctx, { key: "og_image_storage_id" }))
      .rejects.toThrow(/[Uu]nauthorized/);
  });

  it("retorna valor de chave interna quando autenticado", async () => {
    asRole(ctx, "admin");
    ctx.db._seed("siteConfig", [
      { key: "og_image_storage_id", value: "s123", createdAt: 1 },
    ]);
    const result = await handler(getByKey)(ctx, { key: "og_image_storage_id" });
    expect(result?.value).toBe("s123");
  });

  it("retorna chave pública sem autenticação", async () => {
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "Meu Site", createdAt: 1 },
    ]);
    const result = await handler(getByKey)(ctx, { key: "site_title" });
    expect(result?.value).toBe("Meu Site");
  });
});
