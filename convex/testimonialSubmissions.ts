import { v } from 'convex/values';
import { mutation, query, internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { requireRole } from './auth';
import { logAudit } from './audit';
import { requirePlugin } from './plugins';

const MB = 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 20 * MB;
const DAILY_VIDEO_LIMIT_BYTES = 100 * MB;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const IP_RATE_LIMIT_MAX = 3;

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const generateVideoUploadUrl = mutation({
  args: { fileSizeBytes: v.number() },
  handler: async (ctx, { fileSizeBytes }) => {
    await requirePlugin(ctx, 'testimonials-intake');

    if (fileSizeBytes > MAX_VIDEO_SIZE_BYTES) {
      throw new Error('VIDEO_TOO_LARGE');
    }

    const dayStart = todayStart();
    const todaySubmissions = await ctx.db
      .query('testimonialSubmissions')
      .withIndex('by_createdAt')
      .filter((q) => q.gte(q.field('createdAt'), dayStart))
      .collect();

    const usedBytes = todaySubmissions.reduce(
      (sum, s) => sum + (s.videoFileSize ?? 0),
      0,
    );

    if (usedBytes + fileSizeBytes > DAILY_VIDEO_LIMIT_BYTES) {
      throw new Error('VIDEO_DAILY_LIMIT_REACHED');
    }

    return ctx.storage.generateUploadUrl();
  },
});

export const submit = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    company: v.optional(v.string()),
    email: v.string(),
    type: v.union(v.literal('text'), v.literal('video')),
    text: v.optional(v.string()),
    videoStorageId: v.optional(v.id('_storage')),
    videoFileSize: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'testimonials-intake');

    const now = Date.now();
    const email = args.email.toLowerCase().trim();
    const ip = args.ipAddress ?? 'unknown';

    async function checkRateLimit(
      key: string,
      identifier: string,
      maxAttempts: number,
      windowMs: number,
      blockMs: number,
      type: 'contact_submit' | 'testimonial_submit',
    ) {
      const existing = await ctx.db
        .query('rateLimitAttempts')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique();

      if (existing) {
        if (existing.blockedUntil && existing.blockedUntil > now) {
          throw new Error('RATE_LIMITED');
        }
        const windowStart = now - windowMs;
        if (existing.firstAttemptAt > windowStart && existing.attemptCount >= maxAttempts) {
          await ctx.db.patch(existing._id, {
            attemptCount: existing.attemptCount + 1,
            lastAttemptAt: now,
            blockedUntil: now + blockMs,
          });
          throw new Error('RATE_LIMITED');
        }
        if (existing.firstAttemptAt <= windowStart) {
          await ctx.db.patch(existing._id, {
            attemptCount: 1,
            firstAttemptAt: now,
            lastAttemptAt: now,
            blockedUntil: undefined,
            expiresAt: now + windowMs * 2,
          });
        } else {
          await ctx.db.patch(existing._id, {
            attemptCount: existing.attemptCount + 1,
            lastAttemptAt: now,
            expiresAt: now + windowMs * 2,
          });
        }
      } else {
        await ctx.db.insert('rateLimitAttempts', {
          key,
          identifier,
          type,
          attemptCount: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
          expiresAt: now + windowMs * 2,
        });
      }
    }

    await checkRateLimit(
      `testimonial_email:${email}`,
      email,
      1,
      WEEK_MS,
      WEEK_MS,
      'testimonial_submit',
    );

    if (ip !== 'unknown') {
      await checkRateLimit(
        `testimonial_ip:${ip}`,
        ip,
        IP_RATE_LIMIT_MAX,
        DAY_MS,
        HOUR_MS,
        'testimonial_submit',
      );
    }

    const id = await ctx.db.insert('testimonialSubmissions', {
      name: args.name,
      role: args.role,
      company: args.company,
      email,
      type: args.type,
      text: args.text,
      videoStorageId: args.videoStorageId,
      videoFileSize: args.videoFileSize,
      imageUrl: args.imageUrl,
      status: 'pending',
      createdAt: now,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.submitted',
      actorType: 'external',
      targetType: 'testimonialSubmission',
      targetId: id,
      metadata: {
        label: `${args.name} (${args.type})`,
        name: args.name,
        email,
        type: args.type,
      },
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      success: true,
    });

    await ctx.scheduler.runAfter(0, internal.testimonialSubmissions.sendNotification, { id });

    return { id };
  },
});

