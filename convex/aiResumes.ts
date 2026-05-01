import { v } from 'convex/values';
import { internalMutation, query, mutation } from './_generated/server';
import { requireRole } from './auth';

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
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ['root', 'admin']);
    return await ctx.db.query('aiGeneratedResumes').order('desc').collect();
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
    await requireRole(ctx, ['root', 'admin']);
    await ctx.db.delete(args.id);
  },
});
