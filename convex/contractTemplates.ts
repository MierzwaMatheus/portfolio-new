import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./auth";
import { isPluginEnabled, requirePlugin } from "./plugins";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const enabled = await isPluginEnabled(ctx, "contract-templates");
    if (!enabled) return [];
    return ctx.db.query("contractTemplates").collect();
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    await requirePlugin(ctx, "contract-templates");
    return ctx.db
      .query("contractTemplates")
      .withIndex("by_is_default", (q) => q.eq("isDefault", true))
      .unique();
  },
});
