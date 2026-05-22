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

import { seedSiteConfig } from "../../convex/seed";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/seed · seedSiteConfig", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("insere todas as chaves de rubricalConfig em banco vazio", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const docs = ctx.db._all("siteConfig");
    expect(docs.length).toBe(17);
  });

  it("chave site_title recebe valor de rubricalConfig.siteName", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const doc = ctx.db._all("siteConfig").find((d) => d.key === "site_title");
    expect(doc?.value).toBe("Portfolio");
  });

  it("chave rss_title recebe valor de rubricalConfig.rssTitle", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const doc = ctx.db._all("siteConfig").find((d) => d.key === "rss_title");
    expect(doc?.value).toBe("Portfolio — Blog");
  });

  it("chave theme_accent_color recebe valor de rubricalConfig.accentColor", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const doc = ctx.db._all("siteConfig").find((d) => d.key === "theme_accent_color");
    expect(doc?.value).toBe("#6366f1");
  });

  it("não insere nem sobrescreve quando banco já está populado (idempotente)", async () => {
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "Existente", createdAt: 1 },
    ]);
    await handler(seedSiteConfig)(ctx, {});
    const docs = ctx.db._all("siteConfig");
    expect(docs.length).toBe(1);
    expect(docs[0].value).toBe("Existente");
  });
});
