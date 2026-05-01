/**
 * CSV import via HTTP action.
 *
 * Export tables from Supabase as CSV (Table Editor → Export → CSV).
 * Then POST each file:
 *
 *   curl -X POST https://precise-husky-581.convex.site/import/projects \
 *     -H "x-import-secret: YOUR_IMPORT_SECRET" \
 *     -H "Content-Type: text/csv" \
 *     --data-binary @projects.csv
 *
 * Set IMPORT_SECRET via: npx convex env set IMPORT_SECRET <random-string>
 *
 * Supported tables: projects, posts, services, faq, contact_info
 */

import { internalMutation } from './_generated/server';
import { type ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// ─── CSV parser — handles multiline quoted fields correctly ──────────────────

function parseCsv(text: string): Record<string, string>[] {
  // Normalize line endings
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Parse the entire text char-by-char so embedded newlines inside quoted
  // fields don't prematurely split a row.
  const allRows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (ch === '"') {
      if (inQuotes && src[i + 1] === '"') {
        // Escaped quote ""
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      currentRow.push(field);
      field = '';
    } else if (ch === '\n' && !inQuotes) {
      // End of row
      currentRow.push(field);
      field = '';
      // Skip empty lines (e.g. trailing newline at end of file)
      if (currentRow.some((f) => f !== '')) {
        allRows.push(currentRow);
      }
      currentRow = [];
    } else {
      field += ch;
    }
  }
  // Flush last field/row
  if (field !== '' || currentRow.length > 0) {
    currentRow.push(field);
    if (currentRow.some((f) => f !== '')) allRows.push(currentRow);
  }

  if (allRows.length < 2) return [];

  const headers = allRows[0].map((h) => h.trim());
  return allRows.slice(1).map((vals) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
    return row;
  });
}

function s(v: string | undefined, fallback = ''): string { return v ?? fallback; }
function n(v: string | undefined, fallback = 0): number { return v ? Number(v) : fallback; }
function b(v: string | undefined): boolean { return v === 'true' || v === '1' || v === 't'; }
function arr(v: string | undefined): string[] {
  if (!v) return [];
  // Postgres array format: {a,b,c} or JSON ["a","b"]
  const trimmed = v.replace(/^\{/, '[').replace(/\}$/, ']').replace(/^\[/, '[');
  try { return JSON.parse(trimmed.startsWith('[') ? trimmed : `[${trimmed}]`); } catch { return []; }
}

// Parse Supabase translation JSON {"en-US":"...", "pt-BR":"..."} → {ptBR, enUS}
function i18n(raw: string | undefined): { ptBR: string; enUS?: string } | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, string | null>;
    const ptBR = (parsed['pt-BR'] ?? '').trim();
    const enUSRaw = parsed['en-US'];
    const enUS = enUSRaw ? enUSRaw.trim() : undefined;
    if (!ptBR && !enUS) return undefined;
    return enUS ? { ptBR, enUS } : { ptBR };
  } catch { return undefined; }
}

// Parse resume content_translations — CSV format: {"en-US":{...}, "pt-BR":{...}}
// Returns the correct Convex structure per type.
function resumeTextTrans(raw: string | undefined): { ptBR: string; enUS?: string } | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, string> | null>;
    const ptBR = (parsed['pt-BR']?.text ?? '').trim();
    const enUS = parsed['en-US']?.text?.trim();
    if (!ptBR && !enUS) return undefined;
    return enUS ? { ptBR, enUS } : { ptBR };
  } catch { return undefined; }
}

function resumeExperienceTrans(raw: string | undefined): {
  ptBR?: { role?: string; description?: string };
  enUS?: { role?: string; description?: string };
} | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, { role?: string; description?: string } | null>;
    const pt = parsed['pt-BR'];
    const en = parsed['en-US'];
    if (!pt && !en) return undefined;
    return {
      ptBR: pt ? { role: pt.role?.trim(), description: pt.description?.trim() } : undefined,
      enUS: en ? { role: en.role?.trim(), description: en.description?.trim() } : undefined,
    };
  } catch { return undefined; }
}

function resumeEducationTrans(raw: string | undefined): {
  ptBR?: { degree?: string; description?: string };
  enUS?: { degree?: string; description?: string };
} | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, { degree?: string; description?: string } | null>;
    const pt = parsed['pt-BR'];
    const en = parsed['en-US'];
    if (!pt && !en) return undefined;
    return {
      ptBR: pt ? { degree: pt.degree?.trim(), description: pt.description?.trim() } : undefined,
      enUS: en ? { degree: en.degree?.trim(), description: en.description?.trim() } : undefined,
    };
  } catch { return undefined; }
}

