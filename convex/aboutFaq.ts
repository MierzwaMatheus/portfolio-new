import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('aboutFaq').withIndex('by_displayOrder').order('asc').collect();
  },
});

export const create = mutation({
  args: {
    question: v.string(),
    questionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    answer: v.string(),
    answerTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const id = await ctx.db.insert('aboutFaq', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('aboutFaq'),
    question: v.optional(v.string()),
    questionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    answer: v.optional(v.string()),
    answerTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await markPendingChanges(ctx);
  },
});

export const remove = mutation({
  args: { id: v.id('aboutFaq') },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
  },
});
