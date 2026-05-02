import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('homeContent')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('homeContent').collect();
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const now = Date.now();
    const existing = await ctx.db
      .query('homeContent')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: now });
    } else {
      await ctx.db.insert('homeContent', {
        key: args.key,
        value: args.value,
        createdAt: now,
      });
    }
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'homeContent', metadata: { key: args.key }, success: true });
  },
});
