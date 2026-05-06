import { describe, it, expect, vi } from "vitest";
import { CreateChargeUseCase } from "@/usecases/asaas/CreateChargeUseCase";

function makeApi() {
  return { createCharge: vi.fn(async (input: any) => ({ id: "ch1", ...input })) } as any;
}

const baseInput = {
  customer: "cus_1",
  value: 100,
  dueDate: "2024-12-31",
  billingType: "PIX",
};

describe("CreateChargeUseCase", () => {
  it("rejects empty customer", async () => {
    const uc = new CreateChargeUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, customer: "" })).rejects.toThrow(
      "Cliente é obrigatório",
    );
  });

  it("rejects zero/negative value", async () => {
    const uc = new CreateChargeUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, value: 0 })).rejects.toThrow(
      "Valor da cobrança",
    );
    await expect(uc.execute({ ...baseInput, value: -1 })).rejects.toThrow(
      "Valor da cobrança",
    );
  });

  it("rejects empty dueDate", async () => {
    const uc = new CreateChargeUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, dueDate: "" })).rejects.toThrow(
      "Data de vencimento",
    );
  });

  it("rejects empty billingType", async () => {
    const uc = new CreateChargeUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, billingType: "" }),
    ).rejects.toThrow("Tipo de cobrança");
  });

  it("rejects description longer than 500 chars", async () => {
    const uc = new CreateChargeUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, description: "x".repeat(501) }),
    ).rejects.toThrow("máximo 500");
  });

  it("generates a 6-digit externalReference when not provided", async () => {
    const api = makeApi();
    const uc = new CreateChargeUseCase(api);
    await uc.execute(baseInput);
    const arg = api.createCharge.mock.calls[0][0];
    expect(arg.externalReference).toMatch(/^\d{6}$/);
  });

  it("preserves provided externalReference", async () => {
    const api = makeApi();
    const uc = new CreateChargeUseCase(api);
    await uc.execute({ ...baseInput, externalReference: "MY_REF_123" });
    expect(api.createCharge).toHaveBeenCalledWith(
      expect.objectContaining({ externalReference: "MY_REF_123" }),
    );
  });
});
