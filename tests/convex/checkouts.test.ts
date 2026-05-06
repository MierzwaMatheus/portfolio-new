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
  getByLink,
  create,
  remove,
  permanentDelete,
  restore,
  markPaidByLink,
  expireOldCheckouts,
  initiatePayment,
  _patchGatewayData,
} from "../../convex/checkouts";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRoot(ctx: MockCtx, userId = "root-1") {
  ctx.db._seed("users", [{ _id: userId, email: "root@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role: "root" }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

const baseArgs = {
  uniqueLink: "abc123",
  customerName: "Alice",
  customerEmail: "alice@x.com",
  customerCpfCnpj: "12345678900",
  customerMobilePhone: "11999999999",
  value: 1000,
  description: "Job Y",
  dueDate: "2024-12-31",
};

describe("convex/checkouts · create", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates with status=pending and 30-day default expiry", async () => {
    asRoot(ctx);
    const before = Date.now();
    const id = await handler(create)(ctx, baseArgs);
    const doc = await ctx.db.get(id);
    expect(doc!.status).toBe("pending");
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(doc!.expiresAt).toBeGreaterThanOrEqual(before + thirtyDays - 5000);
  });

  it("respects custom expiresAt", async () => {
    asRoot(ctx);
    const custom = Date.now() + 1000;
    const id = await handler(create)(ctx, { ...baseArgs, expiresAt: custom });
    const doc = await ctx.db.get(id);
    expect(doc!.expiresAt).toBe(custom);
  });

  it("rejects duplicate uniqueLink", async () => {
    asRoot(ctx);
    await handler(create)(ctx, baseArgs);
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow(
      "Link already in use",
    );
  });

  it("rejects callers without role", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "a@b.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "blog-editor" }]);
    getAuthUserId.mockResolvedValue("u1");
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Forbidden");
  });
});

describe("convex/checkouts · getByLink (PII strip)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("returns null for unknown link", async () => {
    expect(
      await handler(getByLink)(ctx, { uniqueLink: "ghost" }),
    ).toBeNull();
  });

  it("strips CPF/CNPJ, mobilePhone, phone, company from response", async () => {
    ctx.db._seed("checkouts", [
      {
        uniqueLink: "abc",
        customerName: "Alice",
        customerEmail: "alice@x.com",
        customerCpfCnpj: "12345678900",
        customerMobilePhone: "11999999999",
        customerPhone: "1133333333",
        customerCompany: "Acme",
        value: 1000,
        status: "pending",
        dueDate: "2024-12-31",
        createdAt: 1,
        expiresAt: 2,
      },
    ]);
    const result = await handler(getByLink)(ctx, { uniqueLink: "abc" });
    expect(result).not.toBeNull();
    expect(result.customerCpfCnpj).toBeUndefined();
    expect(result.customerMobilePhone).toBeUndefined();
    expect(result.customerPhone).toBeUndefined();
    expect(result.customerCompany).toBeUndefined();
    expect(result.customerName).toBe("Alice");
    expect(result.customerEmail).toBe("alice@x.com");
  });
});

describe("convex/checkouts · remove / permanentDelete / restore", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("remove soft-deletes a non-paid checkout", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    const doc = await ctx.db.get(id);
    expect(doc!.deletedAt).toBeGreaterThan(0);
  });

  it("remove rejects paid checkouts", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await ctx.db.patch(id, { status: "paid" });
    await expect(handler(remove)(ctx, { id })).rejects.toThrow(
      "Cannot delete paid checkout",
    );
  });

  it("permanentDelete removes when not paid", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(permanentDelete)(ctx, { id });
    expect(await ctx.db.get(id)).toBeNull();
  });

  it("permanentDelete rejects paid", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await ctx.db.patch(id, { status: "paid" });
    await expect(
      handler(permanentDelete)(ctx, { id }),
    ).rejects.toThrow("Cannot delete paid checkout");
  });

  it("restore clears deletedAt", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});

