import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

// ─── i18n helpers ────────────────────────────────────────────────────────────
const i18nString = v.optional(
  v.object({
    'ptBR': v.string(),
    'enUS': v.optional(v.string()),
  }),
);

const i18nStringArray = v.optional(
  v.object({
    'ptBR': v.array(v.string()),
    'enUS': v.optional(v.array(v.string())),
  }),
);

const timelineItem = v.object({
  step: v.string(),
  period: v.string(),
});

// ─── resumeItems discriminated union ─────────────────────────────────────────
const resumeItemVariants = v.union(
  v.object({
    type: v.literal('skill'),
    content: v.object({ name: v.string(), level: v.string() }),
    contentTranslations: v.optional(
      v.object({ name: v.optional(v.string()), level: v.optional(v.string()) }),
    ),
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  v.object({
    type: v.literal('experience'),
    content: v.object({
      role: v.string(),
      period: v.string(),
      company: v.string(),
      description: v.string(),
    }),
    contentTranslations: v.optional(
      v.object({
        'ptBR': v.optional(v.object({ role: v.optional(v.string()), description: v.optional(v.string()) })),
        'enUS': v.optional(v.object({ role: v.optional(v.string()), description: v.optional(v.string()) })),
      }),
    ),
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  v.object({
    type: v.literal('education'),
    content: v.object({
      degree: v.string(),
      period: v.string(),
      description: v.string(),
      institution: v.optional(v.string()),
    }),
    contentTranslations: v.optional(
      v.object({
        'ptBR': v.optional(v.object({ degree: v.optional(v.string()), description: v.optional(v.string()) })),
        'enUS': v.optional(v.object({ degree: v.optional(v.string()), description: v.optional(v.string()) })),
      }),
    ),
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  v.object({
    type: v.literal('course'),
    content: v.object({ text: v.string() }),
    contentTranslations: i18nString,
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  v.object({
    type: v.literal('soft_skill'),
    content: v.object({ text: v.string() }),
    contentTranslations: i18nString,
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  v.object({
    type: v.literal('volunteer'),
    content: v.union(
      v.object({ text: v.string() }),
      v.object({
        role: v.string(),
        period: v.string(),
        company: v.string(),
        description: v.string(),
      }),
    ),
    contentTranslations: v.optional(v.any()),
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
  v.object({
    type: v.literal('language'),
    content: v.object({ name: v.string(), level: v.string() }),
    contentTranslations: i18nString,
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),
);

// ─── Schema ───────────────────────────────────────────────────────────────────
export default defineSchema({
  ...authTables,

  // ── userRoles ──────────────────────────────────────────────────────────────
  userRoles: defineTable({
    userId: v.id('users'),
    role: v.union(
      v.literal('root'),
      v.literal('admin'),
      v.literal('proposal-editor'),
    ),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_userId', ['userId'])
    .index('by_role', ['role']),

  // ── projects ───────────────────────────────────────────────────────────────
  projects: defineTable({
    title: v.string(),
    titleTranslations: i18nString,
    description: v.string(),
    descriptionTranslations: i18nString,
    longDescription: v.optional(v.string()),
    longDescriptionTranslations: i18nString,
    tags: v.array(v.string()),
    imageIds: v.array(v.id('imageMetadata')),
    externalImageUrls: v.optional(v.array(v.string())),
    demoLink: v.optional(v.string()),
    githubLink: v.optional(v.string()),
    orderIndex: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_orderIndex', ['orderIndex'])
    .index('by_createdAt', ['createdAt']),

  // ── posts ──────────────────────────────────────────────────────────────────
  posts: defineTable({
    title: v.string(),
    titleTranslations: i18nString,
    subtitle: v.optional(v.string()),
    subtitleTranslations: i18nString,
    slug: v.string(),
    content: v.string(),
    contentTranslations: i18nString,
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    featured: v.boolean(),
    status: v.union(v.literal('draft'), v.literal('published')),
    readTime: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    authorId: v.optional(v.id('users')),
  })
    .index('by_slug', ['slug'])
    .index('by_status', ['status'])
    .index('by_status_and_publishedAt', ['status', 'publishedAt'])
    .index('by_featured', ['featured'])
    .index('by_imageId', ['imageId'])
    .searchIndex('search_title', { searchField: 'title', filterFields: ['status'] }),

  // ── resumeItems ────────────────────────────────────────────────────────────
  resumeItems: defineTable(resumeItemVariants)
    .index('by_type_and_orderIndex', ['type', 'orderIndex'])
    .index('by_orderIndex', ['orderIndex']),

  // ── services ───────────────────────────────────────────────────────────────
  services: defineTable({
    title: v.string(),
    titleTranslations: i18nString,
    description: v.string(),
    descriptionTranslations: i18nString,
    orderIndex: v.optional(v.number()),
    createdAt: v.number(),
  }).index('by_orderIndex', ['orderIndex']),

  // ── testimonials ───────────────────────────────────────────────────────────
  testimonials: defineTable({
    name: v.string(),
    role: v.string(),
    roleTranslations: i18nString,
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    text: v.string(),
    textTranslations: i18nString,
    orderIndex: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_orderIndex', ['orderIndex'])
    .index('by_imageId', ['imageId']),

  // ── homeContent ────────────────────────────────────────────────────────────
  homeContent: defineTable({
    key: v.string(),
    value: v.any(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_key', ['key']),

  // ── aboutDailyRoutine ──────────────────────────────────────────────────────
  aboutDailyRoutine: defineTable({
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    descriptionTranslations: i18nString,
    spanSize: v.union(v.literal('1x1'), v.literal('1x2'), v.literal('2x1')),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_displayOrder', ['displayOrder']),

  // ── aboutFaq ───────────────────────────────────────────────────────────────
  aboutFaq: defineTable({
    question: v.string(),
    questionTranslations: i18nString,
    answer: v.string(),
    answerTranslations: i18nString,
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_displayOrder', ['displayOrder']),

  // ── contactInfo (singleton) ────────────────────────────────────────────────
  contactInfo: defineTable({
    name: v.string(),
    role: v.string(),
    roleTranslations: i18nString,
    email: v.string(),
    showEmail: v.boolean(),
    phone: v.optional(v.string()),
    showPhone: v.boolean(),
    birthDate: v.optional(v.string()),
    showBirthDate: v.boolean(),
    location: v.optional(v.string()),
    showLocation: v.boolean(),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    behanceUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }),

  // ── imageFolders ───────────────────────────────────────────────────────────
  imageFolders: defineTable({
    name: v.string(),
    parentId: v.optional(v.id('imageFolders')),
    path: v.string(),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_path', ['path'])
    .index('by_parentId', ['parentId']),

  // ── imageMetadata ──────────────────────────────────────────────────────────
  imageMetadata: defineTable({
    storageId: v.id('_storage'),
    folderId: v.optional(v.id('imageFolders')),
    displayName: v.string(),
    description: v.optional(v.string()),
    altText: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_storageId', ['storageId'])
    .index('by_folderId', ['folderId'])
    .index('by_createdAt', ['createdAt']),

  // ── proposals ──────────────────────────────────────────────────────────────
  proposals: defineTable({
    userId: v.id('users'),
    clientName: v.string(),
    slug: v.string(),
    title: v.string(),
    titleTranslations: i18nString,
    objective: v.string(),
    objectiveTranslations: i18nString,
    scope: v.array(v.string()),
    scopeTranslations: i18nStringArray,
    timeline: v.array(timelineItem),
    timelineTranslations: v.optional(v.any()),
    deliveryDate: v.string(),
    investmentValue: v.number(),
    paymentMethods: v.array(v.string()),
    conditions: v.array(v.string()),
    conditionsTranslations: i18nStringArray,
    password: v.optional(v.string()),
    rescissionPolicy: v.string(),
    rescissionPolicyTranslations: i18nString,
    version: v.number(),
    isAccepted: v.boolean(),
    acceptedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_slug', ['slug'])
    .index('by_userId', ['userId'])
    .index('by_isAccepted', ['isAccepted'])
    .index('by_expiresAt', ['expiresAt']),

  // ── proposalVersions ───────────────────────────────────────────────────────
  proposalVersions: defineTable({
    proposalId: v.id('proposals'),
    version: v.number(),
    contentSnapshot: v.string(),
    contentSnapshotVersion: v.string(),
    createdBy: v.id('users'),
    createdAt: v.number(),
  }).index('by_proposalId_and_version', ['proposalId', 'version']),

  // ── proposalSessions ───────────────────────────────────────────────────────
  proposalSessions: defineTable({
    proposalId: v.id('proposals'),
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isUsed: v.boolean(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_proposalId', ['proposalId'])
    .index('by_expiresAt', ['expiresAt']),

  // ── proposalAcceptances ────────────────────────────────────────────────────
  proposalAcceptances: defineTable({
    proposalId: v.id('proposals'),
    proposalVersion: v.number(),
    sessionId: v.optional(v.id('proposalSessions')),
    clientName: v.string(),
    clientDocument: v.string(),
    clientEmail: v.string(),
    clientRole: v.optional(v.string()),
    clientDeclaration: v.optional(v.string()),
    contentSnapshot: v.string(),
    contentSnapshotVersion: v.string(),
    contentHash: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    acceptedAt: v.number(),
    createdAt: v.number(),
    anonymizedAt: v.optional(v.number()),
  })
    .index('by_proposalId', ['proposalId'])
    .index('by_clientDocument', ['clientDocument'])
    .index('by_acceptedAt', ['acceptedAt']),

  // ── checkouts ──────────────────────────────────────────────────────────────
  checkouts: defineTable({
    uniqueLink: v.string(),
    customerId: v.optional(v.string()),
    customerName: v.string(),
    customerEmail: v.string(),
    customerCpfCnpj: v.string(),
    customerMobilePhone: v.optional(v.string()),
    customerCompany: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    value: v.number(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    billingType: v.optional(
      v.union(v.literal('PIX'), v.literal('BOLETO'), v.literal('CREDIT_CARD')),
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('payment_selected'),
      v.literal('payment_confirmed'),
      v.literal('paid'),
      v.literal('expired'),
      v.literal('failed'),
    ),
    paymentMethod: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentValue: v.optional(v.number()),
    installmentInterestRate: v.optional(v.number()),
    installmentInterestAmount: v.optional(v.number()),
    totalValue: v.optional(v.number()),
    pixQrCode: v.optional(v.string()),
    pixQrCodeImage: v.optional(v.string()),
    pixExpirationDate: v.optional(v.number()),
    bankSlipUrl: v.optional(v.string()),
    asaasChargeId: v.optional(v.string()),
    externalReference: v.optional(v.string()),
    expiresAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_uniqueLink', ['uniqueLink'])
    .index('by_asaasChargeId', ['asaasChargeId'])
    .index('by_status', ['status'])
    .index('by_customerEmail', ['customerEmail'])
    .index('by_expiresAt', ['expiresAt']),

  // ── deployStatus (singleton) ───────────────────────────────────────────────
  deployStatus: defineTable({
    pendingChanges: v.boolean(),
    lastPublishedAt: v.optional(v.number()),
    lastCheckAt: v.optional(v.number()),
    lastTriggeredBy: v.optional(v.id('users')),
    updatedAt: v.number(),
  }),

  // ── rateLimitAttempts ──────────────────────────────────────────────────────
  rateLimitAttempts: defineTable({
    key: v.string(),
    identifier: v.string(),
    type: v.union(
      v.literal('login'),
      v.literal('proposal_password'),
      v.literal('proposal_accept'),
      v.literal('webhook_invalid'),
    ),
    attemptCount: v.number(),
    firstAttemptAt: v.number(),
    lastAttemptAt: v.number(),
    blockedUntil: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index('by_key', ['key'])
    .index('by_expiresAt', ['expiresAt']),

  // ── auditLog ───────────────────────────────────────────────────────────────
  auditLog: defineTable({
    eventType: v.string(),
    actorType: v.union(
      v.literal('user'),
      v.literal('system'),
      v.literal('external'),
    ),
    actorId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    success: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index('by_eventType_and_createdAt', ['eventType', 'createdAt'])
    .index('by_actorId', ['actorId'])
    .index('by_targetType_and_targetId', ['targetType', 'targetId'])
    .index('by_createdAt', ['createdAt'])
    .index('by_expiresAt', ['expiresAt']),
});
