import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireRole } from "./auth";

export const getAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("siteTexts").collect(),
});
