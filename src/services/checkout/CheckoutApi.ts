import { Checkout, CreateCheckoutInput, UpdateCheckoutInput } from '@/types/checkout';

export interface CheckoutApi {
  createCheckout(input: CreateCheckoutInput): Promise<Checkout>;
  getCheckout(uniqueLink: string): Promise<Checkout | null>;
  updateCheckout(id: string, input: UpdateCheckoutInput): Promise<Checkout>;
  listCheckouts(limit?: number, status?: string): Promise<Checkout[]>;
}