describe("convex/checkouts · markPaidByLink", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("transitions to paid and schedules notification", async () => {
    const [id] = ctx.db._seed("checkouts", [
      {
        uniqueLink: "p1",
        customerName: "X",
        customerEmail: "x@y.com",
        customerCpfCnpj: "0",
        value: 100,
        status: "pending",
        dueDate: "2024-12-31",
        createdAt: 1,
        expiresAt: 9_999_999_999_999,
      },
    ]);
    await handler(markPaidByLink)(ctx, {
      uniqueLink: "p1",
      asaasChargeId: "ch_123",
    });
    const doc = await ctx.db.get(id);
    expect(doc!.status).toBe("paid");
    expect(doc!.asaasChargeId).toBe("ch_123");
    expect(doc!.completedAt).toBeGreaterThan(0);
    expect(ctx.scheduler.runAfter).toHaveBeenCalled();
  });

  it("is no-op when checkout not found", async () => {
    await expect(
      handler(markPaidByLink)(ctx, { uniqueLink: "ghost" }),
    ).resolves.toBeUndefined();
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it("is no-op when already paid", async () => {
    ctx.db._seed("checkouts", [
      {
        uniqueLink: "p2",
        customerName: "X",
        customerEmail: "x@y.com",
        customerCpfCnpj: "0",
        value: 100,
        status: "paid",
        dueDate: "2024-12-31",
        createdAt: 1,
        expiresAt: 1,
      },
    ]);
    await handler(markPaidByLink)(ctx, { uniqueLink: "p2" });
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });
});

describe("convex/checkouts · expireOldCheckouts", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("expires only pending and payment_selected past their expiresAt", async () => {
    const past = Date.now() - 10_000;
    const future = Date.now() + 10_000;
    ctx.db._seed("checkouts", [
      { uniqueLink: "a", status: "pending", expiresAt: past, customerName: "x", customerEmail: "x@y.com", customerCpfCnpj: "0", value: 1, dueDate: "2024-01-01", createdAt: 1 },
      { uniqueLink: "b", status: "payment_selected", expiresAt: past, customerName: "x", customerEmail: "x@y.com", customerCpfCnpj: "0", value: 1, dueDate: "2024-01-01", createdAt: 1 },
      { uniqueLink: "c", status: "paid", expiresAt: past, customerName: "x", customerEmail: "x@y.com", customerCpfCnpj: "0", value: 1, dueDate: "2024-01-01", createdAt: 1 },
      { uniqueLink: "d", status: "pending", expiresAt: future, customerName: "x", customerEmail: "x@y.com", customerCpfCnpj: "0", value: 1, dueDate: "2024-01-01", createdAt: 1 },
    ]);
    await handler(expireOldCheckouts)(ctx, {});
    const all = ctx.db._all("checkouts");
    const byLink = (link: string) => all.find((c) => c.uniqueLink === link)!;
    expect(byLink("a").status).toBe("expired");
    expect(byLink("b").status).toBe("expired");
    expect(byLink("c").status).toBe("paid"); // unchanged
    expect(byLink("d").status).toBe("pending"); // not yet expired
  });
});

