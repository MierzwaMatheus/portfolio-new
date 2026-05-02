import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { AsaasApi } from "./AsaasApi";
import type {
  Customer,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
  Charge,
  ChargeListResponse,
  CreateChargeInput,
  Invoice,
  InvoiceListResponse,
} from "@/types/asaas";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

const NOT_IMPLEMENTED =
  "Funcionalidade ainda não implementada no backend Convex";

/**
 * Convex implementation of AsaasApi.
 *
 * Currently the Convex backend (`convex/asaas.ts`) exposes only the
 * subset of actions used by the public Checkout flow:
 * - `createCustomer`
 * - `createCharge`
 * - `getCharge`
 * - `cancelCharge`
 *
 * Admin-side list/update/delete operations require new Convex actions to
 * be added on the backend before they will work.
 */
export class ConvexAsaasApi implements AsaasApi {
  async listCustomers(_limit: number = 100): Promise<CustomerListResponse> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createCustomer(_input: CreateCustomerInput): Promise<Customer> {
    throw new Error('createCustomer is internal — use checkouts.initiatePayment');
  }

  async getCustomer(_customerId: string): Promise<Customer> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateCustomer(_input: UpdateCustomerInput): Promise<Customer> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async deleteCustomer(_customerId: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async listCharges(_limit: number = 100): Promise<ChargeListResponse> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createCharge(_input: CreateChargeInput): Promise<Charge> {
    throw new Error('createCharge is internal — use checkouts.initiatePayment');
  }

  async getCharge(chargeId: string): Promise<Charge> {
    return (await client.action(api.asaas.getCharge, {
      chargeId,
    } as any)) as unknown as Charge;
  }

  async deleteCharge(chargeId: string): Promise<void> {
    await client.action(api.asaas.cancelCharge, { chargeId } as any);
  }

  async listInvoices(_limit: number = 100): Promise<InvoiceListResponse> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getInvoice(_invoiceId: string): Promise<Invoice> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