export const sendNotification = internalAction({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => {
    const doc = await ctx.runQuery(internal.testimonialSubmissions.getInternal, { id });
    if (!doc) return;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) return;

    const ts = new Date(doc.createdAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const typeLabel = doc.type === 'video' ? '🎥 Vídeo' : '✍️ Texto';

    const lines = [
      `⭐ <b>Novo depoimento recebido</b>`,
      ``,
      `${typeLabel}`,
      `🕐 <b>Recebido:</b> ${ts}`,
      ``,
      `─────────────────────────`,
      `👤 <b>PESSOA</b>`,
      `<b>Nome:</b> ${doc.name}`,
      `<b>Cargo:</b> ${doc.role}`,
      doc.company ? `<b>Empresa:</b> ${doc.company}` : null,
      `<b>E-mail:</b> ${doc.email}`,
      doc.text ? `` : null,
      doc.text ? `─────────────────────────` : null,
      doc.text ? `💬 <b>DEPOIMENTO</b>` : null,
      doc.text ? doc.text : null,
    ]
      .filter((l) => l !== null)
      .join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'HTML' }),
    });
  },
});

export const getInternal = internalQuery({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('approved'),
        v.literal('rejected'),
        v.literal('published'),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);

    const all = await ctx.db
      .query('testimonialSubmissions')
      .withIndex('by_createdAt')
      .order('desc')
      .take(200);

    const filtered = args.status ? all.filter((s) => s.status === args.status) : all;

    return Promise.all(
      filtered.map(async (s) => ({
        ...s,
        videoUrl: s.videoStorageId ? await ctx.storage.getUrl(s.videoStorageId) : null,
      })),
    );
  },
});

export const approve = mutation({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');

    await ctx.db.patch(id, {
      status: 'approved',
      reviewedAt: Date.now(),
      reviewedBy: userId,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.approved',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonialSubmission',
      targetId: id,
      metadata: { label: doc.name },
      success: true,
    });
  },
});

export const reject = mutation({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');

    if (doc.videoStorageId) {
      await ctx.storage.delete(doc.videoStorageId);
    }

    await ctx.db.patch(id, {
      status: 'rejected',
      reviewedAt: Date.now(),
      reviewedBy: userId,
      videoStorageId: undefined,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.rejected',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonialSubmission',
      targetId: id,
      metadata: { label: doc.name },
      success: true,
    });
  },
});

export const restore = mutation({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');

    await ctx.db.patch(id, {
      status: 'pending',
      reviewedAt: undefined,
      reviewedBy: undefined,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.restored',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonialSubmission',
      targetId: id,
      metadata: { label: doc.name },
      success: true,
    });
  },
});

export const publish = mutation({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');
    if (doc.type !== 'text' || !doc.text) {
      throw new Error('Apenas depoimentos em texto podem ser publicados na home');
    }

    const existing = await ctx.db
      .query('testimonials')
      .withIndex('by_orderIndex')
      .order('desc')
      .first();
    const nextOrder = (existing?.orderIndex ?? 0) + 1;

    const testimonialId = await ctx.db.insert('testimonials', {
      name: doc.name,
      role: doc.role,
      imageUrl: doc.imageUrl,
      text: doc.text,
      orderIndex: nextOrder,
      createdAt: Date.now(),
    });

    await ctx.db.patch(id, {
      status: 'published',
      reviewedAt: Date.now(),
      reviewedBy: userId,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.published',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonialSubmission',
      targetId: id,
      metadata: { label: doc.name, testimonialId },
      success: true,
    });

    return { testimonialId };
  },
});

export const approveAndPublish = mutation({
  args: { id: v.id('testimonialSubmissions') },
  handler: async (ctx, { id }) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');
    if (doc.type !== 'text' || !doc.text) {
      throw new Error('Apenas depoimentos em texto podem ser publicados na home');
    }

    const existing = await ctx.db
      .query('testimonials')
      .withIndex('by_orderIndex')
      .order('desc')
      .first();
    const nextOrder = (existing?.orderIndex ?? 0) + 1;

    const testimonialId = await ctx.db.insert('testimonials', {
      name: doc.name,
      role: doc.role,
      imageUrl: doc.imageUrl,
      text: doc.text,
      orderIndex: nextOrder,
      createdAt: Date.now(),
    });

    await ctx.db.patch(id, {
      status: 'published',
      reviewedAt: Date.now(),
      reviewedBy: userId,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.published',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonialSubmission',
      targetId: id,
      metadata: { label: doc.name, testimonialId },
      success: true,
    });

    return { testimonialId };
  },
});

export const getDailyVideoUsage = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ['root', 'admin']);

    const dayStart = todayStart();
    const todaySubmissions = await ctx.db
      .query('testimonialSubmissions')
      .withIndex('by_createdAt')
      .filter((q) => q.gte(q.field('createdAt'), dayStart))
      .collect();

    const usedBytes = todaySubmissions.reduce(
      (sum, s) => sum + (s.videoFileSize ?? 0),
      0,
    );

    return {
      usedBytes,
      limitBytes: DAILY_VIDEO_LIMIT_BYTES,
      usedMB: Math.round((usedBytes / MB) * 10) / 10,
      limitMB: DAILY_VIDEO_LIMIT_BYTES / MB,
    };
  },
});
