import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { internal } from './_generated/api';

export const trigger = action({
  args: { triggeredBy: v.optional(v.id('users')) },
  handler: async (ctx, args): Promise<{ ok: boolean; statusCode?: number }> => {
    const webhookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!webhookUrl) {
      console.warn('[deploy] VERCEL_DEPLOY_HOOK_URL not set');
      return { ok: false };
    }

    const res = await fetch(webhookUrl, { method: 'POST' });

    if (res.ok) {
      await ctx.runMutation(internal.publishStatus.setPublished, {
        triggeredBy: args.triggeredBy,
      });
    }

    return { ok: res.ok, statusCode: res.status };
  },
});
