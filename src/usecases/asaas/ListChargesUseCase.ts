import { AsaasApi } from '@/services/asaas/AsaasApi';

export class ListChargesUseCase {
  constructor(private asaasApi: AsaasApi) {}

  async execute(limit: number = 100) {
    return await this.asaasApi.listCharges(limit);
  }
}
