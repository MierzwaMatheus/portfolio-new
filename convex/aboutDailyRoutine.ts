import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';

export const list = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query('aboutDailyRoutine')
      .withIndex('by_displayOrder')
      .order('asc')
      .collect();

    return Promise.all(
      items.map(async (item) => {
        let image = null;
        if (item.imageId) {
          const img = await ctx.db.get(item.imageId);
          image = img ? { ...img, url: await ctx.storage.getUrl(img.storageId) } : null;
        }
        // Fall back to imageUrl if no Convex Storage image
        const imageUrl = image ? undefined : item.imageUrl;
        return { ...item, image, imageUrl };
      }),
    );
  },
});

export const create = mutation({
  args: {
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    spanSize: v.union(v.literal('1x1'), v.literal('1x2'), v.literal('2x1')),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const id = await ctx.db.insert('aboutDailyRoutine', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('aboutDailyRoutine'),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    spanSize: v.optional(v.union(v.literal('1x1'), v.literal('1x2'), v.literal('2x1'))),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await markPendingChanges(ctx);
  },
});

export const remove = mutation({
  args: { id: v.id('aboutDailyRoutine') },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
  },
});
