import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { getAuthUserId } from '@convex-dev/auth/server';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const listAllPublished = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isPluginEnabled(ctx, 'blog'))) return [];
    const posts = (await ctx.db
      .query('posts')
      .withIndex('by_status_and_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .collect()).filter((p) => p.deletedAt === undefined);

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        imageUrl: post.imageId
          ? await ctx.db
              .get(post.imageId)
              .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
          : post.imageUrl,
      })),
    );
  },
});

export const listPublished = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'blog'))) {
      return { page: [], isDone: true, continueCursor: '' };
    }
    const result = await ctx.db
      .query('posts')
      .withIndex('by_status_and_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .paginate(args.paginationOpts);

    const nonDeleted = { ...result, page: result.page.filter((p) => p.deletedAt === undefined) };
    const filtered = args.tag
      ? { ...nonDeleted, page: nonDeleted.page.filter((p) => p.tags.includes(args.tag!)) }
      : nonDeleted;

    return {
      ...filtered,
      page: await Promise.all(
        filtered.page.map(async (post) => ({
          ...post,
          imageUrl: post.imageId
            ? await ctx.db
                .get(post.imageId)
                .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
            : post.imageUrl,
        })),
      ),
    };
  },
});

export const listAdmin = query({
  args: { limit: v.optional(v.number()), includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const all = await ctx.db
      .query('posts')
      .withIndex('by_status_and_publishedAt')
      .order('desc')
      .take(args.limit ?? 200);
    const posts = args.includeDeleted ? all : all.filter((p) => p.deletedAt === undefined).slice(0, args.limit ?? 50);

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        imageUrl: post.imageId
          ? await ctx.db
              .get(post.imageId)
              .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
          : post.imageUrl,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'blog'))) return null;
    const post = await ctx.db
      .query('posts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!post || post.deletedAt !== undefined) return null;

    const imageUrl = post.imageId
      ? await ctx.db
          .get(post.imageId)
          .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
      : post.imageUrl;

    return { ...post, imageUrl };
  },
});

export const searchByTitle = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query('posts')
      .withSearchIndex('search_title', (q) =>
        q.search('title', args.query).eq('status', 'published'),
      )
      .take(args.limit ?? 20);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    subtitle: v.optional(v.string()),
    subtitleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    slug: v.string(),
    content: v.string(),
    contentTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    featured: v.boolean(),
    status: v.union(v.literal('draft'), v.literal('published')),
    readTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query('posts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (existing) throw new Error('Slug already in use');

    const now = Date.now();
    const id = await ctx.db.insert('posts', {
      ...args,
      authorId: userId ?? undefined,
      publishedAt: args.status === 'published' ? now : undefined,
      createdAt: now,
    });
    if (args.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId ?? undefined, targetType: 'post', targetId: id, metadata: { label: args.title }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('posts'),
    title: v.optional(v.string()),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    subtitle: v.optional(v.string()),
    subtitleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    contentTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
    readTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    const post = await ctx.db.get(id);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'post', targetId: id, metadata: { label: existing?.title }, success: true });
  },
});

export const publish = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const post = await ctx.db.get(args.id);
    const now = Date.now();
    await ctx.db.patch(args.id, { status: 'published', publishedAt: now, updatedAt: now });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.publish', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

export const unpublish = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const post = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { status: 'draft', updatedAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.unpublish', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const post = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'posts', args.id, userId);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root']);
    const post = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root']);
    const post = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'posts', args.id);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});
