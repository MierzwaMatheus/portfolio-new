import { mutation } from './_generated/server';

// Idempotent seed — safe to run multiple times
export const initialize = mutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];

    // Seed contactInfo singleton
    const contactInfo = await ctx.db.query('contactInfo').first();
    if (!contactInfo) {
      await ctx.db.insert('contactInfo', {
        name: 'Matheus Mierzwa',
        role: 'Desenvolvedor Full Stack',
        roleTranslations: { 'ptBR': 'Desenvolvedor Full Stack', 'enUS': 'Full Stack Developer' },
        email: 'contato@mmlo.com.br',
        showEmail: true,
        showPhone: false,
        showBirthDate: false,
        showLocation: true,
        location: 'Brasil',
        linkedinUrl: 'https://linkedin.com/in/matheusmierzwa',
        githubUrl: 'https://github.com/MierzwaMatheus',
        createdAt: Date.now(),
      });
      results.push('contactInfo seeded');
    }

    // Seed deployStatus singleton
    const deployStatus = await ctx.db.query('deployStatus').first();
    if (!deployStatus) {
      await ctx.db.insert('deployStatus', {
        pendingChanges: false,
        lastCheckAt: Date.now(),
        updatedAt: Date.now(),
      });
      results.push('deployStatus seeded');
    }

    // Seed default home content keys
    const homeKeys = ['hero_title', 'hero_subtitle', 'about_short'];
    for (const key of homeKeys) {
      const existing = await ctx.db
        .query('homeContent')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique();
      if (!existing) {
        await ctx.db.insert('homeContent', {
          key,
          value: '',
          createdAt: Date.now(),
        });
        results.push(`homeContent[${key}] seeded`);
      }
    }

    return { seeded: results };
  },
});
