import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { QueryCtx, MutationCtx } from './_generated/server';
import { requireRole } from './auth';
import { PLUGIN_REGISTRY, PluginId, pluginKey, getPlugin } from './pluginRegistry';

export async function isPluginEnabled(
  ctx: QueryCtx | MutationCtx,
  id: PluginId,
): Promise<boolean> {
  const plugin = getPlugin(id);
  if (plugin.parentId) {
    const parentEnabled = await isPluginEnabled(ctx, plugin.parentId);
    if (!parentEnabled) return false;
  }
  const key = pluginKey(id);
  const setting = await ctx.db
    .query('homeContent')
    .withIndex('by_key', q => q.eq('key', key))
    .unique();
  if (setting !== null) return setting.value !== false;
  return plugin.defaultEnabled;
}

export async function requirePlugin(
  ctx: QueryCtx | MutationCtx,
  id: PluginId,
): Promise<void> {
  const enabled = await isPluginEnabled(ctx, id);
  if (!enabled) throw new Error(`PLUGIN_DISABLED:${id}`);
}

export const checkPlugin = query({
  args: { pluginId: v.string() },
  handler: async (ctx, args) => isPluginEnabled(ctx, args.pluginId as PluginId),
});

export const getPluginStates = query({
  args: {},
  handler: async ctx => {
    const allSettings = await ctx.db.query('homeContent').collect();
    const result: Record<string, boolean> = {};
    for (const plugin of PLUGIN_REGISTRY) {
      const key = pluginKey(plugin.id);
      const setting = allSettings.find(s => s.key === key);
      result[plugin.id] =
        setting !== undefined ? setting.value !== false : plugin.defaultEnabled;
    }
    return result;
  },
});

export const setPluginEnabled = mutation({
  args: {
    pluginId: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const plugin = getPlugin(args.pluginId as PluginId);
    const allowedRoles: Array<'root' | 'admin' | 'proposal-editor'> =
      plugin.minRole === 'root' ? ['root'] : ['root', 'admin'];
    await requireRole(ctx, allowedRoles);

    const key = pluginKey(args.pluginId as PluginId);
    const now = Date.now();
    const existing = await ctx.db
      .query('homeContent')
      .withIndex('by_key', q => q.eq('key', key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.enabled, updatedAt: now });
    } else {
      await ctx.db.insert('homeContent', { key, value: args.enabled, createdAt: now });
    }
  },
});
