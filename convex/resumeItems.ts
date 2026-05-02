import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';

const RESUME_TYPES = ['skill', 'experience', 'education', 'course', 'soft_skill', 'volunteer', 'language'] as const;
type ResumeType = typeof RESUME_TYPES[number];

function resumeItemLabel(type: string, content: Record<string, unknown>): string {
  if (type === 'experience' || type === 'volunteer') return (content.role as string) || (content.text as string) || '';
  if (type === 'education') return (content.degree as string) || '';
  if (type === 'course' || type === 'soft_skill') return (content.text as string) || '';
  return (content.name as string) || '';
}

export const listByType = query({
  args: {
    type: v.union(
      v.literal('skill'),
      v.literal('experience'),
      v.literal('education'),
      v.literal('course'),
      v.literal('soft_skill'),
      v.literal('volunteer'),
      v.literal('language'),
    ),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('resumeItems')
      .withIndex('by_type_and_orderIndex', (q) => q.eq('type', args.type))
      .order('asc')
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('resumeItems').withIndex('by_orderIndex').order('asc').collect();
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal('skill'),
      v.literal('experience'),
      v.literal('education'),
      v.literal('course'),
      v.literal('soft_skill'),
      v.literal('volunteer'),
      v.literal('language'),
    ),
    content: v.any(),
    contentTranslations: v.optional(v.any()),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const id = await ctx.db.insert('resumeItems', {
      ...args,
      createdAt: Date.now(),
    } as Parameters<typeof ctx.db.insert<'resumeItems'>>[1]);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: id, metadata: { type: args.type, label: resumeItemLabel(args.type, args.content as Record<string, unknown>) }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('resumeItems'),
    content: v.optional(v.any()),
    contentTranslations: v.optional(v.any()),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() } as Parameters<typeof ctx.db.patch<'resumeItems'>>[1]);
    await markPendingChanges(ctx);
    const label = existing ? resumeItemLabel(existing.type, existing.content as Record<string, unknown>) : undefined;
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: id, metadata: { type: existing?.type, label }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('resumeItems') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    const label = existing ? resumeItemLabel(existing.type, existing.content as Record<string, unknown>) : undefined;
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: args.id, metadata: { type: existing?.type, label }, success: true });
  },
});

export const reorder = mutation({
  args: {
    items: v.array(v.object({ id: v.id('resumeItems'), orderIndex: v.number() })),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    for (const { id, orderIndex } of args.items) {
      await ctx.db.patch(id, { orderIndex } as Parameters<typeof ctx.db.patch<'resumeItems'>>[1]);
    }
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.reorder', actorType: 'user', actorId: userId, targetType: 'resumeItem', success: true });
  },
});
