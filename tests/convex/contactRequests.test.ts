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
  _submitInternal,
  list,
  markRead,
  updateStatus,
  addNote,
} from "../../convex/contactRequests";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asAdmin(ctx: MockCtx, userId = "admin-1") {
  ctx.db._seed("users", [{ _id: userId, email: "a@b.com" }]);
  ctx.db._seed("userRoles", [{ userId, role: "admin" }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

const baseSubmit = {
  type: "project" as const,
  sourceContext: "homepage",
  answers: { projectType: "webapp" },
  contactInfo: {
    name: "Alice",
    email: "ALICE@X.COM",
    phone: "11999",
  },
  ipAddress: "1.2.3.4",
  userAgent: "Mozilla/5.0",
};

describe("convex/contactRequests · _submitInternal", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("normalizes email to lowercase + trim before storing", async () => {
    const result = await handler(_submitInternal)(ctx, {
      ...baseSubmit,
      contactInfo: { ...baseSubmit.contactInfo, email: "  Bob@X.COM  " },
    });
    expect(result.id).toBeTruthy();
    const created = await ctx.db.get(result.id);
    expect(created!.contactInfo.email).toBe("  Bob@X.COM  "); // raw on doc
    // but rate-limit key uses normalized
    const rl = ctx.db._all("rateLimitAttempts");
    expect(rl.find((r) => r.key === "contact_email:bob@x.com")).toBeTruthy();
  });

  it("creates the contact request and schedules notification", async () => {
    await handler(_submitInternal)(ctx, baseSubmit);
    expect(ctx.db._all("contactRequests")).toHaveLength(1);
    expect(ctx.scheduler.runAfter).toHaveBeenCalled();
  });

  it("rate-limits per email after 3 submissions in 24h", async () => {
    for (let i = 0; i < 3; i++) {
      await handler(_submitInternal)(ctx, baseSubmit);
    }
    await expect(handler(_submitInternal)(ctx, baseSubmit)).rejects.toThrow(
      "RATE_LIMITED",
    );
  });

  it("rate-limits per IP after 10 submissions in 1h with different emails", async () => {
    for (let i = 0; i < 10; i++) {
      await handler(_submitInternal)(ctx, {
        ...baseSubmit,
        contactInfo: { ...baseSubmit.contactInfo, email: `user${i}@x.com` },
      });
    }
    await expect(
      handler(_submitInternal)(ctx, {
        ...baseSubmit,
        contactInfo: { ...baseSubmit.contactInfo, email: "fresh@x.com" },
      }),
    ).rejects.toThrow("RATE_LIMITED");
  });

  it("does not apply IP rate-limit when ipAddress is missing", async () => {
    const { ipAddress: _, ...noIp } = baseSubmit;
    void _;
    await handler(_submitInternal)(ctx, noIp);
    const ipBuckets = ctx.db
      ._all("rateLimitAttempts")
      .filter((r) => r.key.startsWith("contact_ip:"));
    expect(ipBuckets).toHaveLength(0);
  });
});

describe("convex/contactRequests · list", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects non-admin callers", async () => {
    await expect(handler(list)(ctx, {})).rejects.toThrow();
  });

  it("filters by status and excludes soft-deleted by default", async () => {
    asAdmin(ctx);
    ctx.db._seed("contactRequests", [
      { type: "project", status: "new", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1 },
      { type: "project", status: "read", contactInfo: { name: "B", email: "b@b.com" }, createdAt: 2, updatedAt: 2 },
      { type: "job", status: "new", contactInfo: { name: "C", email: "c@b.com" }, createdAt: 3, updatedAt: 3, deletedAt: 4 },
    ]);
    const res = await handler(list)(ctx, { status: "new" });
    expect(res).toHaveLength(1);
    expect(res[0].contactInfo.name).toBe("A");
  });

  it("filters by type", async () => {
    asAdmin(ctx);
    ctx.db._seed("contactRequests", [
      { type: "project", status: "new", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1 },
      { type: "job", status: "new", contactInfo: { name: "C", email: "c@b.com" }, createdAt: 2, updatedAt: 2 },
    ]);
    const res = await handler(list)(ctx, { type: "job" });
    expect(res).toHaveLength(1);
    expect(res[0].type).toBe("job");
  });

  it("includes soft-deleted when includeDeleted=true", async () => {
    asAdmin(ctx);
    ctx.db._seed("contactRequests", [
      { type: "project", status: "new", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1, deletedAt: 5 },
    ]);
    const res = await handler(list)(ctx, { includeDeleted: true });
    expect(res).toHaveLength(1);
  });
});

describe("convex/contactRequests · markRead / updateStatus / addNote", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("markRead transitions new → read", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("contactRequests", [
      { type: "project", status: "new", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1 },
    ]);
    await handler(markRead)(ctx, { id });
    expect((await ctx.db.get(id))!.status).toBe("read");
  });

  it("markRead is no-op for already-read", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("contactRequests", [
      { type: "project", status: "read", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1 },
    ]);
    await handler(markRead)(ctx, { id });
    expect((await ctx.db.get(id))!.status).toBe("read");
  });

  it("updateStatus changes status and writes audit log", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("contactRequests", [
      { type: "project", status: "new", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1 },
    ]);
    await handler(updateStatus)(ctx, { id, status: "in_progress" });
    expect((await ctx.db.get(id))!.status).toBe("in_progress");
    expect(ctx.db._all("auditLog").length).toBeGreaterThan(0);
  });

  it("addNote sets adminNotes", async () => {
    asAdmin(ctx);
    const [id] = ctx.db._seed("contactRequests", [
      { type: "project", status: "new", contactInfo: { name: "A", email: "a@b.com" }, createdAt: 1, updatedAt: 1 },
    ]);
    await handler(addNote)(ctx, { id, note: "called client" });
    expect((await ctx.db.get(id))!.adminNotes).toBe("called client");
  });
});
