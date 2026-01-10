import { AsaasApi } from '@/services/asaas/AsaasApi';
import { CreateChargeInput } from '@/types/asaas';

export class CreateChargeUseCase {
  constructor(private asaasApi: AsaasApi) {}

  async execute(input: CreateChargeInput) {
    if (!input.customer || input.customer.trim().length === 0) {
      throw new Error('Cliente é obrigatório');
    }

    if (!input.value || input.value <= 0) {
      throw new Error('Valor da cobrança é obrigatório');
    }

    if (!input.dueDate || input.dueDate.trim().length === 0) {
      throw new Error('Data de vencimento é obrigatória');
    }

    if (!input.billingType || input.billingType.trim().length === 0) {
      throw new Error('Tipo de cobrança é obrigatório');
    }

    if (input.description && input.description.length > 500) {
      throw new Error('Descrição deve ter no máximo 500 caracteres');
    }

    const externalReference = input.externalReference || Math.floor(100000 + Math.random() * 900000).toString();

    return await this.asaasApi.createCharge({
      ...input,
      externalReference,
    });
  }
}