// ─── Internal insert mutations ────────────────────────────────────────────────

export const _bulkInsertProjects = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query('projects').collect();
    await Promise.all(existing.map((d) => ctx.db.delete(d._id)));
    const now = Date.now();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>;
      await ctx.db.insert('projects', {
        title: s(r.title), description: s(r.description),
        titleTranslations: i18n(r.title_translations),
        descriptionTranslations: i18n(r.description_translations),
        longDescriptionTranslations: i18n(r.long_description_translations),
        tags: arr(r.tags), imageIds: [],
        externalImageUrls: r.cover_url ? [r.cover_url] : r.image_urls ? arr(r.image_urls) : undefined,
        demoLink: r.demo_link || undefined, githubLink: r.github_link || undefined,
        orderIndex: n(r.order_index, i), createdAt: now,
      });
    }
    return rows.length;
  },
});

export const _bulkInsertPosts = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    for (const row of rows as Record<string, string>[]) {
      const slug = s(row.slug);
      const exists = await ctx.db.query('posts').withIndex('by_slug', (q) => q.eq('slug', slug)).first();
      if (exists) {
        await ctx.db.patch(exists._id, {
          titleTranslations: i18n(row.title_translations),
          subtitleTranslations: i18n(row.subtitle_translations),
          contentTranslations: i18n(row.content_translations),
          subtitle: row.subtitle || undefined,
        });
        continue;
      }
      await ctx.db.insert('posts', {
        title: s(row.title), slug,
        subtitle: row.subtitle || undefined,
        content: s(row.content),
        titleTranslations: i18n(row.title_translations),
        subtitleTranslations: i18n(row.subtitle_translations),
        contentTranslations: i18n(row.content_translations),
        tags: arr(row.tags),
        featured: b(row.featured),
        status: row.published_at ? 'published' : 'draft',
        publishedAt: row.published_at ? new Date(row.published_at).getTime() : undefined,
        createdAt: Date.now(),
      });
    }
    return (rows as unknown[]).length;
  },
});

export const _bulkInsertServices = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query('services').collect();
    await Promise.all(existing.map((d) => ctx.db.delete(d._id)));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>;
      await ctx.db.insert('services', {
        title: s(r.title), description: s(r.description),
        titleTranslations: i18n(r.title_translations),
        descriptionTranslations: i18n(r.description_translations),
        orderIndex: n(r.order_index, i), createdAt: Date.now(),
      });
    }
    return rows.length;
  },
});

export const _bulkInsertFaq = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query('aboutFaq').collect();
    await Promise.all(existing.map((d) => ctx.db.delete(d._id)));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>;
      await ctx.db.insert('aboutFaq', {
        question: s(r.question), answer: s(r.answer),
        questionTranslations: i18n(r.question_translations),
        answerTranslations: i18n(r.answer_translations),
        displayOrder: n(r.order_index ?? r.display_order, i), createdAt: Date.now(),
      });
    }
    return rows.length;
  },
});

export const _upsertContactInfoCsv = internalMutation({
  args: { row: v.any() },
  handler: async (ctx, { row }) => {
    const r = row as Record<string, string>;
    const existing = await ctx.db.query('contactInfo').first();
    const data = {
      name: s(r.name), role: s(r.role), email: s(r.email),
      roleTranslations: i18n(r.role_translations),
      phone: r.phone || undefined,
      linkedinUrl: r.linkedin_url || undefined,
      githubUrl: r.github_url || undefined,
      behanceUrl: r.behance_url || undefined,
      showEmail: b(r.show_email ?? 'true'),
      showPhone: b(r.show_phone),
      showLocation: b(r.show_location),
      showBirthDate: b(r.show_birth_date),
      updatedAt: Date.now(),
    };
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert('contactInfo', { ...data, createdAt: Date.now() });
    return 1;
  },
});

export const _bulkInsertTestimonials = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query('testimonials').collect();
    await Promise.all(existing.map((d) => ctx.db.delete(d._id)));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>;
      await ctx.db.insert('testimonials', {
        name: s(r.name),
        role: s(r.role),
        text: s(r.text),
        roleTranslations: i18n(r.role_translations),
        textTranslations: i18n(r.text_translations),
        imageUrl: r.image_url || undefined,
        orderIndex: n(r.order_index, i),
        createdAt: Date.now(),
      });
    }
    return rows.length;
  },
});

