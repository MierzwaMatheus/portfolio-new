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

import { getAll } from "../../convex/siteTexts";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/siteTexts · getAll", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("retorna array vazio quando não há registros", async () => {
    const result = await handler(getAll)(ctx, {});
    expect(result).toEqual([]);
  });

  it("retorna todos os registros presentes na tabela", async () => {
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "s2", key: "about.title", page: "about", ptBR: "Sobre", enUS: "About" },
    ]);
    const result = await handler(getAll)(ctx, {});
    expect(result).toHaveLength(2);
    expect(result.map((r: any) => r.key)).toEqual(
      expect.arrayContaining(["home.greeting", "about.title"])
    );
  });
});
