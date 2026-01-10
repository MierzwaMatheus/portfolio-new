import { supabase } from '@/lib/supabase';
import {
  AsaasApi,
} from './AsaasApi';
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

export class HttpAsaasApi implements AsaasApi {
  async listCustomers(limit: number = 100): Promise<CustomerListResponse> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'list_customers', limit }
    });

    if (error) throw error;
    return data.data as CustomerListResponse;
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'create_customer', ...input }
    });

    if (error) throw error;
    return data.data as Customer;
  }

  async getCustomer(customerId: string): Promise<Customer> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'get_customer', customer_id: customerId }
    });

    if (error) throw error;
    return data.data as Customer;
  }

  async updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'update_customer', ...input }
    });

    if (error) throw error;
    return data.data as Customer;
  }

  async deleteCustomer(customerId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'delete_customer', customer_id: customerId }
    });

    if (error) throw error;
  }

  async listCharges(limit: number = 100): Promise<ChargeListResponse> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'list_charges', limit }
    });

    if (error) throw error;
    return data.data as ChargeListResponse;
  }

  async createCharge(input: CreateChargeInput): Promise<Charge> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'create_charge', ...input }
    });

    if (error) throw error;
    return data.data as Charge;
  }

  async getCharge(chargeId: string): Promise<Charge> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'get_charge', charge_id: chargeId }
    });

    if (error) throw error;
    return data.data as Charge;
  }

  async deleteCharge(chargeId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'delete_charge', charge_id: chargeId }
    });

    if (error) throw error;
  }

  async listInvoices(limit: number = 100): Promise<InvoiceListResponse> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'list_invoices', limit }
    });

    if (error) throw error;
    return data.data as InvoiceListResponse;
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const { data, error } = await supabase.functions.invoke('asaas-api', {
      body: { action: 'get_invoice', invoice_id: invoiceId }
    });

    if (error) throw error;
    return data.data as Invoice;
  }
}