export const _bulkInsertResumeItems = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query('resumeItems').collect();
    await Promise.all(existing.map((d) => ctx.db.delete(d._id)));
    const now = Date.now();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>;
      const type = s(r.type);
      const orderIndex = n(r.order_index, i);
      let content: Record<string, unknown>;
      try { content = JSON.parse(r.content ?? '{}'); } catch { content = {}; }

      if (type === 'skill') {
        await ctx.db.insert('resumeItems', {
          type: 'skill',
          content: { name: s(content.name as string), level: s(content.level as string) },
          orderIndex, createdAt: now,
        });
      } else if (type === 'experience') {
        await ctx.db.insert('resumeItems', {
          type: 'experience',
          content: {
            role: s(content.role as string),
            period: s(content.period as string),
            company: s(content.company as string),
            description: s(content.description as string),
          },
          contentTranslations: resumeExperienceTrans(r.content_translations),
          orderIndex, createdAt: now,
        });
      } else if (type === 'education') {
        await ctx.db.insert('resumeItems', {
          type: 'education',
          content: {
            degree: s(content.degree as string),
            period: s(content.period as string),
            description: s(content.description as string),
            institution: content.institution ? s(content.institution as string) : undefined,
          },
          contentTranslations: resumeEducationTrans(r.content_translations),
          orderIndex, createdAt: now,
        });
      } else if (type === 'course') {
        await ctx.db.insert('resumeItems', {
          type: 'course',
          content: { text: s(content.text as string) },
          contentTranslations: resumeTextTrans(r.content_translations),
          orderIndex, createdAt: now,
        });
      } else if (type === 'soft_skill') {
        await ctx.db.insert('resumeItems', {
          type: 'soft_skill',
          content: { text: s(content.text as string) },
          contentTranslations: resumeTextTrans(r.content_translations),
          orderIndex, createdAt: now,
        });
      } else if (type === 'language') {
        // contentTranslations for language is i18nString — store translated name as the string value
        const langTrans = (() => {
          try {
            const p = JSON.parse(r.content_translations ?? '{}') as Record<string, { name?: string } | null>;
            const ptBR = p['pt-BR']?.name?.trim() ?? '';
            const enUS = p['en-US']?.name?.trim();
            if (!ptBR && !enUS) return undefined;
            return enUS ? { ptBR, enUS } : { ptBR };
          } catch { return undefined; }
        })();
        await ctx.db.insert('resumeItems', {
          type: 'language',
          content: { name: s(content.name as string), level: s(content.level as string) },
          contentTranslations: langTrans,
          orderIndex, createdAt: now,
        });
      } else if (type === 'volunteer') {
        const textContent = content.text
          ? { text: s(content.text as string) }
          : { role: s(content.role as string), period: s(content.period as string), company: s(content.company as string), description: s(content.description as string) };
        await ctx.db.insert('resumeItems', {
          type: 'volunteer',
          content: textContent,
          contentTranslations: resumeTextTrans(r.content_translations),
          orderIndex, createdAt: now,
        });
      }
    }
    return rows.length;
  },
});

export const _bulkInsertDailyRoutine = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    const existing = await ctx.db.query('aboutDailyRoutine').collect();
    await Promise.all(existing.map((d) => ctx.db.delete(d._id)));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>;
      const spanRaw = s(r.span_size, '1x1');
      const span = (['1x1', '1x2', '2x1'] as const).includes(spanRaw as '1x1') ? spanRaw as '1x1' | '1x2' | '2x1' : '1x1';
      await ctx.db.insert('aboutDailyRoutine', {
        imageUrl: r.image_url || undefined,
        description: s(r.description),
        descriptionTranslations: i18n(r.description_translations),
        spanSize: span,
        displayOrder: n(r.display_order, i),
        createdAt: Date.now(),
      });
    }
    return rows.length;
  },
});

