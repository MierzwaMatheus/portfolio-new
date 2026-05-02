import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireRole } from './auth';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';

export const getByLink = query({
  args: { uniqueLink: v.string() },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'payments'))) return null;
    return ctx.db
      .query('checkouts')
      .withIndex('by_uniqueLink', (q) => q.eq('uniqueLink', args.uniqueLink))
      .unique();
  },
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
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    if (args.status) {
      return ctx.db
        .query('checkouts')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .order('desc')
        .take(args.limit ?? 50);
    }
    return ctx.db.query('checkouts').order('desc').take(args.limit ?? 50);
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

export const updatePayment = mutation({
  args: {
    id: v.id('checkouts'),
    status: v.optional(
      v.union(
        v.literal('payment_selected'),
        v.literal('payment_confirmed'),
        v.literal('paid'),
        v.literal('expired'),
        v.literal('failed'),
      ),
    ),
    paymentMethod: v.optional(v.string()),
    asaasChargeId: v.optional(v.string()),
    pixQrCode: v.optional(v.string()),
    pixQrCodeImage: v.optional(v.string()),
    bankSlipUrl: v.optional(v.string()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const checkout = await ctx.db.get(id);
    if (!checkout) throw new Error('Checkout not found');
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
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

    await ctx.db.delete(args.id);
    await logAudit(ctx, {
      eventType: 'admin.delete',
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
      message: `💰 <b>Pagamento confirmado!</b>\n\nCliente: ${checkout.customerName}\nEmail: ${checkout.customerEmail}\nValor: R$ ${checkout.value.toFixed(2)}\nLink: <code>${checkout.uniqueLink}</code>`,
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
