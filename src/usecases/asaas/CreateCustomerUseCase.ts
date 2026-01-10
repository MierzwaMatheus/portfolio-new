import { AsaasApi } from '@/services/asaas/AsaasApi';
import { CreateCustomerInput } from '@/types/asaas';

export class CreateCustomerUseCase {
  constructor(private asaasApi: AsaasApi) {}

  async execute(input: CreateCustomerInput) {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome do cliente é obrigatório');
    }

    if (!input.cpfCnpj || input.cpfCnpj.trim().length === 0) {
      throw new Error('CPF/CNPJ é obrigatório');
    }

    if (!input.mobilePhone || input.mobilePhone.trim().length === 0) {
      throw new Error('Telefone celular é obrigatório');
    }

    const cpfCnpjClean = input.cpfCnpj.replace(/\D/g, '');
    
    if (cpfCnpjClean.length !== 11 && cpfCnpjClean.length !== 14) {
      throw new Error('CPF/CNPJ inválido');
    }

    return await this.asaasApi.createCustomer({
      ...input,
      cpfCnpj: cpfCnpjClean,
    });
  }
}
