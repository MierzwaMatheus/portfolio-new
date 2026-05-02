import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';

// Asaas integration stubs — replace with real Asaas API calls when ready

export const createCustomer = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    cpfCnpj: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ customerId: string }> => {
    // TODO: call Asaas API POST /api/v3/customers
    console.log('[asaas stub] createCustomer', args.name, args.email);
    return { customerId: `cus_stub_${Date.now()}` };
  },
});

export const createCharge = internalAction({
  args: {
    customerId: v.string(),
    amountCents: v.number(),
    description: v.string(),
    billingType: v.union(v.literal('BOLETO'), v.literal('CREDIT_CARD'), v.literal('PIX')),
    dueDate: v.string(),
    externalReference: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ chargeId: string; invoiceUrl: string; pixCode: string | undefined }> => {
    // TODO: call Asaas API POST /api/v3/payments
    console.log('[asaas stub] createCharge', args.customerId, args.amountCents);
    return {
      chargeId: `pay_stub_${Date.now()}`,
      invoiceUrl: `https://www.asaas.com/i/stub${Date.now()}`,
      pixCode: args.billingType === 'PIX' ? `00020101...stub` : undefined,
    };
  },
});

export const cancelCharge = action({
  args: { chargeId: v.string() },
  handler: async (_ctx, args): Promise<void> => {
    // TODO: call Asaas API DELETE /api/v3/payments/{id}
    console.log('[asaas stub] cancelCharge', args.chargeId);
  },
});

export const getCharge = action({
  args: { chargeId: v.string() },
  handler: async (_ctx, args): Promise<{ status: string }> => {
    // TODO: call Asaas API GET /api/v3/payments/{id}
    console.log('[asaas stub] getCharge', args.chargeId);
    return { status: 'PENDING' };
  },
});
