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
  logAudit,
  recent,
  cleanupExpired,
  anonymizeOldIps,
  listSoftDeleted,
} from "../../convex/audit";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRoot(ctx: MockCtx, userId = "root-1") {
  ctx.db._seed("users", [{ _id: userId, email: "root@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role: "root" }]);
  getAuthUserId.mockResolvedValue(userId);
}

describe("convex/audit · logAudit", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("inserts an auditLog with createdAt and 2-year expiresAt", async () => {
    const before = Date.now();
    await logAudit(ctx as any, {
      eventType: "test.event",
      actorType: "user",
      actorId: "u1",
      success: true,
    });
    const all = ctx.db._all("auditLog");
    expect(all).toHaveLength(1);
    expect(all[0].createdAt).toBeGreaterThanOrEqual(before);
    const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
    expect(all[0].expiresAt - all[0].createdAt).toBeCloseTo(twoYears, -3);
  });

  it("preserves all event fields including metadata", async () => {
    await logAudit(ctx as any, {
      eventType: "x",
      actorType: "external",
      targetType: "post",
      targetId: "p1",
      metadata: { foo: "bar" },
      ipAddress: "1.2.3.4",
      userAgent: "ua",
      success: false,
    });
    const entry = ctx.db._all("auditLog")[0];
    expect(entry).toMatchObject({
      eventType: "x",
      actorType: "external",
      targetType: "post",
      targetId: "p1",
      success: false,
      ipAddress: "1.2.3.4",
      userAgent: "ua",
    });
    expect(entry.metadata).toEqual({ foo: "bar" });
  });
});

describe("convex/audit · recent", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects non-root callers", async () => {
    await expect(handler(recent)(ctx, {})).rejects.toThrow();
  });

  it("filters by eventType and resolves actor email", async () => {
    asRoot(ctx);
    ctx.db._seed("users", [{ _id: "u-actor", email: "actor@x.com" }]);
    ctx.db._seed("auditLog", [
      { eventType: "admin.create", actorType: "user", actorId: "u-actor", createdAt: 1, expiresAt: 9, success: true },
      { eventType: "admin.delete", actorType: "user", actorId: "u-actor", createdAt: 2, expiresAt: 9, success: true },
    ]);
    const result = await handler(recent)(ctx, { eventType: "admin.create" });
    expect(result).toHaveLength(1);
    expect(result[0].actorEmail).toBe("actor@x.com");
  });

  it("returns [] when audit-log plugin disabled", async () => {
    asRoot(ctx);
    ctx.db._seed("homeContent", [
      { key: "plugin:audit-log:enabled", value: false, createdAt: 1 },
    ]);
    expect(await handler(recent)(ctx, {})).toEqual([]);
  });

  it("filters by targetType", async () => {
    asRoot(ctx);
    ctx.db._seed("auditLog", [
      { eventType: "x", actorType: "system", targetType: "post", createdAt: 1, expiresAt: 9, success: true },
      { eventType: "x", actorType: "system", targetType: "user", createdAt: 2, expiresAt: 9, success: true },
    ]);
    const result = await handler(recent)(ctx, { targetType: "user" });
    expect(result).toHaveLength(1);
    expect(result[0].targetType).toBe("user");
  });
});

describe("convex/audit · listSoftDeleted", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("returns only delete events flagged with metadata.softDelete=true", async () => {
    asRoot(ctx);
    ctx.db._seed("auditLog", [
      { eventType: "admin.delete", actorType: "user", targetType: "post", targetId: "p1", metadata: { softDelete: true }, createdAt: 1, expiresAt: 9, success: true },
      { eventType: "admin.delete", actorType: "user", targetType: "post", targetId: "p2", metadata: { softDelete: false }, createdAt: 2, expiresAt: 9, success: true },
      { eventType: "admin.update", actorType: "user", createdAt: 3, expiresAt: 9, success: true },
    ]);
    const result = await handler(listSoftDeleted)(ctx, {});
    expect(result).toHaveLength(1);
    expect(result[0].targetId).toBe("p1");
  });
});

describe("convex/audit · cleanupExpired / anonymizeOldIps", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("cleanupExpired removes only entries with expiresAt < now", async () => {
    const now = Date.now();
    ctx.db._seed("auditLog", [
      { eventType: "x", actorType: "system", success: true, createdAt: 1, expiresAt: now - 1000 },
      { eventType: "x", actorType: "system", success: true, createdAt: 1, expiresAt: now + 1000 },
    ]);
    const result = await handler(cleanupExpired)(ctx, {});
    expect(result.deleted).toBe(1);
    expect(ctx.db._all("auditLog")).toHaveLength(1);
  });

  it("anonymizeOldIps replaces ipAddress on logs older than 90 days", async () => {
    const cutoff = Date.now() - 91 * 24 * 60 * 60 * 1000;
    ctx.db._seed("auditLog", [
      { eventType: "x", actorType: "system", success: true, createdAt: cutoff - 1000, expiresAt: 9_999_999_999_999, ipAddress: "1.2.3.4", userAgent: "ua" },
      { eventType: "x", actorType: "system", success: true, createdAt: Date.now(), expiresAt: 9_999_999_999_999, ipAddress: "5.6.7.8" },
      { eventType: "x", actorType: "system", success: true, createdAt: cutoff - 2000, expiresAt: 9_999_999_999_999, ipAddress: "0.0.0.0" },
    ]);
    const result = await handler(anonymizeOldIps)(ctx, {});
    expect(result.anonymized).toBe(1);
    const all = ctx.db._all("auditLog");
    const anonymized = all.find((a) => a.createdAt === cutoff - 1000);
    expect(anonymized!.ipAddress).toBe("0.0.0.0");
    expect(anonymized!.userAgent).toBeUndefined();
  });
});
