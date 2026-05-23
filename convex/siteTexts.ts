import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireRole } from "./auth";

export const getAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("siteTexts").collect(),
});

export const getByPage = query({
  args: { page: v.string() },
  handler: async (ctx, { page }) =>
    ctx.db.query("siteTexts").withIndex("by_page", (q) => q.eq("page", page)).collect(),
});
