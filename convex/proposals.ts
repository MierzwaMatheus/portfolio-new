import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireRole, requireAuth } from './auth';
import { logAudit } from './audit';
import { checkRateLimit, recordRateLimitAttempt, resetRateLimit } from './rateLimit';
import { getAuthUserId } from '@convex-dev/auth/server';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

const timelineItemValidator = v.object({ step: v.string(), period: v.string() });

export const listAdmin = query({
  args: {
    filter: v.optional(v.union(v.literal('all'), v.literal('accepted'), v.literal('pending'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    if (args.filter === 'accepted') {
      return ctx.db
        .query('proposals')
        .withIndex('by_isAccepted', (q) => q.eq('isAccepted', true))
        .order('desc')
        .take(args.limit ?? 50);
    }
    return ctx.db.query('proposals').order('desc').take(args.limit ?? 50);
  },
});

export const getPublic = query({
  args: { slug: v.string(), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) return null;

    const now = Date.now();
    const isExpired = proposal.expiresAt < now;
    const requiresPassword = !!proposal.password;
    let hasValidSession = false;

    if (requiresPassword && args.token) {
      const session = await ctx.db
        .query('proposalSessions')
        .withIndex('by_token', (q) => q.eq('token', args.token!))
        .unique();
      hasValidSession = !!(
        session &&
        session.proposalId === proposal._id &&
        session.expiresAt > now
      );
    }

    return {
      ...proposal,
      password: undefined,
      requiresPassword,
      hasValidSession,
      isExpired,
    };
  },
});

export const generateSignatureUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getAcceptance = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal || !proposal.isAccepted) return null;

    const acceptance = await ctx.db
      .query('proposalAcceptances')
      .withIndex('by_proposalId', (q) => q.eq('proposalId', proposal._id))
      .order('desc')
      .first();
    if (!acceptance) return null;

    const signatureUrl = acceptance.signatureStorageId
      ? await ctx.storage.getUrl(acceptance.signatureStorageId)
      : null;

    return { ...acceptance, signatureUrl };
  },
});

export const checkSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const session = await ctx.db
      .query('proposalSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!session || session.expiresAt < now) return null;
    return session;
  },
});

export const create = mutation({
  args: {
    clientName: v.string(),
    slug: v.string(),
    title: v.string(),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    objective: v.string(),
    objectiveTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    scope: v.array(v.string()),
    scopeTranslations: v.optional(
      v.object({ 'ptBR': v.array(v.string()), 'enUS': v.optional(v.array(v.string())) }),
    ),
    timeline: v.array(timelineItemValidator),
    deliveryDate: v.string(),
    investmentValue: v.number(),
    paymentMethods: v.array(v.string()),
    conditions: v.array(v.string()),
    conditionsTranslations: v.optional(
      v.object({ 'ptBR': v.array(v.string()), 'enUS': v.optional(v.array(v.string())) }),
    ),
    password: v.optional(v.string()),
    rescissionPolicy: v.string(),
    rescissionPolicyTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const existing = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (existing) throw new Error('Slug already in use');

    const now = Date.now();
    const id = await ctx.db.insert('proposals', {
      ...args,
      userId,
      version: 1,
      isAccepted: false,
      expiresAt: now + TEN_DAYS_MS,
      createdAt: now,
    });

    await logAudit(ctx, {
      eventType: 'admin.create',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: id,
      metadata: { label: args.title, clientName: args.clientName },
      success: true,
    });

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('proposals'),
    clientName: v.optional(v.string()),
    title: v.optional(v.string()),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    objective: v.optional(v.string()),
    objectiveTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    scope: v.optional(v.array(v.string())),
    timeline: v.optional(v.array(timelineItemValidator)),
    deliveryDate: v.optional(v.string()),
    investmentValue: v.optional(v.number()),
    paymentMethods: v.optional(v.array(v.string())),
    conditions: v.optional(v.array(v.string())),
    password: v.optional(v.string()),
    rescissionPolicy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.isAccepted) throw new Error('Accepted proposals are immutable');

    const { id, ...fields } = args;
    const newVersion = proposal.version + 1;

    await ctx.db.patch(id, { ...fields, version: newVersion, updatedAt: Date.now() });

    await logAudit(ctx, {
      eventType: 'admin.update',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: id,
      success: true,
    });
  },
});

export const remove = mutation({
  args: { id: v.id('proposals') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Not found');
    if (proposal.isAccepted) throw new Error('Cannot delete accepted proposal');

    await ctx.db.delete(args.id);
    await logAudit(ctx, {
      eventType: 'admin.delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: args.id,
      metadata: { label: proposal.title, clientName: proposal.clientName },
      success: true,
    });
  },
});

