import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth } from './auth';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id('_storage'),
    displayName: v.string(),
    folderId: v.optional(v.id('imageFolders')),
    altText: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireAuth(ctx);
    const now = Date.now();
    return ctx.db.insert('imageMetadata', {
      ...args,
      createdAt: now,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('imageMetadata'),
    displayName: v.optional(v.string()),
    altText: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    folderId: v.optional(v.id('imageFolders')),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id('imageMetadata') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const img = await ctx.db.get(args.id);
    if (!img) throw new Error('Image not found');

    // Check references before deleting
    const projectRef = await ctx.db
      .query('projects')
      .filter((q) => q.eq(q.field('imageIds'), [args.id]))
      .first();
    if (projectRef) throw new Error('Image is referenced by a project');

    await ctx.storage.delete(img.storageId);
    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: {
    folderId: v.optional(v.id('imageFolders')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const images = args.folderId
      ? await ctx.db
          .query('imageMetadata')
          .withIndex('by_folderId', (q) => q.eq('folderId', args.folderId))
          .order('desc')
          .take(args.limit ?? 50)
      : await ctx.db
          .query('imageMetadata')
          .withIndex('by_createdAt')
          .order('desc')
          .take(args.limit ?? 50);

    return Promise.all(
      images.map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
      })),
    );
  },
});

export const getById = query({
  args: { id: v.id('imageMetadata') },
  handler: async (ctx, args) => {
    const img = await ctx.db.get(args.id);
    if (!img) return null;
    return { ...img, url: await ctx.storage.getUrl(img.storageId) };
  },
});
