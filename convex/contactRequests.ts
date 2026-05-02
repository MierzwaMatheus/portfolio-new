import { v } from 'convex/values';
import { mutation, query, internalAction, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { requireRole, requireAuth } from './auth';
import { logAudit } from './audit';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Per email: max 3 submissions per 24h
const EMAIL_RATE_LIMIT_MAX = 3;
const EMAIL_WINDOW_MS = DAY_MS;
// Per IP: max 10 submissions per hour (best-effort, IP may be shared/unknown)
const IP_RATE_LIMIT_MAX = 10;

const TYPE_LABELS: Record<string, string> = {
  project: '💼 Projeto',
  job: '🧑‍💼 Oportunidade de Emprego',
  networking: '🤝 Networking / Colaboração',
  feedback: '💬 Feedback / Dúvida',
};

const ANSWER_LABELS: Record<string, Record<string, string>> = {
  project: {
    projectType: 'Tipo de projeto',
    timeline: 'Prazo estimado',
    budget: 'Orçamento estimado',
    description: 'Descrição',
  },
  job: {
    contractType: 'Tipo de contrato',
    modality: 'Modalidade',
    area: 'Área',
    jobCompany: 'Empresa',
    jobRole: 'Cargo',
  },
  networking: {
    howFound: 'Como me encontrou',
    topic: 'Assunto',
  },
  feedback: {
    about: 'Sobre',
    message: 'Mensagem',
  },
};

const STATUS_LABELS_PT: Record<string, string> = {
  new: 'Novo',
  read: 'Lido',
  contacted: 'Contatado',
  in_progress: 'Em andamento',
  closed: 'Encerrado',
  archived: 'Arquivado',
};

// Human-readable labels for option values
const ANSWER_VALUES: Record<string, string> = {
  // project type
  webapp: 'Web App / SaaS',
  mobile: 'Mobile',
  landing: 'Landing Page',
  system: 'Sistema Interno',
  consulting: 'Consultoria Técnica',
  other: 'Outro',
  // timeline
  urgent: 'Urgente (< 1 mês)',
  short: 'Curto (1–3 meses)',
  medium: 'Médio (3–6 meses)',
  flexible: 'Sem pressa',
  // budget
  small: 'Até R$ 5.000',
  large: 'R$ 15.000 – R$ 30.000',
  enterprise: 'Acima de R$ 30.000',
  unknown: 'Ainda não sei',
  // job contract
  clt: 'CLT',
  pj: 'PJ / Contrato',
  freelance: 'Freelance',
  // modality
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
  // area
  frontend: 'Frontend',
  fullstack: 'Full Stack',
  techlead: 'Tech Lead / Arquitetura',
  // how found
  blog: 'Blog / Artigos',
  linkedin: 'LinkedIn',
  referral: 'Indicação',
  portfolio: 'Portfólio',
  // feedback about
  post: 'Post do blog',
  project: 'Projeto específico',
  general: 'Portfolio em geral',
};

// "medium" conflicts between timeline and budget, so budget needs explicit entry
const BUDGET_VALUES: Record<string, string> = {
  small: 'Até R$ 5.000',
  medium: 'R$ 5.000 – R$ 15.000',
  large: 'R$ 15.000 – R$ 30.000',
  enterprise: 'Acima de R$ 30.000',
  unknown: 'Ainda não sei',
};

function resolveAnswerValue(key: string, value: string): string {
  if (key === 'budget') return BUDGET_VALUES[value] ?? value;
  return ANSWER_VALUES[value] ?? value;
}

export const submit = mutation({
  args: {
    type: v.union(
      v.literal('project'),
      v.literal('job'),
      v.literal('networking'),
      v.literal('feedback'),
    ),
    sourceContext: v.optional(v.string()),
    answers: v.any(),
    contactInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      company: v.optional(v.string()),
    }),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.contactInfo.email.toLowerCase().trim();
    const ip = args.ipAddress ?? 'unknown';

    // Helper: check and increment a rate limit bucket
    async function checkRateLimit(
      key: string,
      identifier: string,
      maxAttempts: number,
      windowMs: number,
      blockMs: number,
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
          type: 'contact_submit',
          attemptCount: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
          expiresAt: now + windowMs * 2,
        });
      }
    }

    // Primary: rate limit by email (reliable, tamper-proof)
    await checkRateLimit(
      `contact_email:${email}`,
      email,
      EMAIL_RATE_LIMIT_MAX,
      EMAIL_WINDOW_MS,
      DAY_MS,
    );

    // Secondary: rate limit by IP (best-effort, catches bulk abuse from same origin)
    if (ip !== 'unknown') {
      await checkRateLimit(
        `contact_ip:${ip}`,
        ip,
        IP_RATE_LIMIT_MAX,
        HOUR_MS,
        HOUR_MS,
      );
    }

    // Kill switch: check if contact wizard is enabled
    const enabledSetting = await ctx.db
      .query('homeContent')
      .withIndex('by_key', (q) => q.eq('key', 'contact_wizard_enabled'))
      .unique();
    if (enabledSetting !== null && enabledSetting.value === false) {
      throw new Error('CONTACT_DISABLED');
    }

    const id = await ctx.db.insert('contactRequests', {
      type: args.type,
      status: 'new',
      sourceContext: args.sourceContext,
      answers: args.answers,
      contactInfo: args.contactInfo,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: now,
      updatedAt: now,
    });

    await logAudit(ctx, {
      eventType: 'contact.submitted',
      actorType: 'external',
      targetType: 'contactRequest',
      targetId: id,
      metadata: {
        label: `${args.contactInfo.name} (${TYPE_LABELS[args.type] ?? args.type}) via ${args.sourceContext ?? 'desconhecido'}`,
        type: args.type,
        sourceContext: args.sourceContext,
        contactName: args.contactInfo.name,
        contactEmail: args.contactInfo.email,
      },
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      success: true,
    });

    await ctx.scheduler.runAfter(0, internal.contactRequests.sendNotification, { id });

    return { id };
  },
});

