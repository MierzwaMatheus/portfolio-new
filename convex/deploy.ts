import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";

export const trigger = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    ok: boolean;
    skipped?: boolean;
    message?: string;
    statusCode?: number;
  }> => {
    const authData = await ctx.runQuery(internal.auth.requireAuthQuery);
    const userId = authData.userId;

    const roleDoc = await ctx.runQuery(internal.auth.getUserRoleQuery, {
      userId,
    });

    if (!roleDoc || !["root", "admin"].includes(roleDoc.role)) {
      throw new Error("Forbidden: insufficient permissions");
    }

    const status = await ctx.runQuery(api.publishStatus.get);

    if (!status?.pendingChanges) {
      return {
        ok: true,
        skipped: true,
        message: "No pending changes to publish",
      };
    }

    if (status.lastPublishedAt) {
      const minutesSince = (Date.now() - status.lastPublishedAt) / 1000 / 60;
      if (minutesSince < 1) {
        return {
          ok: true,
          skipped: true,
          message: "Throttled - last deploy too recent",
        };
      }
    }

    const webhookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!webhookUrl) {
      console.warn("[deploy] VERCEL_DEPLOY_HOOK_URL not set");
      return { ok: false };
    }

    const res = await fetch(webhookUrl, { method: "POST" });

    if (res.ok) {
      await ctx.runMutation(internal.publishStatus.setPublished, {
        triggeredBy: userId,
      });
    }

    return { ok: res.ok, statusCode: res.status };
  },
});
