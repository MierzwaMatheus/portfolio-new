import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { MutationCtx } from './_generated/server';

export async function markPendingChanges(ctx: MutationCtx) {
  const now = Date.now();
  const existing = await ctx.db.query('deployStatus').first();
  if (existing) {
    await ctx.db.patch(existing._id, {
      pendingChanges: true,
      lastCheckAt: now,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert('deployStatus', {
      pendingChanges: true,
      lastCheckAt: now,
      updatedAt: now,
    });
  }
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('deployStatus').first();
  },
});

export const setPublished = internalMutation({
  args: { triggeredBy: v.optional(v.id('users')) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query('deployStatus').first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        pendingChanges: false,
        lastPublishedAt: now,
        lastTriggeredBy: args.triggeredBy,
        updatedAt: now,
      });
    }
  },
});
