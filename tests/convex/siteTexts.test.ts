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

import { getAll, getByPage, seed } from "../../convex/siteTexts";
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

describe("convex/siteTexts · getByPage", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("siteTexts", [
      { _id: "s1", key: "home.greeting", page: "home", ptBR: "Olá", enUS: "Hello" },
      { _id: "s2", key: "home.title", page: "home", ptBR: "Título", enUS: "Title" },
      { _id: "s3", key: "about.title", page: "about", ptBR: "Sobre", enUS: "About" },
    ]);
  });

  it("retorna apenas os registros da página solicitada", async () => {
    const result = await handler(getByPage)(ctx, { page: "home" });
    expect(result).toHaveLength(2);
    expect(result.every((r: any) => r.page === "home")).toBe(true);
  });

  it("retorna array vazio para página sem registros", async () => {
    const result = await handler(getByPage)(ctx, { page: "blog" });
    expect(result).toEqual([]);
  });
});

describe("convex/siteTexts · seed", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("popula a tabela com todas as chaves dos arquivos de tradução (245 chaves)", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("siteTexts");
    expect(docs.length).toBe(245);
  });

  it("é idempotente — rodar duas vezes não duplica registros", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("siteTexts");
    expect(docs.length).toBe(245);
  });

  it("cada registro tem key em dot-notation e page igual ao primeiro segmento", async () => {
    await handler(seed)(ctx, {});
    const homeGreeting = ctx.db._all("siteTexts").find((d: any) => d.key === "home.greeting");
    expect(homeGreeting).toBeDefined();
    expect(homeGreeting?.page).toBe("home");
    expect(homeGreeting?.ptBR).toBeTruthy();
  });
});
