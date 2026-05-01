import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole, getUserRole } from './auth';
import { logAudit } from './audit';
import { getAuthUserId } from '@convex-dev/auth/server';

/** Returns true when no root user exists — used to show first-time setup UI. */
export const isSetupRequired = query({
  args: {},
  handler: async (ctx) => {
    const root = await ctx.db
      .query('userRoles')
      .withIndex('by_role', (q) => q.eq('role', 'root'))
      .first();
    return root === null;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ['root']);
    const users = await ctx.db.query('users').take(100);
    return Promise.all(
      users.map(async (user) => ({
        ...user,
        role: await getUserRole(ctx, user._id),
      })),
    );
  },
});

export const getMyRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return getUserRole(ctx, userId);
  },
});

export const assignRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(
      v.literal('root'),
      v.literal('admin'),
      v.literal('proposal-editor'),
    ),
  },
  handler: async (ctx, args) => {
    const { userId: actorId } = await requireRole(ctx, ['root']);

    const existing = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
    } else {
      await ctx.db.insert('userRoles', {
        userId: args.userId,
        role: args.role,
        createdAt: Date.now(),
        createdBy: actorId,
      });
    }

    await logAudit(ctx, {
      eventType: 'user.role_assigned',
      actorType: 'user',
      actorId: actorId,
      targetType: 'user',
      targetId: args.userId,
      metadata: { role: args.role },
      success: true,
    });
  },
});

export const removeRole = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const { userId: actorId } = await requireRole(ctx, ['root']);

    const existing = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await logAudit(ctx, {
        eventType: 'user.role_removed',
        actorType: 'user',
        actorId: actorId,
        targetType: 'user',
        targetId: args.userId,
        success: true,
      });
    }
  },
});

/**
 * Promotes the currently authenticated user to root.
 * Only works when no root exists yet (first-time setup).
 * Call this right after the first signIn via the setup form.
 */
export const bootstrapRootUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRoot = await ctx.db
      .query('userRoles')
      .withIndex('by_role', (q) => q.eq('role', 'root'))
      .first();
    if (existingRoot) throw new Error('Root user already exists');

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.insert('userRoles', {
      userId,
      role: 'root',
      createdAt: Date.now(),
    });

    return { userId };
  },
});
