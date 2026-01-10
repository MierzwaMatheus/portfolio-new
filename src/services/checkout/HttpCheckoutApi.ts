import { supabase } from '@/lib/supabase';
import { CheckoutApi } from './CheckoutApi';
import { Checkout, CreateCheckoutInput, UpdateCheckoutInput } from '@/types/checkout';

export class HttpCheckoutApi implements CheckoutApi {
  async createCheckout(input: CreateCheckoutInput): Promise<Checkout> {
    const { data, error } = await supabase.functions.invoke('checkout-api', {
      body: { action: 'create_checkout', ...input }
    });

    if (error) throw error;
    return data.data as Checkout;
  }

  async getCheckout(uniqueLink: string): Promise<Checkout | null> {
    const { data, error } = await supabase.functions.invoke('checkout-api', {
      body: { action: 'get_checkout', unique_link: uniqueLink }
    });

    if (error) throw error;
    return data.data as Checkout | null;
  }

  async updateCheckout(id: string, input: UpdateCheckoutInput): Promise<Checkout> {
    const { data, error } = await supabase.functions.invoke('checkout-api', {
      body: { action: 'update_checkout', id, ...input }
    });

    if (error) throw error;
    return data.data as Checkout;
  }

  async listCheckouts(limit: number = 100, status?: string): Promise<Checkout[]> {
    const { data, error } = await supabase.functions.invoke('checkout-api', {
      body: { action: 'list_checkouts', limit, status }
    });

    if (error) throw error;
    return data.data as Checkout[];
  }
}
