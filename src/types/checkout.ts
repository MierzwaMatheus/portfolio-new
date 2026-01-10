export interface Checkout {
  id: string;
  unique_link: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_cpf_cnpj: string;
  customer_mobile_phone: string;
  customer_company: string | null;
  customer_phone: string | null;
  value: number;
  description: string | null;
  due_date: string;
  billing_type: string | null;
  status: CheckoutStatus;
  payment_method: PaymentMethod | null;
  installment_count: number | null;
  installment_value: number | null;
  installment_interest_rate: number | null;
  installment_interest_amount: number | null;
  total_value: number | null;
  pix_qr_code: string | null;
  pix_qr_code_image: string | null;
  bank_slip_url: string | null;
  asaas_charge_id: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export type CheckoutStatus = 
  | 'pending'
  | 'payment_selected'
  | 'payment_confirmed'
  | 'completed'
  | 'expired'
  | 'cancelled';

export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

export interface CreateCheckoutInput {
  customer_id?: string;
  customer_name: string;
  customer_email?: string | null;
  customer_cpf_cnpj: string;
  customer_mobile_phone: string;
  customer_company?: string;
  customer_phone?: string;
  value: number;
  description?: string;
  due_date: string;
  billing_type?: string;
  expires_at?: string;
}

export interface UpdateCheckoutInput {
  status?: CheckoutStatus;
  payment_method?: PaymentMethod;
  installment_count?: number;
  installment_value?: number;
  installment_interest_rate?: number;
  installment_interest_amount?: number;
  total_value?: number;
  pix_qr_code?: string;
  pix_qr_code_image?: string;
  bank_slip_url?: string;
  asaas_charge_id?: string;
  external_reference?: string;
  completed_at?: string;
}

export interface InstallmentOption {
  count: number;
  value: number;
  totalValue: number;
  interestRate?: number;
  interestAmount?: number;
  isInterestFree: boolean;
}

export interface CheckoutApiResponse {
  data: Checkout | Checkout[];
  error?: string;
}
