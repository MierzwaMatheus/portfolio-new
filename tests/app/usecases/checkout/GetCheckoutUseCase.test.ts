import { describe, it, expect, vi } from "vitest";
import { GetCheckoutUseCase } from "@/usecases/checkout/GetCheckoutUseCase";

describe("GetCheckoutUseCase", () => {
  it("rejects empty uniqueLink", async () => {
    const uc = new GetCheckoutUseCase({ getCheckout: vi.fn() } as any);
    await expect(uc.execute("")).rejects.toThrow("Link único é obrigatório");
    await expect(uc.execute("   ")).rejects.toThrow("Link único é obrigatório");
  });

  it("throws when checkout is not found", async () => {
    const uc = new GetCheckoutUseCase({
      getCheckout: vi.fn(async () => null),
    } as any);
    await expect(uc.execute("abc")).rejects.toThrow("Checkout não encontrado");
  });

  it("returns the checkout when found", async () => {
    const uc = new GetCheckoutUseCase({
      getCheckout: vi.fn(async () => ({ id: "x", uniqueLink: "abc" })),
    } as any);
    const result = await uc.execute("abc");
    expect(result).toEqual({ id: "x", uniqueLink: "abc" });
  });
});
