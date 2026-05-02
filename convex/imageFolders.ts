import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';

const EDITOR_ROLES = ['root', 'admin', 'content-editor'] as const;

export const tree = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, [...EDITOR_ROLES]);
    return ctx.db.query('imageFolders').collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id('imageFolders')),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, [...EDITOR_ROLES]);
    let path = args.name.toLowerCase().replace(/\s+/g, '_');

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) throw new Error('Parent folder not found');
      path = `${parent.path}/${path}`;
    }

    const existing = await ctx.db
      .query('imageFolders')
      .withIndex('by_path', (q) => q.eq('path', path))
      .unique();
    if (existing) throw new Error('Folder already exists');

    return ctx.db.insert('imageFolders', {
      name: args.name,
      parentId: args.parentId,
      path,
      createdAt: Date.now(),
      createdBy: userId,
    });
  },
});

export const remove = mutation({
  args: { id: v.id('imageFolders') },
  handler: async (ctx, args) => {
    await requireRole(ctx, [...EDITOR_ROLES]);
    const hasImages = await ctx.db
      .query('imageMetadata')
      .withIndex('by_folderId', (q) => q.eq('folderId', args.id))
      .first();
    if (hasImages) throw new Error('Folder has images. Move them first.');

    const hasChildren = await ctx.db
      .query('imageFolders')
      .withIndex('by_parentId', (q) => q.eq('parentId', args.id))
      .first();
    if (hasChildren) throw new Error('Folder has subfolders.');

    await ctx.db.delete(args.id);
  },
});
