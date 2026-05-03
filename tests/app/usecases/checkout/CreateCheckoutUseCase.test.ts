import { describe, it, expect, vi } from "vitest";
import { CreateCheckoutUseCase } from "@/usecases/checkout/CreateCheckoutUseCase";

function makeApi() {
  return { createCheckout: vi.fn(async (input: any) => ({ id: "co1", ...input })) } as any;
}

const baseInput = {
  customer_name: "Alice",
  customer_email: "alice@x.com",
  customer_cpf_cnpj: "12345678900",
  customer_mobile_phone: "11999999999",
  value: 100,
  due_date: "2024-12-31",
};

describe("CreateCheckoutUseCase", () => {
  it("rejects empty customer_name", async () => {
    const uc = new CreateCheckoutUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, customer_name: "  " }),
    ).rejects.toThrow("Nome do cliente");
  });

  it("rejects empty customer_cpf_cnpj", async () => {
    const uc = new CreateCheckoutUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, customer_cpf_cnpj: "" }),
    ).rejects.toThrow("CPF/CNPJ");
  });

  it("rejects empty customer_mobile_phone", async () => {
    const uc = new CreateCheckoutUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, customer_mobile_phone: "" }),
    ).rejects.toThrow("Celular");
  });

  it("rejects value <= 0", async () => {
    const uc = new CreateCheckoutUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, value: 0 })).rejects.toThrow(
      "maior que zero",
    );
  });

  it("rejects empty due_date", async () => {
    const uc = new CreateCheckoutUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, due_date: "" }),
    ).rejects.toThrow("Data de vencimento");
  });

  it("rejects description over 500 chars", async () => {
    const uc = new CreateCheckoutUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, description: "x".repeat(501) }),
    ).rejects.toThrow("máximo 500");
  });

  it("delegates to checkoutApi.createCheckout when input is valid", async () => {
    const api = makeApi();
    const uc = new CreateCheckoutUseCase(api);
    await uc.execute(baseInput);
    expect(api.createCheckout).toHaveBeenCalledWith(baseInput);
  });
});
