import { AsaasApi } from '@/services/asaas/AsaasApi';

export class ListCustomersUseCase {
  constructor(private asaasApi: AsaasApi) {}

  async execute(limit: number = 100) {
    return await this.asaasApi.listCustomers(limit);
  }
}
