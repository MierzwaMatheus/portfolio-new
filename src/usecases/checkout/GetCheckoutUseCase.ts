import { CheckoutApi } from '@/services/checkout/CheckoutApi';

export class GetCheckoutUseCase {
  constructor(private checkoutApi: CheckoutApi) {}

  async execute(uniqueLink: string) {
    if (!uniqueLink || uniqueLink.trim().length === 0) {
      throw new Error('Link único é obrigatório');
    }

    const checkout = await this.checkoutApi.getCheckout(uniqueLink);

    if (!checkout) {
      throw new Error('Checkout não encontrado');
    }

    return checkout;
  }
}
