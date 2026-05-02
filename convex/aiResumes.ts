import { v } from 'convex/values';
import { internalMutation, query, mutation } from './_generated/server';
import { requireRole } from './auth';
import { logAudit } from './audit';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const save = internalMutation({
  args: {
    title: v.string(),
    locale: v.union(v.literal('pt-BR'), v.literal('en-US')),
    jobDescription: v.string(),
    fitScore: v.number(),
    fitComment: v.string(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    cvData: v.any(),
    createdBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('aiGeneratedResumes', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: { includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const all = await ctx.db.query('aiGeneratedResumes').order('desc').collect();
    return args.includeDeleted ? all : all.filter((r) => r.deletedAt === undefined);
  },
});

export const getById = query({
  args: { id: v.id('aiGeneratedResumes') },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id('aiGeneratedResumes') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'aiGeneratedResumes', args.id, userId);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'aiGeneratedResume', targetId: args.id, metadata: { label: existing?.title, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('aiGeneratedResumes') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'aiGeneratedResume', targetId: args.id, metadata: { label: existing?.title }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('aiGeneratedResumes') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'aiGeneratedResumes', args.id);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'aiGeneratedResume', targetId: args.id, metadata: { label: existing?.title }, success: true });
  },
});