export const createSession = mutation({
  args: {
    slug: v.string(),
    password: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rateLimitKey = `${args.slug}:${args.ipAddress ?? 'unknown'}`;
    const rl = await checkRateLimit(ctx, 'proposal_password', rateLimitKey);
    if (!rl.allowed) {
      throw new Error(`Too many attempts. Try again later.`);
    }

    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) throw new Error('Proposal not found');
    if (!proposal.password) throw new Error('This proposal has no password');
    if (proposal.password !== args.password) {
      await recordRateLimitAttempt(ctx, 'proposal_password', rateLimitKey);
      throw new Error('Invalid password');
    }

    await resetRateLimit(ctx, 'proposal_password', rateLimitKey);

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert('proposalSessions', {
      proposalId: proposal._id,
      token,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent ? args.userAgent.substring(0, 256) : undefined,
      isUsed: false,
      expiresAt: now + SEVEN_DAYS_MS,
      createdAt: now,
    });

    return token;
  },
});

export const accept = mutation({
  args: {
    slug: v.string(),
    token: v.optional(v.string()),
    clientName: v.string(),
    clientDocument: v.string(),
    clientEmail: v.string(),
    clientRole: v.optional(v.string()),
    clientDeclaration: v.optional(v.string()),
    contentSnapshot: v.string(),
    contentHash: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    signatureStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.isAccepted) throw new Error('Already accepted');

    const now = Date.now();
    if (proposal.expiresAt < now) throw new Error('Proposal expired');

    let session = null;
    if (proposal.password) {
      if (!args.token) throw new Error('Invalid or expired session');
      session = await ctx.db
        .query('proposalSessions')
        .withIndex('by_token', (q) => q.eq('token', args.token!))
        .unique();
      if (!session || session.proposalId !== proposal._id || session.expiresAt < now) {
        throw new Error('Invalid or expired session');
      }
    }

    const acceptanceId = await ctx.db.insert('proposalAcceptances', {
      proposalId: proposal._id,
      proposalVersion: proposal.version,
      sessionId: session?._id,
      clientName: args.clientName,
      clientDocument: args.clientDocument,
      clientEmail: args.clientEmail,
      clientRole: args.clientRole,
      clientDeclaration: args.clientDeclaration,
      contentSnapshot: args.contentSnapshot,
      contentSnapshotVersion: 'v1',
      contentHash: args.contentHash,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent.substring(0, 512),
      signatureStorageId: args.signatureStorageId,
      acceptedAt: now,
      createdAt: now,
    });

    await ctx.db.patch(proposal._id, {
      isAccepted: true,
      acceptedAt: now,
      updatedAt: now,
    });
    if (session) await ctx.db.patch(session._id, { isUsed: true });

    await logAudit(ctx, {
      eventType: 'proposal.accepted',
      actorType: 'external',
      actorId: args.ipAddress,
      targetType: 'proposal',
      targetId: proposal._id,
      metadata: { version: proposal.version, email: args.clientEmail },
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      success: true,
    });

    await ctx.scheduler.runAfter(0, internal.telegram.notifyAdmin, {
      message: `✅ <b>Proposta aceita!</b>\n\nCliente: ${args.clientName}\nEmail: ${args.clientEmail}\nProposta: <code>${proposal.slug}</code>\nValor: R$ ${proposal.investmentValue.toFixed(2)}`,
    });

    return acceptanceId;
  },
});

export const requestErasure = mutation({
  args: {
    clientDocument: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);

    const acceptances = await ctx.db
      .query('proposalAcceptances')
      .withIndex('by_clientDocument', (q) => q.eq('clientDocument', args.clientDocument))
      .collect();

    const now = Date.now();
    for (const acc of acceptances) {
      await ctx.db.patch(acc._id, {
        clientName: '[ANONIMIZADO]',
        clientEmail: '[ANONIMIZADO]@example.invalid',
        clientRole: '[ANONIMIZADO]',
        clientDeclaration: '[ANONIMIZADO]',
        ipAddress: '0.0.0.0',
        userAgent: '[ANONIMIZADO]',
        anonymizedAt: now,
      });
    }

    await logAudit(ctx, {
      eventType: 'lgpd.erasure_executed',
      actorType: 'user',
      actorId: userId,
      metadata: { document: args.clientDocument, count: acceptances.length },
      success: true,
    });

    return { anonymized: acceptances.length };
  },
});

export const exportTitularData = query({
  args: { clientDocument: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root']);
    return ctx.db
      .query('proposalAcceptances')
      .withIndex('by_clientDocument', (q) => q.eq('clientDocument', args.clientDocument))
      .collect();
  },
});

export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('proposalSessions')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .take(200);
    for (const session of expired) {
      await ctx.db.delete(session._id);
    }
    return { deleted: expired.length };
  },
});
