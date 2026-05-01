import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query('testimonials')
      .withIndex('by_orderIndex')
      .order('asc')
      .collect();

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
