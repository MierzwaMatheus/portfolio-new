import { CheckoutApi } from '@/services/checkout/CheckoutApi';
import { CreateCheckoutInput } from '@/types/checkout';

export class CreateCheckoutUseCase {
  constructor(private checkoutApi: CheckoutApi) {}

  async execute(input: CreateCheckoutInput) {
    if (!input.customer_name || input.customer_name.trim().length === 0) {
      throw new Error('Nome do cliente é obrigatório');
    }

    if (!input.customer_cpf_cnpj || input.customer_cpf_cnpj.trim().length === 0) {
      throw new Error('CPF/CNPJ é obrigatório');
    }

    if (!input.customer_mobile_phone || input.customer_mobile_phone.trim().length === 0) {
      throw new Error('Celular é obrigatório');
    }

    if (!input.value || input.value <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!input.due_date || input.due_date.trim().length === 0) {
      throw new Error('Data de vencimento é obrigatória');
    }

    if (input.description && input.description.length > 500) {
      throw new Error('Descrição deve ter no máximo 500 caracteres');
    }

    return await this.checkoutApi.createCheckout(input);
  }
}