export const _bulkInsertImageFolders = internalMutation({
  args: { rows: v.array(v.any()) },
  handler: async (ctx, { rows }) => {
    // Build map of supabase id → convex id for parent resolution
    const idMap = new Map<string, string>();
    // Process roots first (no parent), then children
    const sorted = [...(rows as Record<string, string>[])].sort((a, b) =>
      (a.parent_id ? 1 : 0) - (b.parent_id ? 1 : 0)
    );
    for (const r of sorted) {
      const parentConvexId = r.parent_id ? idMap.get(r.parent_id) : undefined;
      const existing = await ctx.db
        .query('imageFolders')
        .withIndex('by_path', (q) => q.eq('path', r.path))
        .first();
      if (existing) {
        idMap.set(r.id, existing._id);
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convexId = await ctx.db.insert('imageFolders', {
        name: r.name,
        path: r.path,
        parentId: parentConvexId as any,
        createdAt: Date.now(),
      });
      idMap.set(r.id, convexId);
    }
    return Object.fromEntries(idMap);
  },
});

export const _createImageMetadata = internalMutation({
  args: {
    storageId: v.id('_storage'),
    displayName: v.string(),
    folderId: v.optional(v.id('imageFolders')),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    supabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { supabaseId: _supabaseId, ...data } = args;
    return ctx.db.insert('imageMetadata', {
      ...data,
      createdAt: Date.now(),
    });
  },
});

export const _linkImages = internalMutation({
  args: {
    posts: v.optional(v.array(v.object({
      slug: v.string(),
      imageMetadataId: v.optional(v.id('imageMetadata')),
      imageUrl: v.optional(v.string()),
    }))),
    projects: v.optional(v.array(v.object({
      orderIndex: v.number(),
      imageMetadataIds: v.optional(v.array(v.id('imageMetadata'))),
      externalImageUrls: v.optional(v.array(v.string())),
    }))),
    dailyRoutine: v.optional(v.array(v.object({
      displayOrder: v.number(),
      imageMetadataId: v.optional(v.id('imageMetadata')),
      imageUrl: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    let linked = 0;
    for (const { slug, imageMetadataId, imageUrl } of args.posts ?? []) {
      const post = await ctx.db.query('posts').withIndex('by_slug', (q) => q.eq('slug', slug)).first();
      if (post) {
        if (imageMetadataId) await ctx.db.patch(post._id, { imageId: imageMetadataId });
        else if (imageUrl) await ctx.db.patch(post._id, { imageUrl });
        linked++;
      }
    }
    for (const { orderIndex, imageMetadataIds, externalImageUrls } of args.projects ?? []) {
      const project = await ctx.db.query('projects').withIndex('by_orderIndex', (q) => q.eq('orderIndex', orderIndex)).first();
      if (project) {
        if (imageMetadataIds && imageMetadataIds.length > 0) await ctx.db.patch(project._id, { imageIds: imageMetadataIds });
        else if (externalImageUrls && externalImageUrls.length > 0) await ctx.db.patch(project._id, { externalImageUrls });
        linked++;
      }
    }
    for (const { displayOrder, imageMetadataId, imageUrl } of args.dailyRoutine ?? []) {
      const item = await ctx.db.query('aboutDailyRoutine').withIndex('by_displayOrder', (q) => q.eq('displayOrder', displayOrder)).first();
      if (item) {
        if (imageMetadataId) await ctx.db.patch(item._id, { imageId: imageMetadataId });
        else if (imageUrl) await ctx.db.patch(item._id, { imageUrl });
        linked++;
      }
    }
    return linked;
  },
});

// ─── HTTP handler (used by http.ts) ──────────────────────────────────────────

function checkSecret(req: Request): Response | null {
  const secret = process.env.IMPORT_SECRET;
  if (!secret) return new Response('IMPORT_SECRET not set', { status: 500 });
  if (req.headers.get('x-import-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }
  return null;
}

export async function handleImport(
  ctx: ActionCtx,
  req: Request,
  table: string,
): Promise<Response> {
  const denied = checkSecret(req);
  if (denied) return denied;

  const text = await req.text();
  const rows = parseCsv(text);
  if (!rows.length) return new Response('No rows found in CSV', { status: 400 });

  let count: unknown;
  switch (table) {
    case 'projects':
      count = await ctx.runMutation(internal.importCsv._bulkInsertProjects, { rows });
      break;
    case 'posts':
      count = await ctx.runMutation(internal.importCsv._bulkInsertPosts, { rows });
      break;
    case 'services':
      count = await ctx.runMutation(internal.importCsv._bulkInsertServices, { rows });
      break;
    case 'faq':
      count = await ctx.runMutation(internal.importCsv._bulkInsertFaq, { rows });
      break;
    case 'contact_info':
      count = await ctx.runMutation(internal.importCsv._upsertContactInfoCsv, { row: rows[0] });
      break;
    case 'testimonials':
      count = await ctx.runMutation(internal.importCsv._bulkInsertTestimonials, { rows });
      break;
    case 'resume_items':
      count = await ctx.runMutation(internal.importCsv._bulkInsertResumeItems, { rows });
      break;
    case 'daily_routine':
      count = await ctx.runMutation(internal.importCsv._bulkInsertDailyRoutine, { rows });
      break;
    default:
      return new Response(`Unknown table: ${table}. Supported: projects, posts, services, faq, contact_info, testimonials, resume_items, daily_routine`, { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true, table, imported: count }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

