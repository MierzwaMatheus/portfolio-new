import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

export const getAuthUser = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});

export const requireAuthQuery = internalQuery({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    return { userId, user };
  },
});

export const getUserRoleQuery = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const roleDoc = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .unique();
    return roleDoc;
  },
});

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return { userId, user };
}

export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();
  return roleDoc?.role ?? null;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"root" | "admin" | "content-editor" | "blog-editor" | "proposal-editor">
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();
  const role = roleDoc?.role ?? null;
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return { userId, user, role };
}
