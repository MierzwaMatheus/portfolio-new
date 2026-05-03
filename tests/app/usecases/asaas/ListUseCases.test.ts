import { describe, it, expect, vi } from "vitest";
import { ListCustomersUseCase } from "@/usecases/asaas/ListCustomersUseCase";
import { ListChargesUseCase } from "@/usecases/asaas/ListChargesUseCase";

describe("ListCustomersUseCase", () => {
  it("delegates to api with default limit=100", async () => {
    const api = { listCustomers: vi.fn(async () => ({ data: [] })) } as any;
    await new ListCustomersUseCase(api).execute();
    expect(api.listCustomers).toHaveBeenCalledWith(100);
  });

  it("forwards a custom limit", async () => {
    const api = { listCustomers: vi.fn(async () => ({ data: [] })) } as any;
    await new ListCustomersUseCase(api).execute(25);
    expect(api.listCustomers).toHaveBeenCalledWith(25);
  });

  it("returns whatever the api returns", async () => {
    const api = { listCustomers: vi.fn(async () => ({ data: [{ id: "c1" }] })) } as any;
    const res = await new ListCustomersUseCase(api).execute();
    expect(res).toEqual({ data: [{ id: "c1" }] });
  });
});

describe("ListChargesUseCase", () => {
  it("delegates to api with default limit=100", async () => {
    const api = { listCharges: vi.fn(async () => ({ data: [] })) } as any;
    await new ListChargesUseCase(api).execute();
    expect(api.listCharges).toHaveBeenCalledWith(100);
  });

  it("forwards a custom limit", async () => {
    const api = { listCharges: vi.fn(async () => ({ data: [] })) } as any;
    await new ListChargesUseCase(api).execute(50);
    expect(api.listCharges).toHaveBeenCalledWith(50);
  });
});
