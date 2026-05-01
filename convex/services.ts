import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('services').withIndex('by_orderIndex').order('asc').collect();
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
    await requireRole(ctx, ['root', 'admin']);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
  },
});
