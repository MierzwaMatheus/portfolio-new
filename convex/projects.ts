import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const list = query({
  args: { tag: v.optional(v.string()), includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'portfolio'))) return [];
    const all = await ctx.db
      .query('projects')
      .withIndex('by_orderIndex')
      .order('asc')
      .collect();

    const projects = args.includeDeleted ? all : all.filter((p) => p.deletedAt === undefined);

    const filtered = args.tag
      ? projects.filter((p) => p.tags.includes(args.tag!))
      : projects;

    return Promise.all(
      filtered.map(async (project) => {
        const images: Array<Record<string, unknown>> = [];

        // Add Convex Storage images
        if (project.imageIds && project.imageIds.length > 0) {
          for (const imgId of project.imageIds) {
            const img = await ctx.db.get(imgId);
            if (img) {
              const url = await ctx.storage.getUrl(img.storageId);
              images.push({ ...img, url });
            }
          }
        }

        // Add external URLs directly
        if (project.externalImageUrls && project.externalImageUrls.length > 0) {
          for (const url of project.externalImageUrls) {
            if (typeof url === 'string' && url.trim()) {
              images.push({ url });
            }
          }
        }

        return { ...project, images };
      }),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'portfolio'))) return null;
    const project = await ctx.db
      .query('projects')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!project || project.deletedAt !== undefined) return null;

    const images: Array<Record<string, unknown>> = [];

    if (project.imageIds && project.imageIds.length > 0) {
      for (const imgId of project.imageIds) {
        const img = await ctx.db.get(imgId);
        if (img) {
          const url = await ctx.storage.getUrl(img.storageId);
          images.push({ ...img, url });
        }
      }
    }

    if (project.externalImageUrls && project.externalImageUrls.length > 0) {
      for (const url of project.externalImageUrls) {
        if (typeof url === 'string' && url.trim()) {
          images.push({ url });
        }
      }
    }

    return { ...project, images };
  },
});

export const getById = query({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) return null;

    const images: Array<Record<string, unknown>> = [];

    // Add Convex Storage images
    if (project.imageIds && project.imageIds.length > 0) {
      for (const imgId of project.imageIds) {
        const img = await ctx.db.get(imgId);
        if (img) {
          const url = await ctx.storage.getUrl(img.storageId);
          images.push({ ...img, url });
        }
      }
    }

    // Add external URLs directly
    if (project.externalImageUrls && project.externalImageUrls.length > 0) {
      for (const url of project.externalImageUrls) {
        if (typeof url === 'string' && url.trim()) {
          images.push({ url });
        }
      }
    }

    return {
      ...project,
      images,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    description: v.string(),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    longDescription: v.optional(v.string()),
    longDescriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    tags: v.array(v.string()),
    imageIds: v.array(v.id('imageMetadata')),
    externalImageUrls: v.optional(v.array(v.string())),
    demoLink: v.optional(v.string()),
    githubLink: v.optional(v.string()),
    slug: v.optional(v.string()),
    caseStudy: v.optional(v.object({
      problem: v.string(),
      solution: v.string(),
      results: v.string(),
      metrics: v.array(v.object({ label: v.string(), value: v.string(), icon: v.optional(v.string()) })),
      testimonial: v.optional(v.object({ text: v.string(), author: v.string(), role: v.optional(v.string()) })),
    })),
    caseStudyTranslations: v.optional(v.object({
      ptBR: v.optional(v.object({ problem: v.string(), solution: v.string(), results: v.string() })),
      enUS: v.optional(v.object({ problem: v.string(), solution: v.string(), results: v.string() })),
    })),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'portfolio');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const now = Date.now();
    const id = await ctx.db.insert('projects', { ...args, createdAt: now });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId, targetType: 'project', targetId: id, metadata: { label: args.title }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('projects'),
    title: v.optional(v.string()),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    description: v.optional(v.string()),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    longDescription: v.optional(v.string()),
    longDescriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    tags: v.optional(v.array(v.string())),
    imageIds: v.optional(v.array(v.id('imageMetadata'))),
    externalImageUrls: v.optional(v.array(v.string())),
    demoLink: v.optional(v.string()),
    githubLink: v.optional(v.string()),
    slug: v.optional(v.string()),
    caseStudy: v.optional(v.object({
      problem: v.string(),
      solution: v.string(),
      results: v.string(),
      metrics: v.array(v.object({ label: v.string(), value: v.string(), icon: v.optional(v.string()) })),
      testimonial: v.optional(v.object({ text: v.string(), author: v.string(), role: v.optional(v.string()) })),
    })),
    caseStudyTranslations: v.optional(v.object({
      ptBR: v.optional(v.object({ problem: v.string(), solution: v.string(), results: v.string() })),
      enUS: v.optional(v.object({ problem: v.string(), solution: v.string(), results: v.string() })),
    })),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'portfolio');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'project', targetId: id, metadata: { label: existing?.title }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'portfolio');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'projects', args.id, userId);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'project', targetId: args.id, metadata: { label: existing?.title, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'portfolio');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'project', targetId: args.id, metadata: { label: existing?.title }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'portfolio');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'projects', args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'project', targetId: args.id, metadata: { label: existing?.title }, success: true });
  },
});

export const reorder = mutation({
  args: {
    items: v.array(v.object({ id: v.id('projects'), orderIndex: v.number() })),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'portfolio');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    for (const { id, orderIndex } of args.items) {
      await ctx.db.patch(id, { orderIndex });
    }
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.reorder', actorType: 'user', actorId: userId, targetType: 'project', success: true });
  },
});
