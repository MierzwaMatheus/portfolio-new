import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';

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
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const id = await ctx.db.insert('aboutFaq', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: id, metadata: { label: args.question }, success: true });
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
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: id, metadata: { label: existing?.question }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('aboutFaq') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: args.id, metadata: { label: existing?.question }, success: true });
  },
});
