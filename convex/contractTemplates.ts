import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRole } from "./auth";
import { isPluginEnabled, requirePlugin } from "./plugins";
import type { Id } from "./_generated/dataModel";

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

export const get = query({
  args: { id: v.id("contractTemplates") },
  handler: async (ctx, { id }) => {
    await requirePlugin(ctx, "contract-templates");
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, { name, description, content, isDefault }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    const now = Date.now();
    return ctx.db.insert("contractTemplates", {
      name,
      description,
      content,
      isDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contractTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, description, content }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (content !== undefined) patch.content = content;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("contractTemplates") },
  handler: async (ctx, { id }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    await ctx.db.delete(id);
  },
});
