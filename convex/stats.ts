import { query } from './_generated/server';
import { requireRole } from './auth';

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const [
      projectsTotal,
      postsPublished,
      postsDraft,
      proposalsTotal,
      proposalsAccepted,
      checkoutsPaid,
      checkoutsPending,
    ] = await Promise.all([
      ctx.db.query('projects').take(1000).then((r) => r.length),
      ctx.db.query('posts').withIndex('by_status', (q) => q.eq('status', 'published')).take(1000).then((r) => r.length),
      ctx.db.query('posts').withIndex('by_status', (q) => q.eq('status', 'draft')).take(1000).then((r) => r.length),
      ctx.db.query('proposals').take(1000).then((r) => r.length),
      ctx.db.query('proposals').withIndex('by_isAccepted', (q) => q.eq('isAccepted', true)).take(1000).then((r) => r.length),
      ctx.db.query('checkouts').withIndex('by_status', (q) => q.eq('status', 'paid')).take(1000).then((r) => r.length),
      ctx.db.query('checkouts').withIndex('by_status', (q) => q.eq('status', 'pending')).take(1000).then((r) => r.length),
    ]);

    return {
      projects: { total: projectsTotal },
      posts: { published: postsPublished, draft: postsDraft },
      proposals: {
        total: proposalsTotal,
        accepted: proposalsAccepted,
        pending: proposalsTotal - proposalsAccepted,
      },
      checkouts: { paid: checkoutsPaid, pending: checkoutsPending },
    };
  },
});
