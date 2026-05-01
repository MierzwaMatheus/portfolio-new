/**
 * Server-side migration from Supabase to Convex.
 * Runs as Convex actions — reads Supabase via REST API, writes via internal mutations.
 *
 * Usage:
 *   npx convex run migration:runAll '{"dryRun":true}'   ← preview only
 *   npx convex run migration:runAll                     ← live run
 *
 * Required Convex env vars (set via `npx convex env set KEY VALUE`):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { v } from 'convex/values';
import { action, internalAction, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel';

// ─── Supabase REST helper ─────────────────────────────────────────────────────

async function supabaseFetch(table: string, query = '') {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY via `npx convex env set`');
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase /${table}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<Record<string, unknown>[]>;
}

function truncateIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  return ip.split(':').slice(0, 4).join(':') + '::0';
}

function str(v: unknown, fallback = ''): string {
  return v != null ? String(v) : fallback;
}

// ─── Internal mutations ───────────────────────────────────────────────────────

export const _upsertContactInfo = internalMutation({
  args: {
    name: v.string(), role: v.string(), email: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()), githubUrl: v.optional(v.string()), behanceUrl: v.optional(v.string()),
    showEmail: v.boolean(), showPhone: v.boolean(), showLocation: v.boolean(), showBirthDate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('contactInfo').first();
    const now = Date.now();
    if (existing) await ctx.db.patch(existing._id, { ...args, updatedAt: now });
    else await ctx.db.insert('contactInfo', { ...args, createdAt: now, updatedAt: now });
  },
});

export const _insertService = internalMutation({
  args: { title: v.string(), description: v.string(), orderIndex: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await ctx.db.insert('services', { ...args, createdAt: Date.now() });
  },
});

export const _insertFaq = internalMutation({
  args: { question: v.string(), answer: v.string(), displayOrder: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert('aboutFaq', { ...args, createdAt: Date.now() });
  },
});

export const _insertProject = internalMutation({
  args: {
    title: v.string(), description: v.string(), tags: v.array(v.string()),
    demoLink: v.optional(v.string()), githubLink: v.optional(v.string()),
    orderIndex: v.number(), externalImageUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('projects', { ...args, imageIds: [], createdAt: Date.now() });
  },
});

export const _insertPost = internalMutation({
  args: {
    title: v.string(), slug: v.string(), content: v.string(),
    excerpt: v.optional(v.string()), tags: v.array(v.string()),
    featured: v.boolean(), status: v.union(v.literal('draft'), v.literal('published')),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('posts').withIndex('by_slug', (q) => q.eq('slug', args.slug)).first();
    if (existing) return;
    await ctx.db.insert('posts', { ...args, createdAt: Date.now() });
  },
});

export const _insertProposal = internalMutation({
  args: {
    userId: v.id('users'),
    slug: v.string(), title: v.string(), clientName: v.string(),
    objective: v.string(), rescissionPolicy: v.string(), deliveryDate: v.string(),
    investmentValue: v.number(), isAccepted: v.boolean(), expiresAt: v.number(),
    scope: v.array(v.string()), timeline: v.array(v.object({ step: v.string(), period: v.string() })),
    paymentMethods: v.array(v.string()), conditions: v.array(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('proposals').withIndex('by_slug', (q) => q.eq('slug', args.slug)).first();
    if (existing) return existing._id;
    const id = await ctx.db.insert('proposals', { ...args, version: 1, createdAt: Date.now() });
    return id;
  },
});

export const _insertAcceptanceMigrated = internalMutation({
  args: {
    proposalId: v.id('proposals'),
    clientName: v.string(), clientEmail: v.string(), clientDocument: v.string(),
    ipAddress: v.string(), contentSnapshot: v.string(), contentHash: v.string(),
    acceptedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('proposalAcceptances')
      .withIndex('by_proposalId', (q) => q.eq('proposalId', args.proposalId))
      .first();
    if (existing) return;
    // Create a synthetic closed session for this migrated record
    const sessionId = await ctx.db.insert('proposalSessions', {
      proposalId: args.proposalId,
      token: `migrated_${args.proposalId}_${args.acceptedAt}`,
      ipAddress: args.ipAddress,
      userAgent: 'migrated',
      isUsed: true,
      expiresAt: args.acceptedAt,
      createdAt: args.acceptedAt,
    });
    await ctx.db.insert('proposalAcceptances', {
      proposalId: args.proposalId,
      proposalVersion: 1,
      sessionId,
      clientName: args.clientName,
      clientEmail: args.clientEmail,
      clientDocument: args.clientDocument,
      contentSnapshot: args.contentSnapshot,
      contentSnapshotVersion: '1',
      contentHash: args.contentHash,
      ipAddress: args.ipAddress,
      userAgent: 'migrated',
      acceptedAt: args.acceptedAt,
      createdAt: args.acceptedAt,
    });
    await ctx.db.patch(args.proposalId, { isAccepted: true, acceptedAt: args.acceptedAt });
  },
});

export const _clearTable = internalMutation({
  args: { table: v.union(v.literal('services'), v.literal('aboutFaq'), v.literal('projects'), v.literal('posts')) },
  handler: async (ctx, args) => {
    const docs = await ctx.db.query(args.table).collect();
    await Promise.all(docs.map((d) => ctx.db.delete(d._id)));
  },
});

export const _getRootUserId = internalMutation({
  args: {},
  handler: async (ctx): Promise<Id<'users'> | null> => {
    const role = await ctx.db.query('userRoles').withIndex('by_role', (q) => q.eq('role', 'root')).first();
    return role?.userId ?? null;
  },
});

// ─── Internal actions (per entity) ───────────────────────────────────────────

export const migrateContactInfo = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('contact_info', 'limit=1');
    if (!rows.length) { console.log('[contact_info] no data found'); return { migrated: 0 }; }
    const r = rows[0];
    console.log(`[contact_info] ${str(r.name)}`);
    if (!dryRun) {
      await ctx.runMutation(internal.migration._upsertContactInfo, {
        name: str(r.name), role: str(r.role), email: str(r.email),
        phone: r.phone ? str(r.phone) : undefined,
        linkedinUrl: r.linkedin_url ? str(r.linkedin_url) : undefined,
        githubUrl: r.github_url ? str(r.github_url) : undefined,
        behanceUrl: r.behance_url ? str(r.behance_url) : undefined,
        showEmail: Boolean(r.show_email ?? true),
        showPhone: Boolean(r.show_phone ?? false),
        showLocation: Boolean(r.show_location ?? false),
        showBirthDate: Boolean(r.show_birth_date ?? false),
      });
    }
    return { migrated: 1 };
  },
});

export const migrateServices = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('services', 'order=order_index.asc');
    console.log(`[services] ${rows.length} found`);
    if (!dryRun) {
      await ctx.runMutation(internal.migration._clearTable, { table: 'services' });
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        await ctx.runMutation(internal.migration._insertService, {
          title: str(r.title), description: str(r.description),
          orderIndex: r.order_index != null ? Number(r.order_index) : i,
        });
      }
    }
    return { migrated: rows.length };
  },
});

export const migrateFaq = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('faq', 'order=order_index.asc');
    console.log(`[faq] ${rows.length} found`);
    if (!dryRun) {
      await ctx.runMutation(internal.migration._clearTable, { table: 'aboutFaq' });
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        await ctx.runMutation(internal.migration._insertFaq, {
          question: str(r.question), answer: str(r.answer),
          displayOrder: r.order_index != null ? Number(r.order_index) : i,
        });
      }
    }
    return { migrated: rows.length };
  },
});

export const migrateProjects = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('projects', 'order=order_index.asc');
    console.log(`[projects] ${rows.length} found`);
    if (!dryRun) {
      await ctx.runMutation(internal.migration._clearTable, { table: 'projects' });
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        await ctx.runMutation(internal.migration._insertProject, {
          title: str(r.title), description: str(r.description),
          tags: Array.isArray(r.tags) ? (r.tags as unknown[]).map(String) : [],
          demoLink: r.demo_link ? str(r.demo_link) : undefined,
          githubLink: r.github_link ? str(r.github_link) : undefined,
          orderIndex: r.order_index != null ? Number(r.order_index) : i,
          externalImageUrls: Array.isArray(r.image_urls)
            ? (r.image_urls as unknown[]).map(String)
            : r.cover_url ? [str(r.cover_url)] : undefined,
        });
      }
    }
    return { migrated: rows.length };
  },
});

export const migratePosts = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('posts', 'order=created_at.asc');
    console.log(`[posts] ${rows.length} found`);
    if (!dryRun) {
      for (const r of rows) {
        await ctx.runMutation(internal.migration._insertPost, {
          title: str(r.title), slug: str(r.slug), content: str(r.content),
          excerpt: r.excerpt ? str(r.excerpt) : undefined,
          tags: Array.isArray(r.tags) ? (r.tags as unknown[]).map(String) : [],
          featured: Boolean(r.featured),
          status: r.published_at ? 'published' : 'draft',
          publishedAt: r.published_at ? new Date(str(r.published_at)).getTime() : undefined,
        });
      }
    }
    return { migrated: rows.length };
  },
});

export const migrateProposals = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('proposals', 'order=created_at.asc');
    console.log(`[proposals] ${rows.length} found`);
    if (!dryRun) {
      const rootUserId = await ctx.runMutation(internal.migration._getRootUserId, {});
      if (!rootUserId) throw new Error('No root user found — run the seed first and create the admin user');
      for (const r of rows) {
        const timeline = Array.isArray(r.timeline)
          ? (r.timeline as Record<string, string>[]).map((t) => ({ step: str(t.step), period: str(t.period) }))
          : [];
        const validUntil = r.valid_until ? new Date(str(r.valid_until)).getTime() : Date.now() + 90 * 86400_000;
        await ctx.runMutation(internal.migration._insertProposal, {
          userId: rootUserId,
          slug: str(r.slug), title: str(r.title), clientName: str(r.client_name),
          objective: str(r.description ?? r.objective ?? r.scope ?? ''),
          rescissionPolicy: str(r.rescision_policy ?? r.rescission_policy ?? 'Sem política definida'),
          deliveryDate: str(r.delivery_date ?? r.valid_until ?? new Date().toISOString().slice(0, 10)),
          investmentValue: Math.round(Number(r.investment_value ?? 0) * 100),
          paymentMethods: Array.isArray(r.payment_methods) ? (r.payment_methods as unknown[]).map(String) : ['PIX'],
          conditions: Array.isArray(r.conditions) ? (r.conditions as unknown[]).map(String) : [],
          scope: Array.isArray(r.deliverables) ? (r.deliverables as unknown[]).map(String) : [],
          timeline,
          password: r.password_hash ? str(r.password_hash) : undefined,
          isAccepted: Boolean(r.accepted_at ?? r.is_accepted),
          expiresAt: validUntil,
        });
      }
    }
    return { migrated: rows.length };
  },
});

export const migrateAcceptances = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    const rows = await supabaseFetch('proposal_acceptances', 'order=accepted_at.asc');
    console.log(`[proposal_acceptances] ${rows.length} found`);
    if (!dryRun) {
      for (const r of rows) {
        // Find proposal by slug or ID
        const proposalSlug = str(r.proposal_slug ?? r.proposal_id ?? '');
        if (!proposalSlug) { console.warn('  skipping acceptance without proposal reference'); continue; }

        const truncatedIp = r.ip_address ? truncateIp(str(r.ip_address)) : '0.0.0.0';
        const snapshot = JSON.stringify({
          clientName: r.client_name, clientDocument: r.client_document,
          clientEmail: r.client_email, acceptedAt: r.accepted_at,
        });
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(snapshot));
        const hash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');

        // We need to find proposal by slug — this requires a query action isn't allowed to do directly
        // so we use a mutation that does the lookup and insert atomically
        await ctx.runMutation(internal.migration._insertAcceptanceMigrated, {
          proposalId: proposalSlug as Id<'proposals'>, // will be rejected if not found — see mutation handler
          clientName: str(r.client_name), clientEmail: str(r.client_email),
          clientDocument: str(r.client_document),
          ipAddress: truncatedIp, contentSnapshot: snapshot, contentHash: hash,
          acceptedAt: new Date(str(r.accepted_at)).getTime(),
        });
      }
    }
    return { migrated: rows.length };
  },
});

// ─── Public entry point ───────────────────────────────────────────────────────

export const runAll = action({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }) => {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Migration ${dryRun ? '[DRY-RUN]' : '[LIVE]'}`);
    console.log(`${'─'.repeat(50)}`);

    const steps: Array<[string, () => Promise<{ migrated: number }>]> = [
      ['contact_info', () => ctx.runAction(internal.migration.migrateContactInfo, { dryRun })],
      ['services',     () => ctx.runAction(internal.migration.migrateServices, { dryRun })],
      ['faq',          () => ctx.runAction(internal.migration.migrateFaq, { dryRun })],
      ['projects',     () => ctx.runAction(internal.migration.migrateProjects, { dryRun })],
      ['posts',        () => ctx.runAction(internal.migration.migratePosts, { dryRun })],
      ['proposals',    () => ctx.runAction(internal.migration.migrateProposals, { dryRun })],
      ['acceptances',  () => ctx.runAction(internal.migration.migrateAcceptances, { dryRun })],
    ];

    const results: Record<string, number> = {};
    for (const [name, fn] of steps) {
      console.log(`\n→ ${name}`);
      const r = await fn();
      results[name] = r.migrated;
      console.log(`  ✓ ${r.migrated}`);
    }
    console.log('\nDone:', results);
    return results;
  },
});
