import { describe, it, expect, vi } from "vitest";
import { CreateCustomerUseCase } from "@/usecases/asaas/CreateCustomerUseCase";

function makeApi() {
  return { createCustomer: vi.fn(async (input: any) => ({ id: "c1", ...input })) } as any;
}

const baseInput = {
  name: "Alice",
  cpfCnpj: "123.456.789-09",
  mobilePhone: "11999999999",
};

describe("CreateCustomerUseCase", () => {
  it("rejects when name is empty/whitespace", async () => {
    const uc = new CreateCustomerUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, name: "" })).rejects.toThrow(
      "Nome do cliente é obrigatório",
    );
    await expect(uc.execute({ ...baseInput, name: "   " })).rejects.toThrow(
      "Nome do cliente é obrigatório",
    );
  });

  it("rejects when cpfCnpj is empty", async () => {
    const uc = new CreateCustomerUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, cpfCnpj: "" })).rejects.toThrow(
      "CPF/CNPJ é obrigatório",
    );
  });

  it("rejects when mobilePhone is empty", async () => {
    const uc = new CreateCustomerUseCase(makeApi());
    await expect(
      uc.execute({ ...baseInput, mobilePhone: "" }),
    ).rejects.toThrow("Telefone celular é obrigatório");
  });

  it("rejects when CPF length is not 11 or 14 after digit-only stripping", async () => {
    const uc = new CreateCustomerUseCase(makeApi());
    await expect(uc.execute({ ...baseInput, cpfCnpj: "1234" })).rejects.toThrow(
      "CPF/CNPJ inválido",
    );
    await expect(
      uc.execute({ ...baseInput, cpfCnpj: "12345678901234567" }),
    ).rejects.toThrow("CPF/CNPJ inválido");
  });

  it("strips non-digits from CPF (11 digits) before delegating", async () => {
    const api = makeApi();
    const uc = new CreateCustomerUseCase(api);
    await uc.execute({ ...baseInput, cpfCnpj: "123.456.789-09" });
    expect(api.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ cpfCnpj: "12345678909" }),
    );
  });

  it("strips non-digits from CNPJ (14 digits) before delegating", async () => {
    const api = makeApi();
    const uc = new CreateCustomerUseCase(api);
    await uc.execute({ ...baseInput, cpfCnpj: "12.345.678/0001-90" });
    expect(api.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ cpfCnpj: "12345678000190" }),
    );
  });

  it("returns the API result", async () => {
    const uc = new CreateCustomerUseCase(makeApi());
    const result = await uc.execute(baseInput);
    expect(result).toMatchObject({ id: "c1", name: "Alice" });
  });
});