export const sendNotification = internalAction({
  args: { id: v.id('contactRequests') },
  handler: async (ctx, { id }) => {
    const doc = await ctx.runQuery(internal.contactRequests.getInternal, { id });
    if (!doc) return;

    const typeLabel = TYPE_LABELS[doc.type] ?? doc.type;
    const answerLabels = ANSWER_LABELS[doc.type] ?? {};
    const answers = doc.answers as Record<string, string> ?? {};

    const answersBlock = Object.entries(answers)
      .map(([k, v]) => `<b>${answerLabels[k] ?? k}:</b> ${resolveAnswerValue(k, v)}`)
      .join('\n');

    const ts = new Date(doc.createdAt).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    const { name, email, phone, linkedin, company } = doc.contactInfo;

    const lines = [
      `🔔 <b>Nova solicitação de contato</b>`,
      ``,
      `${typeLabel}`,
      `📍 <b>Origem:</b> ${doc.sourceContext ?? 'desconhecida'}`,
      `🕐 <b>Recebido:</b> ${ts}`,
      ``,
      `─────────────────────────`,
      `👤 <b>CONTATO</b>`,
      `<b>Nome:</b> ${name}`,
      `<b>E-mail:</b> ${email}`,
      phone ? `<b>Telefone:</b> ${phone}` : null,
      linkedin ? `<b>LinkedIn:</b> ${linkedin}` : null,
      company ? `<b>Empresa:</b> ${company}` : null,
      ``,
      `─────────────────────────`,
      `📋 <b>RESPOSTAS</b>`,
      answersBlock || '(sem respostas)',
    ]
      .filter((l) => l !== null)
      .join('\n');

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (!token || !chatId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: 'HTML' }),
    });
  },
});

export const getInternal = internalQuery({
  args: { id: v.id('contactRequests') },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const list = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin']);
    const all = await ctx.db
      .query('contactRequests')
      .withIndex('by_createdAt')
      .order('desc')
      .take(200);

    return all
      .filter((r) => !args.status || r.status === args.status)
      .filter((r) => !args.type || r.type === args.type)
      .slice(0, args.limit ?? 100);
  },
});

export const get = query({
  args: { id: v.id('contactRequests') },
  handler: async (ctx, { id }) => {
    await requireRole(ctx, ['root', 'admin']);
    return ctx.db.get(id);
  },
});

export const markRead = mutation({
  args: { id: v.id('contactRequests') },
  handler: async (ctx, { id }) => {
    await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');
    if (doc.status === 'new') {
      await ctx.db.patch(id, { status: 'read', updatedAt: Date.now() });
    }
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('contactRequests'),
    status: v.union(
      v.literal('new'),
      v.literal('read'),
      v.literal('contacted'),
      v.literal('in_progress'),
      v.literal('closed'),
      v.literal('archived'),
    ),
  },
  handler: async (ctx, { id, status }) => {
    const { userId } = await requireAuth(ctx);
    await requireRole(ctx, ['root', 'admin']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');
    const prev = doc.status;
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    await logAudit(ctx, {
      eventType: 'contact.status_changed',
      actorType: 'user',
      actorId: userId,
      targetType: 'contactRequest',
      targetId: id,
      metadata: {
        label: `${doc.contactInfo.name} → ${STATUS_LABELS_PT[status] ?? status}`,
        from: prev,
        to: status,
        contactName: doc.contactInfo.name,
        contactEmail: doc.contactInfo.email,
      },
      success: true,
    });
  },
});

export const addNote = mutation({
  args: { id: v.id('contactRequests'), note: v.string() },
  handler: async (ctx, { id, note }) => {
    await requireRole(ctx, ['root', 'admin']);
    await ctx.db.patch(id, { adminNotes: note, updatedAt: Date.now() });
  },
});
