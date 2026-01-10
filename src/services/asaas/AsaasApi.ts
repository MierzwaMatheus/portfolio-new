import {
  Customer,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
  Charge,
  ChargeListResponse,
  CreateChargeInput,
  Invoice,
  InvoiceListResponse,
} from '@/types/asaas';

export interface AsaasApi {
  listCustomers(limit?: number): Promise<CustomerListResponse>;
  createCustomer(input: CreateCustomerInput): Promise<Customer>;
  getCustomer(customerId: string): Promise<Customer>;
  updateCustomer(input: UpdateCustomerInput): Promise<Customer>;
  deleteCustomer(customerId: string): Promise<void>;
  listCharges(limit?: number): Promise<ChargeListResponse>;
  createCharge(input: CreateChargeInput): Promise<Charge>;
  getCharge(chargeId: string): Promise<Charge>;
  deleteCharge(chargeId: string): Promise<void>;
  listInvoices(limit?: number): Promise<InvoiceListResponse>;
  getInvoice(invoiceId: string): Promise<Invoice>;
}
