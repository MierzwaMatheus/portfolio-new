import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';

export const list = query({
  args: { onlyHome: v.optional(v.boolean()) },
  handler: async (ctx, { onlyHome }) => {
    const items = await ctx.db
      .query('testimonials')
      .withIndex('by_orderIndex')
      .order('asc')
      .collect()
      .then((all) => (onlyHome ? all.filter((t) => t.showOnHome === true) : all));

    return Promise.all(
      items.map(async (t) => ({
        ...t,
        imageUrl: t.imageId
          ? await ctx.db
              .get(t.imageId)
              .then((img) => (img ? ctx.storage.getUrl(img.storageId) : t.imageUrl))
          : t.imageUrl,
      })),
    );
  },
});

export const getById = query({
  args: { id: v.id('testimonials') },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    roleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    text: v.string(),
    textTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const id = await ctx.db.insert('testimonials', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('testimonials'),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    roleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    text: v.optional(v.string()),
    textTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    await markPendingChanges(ctx);
  },
});

export const remove = mutation({
  args: { id: v.id('testimonials') },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
  },
});

export const toggleShowOnHome = mutation({
  args: { id: v.id('testimonials') },
  handler: async (ctx, { id }) => {
    await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');
    await ctx.db.patch(id, { showOnHome: !doc.showOnHome });
    await markPendingChanges(ctx);
    return !doc.showOnHome;
  },
});

export const unpublish = mutation({
  args: { submissionId: v.id('testimonialSubmissions') },
  handler: async (ctx, { submissionId }) => {
    await requireRole(ctx, ['root', 'admin']);
    const submission = await ctx.db.get(submissionId);
    if (!submission) throw new Error('Not found');
    if (submission.status !== 'published') throw new Error('Depoimento não está publicado');

    if (submission.testimonialId) {
      await ctx.db.delete(submission.testimonialId);
    }

    await ctx.db.patch(submissionId, {
      status: 'approved',
      testimonialId: undefined,
    });

    await markPendingChanges(ctx);
  },
});
