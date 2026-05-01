import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { MutationCtx } from './_generated/server';
import { requireRole } from './auth';

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

export async function logAudit(
  ctx: MutationCtx,
  event: {
    eventType: string;
    actorType: 'user' | 'system' | 'external';
    actorId?: string;
    targetType?: string;
    targetId?: string;
    metadata?: unknown;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  },
) {
  const now = Date.now();
  await ctx.db.insert('auditLog', {
    ...event,
    metadata: event.metadata ?? undefined,
    createdAt: now,
    expiresAt: now + TWO_YEARS_MS,
  });
}

export const recent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root']);
    return ctx.db
      .query('auditLog')
      .withIndex('by_createdAt')
      .order('desc')
      .take(args.limit ?? 50);
  },
});

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('auditLog')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .take(100);
    for (const doc of expired) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: expired.length };
  },
});

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export const anonymizeOldIps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - NINETY_DAYS_MS;
    const old = await ctx.db
      .query('auditLog')
      .withIndex('by_createdAt', (q) => q.lt('createdAt', cutoff))
      .take(200);
    let count = 0;
    for (const doc of old) {
      if (doc.ipAddress && doc.ipAddress !== '0.0.0.0') {
        await ctx.db.patch(doc._id, { ipAddress: '0.0.0.0', userAgent: undefined });
        count++;
      }
    }
    return { anonymized: count };
  },
});
