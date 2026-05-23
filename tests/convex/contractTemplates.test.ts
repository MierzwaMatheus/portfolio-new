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

import { list } from "../../convex/contractTemplates";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

function enablePlugin(ctx: MockCtx, pluginId: string, enabled: boolean) {
  ctx.db._seed("homeContent", [
    { key: `plugin:${pluginId}:enabled`, value: enabled },
  ]);
}

describe("convex/contractTemplates · list", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna array vazio quando plugin contract-templates está desativado", async () => {
    enablePlugin(ctx, "contract-templates", false);
    ctx.db._seed("contractTemplates", [
      {
        _id: "t1",
        name: "Template A",
        content: "Conteúdo",
        isDefault: false,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result).toEqual([]);
  });
});