describe("convex/checkouts · initiatePayment", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    ctx.runQuery = vi.fn();
    ctx.runAction = vi.fn();
    ctx.runMutation = vi.fn().mockResolvedValue(undefined);
  });

  it("rejects when checkout not found", async () => {
    ctx.runQuery.mockResolvedValue(null);
    await expect(
      handler(initiatePayment)(ctx, { id: "x" as any, billingType: "PIX" }),
    ).rejects.toThrow("not found");
  });

  it("rejects when soft-deleted", async () => {
    ctx.runQuery.mockResolvedValue({ deletedAt: 1 });
    await expect(
      handler(initiatePayment)(ctx, { id: "x" as any, billingType: "PIX" }),
    ).rejects.toThrow("Not found");
  });

  it("rejects when already paid", async () => {
    ctx.runQuery.mockResolvedValue({ status: "paid" });
    await expect(
      handler(initiatePayment)(ctx, { id: "x" as any, billingType: "PIX" }),
    ).rejects.toThrow("Already paid");
  });

  it("returns existing charge data when paymentMethod matches (idempotency)", async () => {
    ctx.runQuery.mockResolvedValue({
      status: "payment_selected",
      asaasChargeId: "ch_existing",
      paymentMethod: "pix",
      pixQrCode: "qr",
      bankSlipUrl: undefined,
    });
    const result = await handler(initiatePayment)(ctx, {
      id: "x" as any,
      billingType: "PIX",
    });
    expect(result.chargeId).toBe("ch_existing");
    expect(result.pixCode).toBe("qr");
    expect(ctx.runAction).not.toHaveBeenCalled();
  });

  it("calls Asaas to create customer + charge and patches gateway data", async () => {
    ctx.runQuery.mockResolvedValue({
      status: "pending",
      customerName: "X",
      customerEmail: "x@y.com",
      customerCpfCnpj: "00000000000",
      customerMobilePhone: "1199",
      value: 1000,
      description: "test",
      dueDate: "2024-12-31",
      uniqueLink: "abc",
    });
    ctx.runAction
      .mockResolvedValueOnce({ customerId: "cust_1" })
      .mockResolvedValueOnce({ chargeId: "ch_new", pixCode: "qrx", invoiceUrl: undefined });

    const result = await handler(initiatePayment)(ctx, {
      id: "x" as any,
      billingType: "PIX",
    });

    expect(ctx.runAction).toHaveBeenCalledTimes(2);
    expect(ctx.runMutation).toHaveBeenCalled();
    const patchArgs = ctx.runMutation.mock.calls[0][1];
    expect(patchArgs.asaasChargeId).toBe("ch_new");
    expect(patchArgs.paymentMethod).toBe("pix");
    expect(result.status).toBe("payment_selected");
  });

  it("CREDIT_CARD billing transitions to payment_confirmed immediately", async () => {
    ctx.runQuery.mockResolvedValue({
      status: "pending",
      customerName: "X",
      customerEmail: "x@y.com",
      customerCpfCnpj: "0",
      value: 50,
      dueDate: "2024-12-31",
      uniqueLink: "abc",
    });
    ctx.runAction
      .mockResolvedValueOnce({ customerId: "c" })
      .mockResolvedValueOnce({ chargeId: "ch", pixCode: undefined, invoiceUrl: undefined });

    const result = await handler(initiatePayment)(ctx, {
      id: "x" as any,
      billingType: "CREDIT_CARD",
    });
    expect(result.status).toBe("payment_confirmed");
  });
});

describe("convex/checkouts · _patchGatewayData", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("rejects when checkout missing", async () => {
    await expect(
      handler(_patchGatewayData)(ctx, {
        id: "ghost" as any,
        status: "payment_selected",
        paymentMethod: "pix",
      }),
    ).rejects.toThrow("Checkout not found");
  });

  it("patches status, paymentMethod, gateway fields", async () => {
    const [id] = ctx.db._seed("checkouts", [
      {
        uniqueLink: "x",
        customerName: "x",
        customerEmail: "x@y.com",
        customerCpfCnpj: "0",
        value: 100,
        status: "pending",
        dueDate: "2024-12-31",
        createdAt: 1,
        expiresAt: 1,
      },
    ]);
    await handler(_patchGatewayData)(ctx, {
      id: id as any,
      status: "payment_confirmed",
      paymentMethod: "credit_card",
      asaasChargeId: "ch1",
      pixQrCode: undefined,
      bankSlipUrl: undefined,
    });
    const doc = await ctx.db.get(id);
    expect(doc!.status).toBe("payment_confirmed");
    expect(doc!.paymentMethod).toBe("credit_card");
    expect(doc!.asaasChargeId).toBe("ch1");
  });
});
