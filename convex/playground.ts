import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { MutationCtx } from './_generated/server';
import { requireRole } from './auth';
import { checkRateLimit, recordRateLimitAttempt } from './rateLimit';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function insertLog(
  ctx: MutationCtx,
  args: {
    sessionId: string;
    eventType: string;
    metadata?: unknown;
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const now = Date.now();
  await ctx.db.insert('playgroundAuditLog', {
    sessionId: args.sessionId,
    eventType: args.eventType,
    metadata: args.metadata,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    success: true,
    createdAt: now,
    expiresAt: now + THIRTY_DAYS_MS,
  });
}

export const logEvent = mutation({
  args: {
    sessionId: v.string(),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identifier = args.ipAddress ?? args.sessionId;
    const { allowed, blockedUntil } = await checkRateLimit(ctx, 'playground_log', identifier);
    if (!allowed) {
      throw new Error(`RATE_LIMITED:${blockedUntil ?? 0}`);
    }
    await recordRateLimitAttempt(ctx, 'playground_log', identifier);
    await insertLog(ctx, args);
  },
});

export const checkAndRecordAiRateLimit = internalMutation({
  args: { ip: v.string() },
  handler: async (ctx, { ip }) => {
    const { allowed, blockedUntil } = await checkRateLimit(ctx, 'playground_ai', ip);
    if (!allowed) return { allowed: false, blockedUntil };
    await recordRateLimitAttempt(ctx, 'playground_ai', ip);
    return { allowed: true };
  },
});

export const internalLogEvent = internalMutation({
  args: {
    sessionId: v.string(),
    eventType: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await insertLog(ctx, args);
  },
});

export const getLogs = query({
  args: {
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root']);

    const logs = await ctx.db
      .query('playgroundAuditLog')
      .withIndex('by_createdAt')
      .order('desc')
      .take(500);

    return logs
      .filter((l) => !args.eventType || l.eventType === args.eventType)
      .filter((l) => !args.sessionId || l.sessionId === args.sessionId)
      .slice(0, args.limit ?? 100);
  },
});

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('playgroundAuditLog')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .take(100);
    for (const doc of expired) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: expired.length };
  },
});
