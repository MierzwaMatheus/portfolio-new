import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const list = query({
  args: { includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('services').withIndex('by_orderIndex').order('asc').collect();
    return args.includeDeleted ? all : all.filter((s) => s.deletedAt === undefined);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    description: v.string(),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const id = await ctx.db.insert('services', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('services'),
    title: v.optional(v.string()),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    description: v.optional(v.string()),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    await markPendingChanges(ctx);
  },
});

export const remove = mutation({
  args: { id: v.id('services') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'services', args.id, userId);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'service', targetId: args.id, metadata: { label: existing?.title, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('services') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'service', targetId: args.id, metadata: { label: existing?.title }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('services') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'services', args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'service', targetId: args.id, metadata: { label: existing?.title }, success: true });
  },
});
