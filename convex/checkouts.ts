import { v } from 'convex/values';
import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireRole } from './auth';

function escapeTgHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const getByLink = query({
  args: { uniqueLink: v.string() },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'payments'))) return null;
    const doc = await ctx.db
      .query('checkouts')
      .withIndex('by_uniqueLink', (q) => q.eq('uniqueLink', args.uniqueLink))
      .unique();
    if (!doc) return null;
    // Strip sensitive PII — CPF/CNPJ and phone are not needed client-side
    const { customerCpfCnpj: _cpf, customerMobilePhone: _phone, customerPhone: _phone2, customerCompany: _company, ...safe } = doc;
    return safe;
  },
});

export const _getById = internalQuery({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const listAdmin = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('payment_selected'),
        v.literal('payment_confirmed'),
        v.literal('paid'),
        v.literal('expired'),
        v.literal('failed'),
      ),
    ),
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const all = args.status
      ? await ctx.db
          .query('checkouts')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .order('desc')
          .take(200)
      : await ctx.db.query('checkouts').order('desc').take(200);
    const filtered = args.includeDeleted ? all : all.filter((c) => c.deletedAt === undefined);
    return filtered.slice(0, args.limit ?? 50);
  },
});

export const create = mutation({
  args: {
    uniqueLink: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerCpfCnpj: v.string(),
    customerMobilePhone: v.optional(v.string()),
    customerCompany: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    value: v.number(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    billingType: v.optional(
      v.union(v.literal('PIX'), v.literal('BOLETO'), v.literal('CREDIT_CARD')),
    ),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root', 'admin']);

    const existing = await ctx.db
      .query('checkouts')
      .withIndex('by_uniqueLink', (q) => q.eq('uniqueLink', args.uniqueLink))
      .unique();
    if (existing) throw new Error('Link already in use');

    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const id = await ctx.db.insert('checkouts', {
      ...args,
      status: 'pending',
      expiresAt: args.expiresAt ?? now + THIRTY_DAYS_MS,
      createdAt: now,
    });

    await logAudit(ctx, {
      eventType: 'admin.create',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: id,
      metadata: { label: args.description ?? args.uniqueLink, customerName: args.customerName },
      success: true,
    });

    return id;
  },
});

export const _patchGatewayData = internalMutation({
  args: {
    id: v.id('checkouts'),
    status: v.union(v.literal('payment_selected'), v.literal('payment_confirmed')),
    paymentMethod: v.string(),
    asaasChargeId: v.optional(v.string()),
    pixQrCode: v.optional(v.string()),
    pixQrCodeImage: v.optional(v.string()),
    bankSlipUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const checkout = await ctx.db.get(id);
    if (!checkout) throw new Error('Checkout not found');
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const initiatePayment = action({
  args: {
    id: v.id('checkouts'),
    billingType: v.union(v.literal('PIX'), v.literal('BOLETO'), v.literal('CREDIT_CARD')),
  },
  handler: async (ctx, args): Promise<{
    chargeId: string;
    pixCode: string | undefined;
    invoiceUrl: string | undefined;
    status: string;
  }> => {
    const checkout = await ctx.runQuery(internal.checkouts._getById, { id: args.id });
    if (!checkout) throw new Error('Checkout not found');
    if (checkout.deletedAt) throw new Error('Not found');
    if (checkout.status === 'paid') throw new Error('Already paid');

    // Idempotency: return existing charge data if billing type matches
    if (
      checkout.asaasChargeId &&
      checkout.paymentMethod &&
      checkout.paymentMethod.toUpperCase() === args.billingType
    ) {
      return {
        chargeId: checkout.asaasChargeId,
        pixCode: checkout.pixQrCode ?? undefined,
        invoiceUrl: checkout.bankSlipUrl ?? undefined,
        status: checkout.status,
      };
    }

    const { customerId } = await ctx.runAction(internal.asaas.createCustomer, {
      name: checkout.customerName,
      email: checkout.customerEmail,
      cpfCnpj: checkout.customerCpfCnpj,
      phone: checkout.customerMobilePhone,
    });

    const charge = await ctx.runAction(internal.asaas.createCharge, {
      customerId,
      amountCents: Math.round(checkout.value * 100),
      description: checkout.description ?? `Pagamento - ${checkout.uniqueLink}`,
      billingType: args.billingType,
      dueDate: checkout.dueDate,
      externalReference: checkout.uniqueLink,
    });

    const status = args.billingType === 'CREDIT_CARD' ? 'payment_confirmed' : 'payment_selected';

    await ctx.runMutation(internal.checkouts._patchGatewayData, {
      id: args.id,
      status,
      paymentMethod: args.billingType.toLowerCase(),
      asaasChargeId: charge.chargeId,
      pixQrCode: charge.pixCode,
      bankSlipUrl: charge.invoiceUrl,
    });

    return {
      chargeId: charge.chargeId,
      pixCode: charge.pixCode,
      invoiceUrl: charge.invoiceUrl,
      status,
    };
  },
});

export const remove = mutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const checkout = await ctx.db.get(args.id);
    if (!checkout) throw new Error('Not found');
    if (checkout.status === 'paid') throw new Error('Cannot delete paid checkout');

    await softDeleteDoc(ctx, 'checkouts', args.id, userId);
    await logAudit(ctx, {
      eventType: 'admin.delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: args.id,
      metadata: { label: checkout.description ?? checkout.uniqueLink, customerName: checkout.customerName, softDelete: true },
      success: true,
    });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root']);
    const checkout = await ctx.db.get(args.id);
    if (!checkout) throw new Error('Not found');
    if (checkout.status === 'paid') throw new Error('Cannot delete paid checkout');
    await ctx.db.delete(args.id);
    await logAudit(ctx, {
      eventType: 'admin.permanent_delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: args.id,
      metadata: { label: checkout.description ?? checkout.uniqueLink, customerName: checkout.customerName },
      success: true,
    });
  },
});

export const restore = mutation({
  args: { id: v.id('checkouts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'payments');
    const { userId } = await requireRole(ctx, ['root']);
    const checkout = await ctx.db.get(args.id);
    if (!checkout) throw new Error('Not found');
    await restoreDoc(ctx, 'checkouts', args.id);
    await logAudit(ctx, {
      eventType: 'admin.restore',
      actorType: 'user',
      actorId: userId,
      targetType: 'checkout',
      targetId: args.id,
      metadata: { label: checkout.description ?? checkout.uniqueLink, customerName: checkout.customerName },
      success: true,
    });
  },
});

export const markPaidByLink = internalMutation({
  args: {
    uniqueLink: v.string(),
    asaasChargeId: v.optional(v.string()),
    gatewayData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checkout = await ctx.db
      .query('checkouts')
      .withIndex('by_uniqueLink', (q) => q.eq('uniqueLink', args.uniqueLink))
      .unique();
    if (!checkout || checkout.status === 'paid') return;

    const now = Date.now();
    await ctx.db.patch(checkout._id, {
      status: 'paid',
      asaasChargeId: args.asaasChargeId,
      completedAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.telegram.notifyAdmin, {
      message: `💰 <b>Pagamento confirmado!</b>\n\nCliente: ${escapeTgHtml(checkout.customerName)}\nEmail: ${escapeTgHtml(checkout.customerEmail)}\nValor: R$ ${checkout.value.toFixed(2)}\nLink: <code>${escapeTgHtml(checkout.uniqueLink)}</code>`,
    });
  },
});

export const expireOldCheckouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('checkouts')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .collect();

    for (const checkout of expired) {
      if (checkout.status === 'pending' || checkout.status === 'payment_selected') {
        await ctx.db.patch(checkout._id, { status: 'expired', updatedAt: now });
      }
    }
  },
});
